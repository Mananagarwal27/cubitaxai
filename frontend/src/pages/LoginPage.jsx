import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import LoginForm from "../components/auth/LoginForm";
import BrandLogo from "../components/common/BrandLogo";

/**
 * Render the login page.
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  return (
    <div className="page-shell min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-8 text-white shadow-panel"
        >
          <BrandLogo light />
          <div className="mt-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Tax operations workspace</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              Run GST, TDS, and compliance work from one AI operating layer.
            </h1>
            <p className="mt-4 text-sm leading-7 text-violet-100">
              Login to continue with cited answers, indexed document search, deterministic tax calculations, and a
              dashboard built around filing deadlines instead of generic analytics.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Cited answers", text: "Ground assistant output in tax references and uploaded evidence." },
              { icon: Sparkles, title: "Fast workflows", text: "Move from question to filing action without switching tools." },
              { icon: CheckCircle2, title: "Workspace memory", text: "Keep conversation context attached to the active dashboard." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                  <Icon className="h-5 w-5 text-violet-200" />
                  <p className="mt-3 font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-violet-100">{item.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="glass-card rounded-[32px] border border-white/70 p-8 shadow-panel">
            <div className="mb-8 text-center">
              <div className="mx-auto flex w-fit items-center justify-center rounded-3xl bg-white px-4 py-3 shadow-sm">
                <BrandLogo compact />
              </div>
              <h1 className="mt-5 text-3xl font-bold text-brand-primary">Welcome back</h1>
              <p className="mt-2 text-slate-500">Sign in to your compliance dashboard</p>
            </div>
            <LoginForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
