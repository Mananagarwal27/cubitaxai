import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Render a monthly compliance score trend chart.
 * @param {{ data: Array<{ month: string, score: number }> }} props
 * @returns {JSX.Element}
 */
export default function ComplianceChart({ data }) {
  return (
    <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
      <h2 className="mb-4 text-lg font-semibold text-brand-primary">Compliance Trend</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#64748B" />
            <YAxis stroke="#64748B" />
            <Tooltip />
            <Bar dataKey="score" fill="#7C3AED" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

