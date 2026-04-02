"""Document Auditor agent — cross-references uploaded docs against computed liabilities."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

from app.agents.calculator import TaxCalculatorAgent

logger = logging.getLogger(__name__)


@dataclass
class AuditGapItem:
    """Single gap identified during document audit."""

    category: str
    expected_amount: float
    actual_amount: float
    shortfall: float
    risk: str  # Low, Medium, High, Critical
    section_ref: str
    description: str


class DocumentAuditorAgent:
    """Audit uploaded Form 26AS or GSTR-2B against computed liabilities.

    Cross-references extracted financial data from documents against
    the deterministic tax rules engine to identify gaps and risks.
    """

    def __init__(self) -> None:
        """Initialize the calculator for reference computations."""
        self.calculator = TaxCalculatorAgent()

    async def audit_form_26as(self, document_data: dict[str, Any]) -> dict[str, Any]:
        """Audit a Form 26AS document for TDS gaps.

        Args:
            document_data: Parsed document data including extracted text and tables.

        Returns:
            Structured audit report with gaps, risk assessment, and recommendations.
        """
        tds_entries = self._extract_tds_entries(document_data)
        gaps: list[AuditGapItem] = []
        total_deducted = 0.0
        total_expected = 0.0

        for entry in tds_entries:
            deducted = entry.get("amount_deducted", 0.0)
            payment_amount = entry.get("payment_amount", 0.0)
            section = entry.get("section", "194J")
            total_deducted += deducted

            expected_result = self.calculator.calculate_tds(
                payment_type=section,
                amount=payment_amount,
                pan_available=True,
                resident=True,
            )
            expected = expected_result.get("total_deduction", 0.0)
            total_expected += expected

            shortfall = round(expected - deducted, 2)
            if shortfall > 100:
                risk = "Critical" if shortfall > 50000 else "High" if shortfall > 10000 else "Medium"
                gaps.append(AuditGapItem(
                    category="TDS Shortfall",
                    expected_amount=expected,
                    actual_amount=deducted,
                    shortfall=shortfall,
                    risk=risk,
                    section_ref=f"Section {section}",
                    description=(
                        f"TDS deducted ₹{deducted:,.2f} but expected ₹{expected:,.2f} "
                        f"under Section {section}. Shortfall: ₹{shortfall:,.2f}"
                    ),
                ))

        return {
            "document_type": "FORM_26AS",
            "total_tds_deducted": round(total_deducted, 2),
            "total_tds_expected": round(total_expected, 2),
            "total_shortfall": round(total_expected - total_deducted, 2),
            "overall_risk": self._overall_risk(gaps),
            "gaps": [
                {
                    "category": gap.category,
                    "expected": gap.expected_amount,
                    "actual": gap.actual_amount,
                    "shortfall": gap.shortfall,
                    "risk": gap.risk,
                    "section": gap.section_ref,
                    "description": gap.description,
                }
                for gap in gaps
            ],
            "gap_count": len(gaps),
            "recommendations": self._generate_recommendations(gaps),
        }

    async def audit_gstr_2b(self, document_data: dict[str, Any]) -> dict[str, Any]:
        """Audit a GSTR-2B for ITC reconciliation gaps."""
        itc_entries = self._extract_itc_entries(document_data)
        gaps: list[AuditGapItem] = []
        total_itc_claimed = 0.0
        total_itc_available = 0.0

        for entry in itc_entries:
            claimed = entry.get("itc_claimed", 0.0)
            available = entry.get("itc_available", 0.0)
            total_itc_claimed += claimed
            total_itc_available += available

            difference = round(claimed - available, 2)
            if difference > 500:
                risk = "High" if difference > 50000 else "Medium"
                gaps.append(AuditGapItem(
                    category="ITC Mismatch",
                    expected_amount=available,
                    actual_amount=claimed,
                    shortfall=difference,
                    risk=risk,
                    section_ref="Section 16",
                    description=(
                        f"ITC claimed ₹{claimed:,.2f} but only ₹{available:,.2f} "
                        f"matched in GSTR-2B. Excess: ₹{difference:,.2f}"
                    ),
                ))

        return {
            "document_type": "GSTR_2B",
            "total_itc_claimed": round(total_itc_claimed, 2),
            "total_itc_available": round(total_itc_available, 2),
            "total_excess": round(total_itc_claimed - total_itc_available, 2),
            "overall_risk": self._overall_risk(gaps),
            "gaps": [
                {
                    "category": gap.category,
                    "expected": gap.expected_amount,
                    "actual": gap.actual_amount,
                    "shortfall": gap.shortfall,
                    "risk": gap.risk,
                    "section": gap.section_ref,
                    "description": gap.description,
                }
                for gap in gaps
            ],
            "gap_count": len(gaps),
            "recommendations": self._generate_recommendations(gaps),
        }

    @staticmethod
    def _extract_tds_entries(document_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract TDS entries from parsed document data."""
        entries: list[dict[str, Any]] = []
        text = " ".join(
            page.get("text", "") for page in document_data.get("pages", [])
        )

        for table in document_data.get("tables", []):
            for row in table.get("rows", [])[1:]:
                if len(row) >= 4:
                    try:
                        amount_str = re.sub(r"[^\d.]", "", str(row[2] or "0"))
                        tds_str = re.sub(r"[^\d.]", "", str(row[3] or "0"))
                        section = str(row[1] or "194J").strip()
                        entries.append({
                            "deductor": str(row[0] or ""),
                            "section": section if section else "194J",
                            "payment_amount": float(amount_str) if amount_str else 0.0,
                            "amount_deducted": float(tds_str) if tds_str else 0.0,
                        })
                    except (ValueError, IndexError):
                        continue

        if not entries:
            amounts = re.findall(r"₹?\s*([\d,]+(?:\.\d{2})?)", text)
            if len(amounts) >= 2:
                entries.append({
                    "deductor": "Extracted",
                    "section": "194J",
                    "payment_amount": float(amounts[0].replace(",", "")),
                    "amount_deducted": float(amounts[1].replace(",", "")),
                })

        return entries

    @staticmethod
    def _extract_itc_entries(document_data: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract ITC entries from GSTR-2B data."""
        entries: list[dict[str, Any]] = []
        for table in document_data.get("tables", []):
            for row in table.get("rows", [])[1:]:
                if len(row) >= 3:
                    try:
                        entries.append({
                            "supplier": str(row[0] or ""),
                            "itc_available": float(re.sub(r"[^\d.]", "", str(row[1] or "0")) or 0),
                            "itc_claimed": float(re.sub(r"[^\d.]", "", str(row[2] or "0")) or 0),
                        })
                    except (ValueError, IndexError):
                        continue
        return entries

    @staticmethod
    def _overall_risk(gaps: list[AuditGapItem]) -> str:
        """Determine overall risk level from individual gap assessments."""
        if any(g.risk == "Critical" for g in gaps):
            return "Critical"
        if any(g.risk == "High" for g in gaps):
            return "High"
        if any(g.risk == "Medium" for g in gaps):
            return "Medium"
        if gaps:
            return "Low"
        return "None"

    @staticmethod
    def _generate_recommendations(gaps: list[AuditGapItem]) -> list[str]:
        """Generate actionable recommendations based on identified gaps."""
        recommendations: list[str] = []
        if not gaps:
            recommendations.append("No significant gaps detected. Continue regular monitoring.")
            return recommendations

        critical_gaps = [g for g in gaps if g.risk in ("Critical", "High")]
        if critical_gaps:
            recommendations.append(
                f"URGENT: {len(critical_gaps)} high/critical gaps found. "
                "Cross-verify with original TDS certificates immediately."
            )
        recommendations.append("Request revised TDS certificates from deductors where shortfalls are identified.")
        recommendations.append("File a correction statement if TDS amounts are confirmed incorrect.")
        total_shortfall = sum(g.shortfall for g in gaps)
        if total_shortfall > 100000:
            recommendations.append(
                f"Total shortfall of ₹{total_shortfall:,.2f} may attract interest under Section 234B. "
                "Consult with your CA for remediation strategy."
            )
        return recommendations
