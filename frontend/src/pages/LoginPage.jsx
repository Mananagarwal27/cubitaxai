import { motion } from "framer-motion";

import LoginForm from "../components/auth/LoginForm";

/**
 * Render the login page.
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card rounded-[32px] border border-white/70 p-8 shadow-panel">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-primary text-xl font-bold text-white">
              C
            </div>
            <h1 className="mt-5 text-3xl font-bold text-brand-primary">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to your compliance dashboard</p>
          </div>
          <LoginForm />
        </div>
      </motion.div>
    </div>
  );
}

