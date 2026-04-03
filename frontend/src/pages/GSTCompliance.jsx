import { motion } from "framer-motion";
import { CheckCircle2, Receipt } from "lucide-react";
import AppShell from "../components/AppShell";

const gstData = [
  { form: "GSTR-1", period: "Mar 2026", status: "filed", amount: "₹4,12,000" },
  { form: "GSTR-3B", period: "Mar 2026", status: "pending", amount: "₹1,89,400" },
  { form: "GSTR-9", period: "FY 2025-26", status: "upcoming", amount: "—" },
];

export default function GSTCompliance() {
  return (
    <AppShell title="GST Compliance">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total GST Liability", value: "₹6,01,400", color: "accent" },
            { label: "Filed This Quarter", value: "2 / 3", color: "mint" },
            { label: "ITC Available", value: "₹1,45,200", color: "mint" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glow-card p-5">
              <p className="text-xs uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className={`mt-2 font-display text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="glow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <Receipt className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">GST Returns</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Form", "Period", "Status", "Amount"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gstData.map(r => (
                <tr key={`${r.form}-${r.period}`} className="border-b border-border/50 transition-colors hover:bg-surface-hover/50">
                  <td className="px-5 py-3 text-sm font-semibold text-text-primary">{r.form}</td>
                  <td className="px-5 py-3 text-sm text-text-secondary">{r.period}</td>
                  <td className="px-5 py-3">
                    <span className={`badge-${r.status === "filed" ? "success" : r.status === "pending" ? "warning" : "neutral"}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-sm text-text-primary">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
