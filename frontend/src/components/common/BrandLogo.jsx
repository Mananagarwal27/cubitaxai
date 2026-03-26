/**
 * Render the CubitaxAI brand logo using a reusable vector mark and wordmark.
 * The icon is a lightweight SVG recreation based on the provided logo reference.
 *
 * @param {{
 *   compact?: boolean,
 *   showTagline?: boolean,
 *   light?: boolean,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function BrandLogo({ compact = false, showTagline = true, light = false, className = "" }) {
  const wordColor = light ? "text-white" : "text-brand-primary";
  const taglineColor = light ? "text-white/70" : "text-slate-500";

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className={`${compact ? "h-12 w-12" : "h-14 w-14"} shrink-0`}>
        <svg viewBox="0 0 84 84" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="cubitax-shell" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#D7DCE5" />
              <stop offset="50%" stopColor="#9AA3B1" />
              <stop offset="100%" stopColor="#6B7280" />
            </linearGradient>
            <linearGradient id="cubitax-core" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          <path
            d="M42 5 68.5 20.5V50L42 79 15.5 50V20.5L42 5Z"
            fill="none"
            stroke="url(#cubitax-shell)"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M42 12.5 62 24.5V46L42 67.5 22 46V24.5L42 12.5Z"
            fill="none"
            stroke="#B7BEC9"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M30 28 42 21l12 7-12 7-12-7Z"
            fill="none"
            stroke="url(#cubitax-shell)"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path d="M30 28v15.5L42 51V35" fill="none" stroke="url(#cubitax-shell)" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M54 28v15.5L42 51" fill="none" stroke="url(#cubitax-shell)" strokeWidth="2.6" strokeLinejoin="round" />

          <path d="M21 24.5 42 35M63 24.5 42 35" fill="none" stroke="#ADB5C1" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M22 46 42 35 62 46" fill="none" stroke="#ADB5C1" strokeWidth="2.2" strokeLinecap="round" />

          <path d="M48 18v12M56 35v12M34 18h10M24 39h11" fill="none" stroke="url(#cubitax-core)" strokeWidth="2.4" strokeLinecap="round" />

          <circle cx="50.5" cy="18" r="3.8" fill="#8B5CF6" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="57.5" cy="34.5" r="3.8" fill="#8B5CF6" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="33" cy="18" r="3.8" fill="#60A5FA" stroke="#DBEAFE" strokeWidth="1.5" />

          <path
            d="M17 48c8-2 13 1 18 6M16 54c6-1 10 1 14 4M17 60c4-1 7 0 10 2"
            fill="none"
            stroke="url(#cubitax-shell)"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!compact ? (
        <div className="min-w-0">
          <div className="flex items-end gap-0.5 leading-none">
            <span className={`truncate text-[2rem] font-black tracking-[-0.05em] ${wordColor}`}>Cubitax</span>
            <span className="text-[2rem] font-black tracking-[-0.06em] text-brand-accent">AI</span>
          </div>
          {showTagline ? (
            <p className={`truncate text-[0.68rem] font-medium leading-none ${taglineColor}`}>
              GenAI-based Tax &amp; Compliance Software
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

