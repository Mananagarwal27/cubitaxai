import { Eye, EyeOff } from "lucide-react";
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
      <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Demo workspace</p>
            <p className="mt-1 text-sm text-slate-600">
              {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
            </p>
          </div>
          <button
            type="button"
            onClick={applyDemoCredentials}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-primary transition hover:text-brand-accent"
          >
            Use demo
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 outline-none transition focus:border-violet-300 focus:bg-white"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-500">
          <input
            type="checkbox"
            checked={values.remember}
            onChange={(event) => setValues((current) => ({ ...current, remember: event.target.checked }))}
            className="rounded border-slate-300"
          />
          Remember me
        </label>
        <button type="button" className="font-medium text-brand-accent">
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Login"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-brand-accent">
          Register
        </Link>
      </p>
    </form>
  );
}
