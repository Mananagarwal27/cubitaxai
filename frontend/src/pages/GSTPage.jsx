import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import DeadlineList from "../components/dashboard/DeadlineList";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the GST compliance page.
 * @returns {JSX.Element}
 */
export default function GSTPage() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const gstDeadlines = (deadlinesQuery.data || []).filter((item) => item.filing_name.includes("GSTR"));

  return (
    <DashboardLayout title="GST Compliance">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">GST position</p>
          <h2 className="mt-3 text-3xl font-bold text-brand-primary">Return visibility and filing cadence</h2>
          <p className="mt-4 leading-7 text-slate-500">
            Use the assistant to validate GSTR-1 and GSTR-3B obligations, cross-check ITC conditions, and inspect
            uploaded GST evidence.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Key checks</p>
              <p className="mt-3 font-semibold text-slate-900">Registration, ITC, returns, penalties</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Suggested query</p>
              <p className="mt-3 font-semibold text-slate-900">“What is the GSTR-3B due date and related section?”</p>
            </div>
          </div>
        </div>
        <DeadlineList deadlines={gstDeadlines} />
      </div>
    </DashboardLayout>
  );
}

