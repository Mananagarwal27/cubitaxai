import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";

import { api } from "../api/client";
import AppShell from "../components/AppShell";

/**
 * Render the deadlines page.
 * @returns {JSX.Element}
 */
export default function Deadlines() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const deadlines = deadlinesQuery.data || [];

  const items = deadlines.length
    ? deadlines
    : [
        { filing_name: "GSTR-1", due_date: "2026-04-11T00:00:00Z", urgency: "AMBER", status: "Due Soon" },
        { filing_name: "GSTR-3B", due_date: "2026-04-20T00:00:00Z", urgency: "AMBER", status: "Due Soon" },
        { filing_name: "TDS Deposit", due_date: "2026-04-07T00:00:00Z", urgency: "GREEN", status: "OK" }
      ];

  return (
    <AppShell
      title="Deadlines"
      pageLabel="Deadlines"
      suggestions={[
        "Which deadline is most urgent?",
        "Explain the next GST due date",
        "What is already overdue?"
      ]}
      notificationCount={items.length}
    >
      <div className="surface-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber/10 p-3 text-amber">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Compliance calendar</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Upcoming filing deadlines</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((deadline) => {
            const Icon =
              deadline.status === "Overdue" ? AlertTriangle : deadline.status === "Due Soon" ? Clock3 : CheckCircle2;
            const toneClass =
              deadline.status === "Overdue"
                ? "bg-red/15 text-red"
                : deadline.status === "Due Soon"
                  ? "bg-amber/15 text-amber"
                  : "bg-green/15 text-green";

            return (
              <div key={`${deadline.filing_name}-${deadline.due_date}`} className="flex items-center justify-between gap-4 rounded-2xl border border-navy-border bg-navy px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-3 ${toneClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{deadline.filing_name}</p>
                    <p className="text-sm text-text-secondary">
                      Due on {new Date(deadline.due_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
                  {deadline.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
