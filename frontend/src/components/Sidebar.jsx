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
      <div className="border-b border-slate-200 px-5 py-5">
        <BrandLogo compact className="w-full" />
      </div>

      <div className="px-5 py-5">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">{user?.full_name || "Demo User"}</p>
              <p className="truncate text-sm text-slate-500">{user?.company_name || "Demo Co"}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">
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
                <div className="relative overflow-hidden rounded-2xl">
                  {isActive ? (
                    <motion.div
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-2xl bg-violet-50"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <div
                    className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                      isActive ? "text-[#20175f]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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

      <div className="border-t border-slate-200 px-4 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:border-violet-200 hover:text-violet-700"
        >
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-slate-200 bg-[#fbfcff] md:block">
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
              className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-[#fbfcff] md:hidden"
            >
              <SidebarContent user={user} onLogout={onLogout} onClose={onClose} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
