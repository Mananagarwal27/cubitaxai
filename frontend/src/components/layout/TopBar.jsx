import { Bell, ShieldCheck } from "lucide-react";

import BrandLogo from "../common/BrandLogo";
import { useAuth } from "../../hooks/useAuth";

/**
 * Render the dashboard top bar with page title and user controls.
 * @param {{ title: string, eyebrow?: string, description?: string, notificationCount?: number }} props
 * @returns {JSX.Element}
 */
export default function TopBar({
  title,
  eyebrow = "CubitaxAI Workspace",
  description = "",
  notificationCount = 0
}) {
  const { user } = useAuth();
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 backdrop-blur">
      <div className="px-4 py-5 md:px-8">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-[26px] border border-violet-100 bg-white/90 p-3 shadow-sm">
              <BrandLogo compact className="opacity-90" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
              <div className="mt-1 flex flex-col gap-2 xl:flex-row xl:items-end xl:gap-4">
                <h1 className="text-3xl font-bold leading-tight text-brand-primary md:text-4xl">{title}</h1>
                {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-stretch gap-3 2xl:justify-end">
            <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current date</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 md:text-base">{today}</p>
            </div>

            <div className="hidden rounded-[26px] border border-emerald-100 bg-emerald-50/80 px-4 py-3 shadow-sm md:block">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Assistant ready</span>
              </div>
              <p className="mt-1 text-sm text-emerald-800">Cited answers are active in this workspace.</p>
            </div>

            <button
              type="button"
              className="relative rounded-[26px] border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-brand-accent"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-danger px-1 text-xs font-semibold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>

            <div className="flex min-w-[240px] items-center gap-3 rounded-[26px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-brand-accent">
                {user?.full_name?.[0] || "C"}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{user?.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
