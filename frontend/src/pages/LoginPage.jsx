import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import LoginForm from "../components/auth/LoginForm";
import BrandLogo from "../components/common/BrandLogo";

const workflowCards = [
  {
    icon: ShieldCheck,
    title: "Cited retrieval",
    text: "Ground assistant answers in tax references and uploaded evidence."
  },
  {
    icon: Sparkles,
    title: "Action-first workflow",
    text: "Move from question to filing decision without jumping between tools."
  },
  {
    icon: CheckCircle2,
    title: "Persistent workspace",
    text: "Keep deadlines, documents, and assistant memory in one place."
  }
];

/**
 * Render the login page.
 * @returns {JSX.Element}
 */
export default function LoginPage() {
  return (
    <div className="page-shell relative min-h-screen overflow-hidden px-4 py-8 md:px-6 lg:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-4rem] h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute bottom-[-5rem] right-[-3rem] h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute right-[22%] top-[16%] h-40 w-40 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_480px] lg:items-stretch">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[38px] bg-gradient-to-br from-brand-primary via-[#2a216c] to-[#17153b] p-8 text-white shadow-panel md:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:100%_100%,28px_28px,28px_28px]" />
          <div className="relative">
            <BrandLogo light />

            <div className="mt-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-200">Secure tax workspace</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] md:text-6xl">
                Step back into a sharper compliance operating system.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-violet-100">
                Resume GST, TDS, and filing workflows with a workspace built around cited answers, document-grounded
                analysis, and execution-ready dashboards.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["GST evidence", "Deterministic tax rules", "Deadline monitoring"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-100 backdrop-blur"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {workflowCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur transition hover:bg-white/14"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-violet-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-xl font-semibold text-white">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-violet-100">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Inside this workspace</p>
                  <p className="mt-2 text-lg font-semibold text-white">Dashboard, documents, GST, TDS, deadlines, and reports</p>
                </div>
                <div className="hidden rounded-full bg-white/10 p-3 text-violet-100 md:block">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full"
        >
          <div className="glass-card relative w-full rounded-[34px] border border-white/80 p-7 shadow-panel md:p-9">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />

            <div className="mb-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-sm">
                <BrandLogo compact />
              </div>
              <div className="mt-5 flex justify-center">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Secure Sign-In
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-brand-primary">Welcome back</h1>
              <p className="mt-3 text-base leading-7 text-slate-500">Sign in to continue to your compliance dashboard</p>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Auth", value: "JWT secured" },
                { label: "Session", value: "24 hour access" },
                { label: "Mode", value: "Workspace resume" }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50/90 px-4 py-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>

            <LoginForm />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
