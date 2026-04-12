"""Deterministic tax rules engine for calculations and query handling."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class TDSRule:
    """Structured representation of a TDS rate rule."""

    section: str
    nature_of_payment: str
    threshold: float
    rate_with_pan: float
    rate_without_pan: float


class TaxRulesEngine:
    """Pure-Python tax calculation engine with hardcoded compliance rules."""

    TDS_RATES: dict[str, TDSRule] = {
        "194A": TDSRule("194A", "Interest other than securities", 50000, 0.10, 0.20),
        "194B": TDSRule("194B", "Lottery or crossword winnings", 10000, 0.30, 0.30),
        "194C": TDSRule("194C", "Contractors", 30000, 0.01, 0.20),
        "194D": TDSRule("194D", "Insurance commission", 15000, 0.05, 0.20),
        "194H": TDSRule("194H", "Commission or brokerage", 15000, 0.05, 0.20),
        "194I": TDSRule("194I", "Rent", 240000, 0.10, 0.20),
        "194J": TDSRule("194J", "Professional or technical fees", 30000, 0.10, 0.20),
        "194N": TDSRule("194N", "Cash withdrawals", 2000000, 0.02, 0.02),
        "195": TDSRule("195", "Non-resident payments", 0, 0.20, 0.20),
        "206AB": TDSRule("206AB", "Specified non-filers", 0, 0.05, 0.05),
    }

    GST_RATES: dict[str, float] = {
        "GOODS_STANDARD": 0.18,
        "SERVICES_STANDARD": 0.18,
        "ESSENTIALS": 0.05,
        "LUXURY": 0.28,
        "EXPORT": 0.00,
    }

    ADVANCE_TAX_SCHEDULE: dict[str, tuple[int, str]] = {
        "Q1": (15, "15 Jun"),
        "Q2": (45, "15 Sep"),
        "Q3": (75, "15 Dec"),
        "Q4": (100, "15 Mar"),
    }

    def calculate_tds(
        self,
        payment_type: str,
        amount: float,
        pan_available: bool,
        resident: bool,
    ) -> dict[str, float | str]:
        """Calculate TDS for a supported payment type."""

        key = payment_type.upper()
        rule = self.TDS_RATES.get(key, self.TDS_RATES["194J"])
        if amount <= rule.threshold and rule.section not in {"195", "206AB"}:
            rate = 0.0
        else:
            rate = rule.rate_with_pan if pan_available else rule.rate_without_pan
        if not resident and rule.section != "195":
            rate = max(rate, self.TDS_RATES["195"].rate_with_pan)
        tds_amount = round(amount * rate, 2)
        surcharge = round(tds_amount * 0.10, 2) if amount > 1000000 else 0.0
        cess = round((tds_amount + surcharge) * 0.04, 2)
        total = round(tds_amount + surcharge + cess, 2)
        return {
            "section": rule.section,
            "rate": rate,
            "tds_amount": tds_amount,
            "surcharge": surcharge,
            "cess": cess,
            "total_deduction": total,
        }

    def calculate_gst(
        self,
        transaction_type: str,
        amount: float,
        hsn_code: Optional[str],
        state: Optional[str],
    ) -> dict[str, float]:
        """Calculate GST split into CGST/SGST or IGST."""

        key = transaction_type.upper()
        rate = self.GST_RATES.get(key, self.GST_RATES["GOODS_STANDARD"])
        is_interstate = bool(state and state.strip().upper() not in {"KA", "MH", "DL"})
        total_gst = round(amount * rate, 2)
        if is_interstate:
            return {
                "cgst": 0.0,
                "sgst": 0.0,
                "igst": total_gst,
                "total_gst": total_gst,
                "applicable_rate": rate,
            }
        half = round(total_gst / 2, 2)
        return {
            "cgst": half,
            "sgst": half,
            "igst": 0.0,
            "total_gst": total_gst,
            "applicable_rate": rate,
        }

    def calculate_advance_tax(
        self,
        annual_income: float,
        existing_tds: float,
        quarter: str,
    ) -> dict[str, float | str]:
        """Calculate advance tax due for the requested quarter."""

        quarter_key = quarter.upper()
        cumulative_percent, due_date = self.ADVANCE_TAX_SCHEDULE.get(quarter_key, self.ADVANCE_TAX_SCHEDULE["Q4"])
        estimated_tax = max(annual_income * 0.30 - existing_tds, 0.0)
        cumulative_due = round(estimated_tax * cumulative_percent / 100, 2)
        previous_percent = 0 if quarter_key == "Q1" else self.ADVANCE_TAX_SCHEDULE[f"Q{int(quarter_key[-1]) - 1}"][0]
        installment_due = round(estimated_tax * (cumulative_percent - previous_percent) / 100, 2)
        return {
            "installment_due": installment_due,
            "cumulative_due": cumulative_due,
            "due_date": due_date,
            "section": "208",
        }

    def calculate_80c_deduction(self, investments_dict: dict[str, float]) -> dict[str, float]:
        """Calculate eligible 80C deduction and approximate tax saved."""

        total = round(sum(investments_dict.values()), 2)
        eligible = min(total, 150000.0)
        tax_saved = round(eligible * 0.30, 2)
        return {
            "total_investment": total,
            "eligible_deduction": eligible,
            "tax_saved": tax_saved,
        }

    def estimate_tds_liability(self, document_count: int) -> float:
        """Produce a coarse TDS exposure estimate for dashboard metrics."""

        return round(document_count * 12500.0, 2)

