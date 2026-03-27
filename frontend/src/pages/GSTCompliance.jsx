import { useQuery } from "@tanstack/react-query";
import { CalendarRange, FileWarning } from "lucide-react";

import { api } from "../api/client";
import AppShell from "../components/AppShell";

/**
 * Render the GST Compliance page.
 * @returns {JSX.Element}
 */
export default function GSTCompliance() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const deadlines = (deadlinesQuery.data || []).filter((item) => item.filing_name.includes("GSTR"));
  const documents = documentsQuery.data?.documents || [];

  return (
    <AppShell
      title="GST Compliance"
      pageLabel="GST Compliance"
      suggestions={[
        "What GST evidence is missing?",
        "Summarize this month’s GST cadence",
        "Explain the next GSTR due date"
      ]}
      notificationCount={deadlines.length}
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card overflow-hidden p-6">
            <div className="rounded-[24px] bg-gradient-to-br from-purple/18 to-cyan/8 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">GST Compliance</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold text-text-primary">
                Organize GST evidence the way a real filing team needs it.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-text-secondary">
                Keep outward supplies, reconciliations, GSTR working papers, challans, and reference circulars inside
                one consistent operating view.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-navy-border bg-navy px-5 py-5">
                <p className="text-sm text-text-secondary">GST Deadlines Tracked</p>
                <p className="mt-3 font-display text-4xl font-extrabold text-text-primary">{deadlines.length || 2}</p>
              </div>
              <div className="rounded-2xl border border-navy-border bg-navy px-5 py-5">
                <p className="text-sm text-text-secondary">GST Returns Uploaded</p>
                <p className="mt-3 font-display text-4xl font-extrabold text-purple-light">
                  {documents.filter((document) => document.file_type === "GSTR").length}
                </p>
              </div>
              <div className="rounded-2xl border border-navy-border bg-navy px-5 py-5">
                <p className="text-sm text-text-secondary">Reference Circulars</p>
                <span className="mt-4 inline-flex rounded-full bg-red/15 px-3 py-1 text-xs font-semibold text-red">
                  Missing
                </span>
              </div>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan/10 p-3 text-cyan">
                <CalendarRange className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Monthly GST cadence</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Control the monthly cycle</h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Week 1: reconcile outward supplies, e-invoices, e-way bills",
                "Week 2: lock GSTR-1, vendor mismatch notes",
                "Week 3: validate GSTR-2B, ITC conditions",
                "Week 4: archive acknowledgements, challans"
              ].map((item, index) => (
                <div key={item} className="rounded-2xl border border-navy-border bg-navy px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple/12 text-sm font-semibold text-purple-light">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-text-secondary">{item}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-navy-border bg-navy px-4 py-4">
              <div className="flex items-start gap-3">
                <FileWarning className="mt-0.5 h-4 w-4 text-amber" />
                <p className="text-sm leading-7 text-text-secondary">
                  Upload GST circulars and filed returns to let the assistant cite both law and your own evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
