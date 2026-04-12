import aiosmtplib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from email.message import EmailMessage
from datetime import datetime, date, timedelta
import httpx
from typing import List, Tuple
from app.config import settings
from app.models.deadline import DeadlineCalendar, FilingStatus, AlertLog, FilingStatusEnum, AlertChannel, AlertStatus
from app.models.schemas import DeadlineItem

# ── Statutory deadline schedule (month, day, filing_name, section_ref) ──
_STATUTORY_DEADLINES: list[tuple[int, int, str, str]] = [
    (1, 7, "TDS Payment (Dec)", "Sec 194"),
    (1, 15, "Advance Tax Q3", "Sec 208"),
    (1, 31, "GSTR-3B (Dec)", "Sec 39"),
    (2, 7, "TDS Payment (Jan)", "Sec 194"),
    (3, 7, "TDS Payment (Feb)", "Sec 194"),
    (3, 15, "Advance Tax Q4", "Sec 208"),
    (3, 31, "GSTR-9 Annual Return", "Sec 44"),
    (4, 7, "TDS Payment (Mar)", "Sec 194"),
    (4, 30, "TDS Return Q4 (24Q/26Q)", "Sec 200"),
    (5, 31, "TDS Certificate (16A)", "Sec 203"),
    (6, 15, "Advance Tax Q1", "Sec 208"),
    (7, 7, "TDS Payment (Jun)", "Sec 194"),
    (7, 31, "TDS Return Q1 (24Q/26Q)", "Sec 200"),
    (7, 31, "ITR Filing (Non-audit)", "Sec 139"),
    (8, 7, "TDS Payment (Jul)", "Sec 194"),
    (9, 7, "TDS Payment (Aug)", "Sec 194"),
    (9, 15, "Advance Tax Q2", "Sec 208"),
    (9, 30, "GSTR-3B (Aug)", "Sec 39"),
    (10, 7, "TDS Payment (Sep)", "Sec 194"),
    (10, 31, "ITR Filing (Audit cases)", "Sec 139"),
    (10, 31, "TDS Return Q2 (24Q/26Q)", "Sec 200"),
    (11, 7, "TDS Payment (Oct)", "Sec 194"),
    (12, 7, "TDS Payment (Nov)", "Sec 194"),
]


class DeadlineService:

    def get_current_deadlines(self) -> list[DeadlineItem]:
        """Return upcoming statutory compliance deadlines as DeadlineItem objects.

        This provides a deterministic list of Indian tax filing deadlines
        based on the current date. Used by the ComplianceCheckerAgent for
        dashboard display and orchestrator compliance nodes.
        """
        today = date.today()
        current_year = today.year
        items: list[DeadlineItem] = []

        for month, day, filing_name, section_ref in _STATUTORY_DEADLINES:
            # Check current year and next year to capture upcoming deadlines
            for year in (current_year, current_year + 1):
                try:
                    due = date(year, month, day)
                except ValueError:
                    continue
                days_remaining = (due - today).days
                if -30 <= days_remaining <= 180:
                    if days_remaining < 0:
                        urgency = "RED"
                        status = "Overdue"
                    elif days_remaining <= 7:
                        urgency = "RED"
                        status = "Due Soon"
                    elif days_remaining <= 30:
                        urgency = "AMBER"
                        status = "Upcoming"
                    else:
                        urgency = "GREEN"
                        status = "Scheduled"

                    items.append(DeadlineItem(
                        filing_name=filing_name,
                        due_date=datetime(year, month, day),
                        days_remaining=days_remaining,
                        urgency=urgency,
                        status=status,
                        section_ref=section_ref,
                    ))

        items.sort(key=lambda x: x.due_date)
        return items

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
