import { useMemo, useState } from "react";
import type { TimeEntry, UserSettings } from "../lib/types";
import { aggregate, entriesToCsv } from "../lib/reports";
import { formatDuration, formatMoney } from "../lib/time";
import { EntryList } from "./EntryList";
import { Button, EmptyState, inputClass } from "./ui";
import { DownloadIcon, PlusIcon } from "./icons";

function downloadCsv(entries: TimeEntry[]) {
  const blob = new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `time-entries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function EntriesView({
  entries,
  settings,
  onNewEntry,
  onEdit,
  onDelete,
}: {
  entries: TimeEntry[];
  settings: UserSettings;
  onNewEntry: () => void;
  onEdit: (e: TimeEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("");
  const [billable, setBillable] = useState<"all" | "billable" | "non">("all");

  const clients = useMemo(
    () => Array.from(new Set(entries.map((e) => e.client).filter(Boolean))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (client && e.client !== client) return false;
      if (billable === "billable" && !e.billable) return false;
      if (billable === "non" && e.billable) return false;
      if (!q) return true;
      return [e.task, e.notes, e.client, e.project, e.ticket, ...(e.tags ?? [])]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q));
    });
  }, [entries, query, client, billable]);

  const agg = aggregate(filtered);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search task, notes, ticket…"
          className={`${inputClass} sm:max-w-xs`}
        />
        <select
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className={`${inputClass} sm:w-44`}
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={billable}
          onChange={(e) => setBillable(e.target.value as typeof billable)}
          className={`${inputClass} sm:w-40`}
        >
          <option value="all">All time</option>
          <option value="billable">Billable only</option>
          <option value="non">Non-billable</option>
        </select>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="secondary"
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={onNewEntry}>
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-1 text-sm text-slate-400">
        <span>
          <span className="font-semibold text-slate-200">{filtered.length}</span> entries
        </span>
        <span>
          <span className="font-semibold text-slate-200">
            {formatDuration(agg.totalMinutes)}
          </span>{" "}
          total
        </span>
        <span>
          <span className="font-semibold text-emerald-300">
            {formatMoney(agg.billableAmount, settings.currency)}
          </span>{" "}
          billable
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching entries"
          description="Try adjusting your search or filters, or log a new time entry."
          action={
            <Button onClick={onNewEntry}>
              <PlusIcon className="h-4 w-4" />
              New entry
            </Button>
          }
        />
      ) : (
        <EntryList
          entries={filtered}
          settings={settings}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
