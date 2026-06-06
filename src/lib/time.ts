// Lightweight date helpers — all operate on local time and avoid extra deps.

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Returns "YYYY-MM-DD" for a Date in local time. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
export function fromDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(r, -diff);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfQuarter(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

/** Format minutes as "Xh Ym" (or "Xh" / "Ym"). */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

/** Format minutes as decimal hours, e.g. 90 -> "1.50". */
export function toDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function formatMoney(amount: number, currency = "$"): string {
  return `${currency}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Friendly label like "Mon, Jun 6". */
export function formatDayLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatRangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const left = `${MONTHS[start.getMonth()]} ${start.getDate()}${
    sameYear ? "" : `, ${start.getFullYear()}`
  }`;
  const right = `${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${left} – ${right}`;
}

export { MONTHS, WEEKDAYS };
