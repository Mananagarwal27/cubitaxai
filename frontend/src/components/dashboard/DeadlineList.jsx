/**
 * Render the upcoming deadlines table.
 * @param {{ deadlines: Array<{ filing_name: string, due_date: string, days_remaining: number, urgency: string, status: string }> }} props
 * @returns {JSX.Element}
 */
export default function DeadlineList({ deadlines }) {
  const urgencyClasses = {
    RED: "bg-rose-50 text-rose-600",
    AMBER: "bg-amber-50 text-amber-600",
    GREEN: "bg-emerald-50 text-emerald-600"
  };

  return (
    <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-primary">Upcoming Deadlines</h2>
          <p className="text-sm text-slate-500">Track approaching GST, TDS, and income tax milestones.</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-medium">Filing Name</th>
              <th className="pb-3 font-medium">Due Date</th>
              <th className="pb-3 font-medium">Days Left</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((deadline) => (
              <tr key={`${deadline.filing_name}-${deadline.due_date}`} className="border-b border-slate-100 last:border-none">
                <td className="py-4 font-medium text-slate-900">{deadline.filing_name}</td>
                <td className="py-4 text-slate-600">{new Date(deadline.due_date).toLocaleDateString("en-IN")}</td>
                <td className="py-4 text-slate-600">{deadline.days_remaining}</td>
                <td className="py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyClasses[deadline.urgency] || urgencyClasses.GREEN}`}>
                    {deadline.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

