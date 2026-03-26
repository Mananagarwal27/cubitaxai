import { Bell } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

/**
 * Render the dashboard top bar with page title and user controls.
 * @param {{ title: string, notificationCount?: number }} props
 * @returns {JSX.Element}
 */
export default function TopBar({ title, notificationCount = 0 }) {
  const { user } = useAuth();
  const today = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full"
  }).format(new Date());

  return (
    <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">CubitaxAI Workspace</p>
          <h1 className="text-2xl font-bold text-brand-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="text-sm text-slate-500">Current date</p>
            <p className="font-medium text-slate-900">{today}</p>
          </div>
          <button
            type="button"
            className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 transition hover:border-violet-200 hover:text-brand-accent"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-danger px-1 text-xs font-semibold text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-brand-accent">
              {user?.full_name?.[0] || "C"}
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-slate-900">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

