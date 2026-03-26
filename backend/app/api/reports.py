"""Report generation and download routes."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.agents.report_writer import ReportWriterAgent
from app.config import settings
from app.models.schemas import ReportResponse
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()


def _markdown_to_pdf(markdown_text: str, pdf_path: Path) -> None:
    """Render markdown-like plain text into a simple PDF document."""

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    pdf = canvas.Canvas(str(pdf_path), pagesize=A4)
    text_object = pdf.beginText(40, 800)
    text_object.setFont("Helvetica", 11)

    for line in markdown_text.splitlines():
        if text_object.getY() < 40:
            pdf.drawText(text_object)
            pdf.showPage()
            text_object = pdf.beginText(40, 800)
            text_object.setFont("Helvetica", 11)
        text_object.textLine(line[:120])

    pdf.drawText(text_object)
    pdf.save()


@router.post("/generate", response_model=ReportResponse)
async def generate_report(current_user: User = Depends(get_current_user)) -> ReportResponse:
    """Generate and persist a markdown compliance report."""

    writer = ReportWriterAgent()
    content = await writer.generate_compliance_report(str(current_user.id))
    report_id = uuid4().hex
    report_path = settings.reports_dir / f"{report_id}.md"
    report_path.write_text(content, encoding="utf-8")
    return ReportResponse(report_id=report_id, content=content, generated_at=datetime.now(timezone.utc))


@router.get("/download/{report_id}")
async def download_report(report_id: str, current_user: User = Depends(get_current_user)) -> FileResponse:
    """Return a generated report as a downloadable PDF."""

    _ = current_user
    markdown_path = settings.reports_dir / f"{report_id}.md"
    pdf_path = settings.reports_dir / f"{report_id}.pdf"
    if not markdown_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if not pdf_path.exists():
        _markdown_to_pdf(markdown_path.read_text(encoding="utf-8"), pdf_path)
    return FileResponse(path=pdf_path, filename=f"cubitaxai-report-{report_id}.pdf", media_type="application/pdf")
