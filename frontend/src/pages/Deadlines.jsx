import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import AppShell from "../components/AppShell";

const deadlines = [
  { name: "GSTR-1 Filing", form: "GSTR-1", date: "2026-04-11", daysLeft: 8, severity: "warning" },
  { name: "GSTR-3B Filing", form: "GSTR-3B", date: "2026-04-20", daysLeft: 17, severity: "warning" },
  { name: "TDS Q4 Return", form: "26Q", date: "2026-05-31", daysLeft: 58, severity: "success" },
  { name: "ITR Filing", form: "ITR-6", date: "2026-10-31", daysLeft: 211, severity: "success" },
  { name: "GST Annual Return", form: "GSTR-9", date: "2026-12-31", daysLeft: 272, severity: "success" },
];

export default function Deadlines() {
  return (
    <AppShell title="Deadlines">
      <div className="max-w-3xl space-y-4">
        {deadlines.map((dl, i) => (
          <motion.div
            key={dl.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glow-card flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dl.severity === "warning" ? "bg-warning/10" : "bg-mint/10"}`}>
                <Calendar className={`h-5 w-5 ${dl.severity === "warning" ? "text-warning" : "text-mint"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{dl.name}</p>
                <p className="text-xs text-text-muted">{dl.form} · Due {dl.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge-${dl.severity}`}>{dl.daysLeft} days left</span>
            </div>
          </motion.div>
        ))}
      </div>
    </AppShell>
  );
}
