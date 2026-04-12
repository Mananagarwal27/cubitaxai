"""Query classifier for routing incoming queries to appropriate retrieval strategies."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

QueryCategory = Literal["section_lookup", "calculation", "deadline_check", "general_explanation"]


@dataclass
class QueryClassification:
    """Classification result for an incoming user query."""

    category: QueryCategory
    confidence: float
    bm25_weight: float
    dense_weight: float
    skip_vector_search: bool = False
    date_filter: Optional[str] = None


# Section reference patterns
SECTION_PATTERN = re.compile(
    r"\b(?:section|sec\.?|s\.?)\s*(\d{1,3}[A-Z]{0,2}(?:\(\d+\))?)\b",
    re.IGNORECASE,
)
SPECIFIC_SECTION_PATTERN = re.compile(
    r"\b(194[A-Z]?|195|196[A-D]?|206[A-Z]{2}|80[A-Z]{1,3}|139|143|234[A-F]|271)\b",
    re.IGNORECASE,
)


class QueryClassifier:
    """Classify tax queries and determine optimal retrieval strategy."""

    CALCULATION_MARKERS = frozenset([
        "calculate", "how much", "compute", "working", "tds on", "gst on",
        "advance tax", "what is the tax", "tax payable", "deduction of",
        "what will be", "how to compute",
    ])

    DEADLINE_MARKERS = frozenset([
        "deadline", "due date", "when is", "filing date", "last date",
        "compliance", "filing status", "overdue", "penalty for late",
        "when should i file", "when to file", "due this month",
    ])

    SECTION_MARKERS = frozenset([
        "section", "sec ", "what does section", "explain section",
        "provisions of", "under section", "as per section",
    ])

    def classify(self, query: str) -> QueryClassification:
        """Classify a query into a retrieval category with tuned weights.

        The classifier uses a rule-based approach with explicit section/keyword
        matching, falling back to general_explanation for ambiguous queries.
        """
        normalized = query.lower().strip()
        has_amount = bool(re.search(r"\b\d[\d,]*(?:\.\d+)?\b", normalized))
        has_section_ref = bool(SECTION_PATTERN.search(normalized) or SPECIFIC_SECTION_PATTERN.search(normalized))

        # 1. Direct section lookup — boost BM25 for exact keyword match
        if has_section_ref and not has_amount:
            section_term_count = sum(1 for m in normalized.split() if m in ("section", "sec", "sec."))
            calc_overlap = any(marker in normalized for marker in self.CALCULATION_MARKERS)
            if not calc_overlap or section_term_count > 0:
                return QueryClassification(
                    category="section_lookup",
                    confidence=0.90 if has_section_ref else 0.70,
                    bm25_weight=0.70,
                    dense_weight=0.30,
                )

        # 2. Calculation query — skip vector search, route to calculator
        if has_amount and any(marker in normalized for marker in self.CALCULATION_MARKERS):
            return QueryClassification(
                category="calculation",
                confidence=0.85,
                bm25_weight=0.0,
                dense_weight=0.0,
                skip_vector_search=True,
            )

        # 3. Deadline / compliance query — use date-filtered retrieval
        if any(marker in normalized for marker in self.DEADLINE_MARKERS):
            date_match = re.search(r"(FY\s*\d{4}(?:-\d{2})?|\d{4}-\d{2}|\bthis\s+month\b)", normalized)
            return QueryClassification(
                category="deadline_check",
                confidence=0.80,
                bm25_weight=0.40,
                dense_weight=0.60,
                date_filter=date_match.group(1) if date_match else None,
            )

        # 4. Section lookup by context (section mentioned with amount = still section lookup)
        if has_section_ref:
            return QueryClassification(
                category="section_lookup",
                confidence=0.75,
                bm25_weight=0.60,
                dense_weight=0.40,
            )

        # 5. Fallback — general explanation
        return QueryClassification(
            category="general_explanation",
            confidence=0.60,
            bm25_weight=0.45,
            dense_weight=0.55,
        )
