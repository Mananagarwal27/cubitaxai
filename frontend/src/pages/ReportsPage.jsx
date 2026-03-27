import { useState } from "react";
import toast from "react-hot-toast";

import { api } from "../api/client";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the report generation page.
 * @returns {JSX.Element}
 */
export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateReport() {
    setIsGenerating(true);
    try {
      const nextReport = await api.reports.generateReport();
      setReport(nextReport);
      toast.success("Compliance report generated");
    } catch (error) {
      toast.error("Unable to generate report");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">Compliance reporting</p>
          <h2 className="mt-3 text-3xl font-bold text-brand-primary">Generate a cited compliance report</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-500">
            Build a markdown report with score breakdown, pending obligations, TDS and GST summaries, recommendations,
            and citations from the compliance calendar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="rounded-2xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate report"}
            </button>
            {report ? (
              <button
                type="button"
                onClick={() => api.reports.downloadReport(report.report_id)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-brand-accent"
              >
                Download PDF
              </button>
            ) : null}
          </div>
        </div>

        <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
          <h3 className="text-xl font-semibold text-brand-primary">Preview</h3>
          <pre className="mt-4 whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {report?.content || "Generate a report to preview markdown output."}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
