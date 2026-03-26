import { Eye, EyeOff, LockKeyhole, Mail, Wand2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

const DEMO_CREDENTIALS = {
  email: "demo@example.com",
  password: "Demo12345"
};

/**
 * Render the login form.
 * @returns {JSX.Element}
 */
export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({
    email: "",
    password: "",
    remember: true
  });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await login(values.email, values.password);
    } catch (error) {
      // AuthContext already surfaces the message via toast.
    }
  }

  function applyDemoCredentials() {
    setValues((current) => ({
      ...current,
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</label>
        <div className="group flex h-14 items-center rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]">
          <Mail className="h-4 w-4 text-slate-400 transition group-focus-within:text-brand-accent" />
          <input
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            className="h-full w-full bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password</label>
        <div className="group flex h-14 items-center rounded-[22px] border border-slate-200 bg-slate-50/90 px-4 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]">
          <LockKeyhole className="h-4 w-4 text-slate-400 transition group-focus-within:text-brand-accent" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            className="h-full w-full bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="text-slate-400 transition hover:text-brand-accent"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-slate-500">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))}
            className="rounded border-slate-300"
          />
          Remember me
        </label>
        <button type="button" className="font-medium text-brand-accent transition hover:text-violet-700">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-14 w-full items-center justify-center rounded-[22px] bg-brand-primary text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Login"}
      </button>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Need a quick product tour?</p>
            <p className="mt-1 text-sm text-slate-500">Use the demo account to preview the workspace without typing credentials manually.</p>
          </div>
          <button
            type="button"
            onClick={applyDemoCredentials}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary transition hover:text-brand-accent"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Use Demo
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-brand-accent transition hover:text-violet-700">
          Register
        </Link>
      </p>
    </form>
  );
}
