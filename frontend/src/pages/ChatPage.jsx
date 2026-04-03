import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  Loader2,
  MessageSquarePlus,
  Paperclip,
  Search,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";

/* ── Pipeline steps ──────────────────────────────────────────────── */
const PIPELINE = [
  { key: "planning_node", label: "Planning" },
  { key: "retriever_node", label: "Retrieving" },
  { key: "calculator_node", label: "Calculating" },
  { key: "compliance_node", label: "Compliance" },
  { key: "answer_synthesizer", label: "Generating" },
  { key: "critic_node", label: "Reviewing" },
];

/* ── Chat Page ───────────────────────────────────────────────────── */
export default function ChatPage() {
  const { user } = useAuth();
  const {
    messages, setMessages, isStreaming, activeStep, stepTimings,
    plan, critiqueScores, needsReview,
    sendMessage, stopStreaming, clearMessages,
  } = useChat();

  const [input, setInput] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("cubitax_token") : null;

  /* Auto-scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 144) + "px";
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    sendMessage(trimmed, sessionId, token);
  }, [input, isStreaming, sendMessage, sessionId, token]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  /* ── Computed pipeline state ───────────────────────────────────── */
  const activeIdx = PIPELINE.findIndex((s) => s.key === activeStep);

  return (
    <div className="flex h-screen bg-bg">
      {/* ═══ LEFT SIDEBAR ════════════════════════════════════════════ */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full shrink-0 flex-col border-r border-border bg-bg-secondary overflow-hidden"
          >
            <div className="p-4">
              <button
                onClick={() => { clearMessages(); }}
                className="btn-primary w-full justify-center py-3"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New conversation
              </button>
            </div>

            {/* Conversation list placeholder */}
            <div className="flex-1 overflow-y-auto px-3">
              <p className="px-2 py-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Today</p>
              <div className="rounded-lg border-l-2 border-accent bg-surface-hover px-3 py-2.5">
                <p className="truncate text-sm text-text-primary">Current conversation</p>
                <p className="mt-0.5 text-xs text-text-muted">Just now</p>
              </div>

              <p className="mt-4 px-2 py-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Earlier</p>
              {["TDS calculation for contractors", "GST filing deadline query", "Section 80C deductions"].map((title) => (
                <div key={title} className="cursor-pointer rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover">
                  <p className="truncate text-sm text-text-secondary">{title}</p>
                  <p className="mt-0.5 text-xs text-text-muted">Yesterday</p>
                </div>
              ))}
            </div>

            {/* Back to dashboard */}
            <div className="border-t border-border p-3">
              <Link to="/dashboard" className="btn-ghost w-full justify-start text-xs">
                ← Back to Dashboard
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CHAT ═══════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(prev => !prev)} className="btn-ghost p-1.5">
              <FileText className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-semibold text-text-primary">
              AI Tax Assistant
            </h1>
            {isStreaming && (
              <span className="flex items-center gap-1.5 text-xs text-accent">
                <span className="status-dot-pulse bg-accent" /> Thinking...
              </span>
            )}
          </div>
          <button onClick={() => setRightPanelOpen(prev => !prev)} className="btn-ghost p-1.5 text-xs">
            Pipeline {rightPanelOpen ? "▸" : "◂"}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-6">
                  <Sparkles className="h-7 w-7 text-accent" />
                </div>
                <h2 className="font-display text-2xl font-bold">Ask anything about Indian tax law</h2>
                <p className="mt-2 max-w-md text-sm text-text-secondary">
                  Get cited answers from the Income Tax Act, GST circulars, and your uploaded documents.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {[
                    "What is the TDS rate under Section 194J?",
                    "Calculate advance tax for income of ₹25 lakhs",
                    "When is GSTR-3B due this quarter?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="rounded-full border border-border px-4 py-2 text-xs text-text-secondary transition-colors hover:border-accent/30 hover:text-text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  /* User bubble */
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-5 py-3 text-sm text-white">
                    {msg.content}
                  </div>
                ) : (
                  /* Agent response */
                  <div className="max-w-[85%] space-y-2">
                    {needsReview && i === messages.length - 1 && (
                      <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Needs CA Review — amounts exceed ₹10 lakhs
                      </div>
                    )}

                    <div className="surface-card p-5">
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || (msg.isStreaming ? "..." : "")}
                        </ReactMarkdown>
                        {msg.isStreaming && (
                          <span className="inline-block h-4 w-0.5 animate-pulse bg-accent ml-0.5" />
                        )}
                      </div>

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <details className="mt-3 border-t border-border pt-3">
                          <summary className="cursor-pointer text-xs font-semibold text-text-muted hover:text-text-secondary">
                            Sources used ({msg.citations.length})
                          </summary>
                          <div className="mt-2 space-y-1.5">
                            {msg.citations.map((c, ci) => (
                              <p key={ci} className="text-xs text-text-muted">
                                <span className="font-mono text-accent">{c.section_ref || "Ref"}</span>
                                {" — "}{c.snippet?.slice(0, 100)}...
                              </p>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Actions */}
                      {!msg.isStreaming && msg.content && (
                        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="btn-ghost text-xs"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                          <span className="text-xs text-text-muted">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-bg-secondary p-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-border bg-bg-tertiary p-3 focus-within:border-accent/30">
              <button className="btn-ghost shrink-0 p-2 text-text-muted hover:text-text-primary">
                <Paperclip className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about tax law, compliance, or calculations..."
                rows={1}
                className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />

              <button
                onClick={isStreaming ? stopStreaming : handleSend}
                disabled={!input.trim() && !isStreaming}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                  input.trim() || isStreaming
                    ? "bg-accent text-white hover:bg-accent-light"
                    : "bg-surface text-text-muted"
                }`}
              >
                {isStreaming ? (
                  <X className="h-4 w-4" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-text-muted">
              Enter to send · Shift+Enter for new line · Responses include section citations
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Agent Pipeline ════════════════════════════ */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full shrink-0 flex-col border-l border-border bg-bg-secondary overflow-hidden"
          >
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold text-text-primary">Agent Pipeline</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Pipeline steps */}
              <div className="space-y-1">
                {PIPELINE.map((step, i) => {
                  const isActive = step.key === activeStep;
                  const isComplete = activeIdx > i || (!isStreaming && messages.length > 0 && i <= activeIdx);
                  const timing = stepTimings[step.key];

                  return (
                    <div key={step.key} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />
                      ) : isActive ? (
                        <span className="status-dot-pulse bg-accent shrink-0" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                      )}

                      <span className={`text-sm ${
                        isActive ? "font-semibold text-accent" :
                        isComplete ? "text-text-primary" :
                        "text-text-muted"
                      }`}>
                        {step.label}
                      </span>

                      {timing && (
                        <span className="ml-auto font-mono text-xs text-text-muted">
                          {Math.round(timing)}ms
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Critique scores */}
              {critiqueScores && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Quality Scores</p>
                  <div className="space-y-2">
                    {Object.entries(critiqueScores).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary capitalize">{key.replace(/_/g, " ")}</span>
                        <span className={`font-mono text-xs font-semibold ${val >= 0.7 ? "text-mint" : val >= 0.5 ? "text-warning" : "text-danger"}`}>
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan info */}
              {plan && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Query Plan</p>
                  <div className="space-y-2 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-mono text-accent">{plan.query_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Classification</span>
                      <span className="font-mono">{plan.classification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence</span>
                      <span className="font-mono">{((plan.confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
