import { motion } from "framer-motion";

/**
 * Render a key metric card on the dashboard.
 * @param {{ label: string, value: string, subtitle: string, tone?: "success"|"warning"|"danger"|"default" }} props
 * @returns {JSX.Element}
 */
export default function MetricCard({ label, value, subtitle, tone = "default" }) {
  const toneClasses = {
    success: "text-brand-success",
    warning: "text-brand-warning",
    danger: "text-brand-danger",
    default: "text-brand-primary"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-4 text-4xl font-bold ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </motion.div>
  );
}

