"""LangGraph orchestration for CubitaxAI v2 — enterprise agent graph."""

from __future__ import annotations

import re
import time
from typing import Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.calculator import TaxCalculatorAgent
from app.agents.compliance_checker import ComplianceCheckerAgent
from app.agents.retriever import TaxRetrieverAgent
from app.memory.vector_store import VectorStoreManager
from app.models.schemas import Citation
from app.observability.logging import get_logger
from app.observability.tracing import trace_agent_step
from app.services.query_classifier import QueryClassifier, QueryClassification

logger = get_logger("orchestrator")


QueryType = Literal["TAX_QUESTION", "COMPLIANCE_CHECK", "CALCULATION", "DOCUMENT_QUERY", "GENERAL"]

HUMAN_REVIEW_THRESHOLD = 1000000  # ₹10 lakhs


class OrchestratorState(TypedDict, total=False):
    """Shared state passed through the LangGraph pipeline."""

    query: str
    user_id: str
    session_id: str
    chat_history: list[dict[str, Any]]
    retrieved_chunks: list[dict[str, Any]]
    calculations: dict[str, Any]
    compliance_alerts: list[dict[str, Any]]
    final_answer: str
    citations: list[dict[str, Any]]
    needs_recalculation: bool
    query_type: QueryType
    confidence: float
    retry_count: int
    should_retry: bool
    # v2 additions
    plan: dict[str, Any]
    critique_scores: dict[str, float]
    needs_review: bool
    active_agent: str
    graph_context: list[dict[str, Any]]
    classification: dict[str, Any]
    step_timings: dict[str, float]
    entity_context: str


