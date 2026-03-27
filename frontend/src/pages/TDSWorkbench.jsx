import { Calculator, Landmark, Percent, ReceiptIndianRupee } from "lucide-react";
import { useMemo, useState } from "react";

import AppShell from "../components/AppShell";

const sectionRates = {
  "194A": 0.1,
  "194C": 0.01,
  "194I": 0.1,
  "194J": 0.1,
  "195": 0.2,
  "206AB": 0.05
};

/**
 * Render the TDS workbench page.
 * @returns {JSX.Element}
 */
export default function TDSWorkbench() {
  const [amount, setAmount] = useState(250000);
  const [panAvailable, setPanAvailable] = useState(true);
  const [section, setSection] = useState("194I");

  const output = useMemo(() => {
    const baseRate = sectionRates[section] || 0;
    const effectiveRate = panAvailable ? baseRate : Math.max(baseRate, 0.2);
    const baseAmount = amount * effectiveRate;
    const surcharge = amount > 1000000 ? baseAmount * 0.1 : 0;
    const totalDeduction = baseAmount + surcharge;

    return {
      section,
      rate: `${(effectiveRate * 100).toFixed(2)}%`,
      baseAmount,
      surcharge,
      totalDeduction
    };
  }, [amount, panAvailable, section]);

  return (
    <AppShell
      title="TDS Workbench"
      pageLabel="TDS Workbench"
      suggestions={[
        "What section applies to this payment?",
        "Calculate TDS on professional fees",
        "Compare rent TDS with and without PAN"
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple/10 p-3 text-purple-light">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">TDS Calculator</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Deterministic deduction preview</h2>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Amount (₹)</span>
              <span className="input-shell">
                <ReceiptIndianRupee className="h-4 w-4 text-text-muted" />
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value || 0))}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-text-secondary">Section</span>
              <span className="input-shell">
                <Landmark className="h-4 w-4 text-text-muted" />
                <select value={section} onChange={(event) => setSection(event.target.value)}>
                  {Object.keys(sectionRates).map((option) => (
                    <option key={option} value={option} className="bg-navy-card">
                      Section {option}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <div className="flex items-center justify-between rounded-2xl border border-navy-border bg-navy px-4 py-4">
              <div>
                <p className="text-sm font-medium text-text-primary">PAN available</p>
                <p className="text-sm text-text-muted">Turn off to apply higher withholding logic.</p>
              </div>
              <button
                type="button"
                onClick={() => setPanAvailable((current) => !current)}
                className={`flex h-8 w-16 items-center rounded-full px-1 ${
                  panAvailable ? "bg-green/20" : "bg-navy-border"
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full bg-white transition-transform ${
                    panAvailable ? "translate-x-8" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button type="button" className="primary-button w-full">
              Calculate
            </button>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan/10 p-3 text-cyan">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Output Card</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">TDS deduction breakdown</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { label: "Section", value: output.section },
              { label: "Rate", value: output.rate },
              { label: "Base amount", value: `₹${output.baseAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` },
              { label: "Surcharge", value: `₹${output.surcharge.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-navy-border bg-navy px-5 py-5">
                <p className="text-sm text-text-secondary">{item.label}</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-purple/24 bg-purple/10 px-5 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-light">Total deduction</p>
            <p className="mt-3 font-display text-4xl font-extrabold text-text-primary">
              ₹{output.totalDeduction.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
