import { motion } from "framer-motion";
import { Calculator, IndianRupee } from "lucide-react";
import AppShell from "../components/AppShell";

const tdsData = [
  { section: "194J", desc: "Professional fees", rate: "10%", threshold: "₹30,000", amount: "₹85,000" },
  { section: "194I", desc: "Rent", rate: "10%", threshold: "₹2,40,000", amount: "₹1,20,000" },
  { section: "194C", desc: "Contractor payments", rate: "1%/2%", threshold: "₹30,000", amount: "₹40,000" },
];

export default function TDSWorkbench() {
  return (
    <AppShell title="TDS Workbench">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total TDS Deducted", value: "₹2,45,000", color: "accent" },
            { label: "TDS Deposited", value: "₹2,05,000", color: "mint" },
            { label: "TDS Pending", value: "₹40,000", color: "warning" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glow-card p-5">
              <p className="text-xs uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className={`mt-2 font-display text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="glow-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <Calculator className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">TDS Sections</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Section", "Description", "Rate", "Threshold", "Deducted"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tdsData.map(r => (
                <tr key={r.section} className="border-b border-border/50 transition-colors hover:bg-surface-hover/50">
                  <td className="px-5 py-3 font-mono text-sm font-bold text-accent">{r.section}</td>
                  <td className="px-5 py-3 text-sm text-text-secondary">{r.desc}</td>
                  <td className="px-5 py-3 font-mono text-sm text-text-primary">{r.rate}</td>
                  <td className="px-5 py-3 font-mono text-sm text-text-secondary">{r.threshold}</td>
                  <td className="px-5 py-3 font-mono text-sm font-semibold text-text-primary">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
