import { motion } from "framer-motion";

export function ComplianceScoreRing({ score = 0, size = 180, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  const color =
    progress >= 80 ? "#10B981" : progress >= 60 ? "#F59E0B" : "#EF4444";
  const bgColor =
    progress >= 80
      ? "rgba(16, 185, 129, 0.1)"
      : progress >= 60
        ? "rgba(245, 158, 11, 0.1)"
        : "rgba(239, 68, 68, 0.1)";
  const label =
    progress >= 80 ? "Excellent" : progress >= 60 ? "Fair" : "Needs Attention";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {progress}
          </span>
          <span className="text-xs text-text-muted uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>
      <div className="text-center">
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: bgColor, color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const config = {
    Filed: { class: "badge-success", dot: "bg-success" },
    Pending: { class: "badge-warning", dot: "bg-warning" },
    Overdue: { class: "badge-danger", dot: "bg-danger" },
    "Not Applicable": { class: "badge-neutral", dot: "bg-text-muted" },
    Indexed: { class: "badge-success", dot: "bg-success" },
    Processing: { class: "badge-warning", dot: "bg-warning" },
    Failed: { class: "badge-danger", dot: "bg-danger" },
  };
  const c = config[status] || config["Pending"];

  return (
    <span className={c.class}>
      <span className={`status-dot ${c.dot} mr-1.5`} />
      {status}
    </span>
  );
}

export function MetricCard({ title, value, subtitle, icon, trend, color = "accent" }) {
  const colorMap = {
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <motion.div
      className="card group cursor-pointer"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-text-muted text-sm">{title}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${colorMap[color] || "text-text-primary"} mb-1`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-text-muted flex items-center gap-1">
          {trend && (
            <span className={trend > 0 ? "text-success" : "text-danger"}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

export function SkeletonLoader({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function AgentBadge({ agent }) {
  const labels = {
    planning_node: { label: "Planner", color: "badge-accent" },
    retriever_node: { label: "Tax Retriever", color: "badge-accent" },
    calculator_node: { label: "Liability Calc", color: "badge-warning" },
    compliance_node: { label: "Compliance", color: "badge-success" },
    answer_synthesizer: { label: "Synthesizer", color: "badge-neutral" },
    critic_node: { label: "Critic", color: "badge-danger" },
  };
  const config = labels[agent] || { label: agent || "Agent", color: "badge-neutral" };

  return <span className={config.color}>{config.label}</span>;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-text-muted mb-4 text-4xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm max-w-md mb-4">{description}</p>
      {action}
    </div>
  );
}
