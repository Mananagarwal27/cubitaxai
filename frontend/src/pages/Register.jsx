import { motion } from "framer-motion";
import { Building2, Eye, EyeOff, Mail, ShieldCheck, User2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../hooks/useAuth";

/**
 * Render the registration page.
 * @returns {JSX.Element}
 */
export default function Register() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    pan_number: "",
    gstin: "",
    password: ""
  });

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await register({
        ...form,
        pan_number: form.pan_number || null,
        gstin: form.gstin || null
      });
    } catch (error) {
      // AuthContext already surfaces the registration error.
    }
  }

  return (
    <div className="page-grid flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-2xl p-8 md:p-10"
      >
        <BrandLogo light />
        <div className="mt-6">
          <span className="inline-flex rounded-full border border-green/30 bg-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green">
            Create Workspace
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold text-text-primary">Start your CubitaxAI workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
            Create a secure account for your Indian tax, GST, and compliance operations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { key: "full_name", label: "Full name", icon: User2, placeholder: "Aarav Mehta", span: "md:col-span-1" },
            { key: "email", label: "Email", icon: Mail, placeholder: "you@company.com", span: "md:col-span-1", type: "email" },
            { key: "company_name", label: "Company", icon: Building2, placeholder: "Cubitax Advisors LLP", span: "md:col-span-2" }
          ].map((field) => {
            const Icon = field.icon;
            return (
              <label key={field.key} className={`block ${field.span}`}>
                <span className="mb-2 block text-sm font-medium text-text-secondary">{field.label}</span>
                <span className="input-shell">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <input
                    type={field.type || "text"}
                    required
                    value={form[field.key]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    placeholder={field.placeholder}
                  />
                </span>
              </label>
            );
          })}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-text-secondary">PAN number</span>
            <span className="input-shell">
              <ShieldCheck className="h-4 w-4 text-text-muted" />
              <input
                value={form.pan_number}
                onChange={(event) => setForm((current) => ({ ...current, pan_number: event.target.value.toUpperCase() }))}
                placeholder="ABCDE1234F"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-text-secondary">GSTIN</span>
            <span className="input-shell">
              <ShieldCheck className="h-4 w-4 text-text-muted" />
              <input
                value={form.gstin}
                onChange={(event) => setForm((current) => ({ ...current, gstin: event.target.value.toUpperCase() }))}
                placeholder="29ABCDE1234F1Z5"
              />
            </span>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-text-secondary">Password</span>
            <span className="input-shell">
              <ShieldCheck className="h-4 w-4 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Create a secure password"
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-text-muted hover:text-text-primary">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          <div className="md:col-span-2">
            <button type="submit" disabled={isLoading} className="primary-button w-full">
              {isLoading ? "Creating account..." : "Create account"}
            </button>
            <p className="mt-4 text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-purple-light hover:text-text-primary">
                Login
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
