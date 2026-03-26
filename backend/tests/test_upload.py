"""Document upload API tests."""

from __future__ import annotations


def test_upload_document_accepts_pdf_and_lists_document(client, registered_user):
    """Upload a PDF and confirm it appears in the user's document list."""

    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF"
    )

    upload_response = client.post(
        "/api/upload/document",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        headers=registered_user,
    )
    assert upload_response.status_code == 202
    payload = upload_response.json()
    assert payload["filename"] == "sample.pdf"

    list_response = client.get("/api/upload/documents", headers=registered_user)
    assert list_response.status_code == 200
    documents = list_response.json()["documents"]
    assert len(documents) == 1
    assert documents[0]["filename"] == "sample.pdf"
