import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Download, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { api } from "../api/client";
import { LogOut } from "lucide-react";

function ComplianceRing({ score }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00D4AA" : score >= 50 ? "#F5A623" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-bold text-2xl" style={{ color }}>{score}</p>
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ filings: [], deadlines: [], reports: [], score: 0 });

  useEffect(() => {
    async function fetchData() {
      // In a real app we'd fetch specific client API routes
      const token = localStorage.getItem("cubitax_token");
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      try {
          const [filings, deadlines, reports, score] = await Promise.all([
              fetch(`${baseUrl}/api/portal/filing-status`, {headers}).then(r => r.json()),
              fetch(`${baseUrl}/api/portal/deadlines`, {headers}).then(r => r.json()),
              fetch(`${baseUrl}/api/portal/reports`, {headers}).then(r => r.json()),
              fetch(`${baseUrl}/api/portal/compliance-score`, {headers}).then(r => r.json())
          ]);
          setData({
              filings: filings.filings || [],
              deadlines: deadlines.deadlines || [],
              reports: reports.reports || [],
              score: score.score || 0
          });
      } catch (err) {
          console.error(err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-primary p-6 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">{user?.company_name || 'Client Portal'}</h1>
          <p className="text-sm text-text-secondary">Powered by CubitaxAI</p>
        </div>
        <button onClick={logout} className="btn-ghost text-danger">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            
          {/* Filings */}
          <div className="glow-card p-6">
            <h2 className="text-xl font-bold mb-4 font-display">Filing Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-text-muted">
                    <th className="py-2">Filing Type</th>
                    <th>Period</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Ack No.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filings.map((f, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-3 font-semibold">{f.filing_type}</td>
                      <td>{f.period}</td>
                      <td>{f.due_date}</td>
                      <td>
                          <span className={`badge-${f.status === 'FILED' ? 'success' : f.status === 'OVERDUE' ? 'danger' : 'warning'}`}>
                              {f.status}
                          </span>
                      </td>
                      <td className="text-sm">{f.ack_number || '-'}</td>
                    </tr>
                  ))}
                  {data.filings.length === 0 && (
                      <tr><td colSpan="5" className="py-4 text-center text-text-muted">No filings to show</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Reports */}
          <div className="glow-card p-6">
             <h2 className="text-xl font-bold mb-4 font-display flex items-center"><FileText className="mr-2"/> Approved Reports</h2>
             <div className="space-y-4">
                 {data.reports.map((r, i) => (
                     <div key={i} className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
                         <div>
                             <p className="font-bold">{r.name}</p>
                             <p className="text-sm text-text-muted">{new Date(r.date).toLocaleDateString()}</p>
                         </div>
                         <a href={`/api/reports/download/${r.id}?format=pdf`} className="btn-secondary">
                             <Download className="h-4 w-4 mr-2"/> Download
                         </a>
                     </div>
                 ))}
                 {data.reports.length === 0 && (
                     <p className="text-center text-text-muted py-4">No reports shared yet</p>
                 )}
             </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
            
            {/* Compliance Score */}
            <div className="glow-card p-6 flex flex-col items-center">
                <h2 className="text-lg font-bold mb-4 w-full">Compliance Score</h2>
                <ComplianceRing score={data.score} />
                <p className="text-sm mt-4 text-text-secondary text-center">Your overall compliance health based on recent filings.</p>
            </div>

            {/* Deadlines */}
            <div className="glow-card p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center"><Clock className="mr-2 h-5 w-5"/> Upcoming Deadlines</h2>
                <div className="space-y-3">
                    {data.deadlines.map((d, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${d.days_remaining <= 3 ? 'border-danger/50 bg-danger/5' : 'border-border bg-surface'}`}>
                            <p className="font-bold">{d.name}</p>
                            <div className="flex justify-between text-sm mt-1">
                                <span className={d.days_remaining <= 3 ? 'text-danger' : 'text-text-muted'}>Due: {d.due_date}</span>
                                <span>{d.days_remaining} days left</span>
                            </div>
                        </div>
                    ))}
                    {data.deadlines.length === 0 && (
                        <p className="text-center text-text-muted py-4">No upcoming deadlines.</p>
                    )}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
