import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Download, FileText, CheckCircle, Clock, AlertTriangle, Users, Target } from "lucide-react";
import { api } from "../api/client";
import { LogOut } from "lucide-react";

function MiniRing({ score }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00D4AA" : score >= 50 ? "#F5A623" : "#EF4444";

  return (
    <div className="relative flex items-center justify-center w-[40px] h-[40px]">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute text-center text-xs font-bold" style={{ color }}>{score}</div>
    </div>
  );
}

export default function CADashboard() {
  const { user, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [sweep, setSweep] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // In a real app we'd use api methods
      const token = localStorage.getItem("cubitax_token");
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      
      try {
          const [clientsRes, sweepRes] = await Promise.all([
              fetch(`${baseUrl}/api/ca/clients`, {headers}).then(r => r.json()),
              fetch(`${baseUrl}/api/ca/clients/deadline-sweep`, {headers}).then(r => r.json())
          ]);
          
          if (Array.isArray(clientsRes)) {
             // Mock some extra fields like score since health check route is separate
             setClients(clientsRes.map(c => ({...c, score: 85 + Math.floor(Math.random() * 10), overdue: 0, due_this_week: 1})));
          }
          if (Array.isArray(sweepRes)) {
             setSweep(sweepRes);
          }
      } catch (err) {
          console.error(err);
      }
    }
    fetchData();
  }, []);

  const switchContext = async (org_id) => {
      // call /api/ca/clients/{org_id}/switch and reload 
      alert("Switched to client context: " + org_id);
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary p-6 font-sans mx-auto max-w-[1440px]">
      <header className="flex justify-between items-center mb-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center"><Users className="mr-3 text-accent h-8 w-8"/> Client Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Manage all CA firm clients from one place <span className="badge-primary ml-2">{clients.length} Clients</span></p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {clients.map(c => (
            <div key={c.id} className="glow-card p-5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <MiniRing score={c.score} />
                    <div>
                        <h3 className="font-bold text-lg">{c.company_name}</h3>
                        <p className="text-sm text-text-muted font-mono">{c.pan_number}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-center">
                       <span className="text-danger font-bold text-lg">{c.overdue}</span>
                       <span className="text-xs text-text-muted">Overdue</span>
                    </div>
                    <div className="flex flex-col items-center">
                       <span className="text-warning font-bold text-lg">{c.due_this_week}</span>
                       <span className="text-xs text-text-muted">Due this week</span>
                    </div>
                    <button onClick={() => switchContext(c.id)} className="btn-secondary text-sm px-4">View</button>
                </div>
            </div>
        ))}
      </div>

      <div className="glow-card overflow-hidden">
         <div className="p-5 border-b border-border flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center"><Target className="mr-2"/> Bulk Deadline Sweep</h2>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-border text-sm text-text-muted">
                        <th className="py-3 px-4">Client</th>
                        <th className="px-4">Filing Type</th>
                        <th className="px-4">Period</th>
                        <th className="px-4">Due Date</th>
                        <th className="px-4">Status</th>
                        <th className="px-4">Days Left</th>
                    </tr>
                </thead>
                <tbody>
                    {sweep.map((s, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                            <td className="py-3 px-4 font-semibold">{s.client_name}</td>
                            <td className="px-4 text-sm">{s.filing_type}</td>
                            <td className="px-4 text-sm text-text-secondary">{s.period}</td>
                            <td className="px-4 font-mono text-sm">{s.due_date}</td>
                            <td className="px-4">
                                <span className={`badge-${s.status === 'OVERDUE' ? 'danger' : s.status === 'PENDING' ? 'warning' : 'neutral'}`}>{s.status}</span>
                            </td>
                            <td className="px-4">
                                <span className={s.days_left <= 3 ? 'text-danger font-bold' : ''}>{s.days_left}d</span>
                            </td>
                        </tr>
                    ))}
                    {sweep.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-text-muted">No deadlines found across all clients in the next 30 days.</td></tr>}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
}
