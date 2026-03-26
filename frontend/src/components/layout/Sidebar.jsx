import { BarChart2, Calendar, Calculator, FileText, LayoutDashboard, LogOut, Receipt, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import BrandLogo from "../common/BrandLogo";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/dashboard/documents", icon: FileText },
  { label: "GST Compliance", to: "/dashboard/gst", icon: Receipt },
  { label: "TDS Workbench", to: "/dashboard/tds", icon: Calculator },
  { label: "Deadlines", to: "/dashboard/deadlines", icon: Calendar },
  { label: "Reports", to: "/dashboard/reports", icon: BarChart2 },
  { label: "Settings", to: "/dashboard", icon: Settings }
];

/**
 * Render the persistent dashboard navigation sidebar.
 * @returns {JSX.Element}
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("") || "CU";

  return (
    <aside className="z-20 w-full border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="mb-6 flex items-center justify-between md:block">
          <div className="flex items-center gap-3">
            <BrandLogo compact className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">CubitaxAI</p>
              <p className="truncate text-lg font-semibold text-brand-primary">Compliance Workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-violet-200 hover:text-brand-accent md:hidden"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 rounded-[28px] border border-slate-100 bg-slate-50/90 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user?.full_name}</p>
              <p className="truncate text-sm text-slate-500">{user?.company_name}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">
            Assistant memory and cited retrieval stay attached to this workspace session.
          </div>
        </div>

        <nav className="flex flex-1 gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-max items-center gap-3 rounded-2xl border-l-4 px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border-brand-accent bg-violet-50 text-brand-accent"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-brand-primary"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-6 hidden items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:text-brand-accent md:flex"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
