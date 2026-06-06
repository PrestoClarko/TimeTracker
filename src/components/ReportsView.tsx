import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportPeriod, TimeEntry, UserSettings } from "../lib/types";
import {
  aggregate,
  dailySeries,
  entriesInRange,
  entriesToCsv,
  getPeriodRange,
  groupBy,
  monthlySeries,
} from "../lib/reports";
import {
  formatDuration,
  formatMoney,
  formatRangeLabel,
  toDecimalHours,
} from "../lib/time";
import { Button, Card, StatCard } from "./ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
} from "./icons";

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

const PIE_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e",
  "#a855f7", "#14b8a6", "#eab308", "#ec4899", "#64748b",
];

function downloadCsv(entries: TimeEntry[], label: string) {
  const blob = new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsView({
  entries,
  settings,
}: {
  entries: TimeEntry[];
  settings: UserSettings;
}) {
  const [period, setPeriod] = useState<ReportPeriod>("weekly");
  const [offset, setOffset] = useState(0);
  const now = useMemo(() => new Date(), []);

  const range = getPeriodRange(period, now, offset, settings.weekStartsOn);
  const periodEntries = entriesInRange(entries, range);
  const agg = aggregate(periodEntries);

  const useMonthly = period === "quarterly" || period === "yearly";
  const chartData = useMonthly
    ? monthlySeries(periodEntries, range)
    : dailySeries(periodEntries, range);

  const byClient = groupBy(periodEntries, (e) => e.client || "Unassigned");
  const byProject = groupBy(periodEntries, (e) => e.project || "Unassigned");

  const rangeLabel = formatRangeLabel(
    range.start,
    new Date(range.end.getTime() - 1),
  );
  const avgPerDay = (() => {
    const days = Math.round((range.end.getTime() - range.start.getTime()) / 86400000);
    return days > 0 ? agg.totalMinutes / days : 0;
  })();

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id);
                setOffset(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                period === p.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="min-w-[180px] text-center text-sm font-medium text-slate-200">
            {rangeLabel}
          </div>
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          {offset !== 0 && (
            <Button variant="ghost" onClick={() => setOffset(0)} className="!px-2">
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total time"
          value={formatDuration(agg.totalMinutes)}
          sub={`${toDecimalHours(agg.totalMinutes)} hrs · ${agg.entryCount} entries`}
          accent="indigo"
        />
        <StatCard
          label="Billable time"
          value={formatDuration(agg.billableMinutes)}
          sub={`${
            agg.totalMinutes
              ? Math.round((agg.billableMinutes / agg.totalMinutes) * 100)
              : 0
          }% of total`}
          accent="emerald"
        />
        <StatCard
          label="Billable amount"
          value={formatMoney(agg.billableAmount, settings.currency)}
          sub="At configured rates"
          accent="amber"
        />
        <StatCard
          label="Avg / day"
          value={formatDuration(avgPerDay)}
          sub="Across the period"
          accent="sky"
        />
      </div>

      {/* Trend chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {useMonthly ? "Monthly" : "Daily"} breakdown
          </h3>
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(periodEntries, `${period}-${rangeLabel.replace(/[ ,]+/g, "-")}`)
            }
            disabled={periodEntries.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
        {periodEntries.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            No time logged in this period.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#1e293b55" }}
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: number, name: string) => [`${v}h`, name]}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="billable" fill="#10b981" radius={[4, 4, 0, 0]} name="Billable" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="By client"
          buckets={byClient}
          total={agg.totalMinutes}
          settings={settings}
          showPie
        />
        <BreakdownCard
          title="By project"
          buckets={byProject}
          total={agg.totalMinutes}
          settings={settings}
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  buckets,
  total,
  settings,
  showPie = false,
}: {
  title: string;
  buckets: ReturnType<typeof groupBy>;
  total: number;
  settings: UserSettings;
  showPie?: boolean;
}) {
  const pieData = buckets.slice(0, 10).map((b) => ({
    name: b.key,
    value: +(b.totalMinutes / 60).toFixed(2),
  }));

  return (
    <Card className="p-5">
      <h3 className="mb-4 font-semibold text-white">{title}</h3>
      {buckets.length === 0 ? (
        <p className="text-sm text-slate-500">No data for this period.</p>
      ) : (
        <div className={showPie ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : ""}>
          {showPie && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v}h`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-2.5">
            {buckets.slice(0, 8).map((b, i) => {
              const pct = total ? Math.round((b.totalMinutes / total) * 100) : 0;
              return (
                <div key={b.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate text-slate-200">{b.key}</span>
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {formatDuration(b.totalMinutes)}
                      {b.billableAmount > 0 && (
                        <span className="ml-2 text-emerald-400/80">
                          {formatMoney(b.billableAmount, settings.currency)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
