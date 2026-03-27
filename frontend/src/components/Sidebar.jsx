import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  Calculator,
  FileText,
  Grid2X2,
  LogOut,
  ReceiptText,
  Settings
} from "lucide-react";
import { NavLink } from "react-router-dom";

import BrandLogo from "./BrandLogo";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: Grid2X2 },
  { label: "Documents", to: "/dashboard/documents", icon: FileText },
  { label: "GST Compliance", to: "/dashboard/gst", icon: ReceiptText },
  { label: "TDS Workbench", to: "/dashboard/tds", icon: Calculator },
  { label: "Deadlines", to: "/dashboard/deadlines", icon: CalendarDays },
  { label: "Reports", to: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/settings", icon: Settings }
];

function SidebarContent({ user, onLogout, onClose }) {
  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "DU";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-navy-border px-5 py-5">
        <BrandLogo light />
      </div>

      <div className="px-5 py-5">
        <div className="surface-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple/20 font-semibold text-purple-light">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-text-primary">{user?.full_name || "Demo User"}</p>
              <p className="truncate text-sm text-text-secondary">{user?.company_name || "Demo Co"}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-text-muted">
            Workspace session is active. Assistant history remains attached while you stay signed in.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} onClick={onClose} className="block">
              {({ isActive }) => (
                <div className="relative overflow-hidden rounded-full">
                  {isActive ? (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-full bg-purple/20"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <div
                    className={`relative flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold ${
                      isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-navy-border px-4 py-4">
        <button type="button" onClick={onLogout} className="ghost-button w-full justify-center">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

/**
 * Render the responsive app navigation sidebar.
 * @param {{ user?: object, mobileOpen: boolean, onClose: () => void, onLogout: () => void }} props
 * @returns {JSX.Element}
 */
export default function Sidebar({ user, mobileOpen, onClose, onLogout }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] border-r border-navy-border bg-navy md:block">
        <SidebarContent user={user} onLogout={onLogout} onClose={onClose} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-black/55 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 w-[220px] border-r border-navy-border bg-navy md:hidden"
            >
              <SidebarContent user={user} onLogout={onLogout} onClose={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
