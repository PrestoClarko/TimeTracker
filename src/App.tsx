import { useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useEntries, type EntryDraft } from "./hooks/useEntries";
import { useSettings } from "./hooks/useSettings";
import { useTimer } from "./hooks/useTimer";
import { Sidebar, type View } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { EntriesView } from "./components/EntriesView";
import { ReportsView } from "./components/ReportsView";
import { SettingsView } from "./components/SettingsView";
import { EntryModal } from "./components/EntryModal";
import { ClockIcon } from "./components/icons";
import { todayStr } from "./lib/time";
import type { TimeEntry } from "./lib/types";

const VIEW_TITLES: Record<View, string> = {
  dashboard: "Dashboard",
  entries: "Time Entries",
  reports: "Reports",
  settings: "Settings",
};

export default function App() {
  const auth = useAuth();
  const {
    entries,
    loading,
    syncing,
    source,
    error: entriesError,
    clearError,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useEntries(auth.user);
  const { settings, update } = useSettings();
  const timer = useTimer();

  const [view, setView] = useState<View>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [prefill, setPrefill] = useState<Partial<EntryDraft> | null>(null);

  const clients = useMemo(
    () => Array.from(new Set(entries.map((e) => e.client).filter(Boolean))).sort(),
    [entries],
  );
  const projects = useMemo(
    () => Array.from(new Set(entries.map((e) => e.project).filter(Boolean))).sort(),
    [entries],
  );

  function openNew(pf?: Partial<EntryDraft> | null) {
    setEditing(null);
    setPrefill(pf ?? null);
    setModalOpen(true);
  }

  function openEdit(entry: TimeEntry) {
    setEditing(entry);
    setPrefill(null);
    setModalOpen(true);
  }

  function handleSave(draft: EntryDraft) {
    if (editing) updateEntry(editing.id, draft);
    else addEntry(draft);
  }

  function handleStopTimer() {
    const result = timer.stop();
    if (!result) return;
    openNew({
      task: result.task,
      client: result.client,
      minutes: result.minutes,
      date: todayStr(),
      billable: settings.defaultBillable,
      rate: settings.defaultRate,
      notes: "",
      project: "",
    });
  }

  if (auth.loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-slate-400">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <ClockIcon className="h-6 w-6" />
        </div>
        <p className="text-sm">Loading TimeTracker…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar view={view} onChange={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={auth.user}
          enabled={auth.enabled}
          source={source}
          syncing={syncing}
          onSignIn={auth.signIn}
          onSignOut={auth.signOut}
          onNewEntry={() => openNew()}
          timer={timer}
          onStopTimer={handleStopTimer}
        />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {VIEW_TITLES[view]}
              </h1>
            </div>

            {auth.error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {auth.error}
              </div>
            )}

            {entriesError && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <span>{entriesError}</span>
                <button
                  onClick={clearError}
                  className="shrink-0 rounded-md px-2 py-0.5 text-rose-300 hover:bg-rose-500/20"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Loading entries…
              </div>
            ) : view === "dashboard" ? (
              <Dashboard
                entries={entries}
                settings={settings}
                onNewEntry={() => openNew()}
                onEdit={openEdit}
                onDelete={deleteEntry}
              />
            ) : view === "entries" ? (
              <EntriesView
                entries={entries}
                settings={settings}
                onNewEntry={() => openNew()}
                onEdit={openEdit}
                onDelete={deleteEntry}
              />
            ) : view === "reports" ? (
              <ReportsView entries={entries} settings={settings} />
            ) : (
              <SettingsView
                settings={settings}
                onUpdate={update}
                user={auth.user}
                enabled={auth.enabled}
                source={source}
                entries={entries}
                onSignIn={auth.signIn}
                onSignOut={auth.signOut}
              />
            )}
          </div>
        </main>
      </div>

      <EntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        settings={settings}
        initial={editing}
        prefill={prefill}
        clients={clients}
        projects={projects}
      />
    </div>
  );
}
