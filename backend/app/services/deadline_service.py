"""Compliance deadline generation and urgency helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models.schemas import DeadlineItem


class DeadlineService:
    """Generate rolling compliance deadlines using Indian filing rules."""

    def _urgency(self, due_date: datetime) -> str:
        """Return RED, AMBER, or GREEN urgency for a deadline."""

        days_remaining = (due_date.date() - datetime.now(timezone.utc).date()).days
        if days_remaining < 7:
            return "RED"
        if days_remaining < 30:
            return "AMBER"
        return "GREEN"

    def get_current_deadlines(self) -> list[DeadlineItem]:
        """Build the upcoming compliance calendar."""

        now = datetime.now(timezone.utc)
        first_next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
        quarter_due_dates = [
            ("TDS Return 24Q/26Q", datetime(now.year, 7, 31, tzinfo=timezone.utc)),
            ("TDS Return 24Q/26Q", datetime(now.year, 10, 31, tzinfo=timezone.utc)),
            ("TDS Return 24Q/26Q", datetime(now.year + 1, 1, 31, tzinfo=timezone.utc)),
            ("TDS Return 24Q/26Q", datetime(now.year + 1, 5, 31, tzinfo=timezone.utc)),
        ]
        base_deadlines = [
            ("GSTR-1", first_next_month.replace(day=11), "Sec. 37"),
            ("GSTR-3B", first_next_month.replace(day=20), "Sec. 39"),
            ("TDS Deposit", first_next_month.replace(day=7), "Rule 30"),
            ("Advance Tax Q1", datetime(now.year, 6, 15, tzinfo=timezone.utc), "Sec. 211"),
            ("Advance Tax Q2", datetime(now.year, 9, 15, tzinfo=timezone.utc), "Sec. 211"),
            ("Advance Tax Q3", datetime(now.year, 12, 15, tzinfo=timezone.utc), "Sec. 211"),
            ("Advance Tax Q4", datetime(now.year + 1, 3, 15, tzinfo=timezone.utc), "Sec. 211"),
            ("ITR Filing", datetime(now.year, 7, 31, tzinfo=timezone.utc), "Sec. 139"),
            ("ITR Filing (Audit Case)", datetime(now.year, 10, 31, tzinfo=timezone.utc), "Sec. 139"),
        ]
        all_deadlines = base_deadlines + [(name, due, "Rule 31A") for name, due in quarter_due_dates]
        items: list[DeadlineItem] = []
        for name, due_date, section_ref in all_deadlines:
            days_remaining = (due_date.date() - now.date()).days
            items.append(
                DeadlineItem(
                    filing_name=name,
                    due_date=due_date,
                    days_remaining=days_remaining,
                    urgency=self._urgency(due_date),
                    status="Upcoming" if days_remaining >= 0 else "Overdue",
                    section_ref=section_ref,
                )
            )
        return sorted(items, key=lambda item: item.due_date)

