import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, WandSparkles } from "lucide-react";
import { useState } from "react";

import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../hooks/useAuth";

const metaBadges = [
  { label: "JWT secured", value: "Auth" },
  { label: "24 hour access", value: "Session" },
  { label: "Workspace resume", value: "State" }
];

/**
 * Render the secure sign-in page.
 * @returns {JSX.Element}
 */
export default function Login() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true
  });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await login(form.email, form.password);
    } catch (error) {
      // AuthContext already surfaces the login error.
    }
  }

  async function handleDemoLogin() {
    try {
      await login("demo@example.com", "demo123");
    } catch (error) {
      // AuthContext already surfaces the demo login error.
    }
  }

  return (
    <div className="page-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-10">
      <div className="absolute left-[-7rem] top-[-7rem] h-72 w-72 rounded-full bg-purple/30 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="glass-card w-full max-w-[420px] p-10"
      >
        <div className="space-y-6">
          <BrandLogo light />

          <span className="inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Secure Sign-In
          </span>

          <div>
            <h1 className="font-display text-[28px] font-bold text-text-primary">Welcome back</h1>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Sign in to continue to your compliance dashboard
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {metaBadges.map((badge) => (
              <div key={badge.label} className="rounded-full border border-navy-border bg-navy/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">{badge.label}</p>
                <p className="mt-1 text-xs font-medium text-text-secondary">{badge.value}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Email</span>
              <span className="input-shell">
                <Mail className="h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@company.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Password</span>
              <span className="input-shell">
                <Lock className="h-4 w-4 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
                  className="rounded border-navy-border bg-transparent"
                />
                Remember me
              </label>
              <button type="button" className="font-semibold text-purple-light hover:text-text-primary">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full rounded-full bg-navy px-5 py-4 text-sm font-semibold text-white hover:bg-[#11143a] disabled:opacity-60">
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-navy-border" />
            <span className="text-sm text-text-muted">or</span>
            <div className="h-px flex-1 bg-navy-border" />
          </div>

          <div className="space-y-3">
            <p className="text-sm leading-7 text-text-secondary">
              <span className="font-semibold uppercase tracking-[0.16em] text-text-muted">Need a quick product tour?</span>{" "}
              Use the demo account to preview the workspace.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-purple/40 bg-transparent px-5 py-4 text-sm font-semibold text-purple-light hover:bg-purple/10"
            >
              <WandSparkles className="h-4 w-4" />
              Use Demo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
