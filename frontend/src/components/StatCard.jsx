import { motion } from "framer-motion";

const toneClasses = {
  green: "from-green/20 to-green/5 text-green",
  purple: "from-purple/20 to-purple/5 text-purple-light",
  amber: "from-amber/20 to-amber/5 text-amber",
  muted: "from-white/5 to-white/[0.02] text-text-secondary"
};

/**
 * Render a dashboard KPI card.
 * @param {{ title: string, value: string, icon: import("lucide-react").LucideIcon, tone?: "green"|"purple"|"amber"|"muted", helper?: string }} props
 * @returns {JSX.Element}
 */
export default function StatCard({ title, value, icon: Icon, tone = "muted", helper = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card relative overflow-hidden p-5"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${toneClasses[tone]} opacity-70`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-text-primary">{value}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-text-secondary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {helper ? <p className="mt-4 text-sm text-text-muted">{helper}</p> : null}
      </div>
    </motion.div>
  );
}
