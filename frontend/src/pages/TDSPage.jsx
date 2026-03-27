import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the TDS workbench page.
 * @returns {JSX.Element}
 */
export default function TDSPage() {
  return (
    <DashboardLayout title="TDS Workbench">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-accent">Deterministic engine</p>
          <h2 className="mt-3 text-3xl font-bold text-brand-primary">Key TDS sections covered</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {["194A", "194B", "194C", "194D", "194H", "194I", "194J", "194N", "195", "206AB"].map((section) => (
              <div key={section} className="rounded-2xl bg-slate-50 px-4 py-3 font-medium text-slate-700">
                Section {section}
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-[28px] border border-white/80 p-6 shadow-panel">
          <h3 className="text-xl font-semibold text-brand-primary">How to use</h3>
          <p className="mt-4 leading-7 text-slate-500">
            Ask the assistant questions like “Calculate TDS on rent of 250000 with PAN” or “TDS on professional fees
            without PAN”.
          </p>
          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            CubitaxAI uses deterministic Python rules for tax math instead of LLM arithmetic.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

