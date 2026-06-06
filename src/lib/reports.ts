import type { ReportPeriod, TimeEntry } from "./types";
import {
  addDays,
  fromDateStr,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  toDateStr,
} from "./time";

export interface PeriodRange {
  start: Date;
  /** Exclusive end (first instant of next period). */
  end: Date;
}

/**
 * Returns the [start, end) range for the period that contains `anchor`,
 * shifted by `offset` periods (negative = past, positive = future).
 */
export function getPeriodRange(
  period: ReportPeriod,
  anchor: Date,
  offset: number,
  weekStartsOn: 0 | 1 = 1,
): PeriodRange {
  switch (period) {
    case "weekly": {
      const start = addDays(startOfWeek(anchor, weekStartsOn), offset * 7);
      return { start, end: addDays(start, 7) };
    }
    case "biweekly": {
      // Anchor biweekly periods to a fixed epoch so they're stable.
      const epoch = startOfWeek(new Date(2000, 0, 3), weekStartsOn); // a Monday
      const ws = startOfWeek(anchor, weekStartsOn);
      const weeks = Math.round(
        (ws.getTime() - epoch.getTime()) / (7 * 86400000),
      );
      const periodIndex = Math.floor(weeks / 2) + offset;
      const start = addDays(epoch, periodIndex * 14);
      return { start, end: addDays(start, 14) };
    }
    case "monthly": {
      const s = startOfMonth(anchor);
      const start = new Date(s.getFullYear(), s.getMonth() + offset, 1);
      const end = new Date(s.getFullYear(), s.getMonth() + offset + 1, 1);
      return { start, end };
    }
    case "quarterly": {
      const s = startOfQuarter(anchor);
      const start = new Date(s.getFullYear(), s.getMonth() + offset * 3, 1);
      const end = new Date(s.getFullYear(), s.getMonth() + offset * 3 + 3, 1);
      return { start, end };
    }
    case "yearly": {
      const s = startOfYear(anchor);
      const start = new Date(s.getFullYear() + offset, 0, 1);
      const end = new Date(s.getFullYear() + offset + 1, 0, 1);
      return { start, end };
    }
  }
}

export function entriesInRange(
  entries: TimeEntry[],
  range: PeriodRange,
): TimeEntry[] {
  const startStr = toDateStr(range.start);
  const endStr = toDateStr(range.end);
  return entries.filter((e) => e.date >= startStr && e.date < endStr);
}

export interface Aggregate {
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  billableAmount: number;
  entryCount: number;
}

export function aggregate(entries: TimeEntry[]): Aggregate {
  let totalMinutes = 0;
  let billableMinutes = 0;
  let billableAmount = 0;
  for (const e of entries) {
    totalMinutes += e.minutes;
    if (e.billable) {
      billableMinutes += e.minutes;
      billableAmount += (e.minutes / 60) * e.rate;
    }
  }
  return {
    totalMinutes,
    billableMinutes,
    nonBillableMinutes: totalMinutes - billableMinutes,
    billableAmount,
    entryCount: entries.length,
  };
}

export interface GroupBucket extends Aggregate {
  key: string;
}

export function groupBy(
  entries: TimeEntry[],
  selector: (e: TimeEntry) => string,
): GroupBucket[] {
  const map = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const key = selector(e) || "—";
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries())
    .map(([key, list]) => ({ key, ...aggregate(list) }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/** Per-day totals across a range, useful for charts. */
export function dailySeries(
  entries: TimeEntry[],
  range: PeriodRange,
): { date: string; label: string; hours: number; billable: number }[] {
  const days: { date: string; label: string; hours: number; billable: number }[] =
    [];
  const byDate = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const arr = byDate.get(e.date);
    if (arr) arr.push(e);
    else byDate.set(e.date, [e]);
  }
  let cursor = new Date(range.start);
  // Cap chart granularity: for long ranges, fall back to per-day still but
  // callers may choose monthly grouping instead.
  while (cursor < range.end) {
    const ds = toDateStr(cursor);
    const list = byDate.get(ds) ?? [];
    const agg = aggregate(list);
    days.push({
      date: ds,
      label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      hours: +(agg.totalMinutes / 60).toFixed(2),
      billable: +(agg.billableMinutes / 60).toFixed(2),
    });
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Monthly totals across a range, for quarterly/yearly charts. */
export function monthlySeries(
  entries: TimeEntry[],
  range: PeriodRange,
): { label: string; hours: number; billable: number }[] {
  const buckets = new Map<string, TimeEntry[]>();
  for (const e of entries) {
    const d = fromDateStr(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const arr = buckets.get(key);
    if (arr) arr.push(e);
    else buckets.set(key, [e]);
  }
  const out: { label: string; hours: number; billable: number }[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  while (cursor < range.end) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    const list = buckets.get(key) ?? [];
    const agg = aggregate(list);
    out.push({
      label: months[cursor.getMonth()],
      hours: +(agg.totalMinutes / 60).toFixed(2),
      billable: +(agg.billableMinutes / 60).toFixed(2),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return out;
}

export function entriesToCsv(entries: TimeEntry[]): string {
  const header = [
    "Date",
    "Client",
    "Project",
    "Task",
    "Ticket",
    "Notes",
    "Hours",
    "Billable",
    "Rate",
    "Amount",
  ];
  const rows = entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const hours = (e.minutes / 60).toFixed(2);
      const amount = e.billable ? ((e.minutes / 60) * e.rate).toFixed(2) : "0.00";
      return [
        e.date,
        e.client,
        e.project,
        e.task,
        e.ticket ?? "",
        e.notes,
        hours,
        e.billable ? "Yes" : "No",
        e.rate.toFixed(2),
        amount,
      ];
    });
  return [header, ...rows]
    .map((cols) => cols.map(csvCell).join(","))
    .join("\r\n");
}

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
