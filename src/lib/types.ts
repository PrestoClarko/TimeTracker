export interface TimeEntry {
  id: string;
  /** ISO date string for the day the work was performed, e.g. "2026-06-06" */
  date: string;
  /** Client / company you're consulting for */
  client: string;
  /** Project or engagement name */
  project: string;
  /** Short task / ticket title */
  task: string;
  /** Detailed MSP-style work notes */
  notes: string;
  /** Duration in minutes */
  minutes: number;
  /** Whether this time is billable */
  billable: boolean;
  /** Hourly rate in dollars used for billable amount calculations */
  rate: number;
  /** Optional ticket / reference number */
  ticket?: string;
  /** Free-form comma-separated tags */
  tags?: string[];
  /** Epoch millis when created */
  createdAt: number;
  /** Epoch millis when last updated */
  updatedAt: number;
}

export type ReportPeriod =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface UserSettings {
  defaultRate: number;
  defaultBillable: boolean;
  /** ISO currency-ish symbol */
  currency: string;
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn: 0 | 1;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultRate: 100,
  defaultBillable: true,
  currency: "$",
  weekStartsOn: 1,
};
