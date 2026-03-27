import { AnimatePresence, motion } from "framer-motion";
import { Bot, SendHorizontal, X } from "lucide-react";
import { useState } from "react";

/**
 * Render the collapsible CubitaxAI assistant panel.
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   suggestions: string[],
 *   pageLabel: string,
 *   chat: {
 *     messages: Array<{ role: string, content: string, citations?: Array, created_at?: string }>,
 *     isStreaming: boolean,
 *     sessionId: string,
 *     lastActivity?: string | null,
 *     sendMessage: (query: string) => Promise<void>,
 *     clearHistory: () => Promise<void>
 *   }
 * }} props
 * @returns {JSX.Element}
 */
export default function ChatPanel({ open, onClose, suggestions, pageLabel, chat }) {
  const [value, setValue] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    const next = value;
    setValue("");
    await chat.sendMessage(next);
  }

  const lastActivity = chat.lastActivity
    ? new Date(chat.lastActivity).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : "Just now";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-navy-border bg-navy p-5 md:w-[340px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-text-primary">CubitaxAI Assistant</h3>
                  <span className="h-2.5 w-2.5 rounded-full bg-green" />
                </div>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Ask about {pageLabel.toLowerCase()}, deductions, deadlines, or uploaded evidence.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={chat.clearHistory}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted hover:text-text-primary"
                >
                  Clear
                </button>
                <button type="button" onClick={onClose} className="ghost-button !p-2 md:hidden">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Session status</p>
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p>
                  <span className="text-green">Ready</span> to ground answers in cited tax references
                </p>
                <p>Session ID: {chat.sessionId.slice(0, 8)}</p>
                <p>Last activity: {lastActivity}</p>
              </div>
            </div>

            <div className="thin-scrollbar mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
              {chat.messages.length ? (
                chat.messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-purple text-white"
                          : "surface-card-soft"
                      }`}
                    >
                      {message.role !== "user" ? (
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                          <Bot className="h-3.5 w-3.5" />
                          CubitaxAI
                        </div>
                      ) : null}
                      <p className="text-sm leading-7 text-inherit">{message.content || "..."}</p>
                      {message.role !== "user" && message.citations?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.citations.slice(0, 3).map((citation, citationIndex) => (
                            <span
                              key={`${citation.section_ref}-${citationIndex}`}
                              className="rounded-full border border-purple/20 bg-purple/10 px-3 py-1 text-[11px] font-semibold text-purple-light"
                            >
                              {citation.section_ref}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="surface-card p-4 text-sm leading-7 text-text-secondary">
                  Ask a focused Indian tax or compliance question and the assistant will answer using the platform
                  knowledge base and any uploaded documents when available.
                </div>
              )}

              {chat.isStreaming ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple [animation-delay:240ms]" />
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 border-t border-navy-border pt-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => chat.sendMessage(suggestion)}
                    className="rounded-full border border-navy-border bg-navy-card px-3 py-2 text-xs font-medium text-text-secondary hover:border-purple/40 hover:text-text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="input-shell">
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Ask about GST, TDS, deductions…"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-purple text-white shadow-[0_12px_24px_rgba(124,92,252,0.28)] hover:bg-purple-light"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
