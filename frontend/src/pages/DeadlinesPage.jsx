import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";

import { api } from "../api/client";
import DeadlineList from "../components/dashboard/DeadlineList";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the deadlines and alerts page.
 * @returns {JSX.Element}
 */
export default function DeadlinesPage() {
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: api.dashboard.getAlerts });
  const deadlines = deadlinesQuery.data || [];
  const alerts = alertsQuery.data || [];
  const overdueCount = deadlines.filter((deadline) => deadline.days_remaining < 0).length;
  const dueThisWeek = deadlines.filter((deadline) => deadline.days_remaining >= 0 && deadline.days_remaining <= 7).length;
  const dueThisMonth = deadlines.filter((deadline) => deadline.days_remaining >= 0 && deadline.days_remaining <= 30).length;

  return (
    <DashboardLayout
      title="Deadlines"
      eyebrow="Calendar and risk monitoring"
      description="Track what is due soon, what is already overdue, and which filings need evidence support."
      notificationCount={alerts.length}
      chatSummary="Ask the assistant to explain due dates, late filing exposure, or missing evidence before an upcoming deadline."
      chatSuggestions={[
        "What is due in the next 7 days?",
        "Summarize overdue items and risk",
        "Which documents should I upload before the next filing?"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-5 md:grid-cols-3"
        >
          {[
            {
              label: "Due this week",
              value: `${dueThisWeek}`,
              description: "Items entering the immediate action window.",
              icon: Clock3,
              className: "bg-amber-50/80 text-amber-700"
            },
            {
              label: "Due this month",
              value: `${dueThisMonth}`,
              description: "Filing and payment checkpoints still in the active cycle.",
              icon: CalendarClock,
              className: "bg-violet-50/80 text-brand-accent"
            },
            {
              label: "Overdue",
              value: `${overdueCount}`,
              description: "Items that need immediate review or remediation.",
              icon: AlertTriangle,
              className: "bg-rose-50/80 text-rose-600"
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{card.description}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${card.className}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DeadlineList deadlines={deadlines} />

          <div className="space-y-6">
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">Alerts</h2>
              <div className="mt-4 space-y-3">
                {alerts.length ? (
                  alerts.map((alert) => (
                    <div key={alert.title} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">{alert.title}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            alert.severity === "high"
                              ? "bg-rose-50 text-rose-600"
                              : alert.severity === "medium"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{alert.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No active deadline alerts right now.
                  </p>
                )}
              </div>
            </div>

            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-brand-primary">How to stay ahead</h2>
              <div className="mt-4 space-y-3">
                {[
                  "Upload supporting filings early so the assistant can use your evidence before the deadline window.",
                  "Resolve amber items before they move into the 7-day zone.",
                  "Use the reports page after clearing alerts to snapshot your filing position."
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
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
