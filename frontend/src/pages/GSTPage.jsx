import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, FileText, FolderOpen, Receipt } from "lucide-react";

import { api } from "../api/client";
import DeadlineList from "../components/dashboard/DeadlineList";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the GST compliance page.
 * @returns {JSX.Element}
 */
export default function GSTPage() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const gstDeadlines = (deadlinesQuery.data || []).filter((item) => item.filing_name.includes("GSTR"));
  const documents = documentsQuery.data?.documents || [];
  const hasGstr = documents.some((document) => document.file_type === "GSTR");
  const hasGstReference = documents.some((document) => document.file_type === "GST_CIRCULAR");

  const folderBlueprint = [
    {
      key: "registration",
      path: "/01-registration-and-master-data",
      summary: "Keep GST registration, profile changes, LUT/Bond, and state registrations together.",
      documents: ["GST registration certificate", "Amendment orders", "LUT / Bond", "GSTIN master data"]
    },
    {
      key: "outward",
      path: "/02-outward-supplies",
      summary: "Evidence for outward supply reporting and invoice-level accuracy.",
      documents: ["Sales register", "Tax invoices", "Credit / debit notes", "E-invoice IRN and e-way bill exports"]
    },
    {
      key: "inward",
      path: "/03-inward-supplies-and-itc",
      summary: "ITC proof, reconciliations, and vendor-side dependencies.",
      documents: ["Purchase register", "Vendor invoices", "GSTR-2B extracts", "ITC reconciliation working"]
    },
    {
      key: "returns",
      path: "/04-returns-and-payments",
      summary: "Monthly compliance pack for filing and payment defense.",
      documents: ["GSTR-1 workings", "GSTR-3B workings", "PMT-06 / challans", "Filed acknowledgements"]
    },
    {
      key: "annual",
      path: "/05-annual-and-notices",
      summary: "Year-end GST close and litigation support.",
      documents: ["GSTR-9", "GSTR-9C", "DRC-03 / notices", "Replies and orders"]
    },
    {
      key: "reference",
      path: "/06-reference-circulars",
      summary: "Reference material for policy interpretation and audit defense.",
      documents: ["CBIC circular PDFs", "Relevant GST act extracts", "Rate notifications", "Internal position notes"]
    }
  ];

  function getFolderStatus(folderKey) {
    if (folderKey === "returns" && hasGstr) {
      return { label: "Ready", className: "bg-emerald-50 text-emerald-600" };
    }
    if (folderKey === "reference" && hasGstReference) {
      return { label: "Ready", className: "bg-emerald-50 text-emerald-600" };
    }
    if (documents.length) {
      return { label: "Prepare", className: "bg-amber-50 text-amber-600" };
    }
    return { label: "Upload first", className: "bg-slate-100 text-slate-500" };
  }

  return (
    <DashboardLayout
      title="GST Compliance"
      eyebrow="GST command center"
      description="Track monthly filings, keep evidence organized, and route GST questions through the assistant."
      chatSummary="Ask about GSTR-1, GSTR-3B, ITC, GST notices, or missing evidence in your GST workspace."
      chatSuggestions={[
        "What is the next GSTR deadline?",
        "Which GST evidence folders should I prioritize first?",
        "Explain ITC eligibility with citations"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-6 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">GST operating model</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Organize GST evidence the way a real filing team needs it.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              Build a repeatable folder structure for registration, outward and inward supplies, returns, annual
              filings, and notices so CubitaxAI can reconcile filings against the right document sets.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "GST deadlines tracked", value: `${gstDeadlines.length}` },
                { label: "GST returns uploaded", value: `${documents.filter((document) => document.file_type === "GSTR").length}` },
                { label: "Reference circulars", value: hasGstReference ? "Available" : "Missing" }
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
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">Monthly GST cadence</h2>
                <p className="text-sm text-slate-500">Suggested operating rhythm around GSTR-1 and GSTR-3B.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Week 1: reconcile outward supplies, e-invoices, and e-way bills.",
                "Week 2: lock GSTR-1 working and vendor mismatch notes.",
                "Week 3: validate GSTR-2B and ITC conditions before 3B.",
                "Week 4: archive filed acknowledgements, challans, and exception notes."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">Recommended GST folder structure</h2>
                <p className="text-sm text-slate-500">Use this structure for uploads, reconciliations, and future audits.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {folderBlueprint.map((folder) => {
                const status = getFolderStatus(folder.key);
                return (
                  <div key={folder.path} className="rounded-[26px] border border-slate-200 bg-white/90 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-brand-accent" />
                          <p className="truncate font-semibold text-slate-900">{folder.path}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{folder.summary}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {folder.documents.map((document) => (
                        <div key={document} className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                          <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{document}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <DeadlineList deadlines={gstDeadlines} />
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">Assistant prompts for GST</h2>
              <div className="mt-4 space-y-3">
                {[
                  "Reconcile my GST evidence folders against return filings",
                  "What documents support ITC eligibility?",
                  "Explain late-fee exposure if GSTR-3B is delayed"
                ].map((prompt) => (
                  <div key={prompt} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-brand-accent" />
                    <p className="text-sm leading-6 text-slate-600">{prompt}</p>
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
