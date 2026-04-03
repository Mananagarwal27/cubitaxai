import { motion } from "framer-motion";
import { Download, FileText, Plus } from "lucide-react";
import AppShell from "../components/AppShell";

const reports = [
  { name: "Q4 TDS Compliance Report", date: "2026-03-31", type: "TDS", status: "ready" },
  { name: "GST Annual Reconciliation", date: "2026-03-15", type: "GST", status: "ready" },
  { name: "ITR Pre-filing Analysis", date: "2026-02-28", type: "ITR", status: "generating" },
];

export default function Reports() {
  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Generated Reports</h2>
          <button className="btn-primary text-sm"><Plus className="h-4 w-4" /> New Report</button>
        </div>

        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glow-card flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                  <p className="text-xs text-text-muted">{r.type} · {r.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge-${r.status === "ready" ? "success" : "warning"}`}>{r.status}</span>
                {r.status === "ready" && (
                  <button className="btn-ghost text-xs"><Download className="h-3.5 w-3.5" /> PDF</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
