import { motion } from "framer-motion";

import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

/**
 * Render the AI chat side panel.
 * @param {{
 *  chat: {
 *    messages: Array,
 *    isStreaming: boolean,
 *    sessionId: string,
 *    lastInteractionAt?: string | null,
 *    lastError?: string,
 *    sendMessage: (value: string) => Promise<void>,
 *    clearHistory: () => Promise<void>
 *  },
 *  compact?: boolean,
 *  summary?: string,
 *  suggestions?: string[]
 * }} props
 * @returns {JSX.Element}
 */
export default function ChatPanel({
  chat,
  compact = false,
  summary = "Streaming answers with cited references from statutory knowledge and uploaded evidence.",
  suggestions = []
}) {
  const statusLabel = chat.isStreaming ? "Responding now" : chat.lastError ? "Needs retry" : "Ready";

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-white/80 bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-brand-primary">CubitaxAI Assistant</h2>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm text-slate-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={chat.clearHistory}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-brand-accent"
        >
          Clear
        </button>
      </div>

      <div className="mb-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Session status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{statusLabel}</p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
            {chat.sessionId.slice(0, 8)}
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {chat.lastInteractionAt
            ? `Last activity ${new Date(chat.lastInteractionAt).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit"
              })}`
            : "Ask a specific question and I will ground the answer in your workspace and tax knowledge base."}
        </p>
      </div>

      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-[28rem]" : "flex-1"}`}>
        {chat.messages.length ? (
          chat.messages.map((message, index) => (
            <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ChatMessage message={message} />
            </motion.div>
          ))
        ) : (
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Ask about TDS, GST, filing deadlines, deductions, or uploaded documents. I will surface section-level
              citations wherever possible.
            </div>
            <div className="grid gap-3">
              {[
                "Explain a statutory position with citations",
                "Calculate a tax outcome using deterministic rules",
                "Check deadlines and missing evidence from your workspace"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
        {chat.isStreaming ? (
          <div className="flex items-center gap-2 px-2 text-sm text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent [animation-delay:120ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent [animation-delay:240ms]" />
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <ChatInput onSend={chat.sendMessage} disabled={chat.isStreaming} suggestions={suggestions} />
      </div>
    </div>
  );
}
