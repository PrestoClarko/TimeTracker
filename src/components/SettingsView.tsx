import type { User } from "firebase/auth";
import type { TimeEntry, UserSettings } from "../lib/types";
import { entriesToCsv } from "../lib/reports";
import { Button, Card, Field, inputClass } from "./ui";
import { CloudIcon, DownloadIcon, GoogleIcon } from "./icons";

export function SettingsView({
  settings,
  onUpdate,
  user,
  enabled,
  source,
  entries,
  onSignIn,
  onSignOut,
}: {
  settings: UserSettings;
  onUpdate: (patch: Partial<UserSettings>) => void;
  user: User | null;
  enabled: boolean;
  source: "cloud" | "local";
  entries: TimeEntry[];
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  function exportAll() {
    const blob = new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-time-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Account / sync */}
      <Card className="p-5">
        <h3 className="mb-1 font-semibold text-white">Account &amp; sync</h3>
        <p className="mb-4 text-sm text-slate-400">
          Sign in with Google to back up your time entries to the cloud and sync
          across devices.
        </p>
        {!enabled ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Cloud sync isn't configured for this deployment. Your data is saved
            locally in this browser. Add Firebase keys (see README) to enable
            Google sign-in and cloud backup.
          </div>
        ) : user ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3">
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />
              )}
              <div>
                <div className="text-sm font-medium text-white">{user.displayName}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
            </div>
            <Button variant="secondary" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={onSignIn}>
            <GoogleIcon className="h-4 w-4" />
            Sign in with Google
          </Button>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <CloudIcon className="h-4 w-4" />
          Data source:{" "}
          <span className="font-medium text-slate-300">
            {source === "cloud" ? "Cloud (Firestore)" : "This device only"}
          </span>
        </div>
      </Card>

      {/* Defaults */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-white">Defaults</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default hourly rate">
            <input
              type="number"
              min={0}
              value={settings.defaultRate}
              onChange={(e) => onUpdate({ defaultRate: Math.max(0, +e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Currency symbol">
            <input
              value={settings.currency}
              onChange={(e) => onUpdate({ currency: e.target.value.slice(0, 3) })}
              className={inputClass}
            />
          </Field>
          <Field label="Week starts on">
            <select
              value={settings.weekStartsOn}
              onChange={(e) => onUpdate({ weekStartsOn: +e.target.value as 0 | 1 })}
              className={inputClass}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </Field>
          <Field label="New entries are billable">
            <select
              value={settings.defaultBillable ? "yes" : "no"}
              onChange={(e) => onUpdate({ defaultBillable: e.target.value === "yes" })}
              className={inputClass}
            >
              <option value="yes">Yes, by default</option>
              <option value="no">No, by default</option>
            </select>
          </Field>
        </div>
      </Card>

      {/* Data */}
      <Card className="p-5">
        <h3 className="mb-1 font-semibold text-white">Your data</h3>
        <p className="mb-4 text-sm text-slate-400">
          {entries.length} time {entries.length === 1 ? "entry" : "entries"} stored.
          Export a full CSV for invoicing or backup.
        </p>
        <Button variant="secondary" onClick={exportAll} disabled={entries.length === 0}>
          <DownloadIcon className="h-4 w-4" />
          Export all to CSV
        </Button>
      </Card>

      <p className="px-1 pb-2 text-center text-xs text-slate-600">
        TimeTracker · your data stays private to your account
      </p>
    </div>
  );
}
