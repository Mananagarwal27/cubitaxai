import { SendHorizonal } from "lucide-react";
import { useState } from "react";

const defaultSuggestions = [
  "Calculate TDS on ₹2,50,000 rent with PAN",
  "What is the GSTR-3B due date?",
  "Explain the 80C deduction limit with citations"
];

/**
 * Render the chat input and quick suggestions.
 * @param {{ onSend: (value: string) => Promise<void>, disabled?: boolean, suggestions?: string[] }} props
 * @returns {JSX.Element}
 */
export default function ChatInput({ onSend, disabled = false, suggestions = defaultSuggestions }) {
  const [value, setValue] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    const next = value;
    setValue("");
    await onSend(next);
  }

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSend(suggestion)}
            disabled={disabled}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-violet-50 hover:text-brand-accent disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask about GST, TDS, deductions, or your uploaded files..."
          disabled={disabled}
          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
