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
    <header className="sticky top-0 z-20 border-b border-navy-border/80 bg-bg/88 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-4 px-4 py-4 md:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="ghost-button md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">CubitaxAI workspace</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-text-primary">{title}</h1>
        </div>

        <div className="hidden rounded-full border border-navy-border bg-navy-card/80 px-4 py-2 text-sm text-text-secondary md:block">
          {currentDate}
        </div>

        <div className="hidden max-w-md items-center gap-2 rounded-full border border-green/20 bg-green/10 px-4 py-2 text-sm text-green xl:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <span className="font-semibold uppercase tracking-[0.18em]">Assistant ready</span>
          <span className="text-text-secondary">Cited answers are active in this workspace.</span>
        </div>

        <button
          type="button"
          onClick={onToggleAssistant}
          className="secondary-button"
        >
          <MessageSquareMore className="h-4 w-4" />
          {assistantOpen ? "Hide Assistant" : "Show Assistant"}
        </button>

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-navy-border bg-navy-card text-text-secondary"
        >
          <Bell className="h-4 w-4" />
          {notificationCount ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          ) : null}
        </button>

        <div className="flex items-center gap-3 rounded-full border border-navy-border bg-navy-card px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple/20 text-sm font-bold text-purple-light">
            {user?.full_name?.slice(0, 1) || "D"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-text-primary">{user?.full_name || "Demo User"}</p>
            <p className="text-xs text-text-muted">{user?.email || "demo@example.com"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
