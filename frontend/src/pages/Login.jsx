import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

const features = [
  { icon: Shield, text: "Multi-agent compliance intelligence" },
  { icon: Mail, text: "Cited answers from the Income Tax Act & GST" },
  { icon: Lock, text: "Bank-grade encryption & SOC 2 ready" },
];

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [shaking, setShaking] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: true });

  function validate() {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (error) {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      toast.error(error.message || "Login failed");
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-bg">
      {/* ── Left Brand Panel ──────────────────────────────────────── */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden lg:flex">
        {/* Mesh gradient blobs */}
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />

        {/* Grid dot pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-md px-12"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <div className="h-5 w-5 rounded-md bg-accent" />
            </div>
            <span className="font-display text-2xl font-bold text-text-primary">
              Cubitax<span className="text-accent">AI</span>
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-text-primary">
            Tax intelligence,
            <br />
            <span className="gradient-text">automated.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            India&apos;s smartest GenAI tax compliance platform. Ask any question,
            get cited answers instantly.
          </p>

          <div className="mt-10 space-y-5">
            {features.map(({ icon: Icon, text }) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm text-text-secondary">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-12 flex gap-8">
            {[
              { value: "500+", label: "CA Firms" },
              { value: "98.7%", label: "Accuracy" },
              { value: "₹240Cr", label: "TDS Managed" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-bg-secondary px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`w-full max-w-md ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
          style={shaking ? {
            animation: "shake 0.5s ease-in-out",
          } : {}}
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <div className="h-5 w-5 rounded-md bg-accent" />
            </div>
            <span className="font-display text-2xl font-bold text-text-primary">
              Cubitax<span className="text-accent">AI</span>
            </span>
          </div>

          <div className="mb-2">
            <span className="pill border-accent/20 bg-accent/10 text-accent text-[10px]">
              Secure Sign-In
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-text-primary">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to continue to your compliance dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-text-secondary">
                Email
              </label>
              <div className={`input-shell ${errors.email ? "!border-danger !ring-1 !ring-danger/30" : ""}`}>
                <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })); }}
                  placeholder="you@company.com"
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className={`input-shell ${errors.password ? "!border-danger !ring-1 !ring-danger/30" : ""}`}>
                <Lock className="h-4 w-4 shrink-0 text-text-muted" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: undefined })); }}
                  placeholder="Enter your password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="text-text-muted transition-colors hover:text-text-primary"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm(f => ({ ...f, remember: e.target.checked }))}
                  className="h-4 w-4 rounded border-border bg-transparent accent-accent"
                />
                Remember me
              </label>
              <Link to="/auth/forgot-password" className="font-medium text-accent hover:text-accent-light transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base"
              id="login-submit"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-light transition-colors">
              Request access
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
