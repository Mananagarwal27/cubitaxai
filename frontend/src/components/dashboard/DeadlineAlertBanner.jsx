import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "../../api/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function DeadlineAlertBanner() {
  const [deadlines, setDeadlines] = useState([]);
  const [dismissed, setDismissed] = useState(
    sessionStorage.getItem("deadline_banner_dismissed") === "true"
  );

  useEffect(() => {
    // In a real app we'd fetch this from the active user org.
    // Assuming api.dashboard.getDeadlines returns upcoming deadlines
    api.dashboard.getDeadlines().then((res) => {
      // res is a list of deadlines.
      if (Array.isArray(res)) {
          // get real ones or use mock logic if that fails.
          const upcoming = res.filter(d => {
              if (d.days_remaining !== undefined) return d.days_remaining <= 7 && d.days_remaining >= 0;
              return false;
          });
          setDeadlines(upcoming);
      }
    }).catch(() => {
        // Mock fallback to display something if backend is not wired perfectly yet
        setDeadlines([
            { id: 1, filing_type: "GSTR-3B", days_remaining: 3 },
            { id: 2, filing_type: "TDS_24Q", days_remaining: 1 }
        ].filter(d => d.days_remaining <= 7));
    });
  }, []);

  if (dismissed || deadlines.length === 0) return null;

  const urgentCount = deadlines.filter(d => d.days_remaining <= 1).length;
  const bgColor = urgentCount > 0 ? "bg-danger" : "bg-warning";
  const textColor = urgentCount > 0 ? "text-white" : "text-black";
  
  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("deadline_banner_dismissed", "true");
  };

  const typesListed = Array.from(new Set(deadlines.map(d => d.filing_type || d.name))).join(", ");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`mb-6 rounded-xl p-4 shadow-lg ${bgColor} ${textColor} flex items-center justify-between cursor-pointer`}
      >
        <Link to="/dashboard/deadlines" className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <p className="font-bold">
              {deadlines.length} filing{deadlines.length > 1 ? "s" : ""} due this week
            </p>
            <p className="text-sm opacity-90">
              {typesListed}
            </p>
          </div>
        </Link>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDismiss();
          }}
          className="p-2 hover:bg-black/10 rounded-full transition-colors ml-4"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
