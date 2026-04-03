import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PieChart,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Documents", to: "/dashboard/documents", icon: FileText },
  { label: "Reports", to: "/dashboard/reports", icon: PieChart },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

/**
 * Authenticated app shell with sidebar nav, used by secondary pages.
 */
export default function AppShell({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebar, setMobileSidebar] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-border bg-bg-secondary md:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
              <div className="h-4 w-4 rounded-sm bg-accent" />
            </div>
            <span className="font-display text-lg font-bold">
              Cubitax<span className="text-accent">AI</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:bg-surface-hover hover:text-text-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-text-primary">{user?.full_name || "User"}</p>
              <p className="truncate text-xs text-text-muted">{user?.email || ""}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start mt-1 text-xs text-danger">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────────────── */}
      {mobileSidebar && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileSidebar(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-border bg-bg-secondary md:hidden">
            <div className="flex h-14 items-center justify-between px-4 border-b border-border">
              <span className="font-display text-lg font-bold">CubitaxAI</span>
              <button onClick={() => setMobileSidebar(false)} className="btn-ghost p-1.5"><X className="h-4 w-4" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(({ label, to, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to} onClick={() => setMobileSidebar(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary"}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-bg-secondary/50 px-6" style={{ backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebar(true)} className="btn-ghost p-1.5 md:hidden">
              <FileText className="h-4 w-4" />
            </button>
            <h1 className="font-display text-lg font-bold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative btn-ghost p-2">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger border border-bg" />
            </button>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
