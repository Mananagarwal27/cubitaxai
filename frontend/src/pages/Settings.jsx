import { motion } from "framer-motion";
import { Key, Moon, Save, Shield, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "../hooks/useAuth";
import AppShell from "../components/AppShell";

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  });

  function handleSave(e) {
    e.preventDefault();
    toast.success("Settings saved");
  }

  return (
    <AppShell title="Settings">
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">Profile</h2>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Full Name</label>
              <input className="input-field" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Email</label>
              <input className="input-field" value={form.email} disabled />
            </div>
            <button type="submit" className="btn-primary">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">API Keys</h2>
          </div>
          <p className="text-sm text-text-secondary">
            Generate API keys to integrate CubitaxAI with your existing systems.
          </p>
          <button className="btn-secondary mt-4 text-sm">Generate New Key</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="font-display text-lg font-bold">Security</h2>
          </div>
          <button className="btn-secondary text-sm">Change Password</button>
        </motion.div>
      </div>
    </AppShell>
  );
}
