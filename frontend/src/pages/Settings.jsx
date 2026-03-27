import { BellRing, MoonStar, Save, User2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import AppShell from "../components/AppShell";
import { useAuth } from "../hooks/useAuth";

/**
 * Render the settings page.
 * @returns {JSX.Element}
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "Demo User",
    email: user?.email || "demo@example.com",
    company_name: user?.company_name || "Demo Co"
  });
  const [preferences, setPreferences] = useState({
    notifications: true,
    reminders: true,
    darkMode: true
  });

  function handleSave() {
    toast.success("Settings saved locally");
  }

  return (
    <AppShell
      title="Settings"
      pageLabel="Settings"
      suggestions={[
        "What settings matter for compliance workflows?",
        "Summarize my current workspace preferences",
        "How should I configure reminders?"
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-center gap-3">
            <User2 className="h-5 w-5 text-text-secondary" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Profile settings</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Workspace identity</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { key: "full_name", label: "Full name" },
              { key: "email", label: "Email" },
              { key: "company_name", label: "Company" }
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-sm font-medium text-text-secondary">{field.label}</span>
                <span className="input-shell">
                  <input
                    value={profile[field.key]}
                    onChange={(event) => setProfile((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-text-secondary" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">Preferences</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-text-primary">Notifications and theme</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { key: "notifications", label: "Notification alerts", icon: BellRing },
              { key: "reminders", label: "Deadline reminders", icon: BellRing },
              { key: "darkMode", label: "Dark theme", icon: MoonStar }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between rounded-2xl border border-navy-border bg-navy px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/[0.04] p-3 text-text-secondary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences((current) => ({ ...current, [item.key]: !current[item.key] }))}
                    className={`flex h-8 w-16 items-center rounded-full px-1 ${
                      preferences[item.key] ? "bg-purple/30" : "bg-navy-border"
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full bg-white transition-transform ${
                        preferences[item.key] ? "translate-x-8" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={handleSave} className="primary-button mt-6 w-full">
            <Save className="h-4 w-4" />
            Save settings
          </button>
        </div>
      </div>
    </AppShell>
  );
}
