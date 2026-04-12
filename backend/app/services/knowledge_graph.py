"""Neo4j knowledge graph service for tax section relationships and Graph-RAG."""

from __future__ import annotations

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_driver = None


class KnowledgeGraphService:
    """Manage Neo4j connections and execute graph-aware tax retrieval."""

    def __init__(self) -> None:
        """Initialize the Neo4j async driver if credentials are configured."""
        global _driver
        self._driver = _driver
        if not self._driver:
            try:
                from neo4j import AsyncGraphDatabase
                self._driver = AsyncGraphDatabase.driver(
                    settings.neo4j_uri,
                    auth=(settings.neo4j_user, settings.neo4j_password),
                )
                _driver = self._driver
                logger.info("Neo4j driver initialized: %s", settings.neo4j_uri)
            except Exception as exc:
                logger.warning("Neo4j initialization failed: %s", exc)
                self._driver = None

    async def health_check(self) -> bool:
        """Verify Neo4j connectivity."""
        if not self._driver:
            return False
        try:
            async with self._driver.session() as session:
                result = await session.run("RETURN 1 AS n")
                record = await result.single()
                return record is not None
        except Exception:
            return False

    async def close(self) -> None:
        """Close the Neo4j driver."""
        if self._driver:
            await self._driver.close()

    async def get_related_sections(self, section_ref: str, max_hops: int = 3) -> list[dict[str, Any]]:
        """Traverse the knowledge graph up to N hops from a given section.

        Returns a list of related section nodes with their relationship types
        and text content for augmenting vector search context.
        """
        if not self._driver:
            return []

        query = """
        MATCH path = (start:TaxSection {ref: $section_ref})-[r*1..$max_hops]-(related:TaxSection)
        UNWIND relationships(path) AS rel
        RETURN DISTINCT
            related.ref AS section_ref,
            related.title AS title,
            related.text AS text,
            related.effective_from AS effective_from,
            related.effective_to AS effective_to,
            type(rel) AS relationship_type,
            length(path) AS hop_count
        ORDER BY hop_count ASC
        LIMIT 15
        """

        try:
            async with self._driver.session() as session:
                result = await session.run(query, section_ref=section_ref, max_hops=max_hops)
                records = await result.data()
                return records
        except Exception as exc:
            logger.warning("Graph traversal failed for %s: %s", section_ref, exc)
            return []

    async def generate_and_execute_cypher(self, natural_query: str) -> list[dict[str, Any]]:
        """Generate a Cypher query from natural language and execute it.

        Uses the LLM to translate the query, then runs it against Neo4j.
        Falls back to keyword-based graph search if LLM is unavailable.
        """
        if not self._driver:
            return []

        # Attempt LLM-generated Cypher
        cypher_query = await self._generate_cypher(natural_query)
        if cypher_query:
            try:
                async with self._driver.session() as session:
                    result = await session.run(cypher_query)
                    return await result.data()
            except Exception as exc:
                logger.warning("LLM-generated Cypher failed: %s — query: %s", exc, cypher_query)

        # Fallback: keyword extraction + simple match
        return await self._keyword_graph_search(natural_query)

    async def _generate_cypher(self, natural_query: str) -> Optional[str]:
        """Use LLM to generate a Cypher query from natural language."""
        try:
            from langchain_openai import ChatOpenAI
            from app.services.embedder import _has_real_api_key

            if not _has_real_api_key(settings.openai_api_key):
                return None

            llm = ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key, temperature=0)
            prompt = f"""You are a Neo4j Cypher expert for Indian tax law. The graph has:
- Nodes: TaxSection (ref, title, text, effective_from, effective_to)
- Relationships: REFERENCES, AMENDED_BY, SUPERSEDES, EFFECTIVE_FROM, EFFECTIVE_TO, PENALIZES

Generate a READ-ONLY Cypher query for: "{natural_query}"
Return ONLY the Cypher query, no explanation. Use LIMIT 10."""

            response = await llm.ainvoke(prompt)
            cypher = response.content.strip()
            # Safety: reject any write operations
            if any(kw in cypher.upper() for kw in ["CREATE", "DELETE", "MERGE", "SET ", "REMOVE", "DROP"]):
                logger.warning("Rejected write Cypher query: %s", cypher)
                return None
            return cypher
        except Exception as exc:
            logger.warning("Cypher generation failed: %s", exc)
            return None

    async def _keyword_graph_search(self, query: str) -> list[dict[str, Any]]:
        """Simple keyword-based graph search fallback."""
        import re
        section_matches = re.findall(r"\b(\d{1,3}[A-Z]{0,2})\b", query.upper())
        if not section_matches:
            return []

        results = []
        for ref in section_matches[:3]:
            related = await self.get_related_sections(f"Sec {ref}", max_hops=2)
            results.extend(related)
        return results

    async def seed_tax_graph(self) -> int:
        """Seed the Neo4j graph with Indian tax section relationships."""
        if not self._driver:
            return 0

        sections = [
            ("Sec 80C", "Deductions under Section 80C", "Deductions up to INR 1,50,000 for specified investments"),
            ("Sec 80D", "Medical Insurance Deduction", "Deduction for medical insurance and health checkups"),
            ("Sec 139", "Return Filing", "Timelines for filing returns, belated and revised returns"),
            ("Sec 139(1)", "Due Date for Filing", "Original due date for filing income tax returns"),
            ("Sec 234A", "Interest for Late Filing", "Interest @ 1% per month for delay in filing return"),
            ("Sec 234B", "Interest for Default in Advance Tax", "Interest for shortfall in advance tax payment"),
            ("Sec 234C", "Interest for Deferment", "Interest for deferment of advance tax installments"),
            ("Sec 234F", "Fee for Late Filing", "Late filing fee under section 234F"),
            ("Sec 194C", "TDS on Contractors", "TDS on payments to contractors above threshold"),
            ("Sec 194J", "TDS on Professional Fees", "TDS on fees for professional or technical services"),
            ("Sec 195", "TDS on Non-Resident Payments", "Withholding on payments to non-residents"),
        ]

        relationships = [
            ("Sec 139(1)", "REFERENCES", "Sec 234A"),
            ("Sec 139(1)", "REFERENCES", "Sec 234F"),
            ("Sec 234A", "PENALIZES", "Sec 139"),
            ("Sec 234B", "REFERENCES", "Sec 208"),
            ("Sec 234C", "REFERENCES", "Sec 211"),
            ("Sec 80C", "REFERENCES", "Sec 139(1)"),
            ("Sec 194C", "REFERENCES", "Sec 206AB"),
            ("Sec 194J", "REFERENCES", "Sec 206AB"),
            ("Sec 195", "REFERENCES", "Sec 206AA"),
        ]

        count = 0
        try:
            async with self._driver.session() as session:
                for ref, title, text in sections:
                    await session.run(
                        "MERGE (s:TaxSection {ref: $ref}) "
                        "SET s.title = $title, s.text = $text, "
                        "s.effective_from = '2024-04-01'",
                        ref=ref, title=title, text=text,
                    )
                    count += 1

                for from_ref, rel_type, to_ref in relationships:
                    await session.run(
                        f"MATCH (a:TaxSection {{ref: $from_ref}}), (b:TaxSection {{ref: $to_ref}}) "
                        f"MERGE (a)-[:{rel_type}]->(b)",
                        from_ref=from_ref, to_ref=to_ref,
                    )

            logger.info("Seeded %d tax sections into Neo4j", count)
        except Exception as exc:
            logger.warning("Neo4j seeding failed: %s", exc)
        return count
