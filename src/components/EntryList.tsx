import type { TimeEntry, UserSettings } from "../lib/types";
import { formatDuration, formatMoney, fromDateStr, formatDayLabel } from "../lib/time";
import { Badge } from "./ui";
import { EditIcon, TrashIcon } from "./icons";

export function EntryList({
  entries,
  settings,
  onEdit,
  onDelete,
}: {
  entries: TimeEntry[];
  settings: UserSettings;
  onEdit: (e: TimeEntry) => void;
  onDelete: (id: string) => void;
}) {
  // Group entries by date (descending).
  const groups = new Map<string, TimeEntry[]>();
  for (const e of [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)) {
    const arr = groups.get(e.date);
    if (arr) arr.push(e);
    else groups.set(e.date, [e]);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([date, list]) => {
        const dayMinutes = list.reduce((s, e) => s + e.minutes, 0);
        return (
          <div key={date}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-300">
                {formatDayLabel(fromDateStr(date))}
              </h3>
              <span className="text-xs font-medium text-slate-500">
                {formatDuration(dayMinutes)}
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
              {list.map((e, i) => (
                <div
                  key={e.id}
                  className={`group flex items-start gap-3 px-4 py-3.5 transition hover:bg-slate-800/40 ${
                    i > 0 ? "border-t border-slate-800/70" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-100">
                        {e.task || "(no summary)"}
                      </span>
                      {e.ticket && <Badge tone="indigo">#{e.ticket}</Badge>}
                      {e.billable ? (
                        <Badge tone="emerald">Billable</Badge>
                      ) : (
                        <Badge tone="slate">Non-billable</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                      {(e.client || e.project) && (
                        <span className="text-slate-300">
                          {[e.client, e.project].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {e.tags && e.tags.length > 0 && (
                        <span className="text-slate-500">
                          {e.tags.map((t) => `#${t}`).join(" ")}
                        </span>
                      )}
                    </div>
                    {e.notes && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {e.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-slate-100">
                      {formatDuration(e.minutes)}
                    </span>
                    {e.billable && e.rate > 0 && (
                      <span className="text-xs text-emerald-400/80">
                        {formatMoney((e.minutes / 60) * e.rate, settings.currency)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => onEdit(e)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                      title="Edit"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-600/20 hover:text-rose-300"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
