"""Seed the global CubitaxAI knowledge base with tax and compliance references."""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.memory.vector_store import VectorStoreManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def build_seed_chunks() -> list[dict[str, Any]]:
    """Construct curated structured chunks for the global knowledge base."""

    income_tax_sections = [
        ("Sec 80C", "Section 80C allows deductions up to INR 1,50,000 for ELSS, PPF, EPF, life insurance premiums, principal housing loan repayment, and specified tuition fees."),
        ("Sec 80D", "Section 80D provides deduction for medical insurance premiums, preventive health checkups, and certain medical expenditure, subject to age-based limits."),
        ("Sec 80E", "Section 80E allows deduction of interest on education loans for up to eight assessment years without an upper monetary cap."),
        ("Sec 87A", "Section 87A offers rebate to eligible resident individuals when total income falls within the notified threshold, reducing tax liability up to the prescribed maximum."),
        ("Sec 139", "Section 139 governs return filing timelines, belated returns, revised returns, and defective return treatment."),
        ("Sec 143", "Section 143 covers processing, summary assessment, intimation, and scrutiny assessment workflows."),
        ("Sec 194A", "Section 194A applies TDS on interest other than interest on securities, with thresholds varying by payer category."),
        ("Sec 194C", "Section 194C applies TDS on payments to contractors and subcontractors above threshold limits."),
        ("Sec 194D", "Section 194D prescribes TDS on insurance commission."),
        ("Sec 194H", "Section 194H covers commission and brokerage payments."),
        ("Sec 194I", "Section 194I covers rent payments and prescribes deduction based on land, building, plant, or machinery use."),
        ("Sec 194J", "Section 194J applies to fees for professional services, technical services, royalty, and director remuneration."),
        ("Sec 194N", "Section 194N mandates TDS on cash withdrawals beyond notified limits."),
        ("Sec 195", "Section 195 governs withholding on payments to non-residents other than salaries."),
        ("Sec 206AB", "Section 206AB provides higher TDS rates for specified non-filers, subject to exclusions."),
        ("Sec 234A/B/C", "Sections 234A, 234B, and 234C prescribe interest for delay in filing, short payment of advance tax, and deferment of installments."),
        ("Sec 271", "Section 271 and related provisions address penalties for concealment, under-reporting, and non-compliance."),
    ]
    tds_table = [
        ("Sec 194A", "Interest other than securities", "INR 50,000", "10%", "20%"),
        ("Sec 194B", "Lottery or crossword winnings", "INR 10,000", "30%", "30%"),
        ("Sec 194C", "Contractors", "INR 30,000", "1%", "20%"),
        ("Sec 194D", "Insurance commission", "INR 15,000", "5%", "20%"),
        ("Sec 194H", "Commission or brokerage", "INR 15,000", "5%", "20%"),
        ("Sec 194I", "Rent", "INR 2,40,000", "10%", "20%"),
        ("Sec 194J", "Professional fees", "INR 30,000", "10%", "20%"),
        ("Sec 194N", "Cash withdrawals", "INR 20,00,000", "2%", "2%"),
        ("Sec 195", "Non-resident payments", "Nil", "20%", "20%"),
        ("Sec 206AB", "Specified non-filers", "Nil", "5%", "5%"),
    ]
    gst_sections = [
        ("Sec 9", "GST levy and collection under the CGST Act applies on intra-state supplies of goods and services."),
        ("Sec 10", "Composition levy allows eligible taxpayers to pay tax at a concessional rate subject to turnover and restriction conditions."),
        ("Sec 15", "Value of taxable supply includes transaction value and certain incidental charges."),
        ("Sec 16", "Input tax credit is available subject to possession of invoice, receipt of goods/services, tax payment by supplier, and return filing."),
        ("Sec 17", "Section 17 restricts ITC for blocked credits and apportions common input credit."),
        ("Sec 22", "Section 22 sets registration thresholds based on aggregate turnover."),
        ("Sec 24", "Section 24 lists compulsory registration cases such as inter-state taxable supply and e-commerce participation."),
        ("Sec 37", "Section 37 governs furnishing of outward supplies through GSTR-1."),
        ("Sec 39", "Section 39 governs furnishing of returns like GSTR-3B."),
        ("Sec 74", "Section 74 covers tax short paid or not paid due to fraud, wilful misstatement, or suppression."),
        ("Sec 75", "Section 75 provides general procedural rules for demand and recovery."),
    ]
    advance_tax = [
        ("Advance Tax Q1", "By 15 June, 15% of total advance tax should be paid.", "Sec 211"),
        ("Advance Tax Q2", "By 15 September, cumulative payment should reach 45%.", "Sec 211"),
        ("Advance Tax Q3", "By 15 December, cumulative payment should reach 75%.", "Sec 211"),
        ("Advance Tax Q4", "By 15 March, cumulative payment should reach 100%.", "Sec 211"),
    ]
    deadlines = [
        ("GSTR-1", "Due on the 11th of the following month for regular taxpayers.", "Rule 59"),
        ("GSTR-3B", "Due on the 20th of the following month for monthly filers; QRMP state-specific dates may vary.", "Rule 61"),
        ("TDS Deposit", "Due by the 7th of the following month for most deductors.", "Rule 30"),
        ("TDS Return", "Quarterly TDS statements 24Q and 26Q are due after each quarter.", "Rule 31A"),
        ("ITR Filing", "Due by 31 July for most individuals and 31 October for audit cases.", "Sec 139"),
    ]

    chunks: list[dict[str, Any]] = []
    for section_ref, text in income_tax_sections:
        chunks.append(
            {
                "text": text,
                "source": "IT_ACT",
                "section_ref": section_ref,
                "effective_fy": "2024-25",
                "doc_type": "KNOWLEDGE_BASE",
                "page_num": 1,
                "effective_date": "2024-04-01",
            }
        )
    for section_ref, nature, threshold, with_pan, without_pan in tds_table:
        chunks.append(
            {
                "text": f"{section_ref}: {nature}. Threshold {threshold}. Rate with PAN {with_pan}. Rate without PAN {without_pan}.",
                "source": "TDS_TABLE",
                "section_ref": section_ref,
                "effective_fy": "2024-25",
                "doc_type": "KNOWLEDGE_BASE",
                "page_num": 1,
                "effective_date": "2024-04-01",
            }
        )
    for section_ref, text in gst_sections:
        chunks.append(
            {
                "text": text,
                "source": "GST_CIRCULAR",
                "section_ref": section_ref,
                "effective_fy": "2024-25",
                "doc_type": "KNOWLEDGE_BASE",
                "page_num": 1,
                "effective_date": "2024-04-01",
            }
        )
    for section_ref, text, legal_ref in advance_tax + deadlines:
        chunks.append(
            {
                "text": text,
                "source": "COMPLIANCE_CALENDAR",
                "section_ref": f"{section_ref} ({legal_ref})",
                "effective_fy": "2024-25",
                "doc_type": "KNOWLEDGE_BASE",
                "page_num": 1,
                "effective_date": "2024-04-01",
            }
        )
    return chunks


async def main() -> None:
    """Initialize the vector store and upload seed knowledge."""

    manager = VectorStoreManager()
    await manager.initialize()
    chunks = build_seed_chunks()
    inserted = await manager.embed_and_upsert(chunks, "global-tax-knowledge", "seed-2024-25")
    await manager.close()
    logger.info("Seeded %s knowledge chunks into global-tax-knowledge", inserted)


if __name__ == "__main__":
    asyncio.run(main())
