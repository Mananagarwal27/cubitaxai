import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  IndianRupee,
  LogOut,
  PieChart,
  Receipt,
  Settings,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

/* ── Animated counter ────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const end = typeof value === "number" ? value : parseFloat(value) || 0;
    if (!end) { setDisplay(0); return; }
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <>{prefix}{display.toLocaleString("en-IN")}{suffix}</>;
}

/* ── Compliance Score Ring ────────────────────────────────────────── */
function ComplianceRing({ score }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00D4AA" : score >= 50 ? "#F5A623" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Track */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-4xl font-extrabold" style={{ color }}>
          <AnimatedNumber value={score} />
        </p>
        <p className="text-xs text-text-muted">Compliance</p>
      </div>
    </div>
  );
}

/* ── Mock Data ───────────────────────────────────────────────────── */
const mockStats = [
  { label: "Monthly TDS", value: 245000, trend: "+12%", icon: Receipt, color: "accent" },
  { label: "GST Payable", value: 189400, trend: "-3%", icon: IndianRupee, color: "mint" },
  { label: "Advance Tax Due", value: 500000, trend: "+8%", icon: Calendar, color: "warning" },
  { label: "Total Savings", value: 128500, trend: "+24%", icon: TrendingUp, color: "mint" },
];

const mockFilings = [
  { type: "GSTR-3B", period: "Mar 2026", due: "2026-04-20", status: "pending", amount: "₹1,89,400" },
  { type: "TDS 26Q", period: "Q4 FY26", due: "2026-05-31", status: "pending", amount: "₹2,45,000" },
  { type: "GSTR-1", period: "Mar 2026", due: "2026-04-11", status: "filed", amount: "₹4,12,000" },
  { type: "ITR-6", period: "FY 2025-26", due: "2026-10-31", status: "upcoming", amount: "—" },
  { type: "GST Annual", period: "FY 2025-26", due: "2026-12-31", status: "upcoming", amount: "—" },
];

const mockDeadlines = [
  { name: "GSTR-1 Filing", date: "Apr 11", daysLeft: 8, severity: "warning" },
  { name: "GSTR-3B Filing", date: "Apr 20", daysLeft: 17, severity: "warning" },
  { name: "TDS Q4 Return", date: "May 31", daysLeft: 58, severity: "success" },
];

const mockActivity = [
  { agent: "Retriever", summary: "Found 3 relevant sections for TDS query", time: "2m ago", color: "#4F6EF7" },
  { agent: "Calculator", summary: "Computed advance tax for Q1 FY27: ₹1,25,000", time: "15m ago", color: "#00D4AA" },
  { agent: "Compliance", summary: "GSTR-3B deadline alert triggered", time: "1h ago", color: "#F5A623" },
  { agent: "Ingestor", summary: "Indexed Form 26AS (45 pages)", time: "3h ago", color: "#6B8AFF" },
];

const statusStyles = {
  filed: "badge-success",
  pending: "badge-warning",
  overdue: "badge-danger",
  upcoming: "badge-neutral",
};

function stagger(i) {
  return { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.5 } };
}

/* ══════════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Top Nav ──────────────────────────────────────────────── */}
      <nav className="nav-bar scrolled">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                <div className="h-4 w-4 rounded-sm bg-accent" />
              </div>
              <span className="font-display text-lg font-bold">
                Cubitax<span className="text-accent">AI</span>
              </span>
            </Link>
            <div className="hidden items-center gap-1 md:flex">
              {[
                { label: "Dashboard", to: "/dashboard", active: true },
                { label: "Chat", to: "/chat" },
                { label: "Documents", to: "/dashboard/documents" },
                { label: "Reports", to: "/dashboard/reports" },
                { label: "Settings", to: "/dashboard/settings" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-surface-hover text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative btn-ghost">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger border-2 border-bg" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="flex items-center gap-2 rounded-full bg-surface-hover px-3 py-1.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  {(user?.full_name || user?.email || "U")[0].toUpperCase()}
                </div>
                <span className="hidden text-sm text-text-secondary md:inline">
                  {user?.full_name || user?.email || "User"}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-surface-elevated p-2 shadow-panel">
                  <Link to="/dashboard/settings" className="btn-ghost w-full justify-start text-left">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost w-full justify-start text-left text-danger">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1440px] px-6 pb-16 pt-24">
        {/* Hero Row: Compliance Ring + Deadlines */}
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Compliance Score */}
          <motion.div {...stagger(0)} className="glow-card flex flex-col items-center p-8">
            <ComplianceRing score={92} />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="badge-warning">3 filings pending</span>
              <span className="badge-danger">1 overdue</span>
              <span className="badge-success">All TDS filed</span>
            </div>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div {...stagger(1)} className="glow-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Upcoming Deadlines</h2>
              <Link to="/dashboard/deadlines" className="btn-ghost text-xs">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {mockDeadlines.map((dl) => (
                <div key={dl.name} className="surface-card p-4">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${dl.severity === "warning" ? "text-warning" : "text-mint"}`} />
                    <p className="text-xs text-text-muted">{dl.date}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{dl.name}</p>
                  <p className={`mt-1 font-mono text-xs ${dl.severity === "warning" ? "text-warning" : "text-mint"}`}>
                    {dl.daysLeft} days left
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} {...stagger(i + 2)} className="glow-card p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{stat.label}</p>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${stat.color}/10`}>
                    <Icon className={`h-4 w-4 text-${stat.color}`} />
                  </div>
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  ₹<AnimatedNumber value={stat.value} />
                </p>
                <p className={`mt-1 text-xs font-semibold ${stat.trend.startsWith("+") ? "text-mint" : "text-danger"}`}>
                  {stat.trend} vs last month
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Filing Status + Activity */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Filing Table */}
          <motion.div {...stagger(6)} className="glow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="font-display text-lg font-bold">Filing Status</h2>
              <span className="badge-neutral">{mockFilings.length} filings</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Filing Type", "Period", "Due Date", "Status", "Amount", "Action"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockFilings.map((f) => (
                    <tr key={`${f.type}-${f.period}`} className="border-b border-border/50 transition-colors hover:bg-surface-hover/50">
                      <td className="px-6 py-4 text-sm font-semibold text-text-primary">{f.type}</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{f.period}</td>
                      <td className="px-6 py-4 font-mono text-sm text-text-secondary">{f.due}</td>
                      <td className="px-6 py-4">
                        <span className={statusStyles[f.status] || "badge-neutral"}>{f.status}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-text-primary">{f.amount}</td>
                      <td className="px-6 py-4">
                        {f.status === "pending" && (
                          <button className="btn-ghost text-xs text-accent">
                            Take Action <ArrowUpRight className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div {...stagger(7)} className="glow-card p-6">
            <h2 className="font-display text-lg font-bold">Recent Activity</h2>
            <div className="mt-5 space-y-4">
              {mockActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: a.color, boxShadow: `0 0 6px ${a.color}60` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: a.color }}>{a.agent}</p>
                    <p className="mt-0.5 text-sm text-text-secondary leading-snug">{a.summary}</p>
                    <p className="mt-1 text-xs text-text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
