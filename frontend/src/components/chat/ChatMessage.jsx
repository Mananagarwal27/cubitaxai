/**
 * Render a single chat message bubble.
 * @param {{ message: { role: string, content: string, citations?: Array, created_at?: string } }} props
 * @returns {JSX.Element}
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  const timeLabel = message.created_at
    ? new Date(message.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
          isUser ? "bg-brand-accent text-white" : "border border-violet-100 bg-white text-slate-800"
        }`}
      >
        <div
          className={`mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            isUser ? "text-violet-100" : "text-slate-400"
          }`}
        >
          <span>{isUser ? "You" : "CubitaxAI"}</span>
          {timeLabel ? <span className={isUser ? "text-violet-200" : "text-slate-300"}>{timeLabel}</span> : null}
        </div>
        <p className="whitespace-pre-wrap leading-6">{message.content || "..."}</p>
        {!isUser && message.citations?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.citations.map((citation, index) => (
              <span
                key={`${citation.section_ref}-${index}`}
                className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-brand-accent"
              >
                {citation.section_ref}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
