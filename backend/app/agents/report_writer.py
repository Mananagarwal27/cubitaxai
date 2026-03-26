"""Compliance report writer for markdown and downstream PDF generation."""

from __future__ import annotations

from datetime import datetime, timezone

from app.agents.compliance_checker import ComplianceCheckerAgent


class ReportWriterAgent:
    """Generate a structured compliance report for a user."""

    def __init__(self) -> None:
        """Initialize dependent analysis agents."""

        self.compliance_checker = ComplianceCheckerAgent()

    async def generate_compliance_report(self, user_id: str) -> str:
        """Create a markdown compliance report with citations and recommendations."""

        deadlines = await self.compliance_checker.get_upcoming_deadlines(user_id)
        filing_status = await self.compliance_checker.check_filing_status(user_id)
        score = await self.compliance_checker.generate_compliance_score(user_id)
        alerts = await self.compliance_checker.get_alerts(user_id)
        generated_at = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")

        pending_lines = "\n".join(
            f"- **{deadline.filing_name}** due on {deadline.due_date.strftime('%d %b %Y')} ({deadline.section_ref})"
            for deadline in deadlines[:5]
        ) or "- No immediate pending obligations detected."
        tds_summary = "\n".join(
            f"- {name}: {status}"
            for name, status in filing_status.items()
            if "TDS" in name or name == "FORM_26AS"
        ) or "- No TDS-specific artifacts uploaded yet."
        gst_summary = "\n".join(
            f"- {name}: {status}"
            for name, status in filing_status.items()
            if name == "GSTR"
        ) or "- GST filing records not yet available."
        recommendations = "\n".join(
            f"- {alert.title}: {alert.description}"
            for alert in alerts[:5]
        ) or "- Continue regular uploads and monthly deadline reviews."
        citations = "\n".join(
            f"- {deadline.filing_name} -> {deadline.section_ref or 'General compliance calendar'}"
            for deadline in deadlines[:5]
        ) or "- No citations available."

        return f"""# CubitaxAI Compliance Report

Generated at: {generated_at}

## Executive Summary

Current compliance score: **{score}/100**.

## Compliance Score Breakdown

- Base score starts at 100 and is adjusted for overdue deadlines, pending filings, and indexed document coverage.
- Current filing visibility: {sum(1 for status in filing_status.values() if status == "Available")} of {len(filing_status)} expected document classes uploaded.

## Pending Obligations

{pending_lines}

## TDS Liability Summary

{tds_summary}

## GST Position Summary

{gst_summary}

## Recommendations

{recommendations}

## Citations

{citations}
"""

