import { motion } from "framer-motion";
import { CheckCircle2, Files, ShieldCheck } from "lucide-react";

import RegisterForm from "../components/auth/RegisterForm";
import BrandLogo from "../components/common/BrandLogo";

/**
 * Render the registration page.
 * @returns {JSX.Element}
 */
export default function RegisterPage() {
  return (
    <div className="page-shell min-h-screen px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_540px] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] bg-gradient-to-br from-brand-primary via-[#2d2370] to-slate-900 p-8 text-white shadow-panel"
        >
          <BrandLogo light />
          <div className="mt-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-200">Launch your workspace</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              Set up a compliance workspace that is ready for real document-driven tax operations.
            </h1>
            <p className="mt-4 text-sm leading-7 text-violet-100">
              Registration creates the base profile that powers dashboard metrics, document indexing, GST evidence
              packs, deterministic tax workbenches, and cited reporting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: Files, title: "Document-first", text: "Bring PDFs into one place for grounded answers." },
              { icon: ShieldCheck, title: "Compliance-led", text: "Track due dates, obligations, and filing signals." },
              { icon: CheckCircle2, title: "Portfolio-grade", text: "Use the workspace as a polished flagship product." }
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
              <h1 className="mt-5 text-3xl font-bold text-brand-primary">Create your account</h1>
              <p className="mt-2 text-slate-500">Start your tax compliance journey</p>
            </div>
            <RegisterForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
