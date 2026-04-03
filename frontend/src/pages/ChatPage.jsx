import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Upload,
  Clock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../hooks/useChat";
import { AgentBadge, SkeletonLoader } from "../components/ui";
import apiClient from "../api/client";

/* ── Agent Activity Panel (right sidebar) ────────────────────────── */

function AgentActivityPanel({ activeStep, stepTimings, plan, critiqueScores }) {
  const steps = [
    { key: "planning", label: "Planning", icon: "🧠" },
    { key: "retrieval", label: "Retrieving (BM25 + Dense)", icon: "🔍" },
    { key: "calculation", label: "Calculating", icon: "🧮" },
    { key: "compliance", label: "Checking Compliance", icon: "📋" },
    { key: "synthesis", label: "Generating Answer", icon: "✍️" },
    { key: "critic", label: "Self-Critique", icon: "🔬" },
  ];

  const activeMap = {
    planning_node: "planning",
    retriever_node: "retrieval",
    calculator_node: "calculation",
    compliance_node: "compliance",
    answer_synthesizer: "synthesis",
    critic_node: "critic",
  };

  const currentKey = activeMap[activeStep] || null;

  return (
    <div className="w-72 border-l border-border bg-bg-secondary h-full overflow-y-auto p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Sparkles size={14} className="text-accent" />
        Agent Activity
      </h3>

      <div className="space-y-2">
        {steps.map(({ key, label, icon }) => {
          const timing = stepTimings[key];
          const isActive = currentKey === key;
          const isCompleted = timing !== undefined;

          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-accent-muted border border-accent/30"
                  : isCompleted
                    ? "bg-surface"
                    : "opacity-40"
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className={isActive ? "text-accent font-medium" : "text-text-secondary"}>
                {label}
              </span>
              {isActive && !isCompleted && (
                <span className="ml-auto">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </span>
              )}
              {isCompleted && (
                <span className="ml-auto text-xs text-text-muted">{timing}ms</span>
              )}
            </div>
          );
        })}
      </div>

      {plan && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase text-text-muted mb-2">Plan</h4>
          <div className="bg-bg-tertiary rounded-lg p-3 text-xs text-text-secondary space-y-1">
            <p>Type: <span className="text-accent">{plan.query_type}</span></p>
            <p>Confidence: <span className="text-text-primary">{(plan.confidence * 100).toFixed(0)}%</span></p>
            <p>Agents: {plan.agents?.join(" → ")}</p>
          </div>
        </div>
      )}

      {critiqueScores && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase text-text-muted mb-2">Critique</h4>
          <div className="space-y-1.5">
            {Object.entries(critiqueScores).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary capitalize">{key.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val * 100}%`,
                        backgroundColor: val >= 0.7 ? "#10B981" : val >= 0.5 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                  </div>
                  <span className="text-text-muted w-8 text-right">{(val * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Chat Message ────────────────────────────────────────────────── */

function ChatMessage({ message }) {
  const [showCitations, setShowCitations] = useState(false);
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles size={16} className="text-accent" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-first" : ""}`}>
        {!isUser && message.agent && (
          <div className="mb-1.5">
            <AgentBadge agent={message.agent} />
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-accent text-white rounded-tr-md"
              : "bg-surface border border-border rounded-tl-md"
          }`}
        >
          <div className={`text-sm leading-relaxed ${isUser ? "" : "chat-markdown"}`}>
            {isUser ? (
              message.content
            ) : message.isStreaming ? (
              <>
                {message.content}
                <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5" />
              </>
            ) : (
              <div dangerouslySetInnerHTML={{
                __html: message.content
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/\n- /g, "</p><li>")
                  .replace(/^/, "<p>")
                  .replace(/$/, "</p>"),
              }} />
            )}
          </div>
        </div>

        {!isUser && message.citations?.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors"
            >
              {showCitations ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {message.citations.length} citation{message.citations.length > 1 ? "s" : ""}
            </button>
            <AnimatePresence>
              {showCitations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1.5">
                    {message.citations.map((citation, i) => (
                      <div key={i} className="text-xs bg-bg-tertiary rounded-lg p-2 border border-border">
                        <span className="text-accent font-medium">{citation.section_ref}</span>
                        <span className="text-text-muted ml-1">[{citation.source}]</span>
                        <p className="text-text-secondary mt-0.5 line-clamp-2">{citation.snippet}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm font-semibold text-accent">U</span>
        </div>
      )}
    </motion.div>
  );
}

/* ── Conversation List (left sidebar) ────────────────────────────── */

function ConversationList({ sessions, activeSession, onSelect, onNew }) {
  const [search, setSearch] = useState("");
  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 border-r border-border bg-bg-secondary h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <button onClick={onNew} className="btn-primary w-full text-sm gap-2">
          <Plus size={16} />
          New Conversation
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="input-field text-xs pl-9 py-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-8">No conversations yet</p>
        ) : (
          filtered.map((session) => (
            <button
              key={session.session_id}
              onClick={() => onSelect(session.session_id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeSession === session.session_id
                  ? "bg-accent-muted text-accent border border-accent/20"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              {session.created_at && (
                <span className="text-2xs text-text-muted mt-0.5 block">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Main Chat Page ──────────────────────────────────────────────── */

export default function ChatPage() {
  const { user } = useAuth();
  const {
    messages, isStreaming, activeStep, stepTimings,
    plan, critiqueScores, needsReview, sendMessage, clearMessages,
  } = useChat();

  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
  const [sessions, setSessions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const token = localStorage.getItem("cubitax_token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    apiClient.get("/api/chat/sessions").then((res) => {
      setSessions(res.data.sessions || []);
    }).catch(() => {});
  }, []);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim(), sessionId, token);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    clearMessages();
  };

  return (
    <div className="flex h-screen bg-bg">
      {/* Left sidebar */}
      <ConversationList
        sessions={sessions}
        activeSession={sessionId}
        onSelect={(id) => {
          setSessionId(id);
          clearMessages();
        }}
        onNew={handleNewConversation}
      />

      {/* Center: chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-sm font-semibold text-text-primary">Tax Assistant</h2>
          {isStreaming && (
            <span className="badge-accent text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Processing...
            </span>
          )}
        </div>

        {/* Needs CA Review banner */}
        {needsReview && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            className="bg-warning-muted border-b border-warning/30 px-6 py-3 flex items-center gap-2"
          >
            <AlertTriangle size={16} className="text-warning" />
            <span className="text-sm text-warning font-medium">
              This response involves significant amounts and should be reviewed by a Chartered Accountant
            </span>
          </motion.div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                CubitaxAI Tax Assistant
              </h3>
              <p className="text-sm text-text-secondary max-w-md mb-6">
                Ask about TDS rates, GST calculations, compliance deadlines, or upload tax documents for analysis
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg">
                {[
                  "Calculate TDS on ₹5,00,000 professional fees",
                  "What is the deadline for GSTR-3B this month?",
                  "Explain Section 194C deduction rules",
                  "What deductions are available under 80C?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-left text-xs text-text-secondary bg-surface hover:bg-surface-hover border border-border rounded-xl p-3 transition-all hover:border-accent/30"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <label className="btn-ghost cursor-pointer" title="Upload document">
                <Paperclip size={18} />
                <input type="file" accept=".pdf" className="hidden" />
              </label>
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about tax, compliance, or upload a document..."
                  rows={1}
                  className="input-field pr-12 resize-none text-sm min-h-[44px] max-h-32"
                  style={{ height: "auto", overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-accent text-white disabled:opacity-30 hover:bg-accent-light transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
            <p className="text-2xs text-text-muted mt-2 text-center">
              Calculations use a deterministic tax engine. Always verify with a CA for complex scenarios.
            </p>
          </div>
        </div>
      </div>

      {/* Right sidebar: Agent Activity */}
      <AgentActivityPanel
        activeStep={activeStep}
        stepTimings={stepTimings}
        plan={plan}
        critiqueScores={critiqueScores}
      />
    </div>
  );
}
