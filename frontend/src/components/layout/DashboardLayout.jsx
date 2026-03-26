import ChatPanel from "../chat/ChatPanel";
import { useChat } from "../../hooks/useChat";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Compose the shared dashboard shell with navigation and chat.
 * @param {{
 *   title: string,
 *   eyebrow?: string,
 *   description?: string,
 *   chatSummary?: string,
 *   chatSuggestions?: string[],
 *   children: import("react").ReactNode,
 *   notificationCount?: number
 * }} props
 * @returns {JSX.Element}
 */
export default function DashboardLayout({
  title,
  eyebrow,
  description,
  chatSummary,
  chatSuggestions,
  children,
  notificationCount = 0
}) {
  const chat = useChat();

  return (
    <div className="page-shell min-h-screen">
      <div className="flex min-h-screen flex-col md:block">
        <Sidebar />
        <div className="md:ml-64 xl:mr-[340px] 2xl:mr-[360px]">
          <TopBar
            title={title}
            eyebrow={eyebrow}
            description={description}
            notificationCount={notificationCount}
          />
          <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
        <aside className="hidden xl:fixed xl:right-0 xl:top-0 xl:block xl:h-screen xl:w-[340px] xl:border-l xl:border-white/60 xl:bg-white/70 xl:p-5 xl:backdrop-blur 2xl:w-[360px]">
          <ChatPanel chat={chat} summary={chatSummary} suggestions={chatSuggestions} />
        </aside>
      </div>
      <div className="border-t border-white/60 bg-white/70 p-4 backdrop-blur xl:hidden">
        <ChatPanel chat={chat} compact summary={chatSummary} suggestions={chatSuggestions} />
      </div>
    </div>
  );
}
