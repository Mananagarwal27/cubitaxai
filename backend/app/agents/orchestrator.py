"""LangGraph orchestration for CubitaxAI chat responses."""

from __future__ import annotations

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
        if any(term in query for term in ["calculate", "tds on", "gst on", "80c", "advance tax"]):
            query_type: QueryType = "CALCULATION"
        elif any(term in query for term in ["deadline", "due date", "compliance", "filing status", "overdue"]):
            query_type = "COMPLIANCE_CHECK"
        elif any(term in query for term in ["uploaded document", "my itr", "my gstr", "form 26as", "document"]):
            query_type = "DOCUMENT_QUERY"
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

        history_text = ""
        if state.get("chat_history"):
            recent = state["chat_history"][-3:]
            history_text = " ".join(message["content"] for message in recent if message.get("role") == "user")

        answer_parts: list[str] = []
        if state["query_type"] == "CALCULATION" and state.get("calculations"):
            answer_parts.append("Here is the deterministic calculation based on the current query.")
            answer_parts.append(str(state["calculations"]["result"]))
        if state["query_type"] == "COMPLIANCE_CHECK" and state.get("compliance_alerts"):
            answer_parts.append("These are the most relevant compliance items right now.")
            for alert in state["compliance_alerts"][:3]:
                answer_parts.append(f"- {alert['title']}: {alert['description']}")
        if state.get("retrieved_chunks"):
            answer_parts.append("Relevant tax references:")
            for chunk in state["retrieved_chunks"][:3]:
                section_ref = chunk["metadata"].get("section_ref", "General")
                answer_parts.append(f"- {section_ref}: {chunk['text'][:280]}")
        if not answer_parts:
            answer_parts.append(
                "I could not find strong context for this query yet. Try including the section, document, or filing name."
            )
        if history_text:
            answer_parts.append(f"Recent context considered: {history_text[:160]}")
        return {**state, "final_answer": "\n".join(answer_parts)}

    async def self_critique(self, state: OrchestratorState) -> OrchestratorState:
        """Assess answer sufficiency and trigger one retry when context is weak."""

        retrieved_count = len(state.get("retrieved_chunks", []))
        citations_count = len(state.get("citations", []))
        answer_length = len(state.get("final_answer", ""))
        confidence = min(1.0, 0.25 + retrieved_count * 0.15 + citations_count * 0.05 + answer_length / 2000)
        retry_count = state.get("retry_count", 0)
        should_retry = confidence < 0.7 and retry_count < 1
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
