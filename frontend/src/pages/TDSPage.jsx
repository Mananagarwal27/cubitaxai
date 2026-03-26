import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Calculator, FileText, Percent, ShieldCheck } from "lucide-react";

import { api } from "../api/client";
import DashboardLayout from "../components/layout/DashboardLayout";

const tdsSections = [
  { section: "194A", useCase: "Interest other than securities", threshold: "₹50,000", rate: "10%" },
  { section: "194C", useCase: "Contractors", threshold: "₹30,000", rate: "1% / 2%" },
  { section: "194I", useCase: "Rent", threshold: "₹2,40,000", rate: "10%" },
  { section: "194J", useCase: "Professional fees", threshold: "₹30,000", rate: "10%" },
  { section: "195", useCase: "Non-resident payments", threshold: "Nil", rate: "As applicable" },
  { section: "206AB", useCase: "Specified non-filers", threshold: "Nil", rate: "Higher of applicable rates" }
];

/**
 * Render the TDS workbench page.
 * @returns {JSX.Element}
 */
export default function TDSPage() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const tdsDeadlines = (deadlinesQuery.data || []).filter((item) => item.filing_name.includes("TDS"));

  return (
    <DashboardLayout
      title="TDS Workbench"
      eyebrow="Deterministic calculations"
      description="Review key sections, withholding scenarios, and supporting evidence needed for TDS decisions."
      chatSummary="Use the assistant for deterministic TDS calculations, threshold checks, and section-led follow-up questions."
      chatSuggestions={[
        "Calculate TDS on ₹2,50,000 rent with PAN",
        "Calculate TDS on professional fees without PAN",
        "Which section applies to contractor payments?"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-6 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">TDS engine</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Deterministic withholding logic instead of fuzzy model math.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              The assistant routes TDS calculations through hard-coded section tables, rates, and PAN logic so the
              result stays reproducible for review and reporting.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Sections in rotation", value: "10+" },
                { label: "Next TDS deadlines", value: `${tdsDeadlines.length}` },
                { label: "Engine mode", value: "Deterministic" }
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">Best prompts for the engine</h2>
                <p className="text-sm text-slate-500">Ask precise questions to get deterministic outputs.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Calculate TDS on ₹80,000 professional fees with PAN",
                "What section applies to non-resident royalty payments?",
                "Compare TDS on rent with and without PAN"
              ].map((prompt) => (
                <div key={prompt} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-600">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-primary">Core TDS section matrix</h2>
                <p className="text-sm text-slate-500">Working sections available in the current rules engine.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {tdsSections.map((item) => (
                <div key={item.section} className="rounded-[24px] border border-slate-200 bg-white/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-brand-primary">Sec. {item.section}</p>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-brand-accent">
                      {item.rate}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">{item.useCase}</p>
                  <p className="mt-2 text-sm text-slate-500">Threshold: {item.threshold}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brand-primary">Control notes</h2>
                  <p className="text-sm text-slate-500">Questions worth resolving before relying on the output.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Confirm PAN availability and residential status first.",
                  "Check whether threshold is annual or transaction specific.",
                  "Retain invoice, agreement, and challan evidence with the working paper."
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brand-primary">Evidence to retain</h2>
                  <p className="text-sm text-slate-500">Documents that should sit behind any TDS conclusion.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Vendor PAN and declaration documents",
                  "Invoice, agreement, or payment instruction",
                  "Challan, certificate, and monthly reconciliation"
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {item}
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
