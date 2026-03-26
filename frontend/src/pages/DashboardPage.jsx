import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

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

  return (
    <DashboardLayout title="Dashboard" notificationCount={alerts.length}>
      <div className="space-y-6">
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
              <h2 className="text-lg font-semibold text-brand-primary">Compliance Alerts</h2>
              <div className="mt-4 space-y-3">
                {alerts.length ? (
                  alerts.slice(0, 4).map((alert) => (
                    <div key={alert.title} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-slate-900">{alert.title}</p>
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
      </div>
    </DashboardLayout>
  );
}

