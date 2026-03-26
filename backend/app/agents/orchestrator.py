"""LangGraph orchestration for CubitaxAI chat responses."""

from __future__ import annotations

import re
from typing import Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.calculator import TaxCalculatorAgent
from app.agents.compliance_checker import ComplianceCheckerAgent
from app.agents.retriever import TaxRetrieverAgent
from app.memory.vector_store import VectorStoreManager
from app.models.schemas import Citation


QueryType = Literal["TAX_QUESTION", "COMPLIANCE_CHECK", "CALCULATION", "DOCUMENT_QUERY", "GENERAL"]


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


class CubitaxOrchestrator:
    """Route tax queries through retrieval, analysis, and answer synthesis."""

    def __init__(self, vector_store: VectorStoreManager) -> None:
        """Initialize supporting agents and compile the graph."""

        self.retriever = TaxRetrieverAgent(vector_store)
        self.calculator = TaxCalculatorAgent()
        self.compliance_checker = ComplianceCheckerAgent()
        self.graph = self._build_graph().compile()

    async def query_classifier(self, state: OrchestratorState) -> OrchestratorState:
        """Classify the incoming query into a supported workflow."""

        query = state["query"].lower()
        amount_mentioned = bool(re.search(r"\b\d[\d,]*(?:\.\d+)?\b", query))
        if any(term in query for term in ["uploaded", "my itr", "my gstr", "form 26as", "document", "invoice", "certificate", "statement"]):
            query_type: QueryType = "DOCUMENT_QUERY"
        elif any(term in query for term in ["deadline", "due date", "compliance", "filing status", "overdue"]):
            query_type = "COMPLIANCE_CHECK"
        elif any(term in query for term in ["calculate", "how much", "working", "tds on", "gst on", "advance tax"]) or (
            amount_mentioned
            and any(
                term in query
                for term in ["rent", "professional", "contractor", "commission", "interest", "80c", "gst", "pan"]
            )
        ):
            query_type = "CALCULATION"
        elif any(term in query for term in ["tax", "gst", "tds", "section", "deduction"]):
            query_type = "TAX_QUESTION"
        else:
            query_type = "GENERAL"
        return {
            **state,
            "query_type": query_type,
            "needs_recalculation": query_type == "CALCULATION",
            "retry_count": state.get("retry_count", 0),
        }

    async def retriever_node(self, state: OrchestratorState) -> OrchestratorState:
        """Retrieve knowledge and document context for the query."""

        chunks = await self.retriever.retrieve(
            query=state["query"],
            user_id=state["user_id"],
            doc_type_filter=None,
        )
        citations = [citation.model_dump() for citation in self.retriever.to_citations(chunks)]
        return {
            **state,
            "retrieved_chunks": [
                {"text": chunk.text, "metadata": chunk.metadata, "score": chunk.score} for chunk in chunks
            ],
            "citations": citations,
        }

    async def calculator_node(self, state: OrchestratorState) -> OrchestratorState:
        """Perform deterministic calculations when the query requires it."""

        calculation = self.calculator.infer_and_calculate(state["query"])
        return {**state, "calculations": calculation}

    async def compliance_node(self, state: OrchestratorState) -> OrchestratorState:
        """Attach compliance alerts and deadlines to the working state."""

        deadlines = await self.compliance_checker.get_upcoming_deadlines(state["user_id"])
        alerts = await self.compliance_checker.get_alerts(state["user_id"])
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
        }

    async def answer_synthesizer(self, state: OrchestratorState) -> OrchestratorState:
        """Compose the final answer from retrieved context and analysis."""

        direct_answer = self._build_direct_answer(state)
        support_lines = self._build_support_lines(state)
        citations = self._build_reference_lines(state)
        follow_up = self._suggest_follow_up(state)

        answer_parts = [direct_answer]
        if support_lines:
            answer_parts.append("Key support:\n" + "\n".join(f"- {line}" for line in support_lines))
        if citations:
            answer_parts.append("Citations:\n" + "\n".join(f"- {line}" for line in citations))
        if follow_up:
            answer_parts.append(f"Suggested follow-up: {follow_up}")

        return {**state, "final_answer": "\n\n".join(part for part in answer_parts if part)}

    async def self_critique(self, state: OrchestratorState) -> OrchestratorState:
        """Assess answer sufficiency and trigger one retry when context is weak."""

        retrieved_count = len(state.get("retrieved_chunks", []))
        citations_count = len(state.get("citations", []))
        confidence = 0.2 + retrieved_count * 0.14 + citations_count * 0.07
        if state["query_type"] == "CALCULATION" and state.get("calculations"):
            confidence += 0.22
        if state["query_type"] == "COMPLIANCE_CHECK" and (
            state.get("compliance_alerts") or any(citation.get("source") == "COMPLIANCE_CALENDAR" for citation in state.get("citations", []))
        ):
            confidence += 0.18
        if state["query_type"] in {"TAX_QUESTION", "DOCUMENT_QUERY"} and state.get("retrieved_chunks"):
            confidence += 0.15
        confidence = min(1.0, confidence)
        retry_count = state.get("retry_count", 0)
        should_retry = confidence < 0.7 and retry_count < 1 and state["query_type"] != "CALCULATION"
        if should_retry:
            return {
                **state,
                "confidence": confidence,
                "retry_count": retry_count + 1,
                "should_retry": True,
            }
        return {**state, "confidence": confidence, "should_retry": False}

    def _route_after_retriever(self, state: OrchestratorState) -> str:
        """Choose the next node after retrieval based on query type."""

        if state["query_type"] == "CALCULATION":
            return "calculator_node"
        if state["query_type"] == "COMPLIANCE_CHECK":
            return "compliance_node"
        return "answer_synthesizer"

    def _route_after_self_critique(self, state: OrchestratorState) -> str:
        """Retry retrieval once when confidence remains too low."""

        if state.get("should_retry"):
            return "retriever_node"
        return END

    def _build_graph(self) -> StateGraph:
        """Construct the LangGraph state machine for chat orchestration."""

        workflow = StateGraph(OrchestratorState)
        workflow.add_node("query_classifier", self.query_classifier)
        workflow.add_node("retriever_node", self.retriever_node)
        workflow.add_node("calculator_node", self.calculator_node)
        workflow.add_node("compliance_node", self.compliance_node)
        workflow.add_node("answer_synthesizer", self.answer_synthesizer)
        workflow.add_node("self_critique", self.self_critique)

        workflow.add_edge(START, "query_classifier")
        workflow.add_edge("query_classifier", "retriever_node")
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
        workflow.add_edge("answer_synthesizer", "self_critique")
        workflow.add_conditional_edges(
            "self_critique",
            self._route_after_self_critique,
            {
                "retriever_node": "retriever_node",
                END: END,
            },
        )
        return workflow

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
        }
        return await self.graph.ainvoke(initial_state)

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
                    f"The deterministic TDS engine maps this to Section {result.get('section', '194J')} "
                    f"at {self._format_percent(result.get('rate', 0))}, with total deduction of "
                    f"{self._format_currency(result.get('total_deduction', 0))}."
                )
            if calculation_type == "GST":
                return (
                    f"Applicable GST works out to {self._format_currency(result.get('total_gst', 0))} "
                    f"at {self._format_percent(result.get('applicable_rate', 0))}."
                )
            if calculation_type == "ADVANCE_TAX":
                return (
                    f"The advance tax installment due is {self._format_currency(result.get('installment_due', 0))}, "
                    f"with cumulative due of {self._format_currency(result.get('cumulative_due', 0))} by {result.get('due_date', 'the due date')}."
                )
            if calculation_type == "80C":
                return (
                    f"Eligible deduction under Section 80C is {self._format_currency(result.get('eligible_deduction', 0))}, "
                    f"with estimated tax saved of {self._format_currency(result.get('tax_saved', 0))}."
                )

        if state["query_type"] == "COMPLIANCE_CHECK":
            deadline_citations = [
                citation for citation in state.get("citations", []) if citation.get("source") == "COMPLIANCE_CALENDAR"
            ]
            if deadline_citations:
                return self._truncate(deadline_citations[0]["snippet"], max_length=180)
            if state.get("compliance_alerts"):
                first_alert = state["compliance_alerts"][0]
                return f"{first_alert['title']}: {first_alert['description']}"

        if state.get("retrieved_chunks"):
            top_chunk = state["retrieved_chunks"][0]
            section_ref = top_chunk["metadata"].get("section_ref", "the relevant provision")
            doc_type = top_chunk["metadata"].get("doc_type", "KNOWLEDGE_BASE")
            prefix = (
                f"I found matching context in your uploaded {str(doc_type).replace('_', ' ').title()} document. "
                if state["query_type"] == "DOCUMENT_QUERY" and doc_type != "KNOWLEDGE_BASE"
                else f"Based on {section_ref}, "
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
                    "The statutory Section 80C cap is ₹150,000.00 for the current rules baked into this engine.",
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
