"""Chat API tests."""

from __future__ import annotations

import asyncio


def test_chat_message_returns_answer_and_citations(client, registered_user):
    """Seed the knowledge base and verify the chat endpoint returns a cited answer."""

    asyncio.run(
        client.app.state.vector_store.embed_and_upsert(
            [
                {
                    "text": "Section 80C allows deductions up to INR 1,50,000 for eligible investments.",
                    "source": "IT_ACT",
                    "section_ref": "Sec 80C",
                    "effective_fy": "2024-25",
                    "doc_type": "KNOWLEDGE_BASE",
                    "page_num": 1,
                    "effective_date": "2024-04-01"
                }
            ],
            "global-tax-knowledge",
            "test-seed",
        )
    )

    response = client.post(
        "/api/chat/message",
        json={"query": "What is the Section 80C deduction limit?", "session_id": "chat-session-1"},
        headers=registered_user,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["session_id"] == "chat-session-1"
    assert payload["answer"]
    assert payload["citations"]
    assert payload["citations"][0]["section_ref"] == "Sec 80C"

