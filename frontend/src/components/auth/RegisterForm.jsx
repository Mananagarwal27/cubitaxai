import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

/**
 * Render the registration form.
 * @returns {JSX.Element}
 */
export default function RegisterForm() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [values, setValues] = useState({
    full_name: "",
    email: "",
    company_name: "",
    pan_number: "",
    gstin: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false
  });

  const strength = useMemo(() => getPasswordStrength(values.password), [values.password]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!values.termsAccepted) {
      toast.error("You must accept the terms to continue");
      return;
    }
    try {
      await register({
        full_name: values.full_name,
        email: values.email,
        company_name: values.company_name,
        pan_number: values.pan_number || null,
        gstin: values.gstin || null,
        password: values.password
      });
    } catch (error) {
      // AuthContext already surfaces the message via toast.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
        <input
          required
          value={values.full_name}
          onChange={(event) => setValues((current) => ({ ...current, full_name: event.target.value }))}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
          placeholder="Ananya Sharma"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Company name</label>
        <input
          required
          value={values.company_name}
          onChange={(event) => setValues((current) => ({ ...current, company_name: event.target.value }))}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
          placeholder="Cubitax Advisors Pvt Ltd"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">PAN number</label>
          <input
            value={values.pan_number}
            onChange={(event) => setValues((current) => ({ ...current, pan_number: event.target.value.toUpperCase() }))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
            placeholder="ABCDE1234F"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">GSTIN</label>
          <input
            value={values.gstin}
            onChange={(event) => setValues((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-violet-300 focus:bg-white"
            placeholder="29ABCDE1234F1Z5"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 outline-none transition focus:border-violet-300 focus:bg-white"
            placeholder="Create a secure password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-2 flex-1 rounded-full ${strength >= level ? "bg-brand-accent" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={values.confirmPassword}
            onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 outline-none transition focus:border-violet-300 focus:bg-white"
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <input
          type="checkbox"
          checked={values.termsAccepted}
          onChange={(event) => setValues((current) => ({ ...current, termsAccepted: event.target.checked }))}
          className="mt-1 rounded border-slate-300"
        />
        I agree to use CubitaxAI responsibly and understand outputs should be reviewed before filing.
      </label>
      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-accent">
          Login
        </Link>
      </p>
    </form>
  );
}
