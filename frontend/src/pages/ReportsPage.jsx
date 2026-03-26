import { useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { BarChart2, Download, FileText, ShieldCheck } from "lucide-react";

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
    <DashboardLayout
      title="Reports"
      eyebrow="Cited outputs"
      description="Generate structured compliance summaries backed by the same knowledge and evidence used by the assistant."
      chatSummary="Ask the assistant to outline what should appear in the next report or what evidence is still missing."
      chatSuggestions={[
        "What should go into my next compliance report?",
        "Summarize GST and TDS risk for a report",
        "Which citations are likely to appear in the report?"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-6 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Reporting engine</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Build a client-ready compliance narrative in one click.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              The report writer combines compliance score, pending obligations, deterministic tax calculations, and
              citations from your calendar and indexed documents into a reusable output.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-brand-primary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BarChart2 className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate report"}
              </button>
              {report ? (
                <button
                  type="button"
                  onClick={() => api.reports.downloadReport(report.report_id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              ) : null}
            </div>
          </div>

          <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">What gets included</h2>
                <p className="text-sm text-slate-500">Default modules assembled in the generated report.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Executive summary and compliance score breakdown",
                "Pending obligations with due dates and urgency",
                "TDS and GST summaries with supporting references",
                "Recommendations tied back to citations"
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <FileText className="mt-0.5 h-4 w-4 text-brand-accent" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-brand-primary">Preview</h2>
                <p className="text-sm text-slate-500">Live markdown output from the latest generation run.</p>
              </div>
              {report?.generated_at ? (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {new Date(report.generated_at).toLocaleString("en-IN")}
                </div>
              ) : null}
            </div>
            <pre className="mt-4 min-h-[24rem] whitespace-pre-wrap rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
              {report?.content || "Generate a report to preview markdown output."}
            </pre>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">Suggested workflow</h2>
              <div className="mt-4 space-y-3">
                {[
                  "Upload missing evidence first so the report can ground statements in documents.",
                  "Clear or acknowledge major alerts before exporting a final client PDF.",
                  "Download the PDF after generation if you need a static handoff."
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">Export posture</h2>
              <div className="mt-4 grid gap-3">
                {[
                  { label: "Output format", value: report ? "Markdown + PDF" : "Awaiting generation" },
                  { label: "Citation mode", value: "Embedded in report body" },
                  { label: "Use case", value: "Portfolio demo, client-style summary, internal review" }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
