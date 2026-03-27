import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, FileStack, SearchCheck } from "lucide-react";
import { Link } from "react-router-dom";

import BrandLogo from "../components/BrandLogo";

const features = [
  {
    icon: SearchCheck,
    title: "Smart RAG Search",
    text: "Search IT Act sections and GST circulars with direct citations for every answer."
  },
  {
    icon: BrainCircuit,
    title: "Multi-Agent Compliance",
    text: "Blend retrieval, calculations, deadline tracking, and self-critique in one workflow."
  },
  {
    icon: FileStack,
    title: "Document Intelligence",
    text: "Upload ITR, GSTR, Form 26AS, and circular PDFs to ground every response in your own data."
  }
];

/**
 * Render the CubitaxAI marketing landing page.
 * @returns {JSX.Element}
 */
export default function Landing() {
  return (
    <div className="page-grid min-h-screen bg-bg text-text-primary">
      <section className="relative overflow-hidden border-b border-navy-border bg-navy">
        <div className="absolute inset-0 bg-grid-lines opacity-70" />
        <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-purple/25 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-cyan/12 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <BrandLogo light />
            <div className="flex items-center gap-3">
              <Link to="/login" className="ghost-button">
                Login
              </Link>
              <Link to="/register" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-slate-100">
                Get Started
              </Link>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <span className="pill border-purple/24 bg-white/5 text-text-secondary">
                Built for Indian tax workflows
              </span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.02] md:text-6xl">
                India&apos;s Smartest GenAI Tax &amp; Compliance Platform
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
                Ask any tax question. Get cited answers from the Income Tax Act, GST circulars, and your own filings
                instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="rounded-full bg-white px-6 py-4 text-sm font-semibold text-navy hover:bg-slate-100">
                  Start Free <ArrowRight className="ml-2 inline h-4 w-4" />
                </Link>
                <a href="#features" className="secondary-button">
                  See Demo
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="surface-card-soft rounded-[28px] p-6"
            >
              <div className="grid gap-4">
                <div className="surface-card bg-white p-6 text-navy">
                  <p className="text-sm text-slate-500">Compliance score</p>
                  <p className="mt-3 font-display text-5xl font-extrabold">92</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">+7 points this quarter</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="surface-card bg-white p-5 text-navy">
                    <p className="text-sm text-slate-500">Indexed docs</p>
                    <p className="mt-4 font-display text-4xl font-extrabold text-purple">48</p>
                  </div>
                  <div className="surface-card bg-white p-5 text-navy">
                    <p className="text-sm text-slate-500">Upcoming deadlines</p>
                    <p className="mt-4 font-display text-4xl font-extrabold text-amber">03</p>
                  </div>
                </div>
                <div className="surface-card p-5">
                  <p className="text-sm font-semibold text-text-secondary">Assistant insight</p>
                  <p className="mt-4 text-sm leading-7 text-text-primary">
                    &quot;Section 194I applies to rent payments above the threshold. Your uploaded lease summary
                    indicates the payment should be reviewed under commercial rent treatment.&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#f5f7ff] text-[#102048]">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-purple">Core Platform</p>
          <h2 className="mt-4 font-display text-4xl font-extrabold">Built for modern tax operations</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_18px_36px_rgba(16,32,72,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/10 text-purple">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold">{feature.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f7ff] pb-20 text-text-primary">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="rounded-[32px] bg-navy p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-text-secondary">How It Works</p>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                { step: "Step 1", title: "Upload your tax documents" },
                { step: "Step 2", title: "Ask any compliance question" },
                { step: "Step 3", title: "Get cited, accurate answers" }
              ].map((item) => (
                <div key={item.step} className="surface-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">{item.step}</p>
                  <h3 className="mt-8 font-display text-3xl font-bold">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
