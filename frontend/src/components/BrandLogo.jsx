/**
 * Render the CubitaxAI brand mark and wordmark.
 * @param {{ compact?: boolean, light?: boolean, className?: string }} props
 * @returns {JSX.Element}
 */
export default function BrandLogo({ compact = false, light = false, className = "" }) {
  const wordmarkClass = light ? "text-text-primary" : "text-[#132b62]";

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <svg
        viewBox="0 0 72 72"
        className={`${compact ? "h-11 w-11" : "h-14 w-14"} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cubeStroke" x1="10%" x2="90%" y1="10%" y2="90%">
            <stop offset="0%" stopColor="#173566" />
            <stop offset="48%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#4fc4cf" />
          </linearGradient>
        </defs>
        <path
          d="M36 6 58 19v34L36 66 14 53V19L36 6Z"
          fill="none"
          stroke="url(#cubeStroke)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M24 23 36 16l12 7-12 7-12-7Z"
          fill="none"
          stroke="url(#cubeStroke)"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M24 23v17l12 8V30" fill="none" stroke="url(#cubeStroke)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M48 23v17l-12 8" fill="none" stroke="url(#cubeStroke)" strokeWidth="4" strokeLinejoin="round" />
        <path d="M14 20l22 13 22-13" fill="none" stroke="#1e376d" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </svg>
      <div className="flex min-w-0 items-baseline gap-0.5 leading-none">
        <span className={`truncate font-display text-[1.95rem] font-extrabold tracking-[-0.05em] ${wordmarkClass}`}>
          Cubitax
        </span>
        <span className="bg-logo-gradient bg-clip-text font-display text-[1.95rem] font-extrabold tracking-[-0.06em] text-transparent">
          AI
        </span>
      </div>
    </div>
  );
}
