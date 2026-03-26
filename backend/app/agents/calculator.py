"""Deterministic tax calculation agent."""

from __future__ import annotations

import re
from typing import Any

from app.services.tax_rules_engine import TaxRulesEngine


class TaxCalculatorAgent:
    """Expose tax calculations without relying on LLM arithmetic."""

    def __init__(self) -> None:
        """Initialize the deterministic tax rules engine."""

        self.engine = TaxRulesEngine()

    def calculate_tds(
        self,
        payment_type: str,
        amount: float,
        pan_available: bool,
        resident: bool,
    ) -> dict[str, float | str]:
        """Calculate TDS for a payment."""

        return self.engine.calculate_tds(payment_type, amount, pan_available, resident)

    def calculate_gst(
        self,
        transaction_type: str,
        amount: float,
        hsn_code: str,
        state: str,
    ) -> dict[str, float]:
        """Calculate GST for a transaction."""

        return self.engine.calculate_gst(transaction_type, amount, hsn_code, state)

    def calculate_advance_tax(
        self,
        annual_income: float,
        existing_tds: float,
        quarter: str,
    ) -> dict[str, float | str]:
        """Calculate advance tax for a given quarter."""

        return self.engine.calculate_advance_tax(annual_income, existing_tds, quarter)

    def calculate_80c_deduction(self, investments_dict: dict[str, float]) -> dict[str, float]:
        """Calculate eligible Section 80C deduction."""

        return self.engine.calculate_80c_deduction(investments_dict)

    def infer_and_calculate(self, query: str) -> dict[str, Any]:
        """Infer the calculation type from a natural-language query."""

        normalized = query.lower()
        amount_match = re.search(r"(\d[\d,]*\.?\d*)", normalized.replace(",", ""))
        amount = float(amount_match.group(1)) if amount_match else 0.0

        if "80c" in normalized:
            numbers = [float(value) for value in re.findall(r"(\d[\d,]*\.?\d*)", normalized.replace(",", ""))]
            investments = {f"investment_{index}": value for index, value in enumerate(numbers, start=1)}
            return {"calculation_type": "80C", "result": self.calculate_80c_deduction(investments)}
        if "advance tax" in normalized:
            quarter = "Q4"
            for label in ("q1", "q2", "q3", "q4"):
                if label in normalized:
                    quarter = label.upper()
            return {
                "calculation_type": "ADVANCE_TAX",
                "result": self.calculate_advance_tax(annual_income=amount, existing_tds=0.0, quarter=quarter),
            }
        if "gst" in normalized:
            transaction_type = "SERVICES_STANDARD" if "service" in normalized else "GOODS_STANDARD"
            state = "KA" if "intra" in normalized else "MH"
            return {
                "calculation_type": "GST",
                "result": self.calculate_gst(transaction_type=transaction_type, amount=amount, hsn_code="", state=state),
            }

        payment_type = "194I" if "rent" in normalized else "194J" if "professional" in normalized else "194C"
        pan_available = "without pan" not in normalized
        resident = "non-resident" not in normalized
        return {
            "calculation_type": "TDS",
            "result": self.calculate_tds(payment_type, amount, pan_available, resident),
        }