class CubitaxOrchestrator:
    """Route tax queries through planning, retrieval, analysis, and critique."""

    def __init__(self, vector_store: VectorStoreManager) -> None:
        """Initialize supporting agents and compile the graph."""

        self.retriever = TaxRetrieverAgent(vector_store)
        self.calculator = TaxCalculatorAgent()
        self.compliance_checker = ComplianceCheckerAgent()
        self.query_classifier = QueryClassifier()
        self.graph = self._build_graph().compile()

    # ── Planning Node ────────────────────────────────────────────────

    async def planning_node(self, state: OrchestratorState) -> OrchestratorState:
        """Classify the query and create an execution plan."""
        with trace_agent_step("planning_node", {"query": state["query"]}):
            start = time.time()
            query = state["query"]
            classification = self.query_classifier.classify(query)

            # Map classification to query type
            category_map = {
                "section_lookup": "TAX_QUESTION",
                "calculation": "CALCULATION",
                "deadline_check": "COMPLIANCE_CHECK",
                "general_explanation": "GENERAL",
            }
            query_type: QueryType = category_map.get(classification.category, "GENERAL")

            # Determine document query
            normalized = query.lower()
            if any(term in normalized for term in ["uploaded", "my itr", "my gstr", "form 26as", "document"]):
                query_type = "DOCUMENT_QUERY"

            # Build execution plan
            agents_to_invoke = ["retriever_node"]
            if query_type == "CALCULATION":
                agents_to_invoke = ["calculator_node"] if classification.skip_vector_search else ["retriever_node", "calculator_node"]
            elif query_type == "COMPLIANCE_CHECK":
                agents_to_invoke = ["retriever_node", "compliance_node"]

            plan = {
                "query_type": query_type,
                "classification": classification.category,
                "confidence": classification.confidence,
                "agents": agents_to_invoke,
                "bm25_weight": classification.bm25_weight,
                "dense_weight": classification.dense_weight,
            }

            elapsed = time.time() - start
            logger.info("planning_completed", query_type=query_type, category=classification.category, confidence=classification.confidence, elapsed=round(elapsed, 3))
            return {
                **state,
                "query_type": query_type,
                "plan": plan,
                "needs_recalculation": query_type == "CALCULATION",
                "retry_count": state.get("retry_count", 0),
                "active_agent": "planning_node",
                "classification": {
                    "category": classification.category,
                    "confidence": classification.confidence,
                    "bm25_weight": classification.bm25_weight,
                    "dense_weight": classification.dense_weight,
                },
                "step_timings": {**state.get("step_timings", {}), "planning": round(elapsed, 3)},
            }

    # ── Retriever Node ───────────────────────────────────────────────

    async def retriever_node(self, state: OrchestratorState) -> OrchestratorState:
        """Retrieve knowledge and document context for the query."""
        with trace_agent_step("retriever_node", {"query_type": state.get("query_type")}):
            start = time.time()
            classification = state.get("classification", {})
            bm25_w = classification.get("bm25_weight", 0.45)
            dense_w = classification.get("dense_weight", 0.55)
            chunks = await self.retriever.retrieve(
                query=state["query"],
                user_id=state["user_id"],
                doc_type_filter=None,
                bm25_weight=bm25_w,
                dense_weight=dense_w,
            )
            citations = [citation.model_dump() for citation in self.retriever.to_citations(chunks)]

            # Graph-RAG augmentation for section lookups
            graph_context = state.get("graph_context", [])
            if state.get("query_type") in ("TAX_QUESTION", "DOCUMENT_QUERY"):
                try:
                    from app.services.knowledge_graph import KnowledgeGraphService
                    kg = KnowledgeGraphService()
                    import re
                    section_match = re.search(r"\b(\d{1,3}[A-Z]{0,2})\b", state["query"].upper())
                    if section_match:
                        related = await kg.get_related_sections(f"Sec {section_match.group(1)}", max_hops=3)
                        graph_context = related
                except Exception:
                    pass

            elapsed = time.time() - start
            logger.info("retrieval_completed", chunks=len(chunks), citations=len(citations), graph_ctx=len(graph_context), elapsed=round(elapsed, 3))
            return {
                **state,
                "retrieved_chunks": [
                    {"text": chunk.text, "metadata": chunk.metadata, "score": chunk.score} for chunk in chunks
                ],
                "citations": citations,
                "active_agent": "retriever_node",
                "graph_context": graph_context,
                "step_timings": {**state.get("step_timings", {}), "retrieval": round(elapsed, 3)},
            }

    # ── Calculator Node ──────────────────────────────────────────────

    async def calculator_node(self, state: OrchestratorState) -> OrchestratorState:
        """Perform deterministic calculations when the query requires it."""
        with trace_agent_step("calculator_node"):
            start = time.time()
            calculation = self.calculator.infer_and_calculate(state["query"])

            # Check for human review threshold
            needs_review = False
            result = calculation.get("result", {})
            for key in ("total_deduction", "total_gst", "installment_due", "cumulative_due"):
                if result.get(key, 0) > HUMAN_REVIEW_THRESHOLD:
                    needs_review = True
                    break

            elapsed = time.time() - start
            logger.info("calculation_completed", calc_type=calculation.get("calculation_type"), needs_review=needs_review, elapsed=round(elapsed, 3))
            return {
                **state,
                "calculations": calculation,
                "active_agent": "calculator_node",
                "needs_review": state.get("needs_review", False) or needs_review,
                "step_timings": {**state.get("step_timings", {}), "calculation": round(elapsed, 3)},
            }

    # ── Compliance Node ──────────────────────────────────────────────

    async def compliance_node(self, state: OrchestratorState) -> OrchestratorState:
        """Attach compliance alerts and deadlines to the working state."""
        with trace_agent_step("compliance_node"):
            start = time.time()
            deadlines = await self.compliance_checker.get_upcoming_deadlines(state["user_id"])
            alerts = await self.compliance_checker.get_alerts(state["user_id"])

            elapsed = time.time() - start
            return {
                **state,
                "compliance_alerts": [
                    {
                        "title": alert.title,
                        "severity": alert.severity,
                        "description": alert.description,
                        "due_date": alert.due_date.isoformat() if alert.due_date else None,
                    }
                    for alert in alerts
                ],
                "citations": state.get("citations", [])
                + [
                    Citation(
                        source="COMPLIANCE_CALENDAR",
                        section_ref=deadline.section_ref or "Calendar",
                        snippet=f"{deadline.filing_name} due on {deadline.due_date.strftime('%d %b %Y')}",
                        score=1.0,
                    ).model_dump()
                    for deadline in deadlines[:3]
                ],
                "active_agent": "compliance_node",
                "step_timings": {**state.get("step_timings", {}), "compliance": round(elapsed, 3)},
            }

    # ── Answer Synthesizer ───────────────────────────────────────────

    async def answer_synthesizer(self, state: OrchestratorState) -> OrchestratorState:
        """Compose the final answer from retrieved context and analysis."""
        with trace_agent_step("answer_synthesizer"):
            start = time.time()
            direct_answer = self._build_direct_answer(state)
            support_lines = self._build_support_lines(state)
            citations = self._build_reference_lines(state)
            follow_up = self._suggest_follow_up(state)

            # Include graph context if available
            graph_lines = []
            for ctx in state.get("graph_context", [])[:3]:
                if ctx.get("text"):
                    graph_lines.append(
                        f"Related: {ctx.get('section_ref', 'Unknown')} — "
                        f"{ctx['text'][:150]} ({ctx.get('relationship_type', 'related')})"
                    )

            answer_parts = [direct_answer]
            if support_lines:
                answer_parts.append("**Key details:**\n" + "\n".join(f"- {line}" for line in support_lines))
            if graph_lines:
                answer_parts.append("**Related provisions:**\n" + "\n".join(f"- {line}" for line in graph_lines))
            if citations:
                answer_parts.append("**Citations:**\n" + "\n".join(f"- {line}" for line in citations))
            if follow_up:
                answer_parts.append(f"💡 *{follow_up}*")

            # Add CA review banner if needed
            if state.get("needs_review"):
                answer_parts.insert(0, "⚠️ **This response involves amounts exceeding ₹10 lakhs and should be reviewed by a Chartered Accountant.**\n")

            elapsed = time.time() - start
            logger.info("synthesis_completed", answer_len=len("\n\n".join(part for part in answer_parts if part)), needs_review=state.get("needs_review"), elapsed=round(elapsed, 3))
            return {
                **state,
                "final_answer": "\n\n".join(part for part in answer_parts if part),
                "active_agent": "answer_synthesizer",
                "step_timings": {**state.get("step_timings", {}), "synthesis": round(elapsed, 3)},
            }

    # ── Critic Node ──────────────────────────────────────────────────

    async def critic_node(self, state: OrchestratorState) -> OrchestratorState:
        """Score the answer on completeness, citation quality, accuracy, and faithfulness."""
        with trace_agent_step("critic_node"):
            retrieved_count = len(state.get("retrieved_chunks", []))
            citations_count = len(state.get("citations", []))
            retrieved_chunks = state.get("retrieved_chunks", [])

            # Completeness score
            completeness = min(1.0, 0.3 + retrieved_count * 0.12 + citations_count * 0.08)
            if state["query_type"] == "CALCULATION" and state.get("calculations"):
                completeness = min(1.0, completeness + 0.25)
            if state["query_type"] == "COMPLIANCE_CHECK" and state.get("compliance_alerts"):
                completeness = min(1.0, completeness + 0.20)

            # Citation quality
            citation_quality = min(1.0, citations_count * 0.20) if citations_count else 0.3

            # Calculation accuracy (high for deterministic engine)
            calc_accuracy = 0.95 if state.get("calculations") else 0.5

            # Faithfulness check against retrieved context
            faithfulness = 0.5
            try:
                from app.services.faithfulness_filter import FaithfulnessFilter
                ff = FaithfulnessFilter()
                faithfulness = await ff.score(
                    query=state["query"],
                    answer=state.get("final_answer", ""),
                    context_chunks=retrieved_chunks,
                )
            except Exception:
                pass  # Graceful degradation if filter fails

            confidence = (
                completeness * 0.30
                + citation_quality * 0.25
                + calc_accuracy * 0.25
                + faithfulness * 0.20
            )
            confidence = min(1.0, confidence)

            critique_scores = {
                "completeness": round(completeness, 2),
                "citation_quality": round(citation_quality, 2),
                "calculation_accuracy": round(calc_accuracy, 2),
                "faithfulness": round(faithfulness, 2),
                "overall": round(confidence, 2),
            }

            retry_count = state.get("retry_count", 0)
            should_retry = confidence < 0.7 and retry_count < 1 and state["query_type"] != "CALCULATION"

            # Flag for CA review if critic uncertain
            needs_review = state.get("needs_review", False) or (confidence < 0.5 and state["query_type"] != "GENERAL")
            logger.info("critic_completed", confidence=round(confidence, 2), faithfulness=round(faithfulness, 2), should_retry=should_retry, needs_review=needs_review)

            if should_retry:
                return {
                    **state,
                    "confidence": confidence,
                    "critique_scores": critique_scores,
                    "retry_count": retry_count + 1,
                    "should_retry": True,
                    "needs_review": needs_review,
                    "active_agent": "critic_node",
                }
            return {
                **state,
                "confidence": confidence,
                "critique_scores": critique_scores,
                "should_retry": False,
                "needs_review": needs_review,
                "active_agent": "critic_node",
            }

    # ── Routing Functions ────────────────────────────────────────────

    def _route_after_planning(self, state: OrchestratorState) -> str:
        """Route from planning to the appropriate first agent."""
        plan = state.get("plan", {})
        if plan.get("classification") == "calculation" and state.get("classification", {}).get("bm25_weight", 0) == 0:
            return "calculator_node"
        return "retriever_node"

    def _route_after_retriever(self, state: OrchestratorState) -> str:
        """Choose the next node after retrieval based on query type."""
        if state["query_type"] == "CALCULATION":
            return "calculator_node"
        if state["query_type"] == "COMPLIANCE_CHECK":
            return "compliance_node"
        return "answer_synthesizer"

    def _route_after_critic(self, state: OrchestratorState) -> str:
        """Retry retrieval once when confidence remains too low."""
        if state.get("should_retry"):
            return "retriever_node"
        return END

    # ── Graph Builder ────────────────────────────────────────────────

    def _build_graph(self) -> StateGraph:
        """Construct the LangGraph state machine for chat orchestration."""

        workflow = StateGraph(OrchestratorState)

        # Nodes
        workflow.add_node("planning_node", self.planning_node)
        workflow.add_node("retriever_node", self.retriever_node)
        workflow.add_node("calculator_node", self.calculator_node)
        workflow.add_node("compliance_node", self.compliance_node)
        workflow.add_node("answer_synthesizer", self.answer_synthesizer)
        workflow.add_node("critic_node", self.critic_node)

        # Edges
        workflow.add_edge(START, "planning_node")
        workflow.add_conditional_edges(
            "planning_node",
            self._route_after_planning,
            {
                "retriever_node": "retriever_node",
                "calculator_node": "calculator_node",
            },
        )
        workflow.add_conditional_edges(
            "retriever_node",
            self._route_after_retriever,
            {
                "calculator_node": "calculator_node",
                "compliance_node": "compliance_node",
                "answer_synthesizer": "answer_synthesizer",
            },
        )
        workflow.add_edge("calculator_node", "answer_synthesizer")
        workflow.add_edge("compliance_node", "answer_synthesizer")
        workflow.add_edge("answer_synthesizer", "critic_node")
        workflow.add_conditional_edges(
            "critic_node",
            self._route_after_critic,
            {
                "retriever_node": "retriever_node",
                END: END,
            },
        )
        return workflow

    # ── Run ───────────────────────────────────────────────────────────

    async def run(
        self,
        query: str,
        user_id: str,
        session_id: str,
        chat_history: list[dict[str, Any]],
    ) -> OrchestratorState:
        """Execute the compiled workflow and return the final state."""

        initial_state: OrchestratorState = {
            "query": query,
            "user_id": user_id,
            "session_id": session_id,
            "chat_history": chat_history,
            "retrieved_chunks": [],
            "calculations": {},
            "compliance_alerts": [],
            "final_answer": "",
            "citations": [],
            "needs_recalculation": False,
            "retry_count": 0,
            "should_retry": False,
            "plan": {},
            "critique_scores": {},
            "needs_review": False,
            "active_agent": "",
            "graph_context": [],
            "classification": {},
            "step_timings": {},
            "entity_context": "",
        }
        return await self.graph.ainvoke(initial_state)

    # ── Formatting Helpers ───────────────────────────────────────────

    @staticmethod
    def _truncate(text: str, max_length: int = 220) -> str:
        """Compact long snippets so answers stay readable."""
        normalized = " ".join(text.split())
        if len(normalized) <= max_length:
            return normalized
        return f"{normalized[: max_length - 3].rsplit(' ', 1)[0]}..."

    @staticmethod
    def _format_currency(value: Any) -> str:
        """Format numeric values as Indian currency."""
        number = float(value or 0)
        return f"₹{number:,.2f}"

    @staticmethod
    def _format_percent(value: Any) -> str:
        """Format a decimal rate as a percentage string."""
        percentage = float(value or 0) * 100
        if percentage.is_integer():
            return f"{int(percentage)}%"
        return f"{percentage:.2f}%"

    def _build_direct_answer(self, state: OrchestratorState) -> str:
        """Build the primary answer sentence for the response."""

        if state["query_type"] == "CALCULATION" and state.get("calculations"):
            calculation = state["calculations"]
            result = calculation.get("result", {})
            calculation_type = calculation.get("calculation_type")
            if calculation_type == "TDS":
                return (
                    f"The deterministic TDS engine maps this to **Section {result.get('section', '194J')}** "
                    f"at **{self._format_percent(result.get('rate', 0))}**, with total deduction of "
                    f"**{self._format_currency(result.get('total_deduction', 0))}**."
                )
            if calculation_type == "GST":
                return (
                    f"Applicable GST works out to **{self._format_currency(result.get('total_gst', 0))}** "
                    f"at **{self._format_percent(result.get('applicable_rate', 0))}**."
                )
            if calculation_type == "ADVANCE_TAX":
                return (
                    f"The advance tax installment due is **{self._format_currency(result.get('installment_due', 0))}**, "
                    f"with cumulative due of **{self._format_currency(result.get('cumulative_due', 0))}** by {result.get('due_date', 'the due date')}."
                )
            if calculation_type == "80C":
                return (
                    f"Eligible deduction under Section 80C is **{self._format_currency(result.get('eligible_deduction', 0))}**, "
                    f"with estimated tax saved of **{self._format_currency(result.get('tax_saved', 0))}**."
                )

        if state["query_type"] == "COMPLIANCE_CHECK":
            deadline_citations = [
                citation for citation in state.get("citations", []) if citation.get("source") == "COMPLIANCE_CALENDAR"
            ]
            if deadline_citations:
                return self._truncate(deadline_citations[0]["snippet"], max_length=180)
            if state.get("compliance_alerts"):
                first_alert = state["compliance_alerts"][0]
                return f"**{first_alert['title']}**: {first_alert['description']}"

        if state.get("retrieved_chunks"):
            top_chunk = state["retrieved_chunks"][0]
            section_ref = top_chunk["metadata"].get("section_ref", "the relevant provision")
            doc_type = top_chunk["metadata"].get("doc_type", "KNOWLEDGE_BASE")
            prefix = (
                f"I found matching context in your uploaded **{str(doc_type).replace('_', ' ').title()}** document. "
                if state["query_type"] == "DOCUMENT_QUERY" and doc_type != "KNOWLEDGE_BASE"
                else f"Based on **{section_ref}**, "
            )
            return f"{prefix}{self._truncate(top_chunk['text'], max_length=260)}"

        return "I could not find strong context yet. Try naming the section, filing, or uploaded document you want me to inspect."

    def _build_support_lines(self, state: OrchestratorState) -> list[str]:
        """Build supporting bullets tailored to the detected workflow."""

        if state["query_type"] == "CALCULATION" and state.get("calculations"):
            result = state["calculations"].get("result", {})
            calculation_type = state["calculations"].get("calculation_type")
            if calculation_type == "TDS":
                return [
                    f"Base TDS amount: {self._format_currency(result.get('tds_amount', 0))}",
                    f"Surcharge: {self._format_currency(result.get('surcharge', 0))}",
                    f"Cess: {self._format_currency(result.get('cess', 0))}",
                    "This output comes from the deterministic tax rules engine, not LLM arithmetic.",
                ]
            if calculation_type == "GST":
                return [
                    f"CGST: {self._format_currency(result.get('cgst', 0))}",
                    f"SGST: {self._format_currency(result.get('sgst', 0))}",
                    f"IGST: {self._format_currency(result.get('igst', 0))}",
                ]
            if calculation_type == "ADVANCE_TAX":
                return [
                    f"Section reference: {result.get('section', '208')}",
                    f"Installment due date: {result.get('due_date', 'current FY schedule')}",
                ]
            if calculation_type == "80C":
                return [
                    f"Total eligible investments considered: {self._format_currency(result.get('total_investment', 0))}",
                    "The statutory Section 80C cap is ₹1,50,000 for the current rules baked into this engine.",
                ]

        if state["query_type"] == "COMPLIANCE_CHECK":
            support_lines = []
            for alert in state.get("compliance_alerts", [])[:3]:
                support_lines.append(f"{alert['title']}: {alert['description']}")
            if support_lines:
                return support_lines

        support_lines = []
        for chunk in state.get("retrieved_chunks", [])[1:3]:
            support_lines.append(
                f"{chunk['metadata'].get('section_ref', 'Reference')}: {self._truncate(chunk['text'], max_length=170)}"
            )
        return support_lines

    def _build_reference_lines(self, state: OrchestratorState) -> list[str]:
        """Convert citations into readable bullet strings."""
        references: list[str] = []
        for citation in state.get("citations", [])[:3]:
            references.append(
                f"{citation.get('section_ref', 'General')} [{citation.get('source', 'DOCUMENT')}]: "
                f"{self._truncate(citation.get('snippet', ''), max_length=120)}"
            )
        return references

    @staticmethod
    def _suggest_follow_up(state: OrchestratorState) -> str:
        """Suggest the next best question for the user."""
        if state["query_type"] == "CALCULATION":
            return "Ask me to compare this against a different amount, PAN status, or quarter."
        if state["query_type"] == "COMPLIANCE_CHECK":
            return "Ask which supporting document should be uploaded next to strengthen this filing position."
        if state["query_type"] == "DOCUMENT_QUERY":
            return "Ask me to reconcile this answer against GSTR, ITR, Form 26AS, or TDS certificate evidence."
        if state["query_type"] == "TAX_QUESTION":
            return "Ask for the related section, rate table, or compliance implication and I will narrow it further."
        return ""
