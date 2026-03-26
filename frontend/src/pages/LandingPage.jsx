import { ArrowRight, BrainCircuit, FileBadge2, SearchCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import BrandLogo from "../components/common/BrandLogo";

const features = [
  {
    title: "Smart RAG Search",
    description: "Search IT Act sections and GST circulars with direct citations for every answer.",
    icon: SearchCheck
  },
  {
    title: "Multi-Agent Compliance",
    description: "Blend retrieval, calculations, deadline tracking, and self-critique in one workflow.",
    icon: BrainCircuit
  },
  {
    title: "Document Intelligence",
    description: "Upload ITR, GSTR, Form 26AS, and circular PDFs to ground every response in your own data.",
    icon: FileBadge2
  }
];

const steps = [
  "Upload your tax documents",
  "Ask any compliance question",
  "Get cited, accurate answers"
];

/**
 * Render the public marketing landing page.
 * @returns {JSX.Element}
 */
export default function LandingPage() {
  return (
    <div className="bg-brand-background text-slate-900">
      <section className="hero-surface overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <nav className="flex items-center justify-between">
            <BrandLogo light className="max-w-full" />
            <div className="flex items-center gap-3">
              <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white" to="/login">
                Login
              </Link>
              <Link
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-violet-50"
                to="/register"
              >
                Get Started
              </Link>
            </div>
          </nav>

          <div className="grid items-center gap-14 py-20 md:grid-cols-[1.1fr_0.9fr]">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/85">
                Built for Indian tax workflows
              </span>
              <h1 className="mt-6 text-5xl font-black leading-tight text-white md:text-6xl">
                India&apos;s Smartest GenAI Tax & Compliance Platform
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">
                Ask any tax question. Get cited answers from the Income Tax Act, GST circulars, and your own filings
                instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition hover:bg-violet-50"
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See Demo
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[36px] border border-white/12 bg-white/8 p-6 shadow-2xl backdrop-blur"
            >
              <div className="grid gap-4">
                <div className="rounded-[28px] bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">Compliance score</p>
                  <p className="mt-3 text-4xl font-black text-brand-primary">92</p>
                  <p className="mt-2 text-sm text-emerald-600">+7 points this quarter</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] bg-white/90 p-5">
                    <p className="text-sm font-medium text-slate-500">Indexed docs</p>
                    <p className="mt-3 text-3xl font-bold text-brand-accent">48</p>
                  </div>
                  <div className="rounded-[28px] bg-white/90 p-5">
                    <p className="text-sm font-medium text-slate-500">Upcoming deadlines</p>
                    <p className="mt-3 text-3xl font-bold text-brand-warning">03</p>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/15 bg-brand-primary p-5 text-white">
                  <p className="text-sm font-medium text-white/70">Assistant insight</p>
                  <p className="mt-3 leading-7">
                    &quot;Section 194I is applicable on rent payments above the threshold. Your uploaded lease agreement
                    supports classification as commercial rent.&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">Core platform</p>
          <h2 className="mt-3 text-4xl font-black text-brand-primary">Built for modern tax operations</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[30px] border border-white bg-white p-6 shadow-panel"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-brand-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-brand-primary">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-500">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="rounded-[36px] bg-brand-primary px-8 py-12 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">How it works</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-[28px] border border-white/12 bg-white/8 p-6">
                <p className="text-sm font-semibold text-white/60">Step {index + 1}</p>
                <h3 className="mt-4 text-xl font-semibold">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-10">
          <BrandLogo />
          <p>© 2025 CubitaxAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
