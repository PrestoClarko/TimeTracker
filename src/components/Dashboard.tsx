import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeEntry, UserSettings } from "../lib/types";
import {
  aggregate,
  dailySeries,
  entriesInRange,
  getPeriodRange,
  groupBy,
} from "../lib/reports";
import {
  formatDuration,
  formatMoney,
  formatRangeLabel,
  toDecimalHours,
  todayStr,
} from "../lib/time";
import { Card, EmptyState, StatCard, Button } from "./ui";
import { EntryList } from "./EntryList";
import { PlusIcon } from "./icons";

export function Dashboard({
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
  const now = useMemo(() => new Date(), []);

  const weekRange = getPeriodRange("weekly", now, 0, settings.weekStartsOn);
  const weekEntries = entriesInRange(entries, weekRange);
  const weekAgg = aggregate(weekEntries);

  const monthRange = getPeriodRange("monthly", now, 0, settings.weekStartsOn);
  const monthAgg = aggregate(entriesInRange(entries, monthRange));

  const today = todayStr();
  const todayAgg = aggregate(entries.filter((e) => e.date === today));

  const series = dailySeries(weekEntries, weekRange);
  const topClients = groupBy(weekEntries, (e) => e.client || "Unassigned").slice(0, 5);

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <EmptyState
          title="No time logged yet"
          description="Start the timer up top, or add your first entry to begin tracking your IT consulting hours."
          action={
            <Button onClick={onNewEntry}>
              <PlusIcon className="h-4 w-4" />
              Add your first entry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={formatDuration(todayAgg.totalMinutes)}
          sub={`${todayAgg.entryCount} entr${todayAgg.entryCount === 1 ? "y" : "ies"}`}
          accent="sky"
        />
        <StatCard
          label="This Week"
          value={formatDuration(weekAgg.totalMinutes)}
          sub={`${toDecimalHours(weekAgg.totalMinutes)} hrs`}
          accent="indigo"
        />
        <StatCard
          label="Billable (wk)"
          value={formatDuration(weekAgg.billableMinutes)}
          sub={formatMoney(weekAgg.billableAmount, settings.currency)}
          accent="emerald"
        />
        <StatCard
          label="This Month"
          value={formatDuration(monthAgg.totalMinutes)}
          sub={formatMoney(monthAgg.billableAmount, settings.currency)}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">This week</h3>
            <span className="text-xs text-slate-400">
              {formatRangeLabel(weekRange.start, new Date(weekRange.end.getTime() - 1))}
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#1e293b55" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: number, name: string) => [`${v}h`, name === "billable" ? "Billable" : "Total"]}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} name="Billable" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-white">Top clients this week</h3>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-500">No entries this week.</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c) => {
                const pct = weekAgg.totalMinutes
                  ? Math.round((c.totalMinutes / weekAgg.totalMinutes) * 100)
                  : 0;
                return (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate text-slate-200">{c.key}</span>
                      <span className="text-slate-400">{formatDuration(c.totalMinutes)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-white">Recent activity</h3>
        <EntryList
          entries={entries.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 8)}
          settings={settings}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
