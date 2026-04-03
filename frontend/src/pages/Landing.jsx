import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileStack,
  SearchCheck,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: SearchCheck,
    title: "Smart RAG Search",
    desc: "Search IT Act sections and GST circulars with direct citations for every answer. Hybrid BM25 + dense retrieval with Cohere reranking.",
  },
  {
    icon: BrainCircuit,
    title: "Multi-Agent Compliance",
    desc: "Blend retrieval, calculations, deadline tracking, and self-critique in one orchestrated LangGraph workflow.",
  },
  {
    icon: FileStack,
    title: "Document Intelligence",
    desc: "Upload ITR, GSTR, Form 26AS, and circular PDFs to ground every response in your own data.",
  },
];

const stats = [
  { value: "500+", label: "CA Firms Trust Us" },
  { value: "98.7%", label: "Filing Accuracy" },
  { value: "₹240Cr+", label: "TDS Managed" },
  { value: "<2s", label: "Avg Response Time" },
];

const steps = [
  { num: "01", title: "Upload your tax documents", desc: "ITR, GSTR, Form 26AS, TDS Certificates — we parse and index everything." },
  { num: "02", title: "Ask any compliance question", desc: "Natural language queries routed through our multi-agent pipeline for accurate answers." },
  { num: "03", title: "Get cited, accurate answers", desc: "Every response includes section references, calculation breakdowns, and confidence scores." },
];

function stagger(i) {
  return { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.1, duration: 0.6 } };
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* ══ NAV ═══════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-transparent" style={{ background: "rgba(7,9,15,0.85)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
              <div className="h-4 w-4 rounded-sm bg-accent" />
            </div>
            <span className="font-display text-lg font-bold">
              Cubitax<span className="text-accent">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="ghost-button">Login</Link>
            <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        {/* Mesh blobs */}
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:py-0">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left text */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="pill border-accent/20 bg-accent/10 text-accent mb-6">
                <Sparkles className="h-3 w-3" /> Built for Indian tax workflows
              </div>

              <h1 className="font-display text-hero-sm font-extrabold leading-[1.02] lg:text-hero">
                Tax compliance,
                <br />
                <span className="gradient-text">finally intelligent.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-text-secondary">
                Ask any tax question. Get cited answers from the Income Tax Act, GST circulars,
                and your own filings — instantly.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary px-8 py-4 text-base">
                  Request Demo <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#features" className="secondary-button">
                  See how it works
                </a>
              </div>
            </motion.div>

            {/* Right mock UI */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="relative"
            >
              {/* Glow */}
              <div className="absolute -inset-4 rounded-3xl bg-accent/5 blur-3xl" />

              <div className="surface-card-soft relative rounded-3xl p-6">
                <div className="space-y-4">
                  {/* Compliance card */}
                  <div className="glow-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Compliance Score</p>
                    <div className="mt-3 flex items-baseline gap-3">
                      <p className="font-display text-5xl font-extrabold text-mint">92</p>
                      <span className="badge-success">+7 this quarter</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glow-card p-5">
                      <p className="text-xs text-text-muted">Indexed Docs</p>
                      <p className="mt-3 font-display text-3xl font-bold text-accent">48</p>
                    </div>
                    <div className="glow-card p-5">
                      <p className="text-xs text-text-muted">Deadlines</p>
                      <p className="mt-3 font-display text-3xl font-bold text-warning">03</p>
                    </div>
                  </div>

                  {/* Insight */}
                  <div className="glow-card p-5">
                    <p className="text-xs font-semibold text-text-muted">AI Insight</p>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      &quot;Section 194I applies to rent payments above threshold. Your lease
                      summary indicates commercial rent treatment.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════════════ */}
      <section className="border-y border-border bg-bg-secondary">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} {...stagger(i)} className="text-center">
              <p className="font-mono text-3xl font-bold text-text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════ */}
      <section id="features" className="bg-bg py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...stagger(0)} className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Core Platform</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold">
              Built for modern tax operations
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title} {...stagger(i)} className="glow-card p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold">{feat.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <section className="bg-bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...stagger(0)} className="glass-card overflow-hidden p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">How It Works</p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div key={step.num} {...stagger(i)} className="glow-card p-7">
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{step.num}</p>
                  <h3 className="mt-6 font-display text-2xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-bg py-24">
        <div className="mesh-blob mesh-blob-1" style={{ top: "20%", left: "30%" }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        <motion.div {...stagger(0)} className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl font-extrabold lg:text-5xl">
            Ready to automate
            <br />
            <span className="gradient-text">your compliance?</span>
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Join 500+ CA firms using CubitaxAI to file faster, catch errors, and stay ahead of deadlines.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-primary px-8 py-4 text-base">
              Request Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="secondary-button">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-bg-secondary py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
              <div className="h-3.5 w-3.5 rounded-sm bg-accent" />
            </div>
            <span className="font-display text-sm font-bold">CubitaxAI</span>
          </div>
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} CubitaxAI. All rights reserved. Made with 🇮🇳 in India.
          </p>
        </div>
      </footer>
    </div>
  );
}
