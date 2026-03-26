import { useQuery } from "@tanstack/react-query";

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

  return (
    <DashboardLayout title="Deadlines" notificationCount={alerts.length}>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DeadlineList deadlines={deadlines} />
        <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-brand-primary">Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.title} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="font-medium text-slate-900">{alert.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

