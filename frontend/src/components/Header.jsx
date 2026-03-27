import { Bell, Menu, MessageSquareMore } from "lucide-react";

/**
 * Render the dashboard top header.
 * @param {{
 *   title: string,
 *   assistantOpen: boolean,
 *   onToggleAssistant: () => void,
 *   onOpenSidebar: () => void,
 *   notificationCount?: number,
 *   user?: { full_name?: string, email?: string }
 * }} props
 * @returns {JSX.Element}
 */
export default function Header({
  title,
  assistantOpen,
  onToggleAssistant,
  onOpenSidebar,
  notificationCount = 0,
  user
}) {
  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="px-4 py-5 md:px-8 lg:px-10">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onOpenSidebar}
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace overview</p>
                <h1 className="mt-1 font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.05em] text-[#171b4d]">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  Monitor deadlines, indexed evidence, and assistant-backed tax analysis from one clean workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              {currentDate}
            </div>

            <div className="flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Assistant Ready</span>
                <span className="text-sm text-slate-500">Cited answers are active in this workspace.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleAssistant}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-[#20175f] shadow-sm hover:border-violet-300 hover:bg-violet-50"
            >
              <MessageSquareMore className="h-4 w-4" />
              {assistantOpen ? "Hide Assistant" : "Show Assistant"}
            </button>

            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-violet-200 hover:text-violet-700"
            >
              <Bell className="h-4 w-4" />
              {notificationCount ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>

            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                {user?.full_name?.slice(0, 1) || "D"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.full_name || "Demo User"}</p>
                <p className="text-xs text-slate-500">{user?.email || "demo@example.com"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
