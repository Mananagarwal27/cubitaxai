import aiosmtplib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from email.message import EmailMessage
from datetime import datetime, timedelta
import httpx
from typing import List, Tuple
from app.config import settings
from app.models.deadline import DeadlineCalendar, FilingStatus, AlertLog, FilingStatusEnum, AlertChannel, AlertStatus

class DeadlineService:

    async def get_upcoming_deadlines(self, db: AsyncSession, org_id: str, days_ahead: int = 30) -> list:
        end_date = datetime.utcnow().date() + timedelta(days=days_ahead)
        query = select(DeadlineCalendar, FilingStatus).outerjoin(
            FilingStatus, DeadlineCalendar.id == FilingStatus.deadline_id
        ).where(
            DeadlineCalendar.org_id == org_id,
            DeadlineCalendar.due_date <= end_date,
            or_(
                FilingStatus.status == None,
                ~FilingStatus.status.in_([FilingStatusEnum.FILED, FilingStatusEnum.WAIVED])
            )
        ).order_by(DeadlineCalendar.due_date.asc())
        
        result = await db.execute(query)
        deadlines = []
        for dl, fs in result.all():
            days_remaining = (dl.due_date - datetime.utcnow().date()).days
            deadlines.append({
                "deadline": dl,
                "status": fs,
                "days_remaining": days_remaining
            })
        return deadlines

    async def should_alert(self, db: AsyncSession, deadline_info: dict, org_id: str) -> Tuple[bool, str]:
        days_remaining = deadline_info["days_remaining"]
        if days_remaining not in [1, 3, 7]:
            return False, ""
            
        dl = deadline_info["deadline"]
        alert_key = f"{org_id}:{dl.filing_type.value}:{dl.period}:{days_remaining}d"
        
        query = select(AlertLog).where(AlertLog.alert_key == alert_key)
        existing = await db.execute(query)
        if existing.scalar_one_or_none():
            return False, alert_key
            
        return True, alert_key

    async def send_email_alert(self, org, deadline_info: dict):
        dl = deadline_info["deadline"]
        days = deadline_info["days_remaining"]
        msg = EmailMessage()
        msg.set_content(f"Filing {dl.filing_type.value} is due in {days} days for period {dl.period}.\nAmount Due: {dl.amount_due}\nDue Date: {dl.due_date}")
        msg["Subject"] = f"CubitaxAI: {dl.filing_type.value} due in {days} days ({dl.period})"
        msg["From"] = settings.SMTP_USER
        # Note: We need email of the org. Defaulting to a dummy for alert testing, or assume org.email
        # We will log error if this fails.
        org_email = "admin@example.com"
        msg["To"] = org_email

        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_USE_TLS
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send email: {e}")

    async def send_webhook_alert(self, org, deadline_info: dict):
        dl = deadline_info["deadline"]
        # Dummy webhook payload and send logic
        if not hasattr(org, 'webhook_url') or not org.webhook_url:
            return
        
        payload = {"event": "deadline.approaching", "data": {"type": dl.filing_type.value, "due": str(dl.due_date)}}
        import hmac, hashlib, json
        signature = hmac.new(settings.WEBHOOK_SECRET.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()
        headers = {"X-CubitaxAI-Signature": f"sha256={signature}"}
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(org.webhook_url, json=payload, headers=headers)
        except Exception as e:
            import logging
            logging.error(f"Failed to send webhook: {e}")

    async def run_daily_sweep(self, db: AsyncSession):
        from app.models.organization import Organization
        orgs_result = await db.execute(select(Organization))
        orgs = orgs_result.scalars().all()
        alerts_sent = 0
        
        for org in orgs:
            upcoming = await self.get_upcoming_deadlines(db, org.id)
            for deadline_info in upcoming:
                should, alert_key = await self.should_alert(db, deadline_info, org.id)
                if should:
                    if settings.ALERT_EMAIL_ENABLED:
                        await self.send_email_alert(org, deadline_info)
                        log = AlertLog(org_id=org.id, alert_key=alert_key, channel=AlertChannel.EMAIL, status=AlertStatus.SENT)
                        db.add(log)
                    if settings.ALERT_WEBHOOK_ENABLED:
                        await self.send_webhook_alert(org, deadline_info)
                        log = AlertLog(org_id=org.id, alert_key=alert_key, channel=AlertChannel.WEBHOOK, status=AlertStatus.SENT)
                        db.add(log)
                    alerts_sent += 1
        await db.commit()
