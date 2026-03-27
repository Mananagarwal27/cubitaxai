import { useQuery } from "@tanstack/react-query";
import { Bot, CalendarClock, CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react";

import { api } from "../api/client";
import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";

const fallbackMetrics = {
  compliance_score: 92,
  documents_indexed: 48,
  pending_filings: 3
};

/**
 * Render the main dashboard overview.
 * @returns {JSX.Element}
 */
export default function Dashboard() {
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: api.dashboard.getMetrics });
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });

  const metrics = metricsQuery.data || fallbackMetrics;
  const deadlines = deadlinesQuery.data || [
    { filing_name: "GSTR-1", due_date: "2026-04-11T00:00:00Z", urgency: "AMBER", status: "Due Soon", days_remaining: 15 },
    { filing_name: "GSTR-3B", due_date: "2026-04-20T00:00:00Z", urgency: "AMBER", status: "Due Soon", days_remaining: 24 },
    { filing_name: "TDS Deposit", due_date: "2026-04-07T00:00:00Z", urgency: "GREEN", status: "OK", days_remaining: 11 }
  ];
  const documents = documentsQuery.data?.documents || [];
  const indexedDocs = documents.length || metrics.documents_indexed || 48;

  const activity = [
    {
      icon: FileText,
      title: "Knowledge base ready for cited retrieval",
      time: "5 min ago"
    },
    {
      icon: CheckCircle2,
      title: "Compliance score refreshed against latest deadlines",
      time: "18 min ago"
    },
    {
      icon: Sparkles,
      title: "Assistant session resumed for the active workspace",
      time: "36 min ago"
    },
    {
      icon: ShieldCheck,
      title: "Authentication token renewed for current session",
      time: "1 hr ago"
    }
  ];

  return (
    <AppShell
      title="Dashboard"
      pageLabel="Dashboard"
      suggestions={[
        "Summarize my current dashboard risk",
        "What should I file next?",
        "Explain the next deadline with citations"
      ]}
      notificationCount={deadlines.length}
    >
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <StatCard title="Compliance Score" value={`${metrics.compliance_score || 92}`} tone="green" icon={ShieldCheck} helper="Healthy filing posture" />
          <StatCard title="Indexed Docs" value={`${indexedDocs}`} tone="purple" icon={FileText} helper="Ready for retrieval" />
          <StatCard title="Upcoming Deadlines" value={`${String(deadlines.length).padStart(2, "0")}`} tone="amber" icon={CalendarClock} helper="Next 30 day window" />
          <StatCard title="GST Returns" value={`${documents.filter((document) => document.file_type === "GSTR").length}`} tone="muted" icon={CheckCircle2} helper="Uploaded GST evidence" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Recent Activity</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">What moved in the workspace</h2>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center justify-between gap-4 rounded-2xl border border-navy-border bg-navy px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/[0.04] p-3 text-text-secondary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-text-primary">{item.title}</p>
                    </div>
                    <span className="text-xs font-medium text-text-muted">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Upcoming Deadlines</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Keep ahead of due dates</h2>
            <div className="mt-6 space-y-3">
              {deadlines.slice(0, 4).map((deadline) => (
                <div key={`${deadline.filing_name}-${deadline.due_date}`} className="rounded-2xl border border-navy-border bg-navy px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-text-primary">{deadline.filing_name}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        deadline.urgency === "RED"
                          ? "bg-red/15 text-red"
                          : deadline.urgency === "AMBER"
                            ? "bg-amber/15 text-amber"
                            : "bg-green/15 text-green"
                      }`}
                    >
                      {deadline.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    {new Date(deadline.due_date).toLocaleDateString("en-IN")} · {deadline.days_remaining} days left
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-purple/15 p-3 text-purple-light">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Assistant Insight</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Section-linked signal from your workspace</h2>
              <p className="mt-4 max-w-4xl text-base leading-8 text-text-secondary">
                The current filing calendar shows GST obligations in the next cycle, while your workspace still lacks
                uploaded GST returns. Add GSTR evidence first so assistant answers can cite both statutory provisions
                and your actual filing pack.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
