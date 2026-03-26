import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, FileText } from "lucide-react";

import { api } from "../api/client";
import ComplianceChart from "../components/dashboard/ComplianceChart";
import DeadlineList from "../components/dashboard/DeadlineList";
import DocumentManager from "../components/dashboard/DocumentManager";
import MetricCard from "../components/dashboard/MetricCard";
import DashboardLayout from "../components/layout/DashboardLayout";

function buildTrend(score) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({
    month,
    score: Math.max(60, Math.min(100, score - 12 + index * 3))
  }));
}

/**
 * Render the primary dashboard overview page.
 * @returns {JSX.Element}
 */
export default function DashboardPage() {
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: api.dashboard.getMetrics });
  const deadlinesQuery = useQuery({ queryKey: ["deadlines"], queryFn: api.dashboard.getDeadlines });
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: api.dashboard.getAlerts });
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });

  const metrics = metricsQuery.data;
  const deadlines = deadlinesQuery.data || [];
  const alerts = alertsQuery.data || [];
  const documents = documentsQuery.data?.documents || [];
  const nextDeadline = deadlines[0];
  const lastUpdated = metrics?.last_updated
    ? new Date(metrics.last_updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : "--";

  const workspaceSignals = [
    {
      label: "Next filing",
      value: nextDeadline?.filing_name || "No immediate due item",
      detail: nextDeadline ? `${nextDeadline.days_remaining} days remaining` : "Calendar is clear for now"
    },
    {
      label: "Alerts requiring review",
      value: `${alerts.length}`,
      detail: alerts.length ? "Follow up before the due window closes" : "No urgent exposure detected"
    },
    {
      label: "Indexed evidence",
      value: `${documents.filter((document) => document.status === "INDEXED").length}`,
      detail: "Documents available for cited retrieval"
    }
  ];

  const operatingCards = [
    {
      title: "GST readiness",
      value: `${deadlines.filter((item) => item.filing_name.includes("GSTR")).length} tracked`,
      description: "Watch GSTR-1, GSTR-3B, and evidence completeness together.",
      icon: CheckCircle2,
      tone: "emerald"
    },
    {
      title: "TDS monitoring",
      value: `${metrics?.tds_liability ? `₹${metrics.tds_liability.toLocaleString("en-IN")}` : "--"}`,
      description: "Estimated exposure based on indexed activity and known obligations.",
      icon: Clock3,
      tone: "amber"
    },
    {
      title: "Document backlog",
      value: `${documents.filter((document) => document.status !== "INDEXED").length}`,
      description: "Uploads still processing or waiting for replacement evidence.",
      icon: FileText,
      tone: "violet"
    }
  ];

  const quickPlays = [
    "Ask the assistant to explain a section with citations",
    "Review missing evidence before the next filing deadline",
    "Generate a cited compliance report after uploads finish"
  ];

  return (
    <DashboardLayout
      title="Dashboard"
      eyebrow="Compliance command center"
      description="Track filing cadence, indexed evidence, and tax risk from one operating surface."
      notificationCount={alerts.length}
      chatSummary="Use the assistant for cited tax answers, deadline checks, and uploaded document analysis."
      chatSuggestions={[
        "What should I file next this month?",
        "Summarize my compliance risk from current alerts",
        "Explain Section 80C with citations",
        "Calculate TDS on ₹2,50,000 rent with PAN"
      ]}
    >
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-primary via-[#2a216b] to-slate-900 p-6 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Operations snapshot</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
              Keep GST, TDS, and filing evidence moving in one place.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100">
              CubitaxAI links deadlines, indexed PDFs, and deterministic tax workflows so the assistant can answer with
              actual context instead of generic tax summaries.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {workspaceSignals.map((signal) => (
                <div key={signal.label} className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">{signal.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{signal.value}</p>
                  <p className="mt-2 text-sm text-violet-100">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {operatingCards.map((card) => {
              const Icon = card.icon;
              const toneClass =
                card.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700"
                  : card.tone === "amber"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-violet-50 text-brand-accent";
              return (
                <div key={card.title} className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-primary">{card.title}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${toneClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Compliance Score"
            value={metrics ? `${metrics.compliance_score}` : "--"}
            subtitle="Measured from deadline adherence and document coverage"
            tone={metrics?.compliance_score >= 80 ? "success" : metrics?.compliance_score >= 60 ? "warning" : "danger"}
          />
          <MetricCard
            label="Pending Filings"
            value={metrics ? `${metrics.pending_filings}` : "--"}
            subtitle="Outstanding obligations that need review"
            tone={metrics?.pending_filings > 3 ? "danger" : "warning"}
          />
          <MetricCard
            label="TDS Liability"
            value={metrics ? `₹${metrics.tds_liability.toLocaleString("en-IN")}` : "--"}
            subtitle="Estimated exposure from indexed filing activity"
            tone="default"
          />
          <MetricCard
            label="Documents Indexed"
            value={metrics ? `${metrics.documents_indexed}` : "--"}
            subtitle="Uploaded files available to the assistant"
            tone="default"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <DeadlineList deadlines={deadlines.slice(0, 6)} />
            <ComplianceChart data={buildTrend(metrics?.compliance_score || 72)} />
          </div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <DocumentManager documents={documents} onRefresh={documentsQuery.refetch} compact />
            <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-brand-primary">Priority Board</h2>
                  <p className="text-sm text-slate-500">Focus areas for this workspace right now.</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Synced {lastUpdated}
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {alerts.length ? (
                  alerts.slice(0, 4).map((alert) => (
                    <div key={alert.title} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-rose-500" />
                          <p className="font-medium text-slate-900">{alert.title}</p>
                        </div>
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{alert.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No urgent alerts right now.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-brand-primary">Recommended Plays</h2>
            <div className="mt-4 grid gap-3">
              {quickPlays.map((play) => (
                <div key={play} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 text-brand-accent" />
                  <p className="text-sm leading-6 text-slate-600">{play}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-brand-primary">Coverage Snapshot</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "GST evidence",
                  value: documents.some((document) => document.file_type === "GSTR") ? "Available" : "Missing"
                },
                {
                  label: "Income tax pack",
                  value:
                    documents.some((document) => document.file_type === "ITR") &&
                    documents.some((document) => document.file_type === "FORM_26AS")
                      ? "Available"
                      : "Partial"
                },
                {
                  label: "TDS support",
                  value: documents.some((document) => document.file_type === "TDS_CERT") ? "Available" : "Missing"
                },
                {
                  label: "This month",
                  value: metrics ? `${metrics.deadlines_this_month} deadlines` : "--"
                }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
