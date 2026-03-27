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
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-[#f8faff] p-5 shadow-[-24px_0_40px_rgba(15,23,42,0.06)] md:w-[360px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-[#171b4d]">CubitaxAI Assistant</h3>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ask about {pageLabel.toLowerCase()}, deductions, deadlines, or uploaded evidence.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={chat.clearHistory}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 hover:text-slate-900"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm md:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Session status</p>
              <div className="mt-3 space-y-2 text-sm text-slate-500">
                <p>
                  <span className="font-semibold text-emerald-600">Ready</span> to ground answers in cited tax references
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
                          ? "bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,92,252,0.25)]"
                          : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                      }`}
                    >
                      {message.role !== "user" ? (
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700"
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
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-500 shadow-sm">
                  Ask a focused Indian tax or compliance question and the assistant will answer using the platform
                  knowledge base and any uploaded documents when available.
                </div>
              )}

              {chat.isStreaming ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-purple [animation-delay:240ms]" />
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => chat.sendMessage(suggestion)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm hover:border-violet-200 hover:text-slate-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="flex h-12 w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 shadow-sm">
                  <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Ask about GST, TDS, deductions…"
                    className="h-full w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_12px_24px_rgba(124,92,252,0.28)] hover:bg-violet-500"
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
