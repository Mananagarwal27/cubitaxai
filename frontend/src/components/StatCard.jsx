import { motion } from "framer-motion";

const toneClasses = {
  green: "from-emerald-100 to-transparent text-emerald-600",
  purple: "from-violet-100 to-transparent text-violet-600",
  amber: "from-amber-100 to-transparent text-amber-600",
  muted: "from-slate-100 to-transparent text-slate-500"
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
      className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${toneClasses[tone]} opacity-70`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-[#171b4d]">{value}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {helper ? <p className="mt-4 text-sm text-slate-500">{helper}</p> : null}
      </div>
    </motion.div>
  );
}
