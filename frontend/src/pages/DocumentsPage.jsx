import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, FolderOpen, ShieldCheck } from "lucide-react";

import { api } from "../api/client";
import DocumentManager from "../components/dashboard/DocumentManager";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the documents workspace page.
 * @returns {JSX.Element}
 */
export default function DocumentsPage() {
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const documents = documentsQuery.data?.documents || [];
  const fileTypes = new Set(documents.map((document) => document.file_type));
  const indexedCount = documents.filter((document) => document.status === "INDEXED").length;

  const coverageItems = [
    {
      label: "Income tax pack",
      detail: "ITR + Form 26AS for grounded direct-tax answers",
      ready: fileTypes.has("ITR") && fileTypes.has("FORM_26AS")
    },
    {
      label: "GST evidence",
      detail: "GSTR returns, reconciliations, and supporting schedules",
      ready: fileTypes.has("GSTR")
    },
    {
      label: "TDS support",
      detail: "Certificates and withholding back-up",
      ready: fileTypes.has("TDS_CERT")
    },
    {
      label: "Reference library",
      detail: "Circulars and statutory extracts for richer retrieval",
      ready: fileTypes.has("GST_CIRCULAR") || fileTypes.has("IT_ACT")
    }
  ];

  return (
    <DashboardLayout
      title="Documents"
      eyebrow="Evidence workspace"
      description="Manage the PDFs that power retrieval, explanations, and compliance reports."
      chatSummary="Ask the assistant to search uploaded PDFs, summarize evidence, or identify missing tax records."
      chatSuggestions={[
        "Which important documents are still missing?",
        "Summarize the latest uploaded GST evidence",
        "Use my uploaded documents to explain filing risk"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-6 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Ingestion control</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Bring every critical filing document into the AI workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              Upload dense PDFs up to 100MB, let CubitaxAI index them asynchronously, and reuse those chunks across
              chat, deadline review, and report generation.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Total uploads", value: `${documents.length}` },
                { label: "Indexed and searchable", value: `${indexedCount}` },
                { label: "Supported size", value: "100MB / PDF" }
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 text-brand-accent">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">Coverage checklist</h2>
                <p className="text-sm text-slate-500">Recommended document packs for stronger answers.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {coverageItems.map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.ready ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {item.ready ? "Ready" : "Upload next"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <DocumentManager documents={documents} onRefresh={documentsQuery.refetch} />

          <div className="space-y-6">
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brand-primary">How the assistant uses uploads</h2>
                  <p className="text-sm text-slate-500">What improves when your evidence library is complete.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Retrieval narrows answers to your actual returns and certificates.",
                  "Deadlines and compliance summaries become easier to validate against evidence.",
                  "Generated reports can cite uploaded filings instead of relying only on statutory text."
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">Recommended first uploads</h2>
              <div className="mt-4 grid gap-3">
                {[
                  "Latest ITR acknowledgement and computation",
                  "Latest filed GSTR-1 and GSTR-3B set",
                  "Form 26AS and TDS certificates",
                  "Key GST circulars or company filing PDFs you rely on"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <FileText className="mt-0.5 h-4 w-4 text-brand-accent" />
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
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
