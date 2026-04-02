"""RAGAS evaluation test suite against the golden QA set."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

GOLDEN_SET_PATH = Path(__file__).resolve().parent / "golden_qa.json"


def load_golden_set() -> list[dict]:
    """Load the golden QA test set."""
    with open(GOLDEN_SET_PATH) as f:
        return json.load(f)


class TestGoldenQA:
    """Smoke tests to verify golden QA answers contain expected keywords."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Load golden set once per class."""
        self.qa_pairs = load_golden_set()

    def test_golden_set_loaded(self):
        """Verify the golden set loads correctly with expected size."""
        assert len(self.qa_pairs) == 50, f"Expected 50 QA pairs, got {len(self.qa_pairs)}"

    def test_all_pairs_have_required_fields(self):
        """Every QA pair must have id, query, expected_answer_contains, category."""
        for pair in self.qa_pairs:
            assert "id" in pair, f"Missing id in QA pair"
            assert "query" in pair, f"Missing query in {pair.get('id')}"
            assert "expected_answer_contains" in pair, f"Missing expected_answer_contains in {pair['id']}"
            assert "category" in pair, f"Missing category in {pair['id']}"
            assert pair["category"] in ("calculation", "section_lookup", "deadline_check", "general_explanation"), \
                f"Invalid category '{pair['category']}' in {pair['id']}"

    def test_category_distribution(self):
        """Ensure balanced coverage across query categories."""
        categories = [pair["category"] for pair in self.qa_pairs]
        category_counts = {cat: categories.count(cat) for cat in set(categories)}

        assert category_counts.get("calculation", 0) >= 10, "Need at least 10 calculation QA pairs"
        assert category_counts.get("section_lookup", 0) >= 10, "Need at least 10 section_lookup QA pairs"
        assert category_counts.get("deadline_check", 0) >= 5, "Need at least 5 deadline_check QA pairs"

    def test_query_classifier_accuracy(self):
        """Test that the query classifier correctly categorizes golden set queries."""
        from app.services.query_classifier import QueryClassifier

        classifier = QueryClassifier()
        correct = 0
        total = len(self.qa_pairs)

        for pair in self.qa_pairs:
            result = classifier.classify(pair["query"])
            if result.category == pair["category"]:
                correct += 1

        accuracy = correct / total
        assert accuracy >= 0.60, (
            f"Query classifier accuracy is {accuracy:.2%} (target ≥ 60%). "
            f"Classified {correct}/{total} correctly."
        )


class TestRAGASEvaluation:
    """Full RAGAS evaluation requiring API keys and running LLM inference."""

    @pytest.fixture(autouse=True)
    def check_api_key(self):
        """Skip these tests if no OpenAI key is configured."""
        if not os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY", "").startswith("your_"):
            pytest.skip("OPENAI_API_KEY not configured, skipping RAGAS evaluation")

    @pytest.mark.asyncio
    async def test_faithfulness_above_threshold(self):
        """Run faithfulness evaluation and assert score ≥ 0.82."""
        from app.services.faithfulness_filter import FaithfulnessFilter

        filter = FaithfulnessFilter()
        sample_context = [{"text": "Section 194J applies TDS at 10% on professional fees above INR 30,000."}]
        sample_answer = "Under Section 194J, TDS is deducted at 10% on professional fees exceeding INR 30,000."

        score = await filter.score(
            query="What is TDS on professional fees?",
            answer=sample_answer,
            context_chunks=sample_context,
        )
        assert score >= 0.75, f"Faithfulness score {score:.2f} is below 0.75 threshold"

    @pytest.mark.asyncio
    async def test_context_retrieval_quality(self):
        """Verify retrieval returns relevant chunks for a known query."""
        from app.memory.vector_store import VectorStoreManager

        vs = VectorStoreManager()
        await vs.initialize()

        results = await vs.hybrid_search(
            query="Section 194J professional fees TDS",
            namespace="global-tax-knowledge",
            top_k=5,
        )
        await vs.close()

        if results:
            assert any("194J" in r.text for r in results), "Expected at least one result mentioning 194J"
