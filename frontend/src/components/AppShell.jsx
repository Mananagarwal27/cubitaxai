import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import ChatPanel from "./ChatPanel";
import Header from "./Header";
import Sidebar from "./Sidebar";

/**
 * Render the authenticated application shell.
 * @param {{
 *   title: string,
 *   pageLabel: string,
 *   suggestions: string[],
 *   notificationCount?: number,
 *   children: import("react").ReactNode
 * }} props
 * @returns {JSX.Element}
 */
export default function AppShell({
  title,
  pageLabel,
  suggestions,
  notificationCount = 0,
  children
}) {
  const { user, logout } = useAuth();
  const chat = useChat();
  const location = useLocation();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-grid min-h-screen bg-bg">
      <Sidebar
        user={user}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className={`min-h-screen transition-[margin] duration-180 md:ml-[220px] ${assistantOpen ? "xl:mr-[340px]" : ""}`}>
        <Header
          title={title}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => setAssistantOpen((current) => !current)}
          onOpenSidebar={() => setSidebarOpen(true)}
          notificationCount={notificationCount}
          user={user}
        />

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="px-4 py-5 md:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </div>

      <ChatPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        suggestions={suggestions}
        pageLabel={pageLabel}
        chat={chat}
      />
    </div>
  );
}
