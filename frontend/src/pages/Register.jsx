import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ full_name: "", email: "", company_name: "", password: "", confirm: "" });

  function validate() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    try {
      await register({ full_name: form.full_name, email: form.email, company_name: form.company_name, password: form.password });
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    }
  }

  const fields = [
    { id: "full_name", label: "Full Name", type: "text", icon: User, placeholder: "John Doe", autoComplete: "name" },
    { id: "email", label: "Email", type: "email", icon: Mail, placeholder: "you@company.com", autoComplete: "email" },
    { id: "company_name", label: "Company Name", type: "text", icon: ArrowRight, placeholder: "Acme Corp", autoComplete: "organization" },
    { id: "password", label: "Password", type: showPassword ? "text" : "password", icon: Lock, placeholder: "Min 8 characters", autoComplete: "new-password", toggle: true },
    { id: "confirm", label: "Confirm Password", type: showPassword ? "text" : "password", icon: Lock, placeholder: "Re-enter password", autoComplete: "new-password" },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-bg">
      {/* Mesh blobs */}
      <div className="mesh-blob mesh-blob-1" />
      <div className="mesh-blob mesh-blob-2" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 flex w-full items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
              <div className="h-5 w-5 rounded-md bg-accent" />
            </div>
            <span className="font-display text-2xl font-bold">
              Cubitax<span className="text-accent">AI</span>
            </span>
          </div>

          <div className="mb-2">
            <span className="pill border-mint/20 bg-mint/10 text-mint text-[10px]">
              Create Account
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold">Get started</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Create your account to start using CubitaxAI
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {fields.map(({ id, label, type, icon: Icon, placeholder, autoComplete, toggle }) => (
              <div key={id}>
                <label htmlFor={`reg-${id}`} className="mb-2 block text-sm font-medium text-text-secondary">
                  {label}
                </label>
                <div className={`input-shell ${errors[id] ? "!border-danger !ring-1 !ring-danger/30" : ""}`}>
                  <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                  <input
                    id={`reg-${id}`}
                    type={type}
                    required
                    autoComplete={autoComplete}
                    value={form[id]}
                    onChange={(e) => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: undefined })); }}
                    placeholder={placeholder}
                  />
                  {toggle && (
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)} className="text-text-muted hover:text-text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {errors[id] && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
                    <AlertCircle className="h-3 w-3" /> {errors[id]}
                  </p>
                )}
              </div>
            ))}

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-4 text-base" id="register-submit">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent hover:text-accent-light transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
