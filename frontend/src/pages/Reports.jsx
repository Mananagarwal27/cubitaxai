import { CheckCircle2, FileStack, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { api } from "../api/client";
import AppShell from "../components/AppShell";

/**
 * Render the reports page.
 * @returns {JSX.Element}
 */
export default function Reports() {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const response = await api.reports.generateReport();
      setReport(response);
      toast.success("Report generated");
    } catch (error) {
      toast.error("Unable to generate report");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell
      title="Reports"
      pageLabel="Reports"
      suggestions={[
        "What goes into the report?",
        "Summarize compliance position for a client report",
        "What citations will be included?"
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="surface-card p-6">
          <div className="rounded-[24px] bg-gradient-to-br from-purple/18 to-cyan/8 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Client-ready reporting</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold text-text-primary">
              Build a client-ready compliance narrative in one click.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary">
              Generate a structured report with compliance score, deadline posture, and cited tax reasoning from the
              CubitaxAI workspace.
            </p>
            <button type="button" onClick={handleGenerate} className="primary-button mt-8" disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-navy-border bg-navy p-5">
            <div className="flex items-center gap-3">
              <FileStack className="h-5 w-5 text-text-secondary" />
              <h3 className="font-display text-2xl font-bold text-text-primary">Preview</h3>
            </div>
            <pre className="thin-scrollbar mt-4 max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm leading-8 text-text-secondary">
              {report?.content || "Generate Report to preview the cited markdown output."}
            </pre>
          </div>
        </div>

        <div className="surface-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">What gets included</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Checklist</h2>
          <div className="mt-6 space-y-3">
            {[
              "Executive summary + compliance score",
              "Pending obligations with due dates",
              "TDS and GST summaries with references",
              "Recommendations tied back to citations"
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-navy-border bg-navy px-4 py-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green" />
                <p className="text-sm leading-7 text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
