import { Link } from "react-router-dom";

/**
 * CubitaxAI brand mark — used in nav, login, and landing.
 * @param {{ compact?: boolean, to?: string, className?: string }} props
 */
export default function BrandLogo({ compact = false, to = "/", className = "" }) {
  const inner = (
    <div className={`flex items-center gap-2.5 ${className}`.trim()}>
      <div className={`flex items-center justify-center rounded-xl bg-accent/20 ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
        <div className={`rounded-md bg-accent ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      </div>
      <span className={`font-display font-bold tracking-tight ${compact ? "text-lg" : "text-2xl"}`}>
        Cubitax<span className="text-accent">AI</span>
      </span>
    </div>
  );

  if (to) {
    return <Link to={to}>{inner}</Link>;
  }
  return inner;
}
