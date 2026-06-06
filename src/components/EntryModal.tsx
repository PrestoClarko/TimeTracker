import { useEffect, useMemo, useState } from "react";
import type { EntryDraft } from "../hooks/useEntries";
import type { TimeEntry, UserSettings } from "../lib/types";
import { todayStr } from "../lib/time";
import { Button, Field, inputClass } from "./ui";
import { CloseIcon } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (draft: EntryDraft) => void;
  settings: UserSettings;
  /** Existing entry when editing. */
  initial?: TimeEntry | null;
  /** Distinct clients/projects for datalist autocomplete. */
  clients: string[];
  projects: string[];
  /** Prefill (e.g. from a stopped timer). */
  prefill?: Partial<EntryDraft> | null;
}

type Mode = "duration" | "range";

function minutesToHM(min: number): { h: number; m: number } {
  return { h: Math.floor(min / 60), m: min % 60 };
}

function timeToMinutes(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function EntryModal({
  open,
  onClose,
  onSave,
  settings,
  initial,
  clients,
  projects,
  prefill,
}: Props) {
  const [date, setDate] = useState(todayStr());
  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [task, setTask] = useState("");
  const [ticket, setTicket] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [billable, setBillable] = useState(settings.defaultBillable);
  const [rate, setRate] = useState(settings.defaultRate);
  const [mode, setMode] = useState<Mode>("duration");
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const hm = minutesToHM(initial.minutes);
      setDate(initial.date);
      setClient(initial.client);
      setProject(initial.project);
      setTask(initial.task);
      setTicket(initial.ticket ?? "");
      setNotes(initial.notes);
      setTags((initial.tags ?? []).join(", "));
      setBillable(initial.billable);
      setRate(initial.rate);
      setMode("duration");
      setHours(hm.h);
      setMins(hm.m);
    } else {
      const hm = prefill?.minutes ? minutesToHM(prefill.minutes) : { h: 0, m: 0 };
      setDate(prefill?.date ?? todayStr());
      setClient(prefill?.client ?? "");
      setProject(prefill?.project ?? "");
      setTask(prefill?.task ?? "");
      setTicket(prefill?.ticket ?? "");
      setNotes(prefill?.notes ?? "");
      setTags((prefill?.tags ?? []).join(", "));
      setBillable(prefill?.billable ?? settings.defaultBillable);
      setRate(prefill?.rate ?? settings.defaultRate);
      setMode("duration");
      setHours(hm.h);
      setMins(hm.m);
    }
    setStart("09:00");
    setEnd("10:00");
  }, [open, initial, prefill, settings]);

  const computedMinutes = useMemo(() => {
    if (mode === "range") {
      const s = timeToMinutes(start);
      const e = timeToMinutes(end);
      if (s == null || e == null) return 0;
      return Math.max(0, e - s);
    }
    return hours * 60 + mins;
  }, [mode, hours, mins, start, end]);

  if (!open) return null;

  function submit() {
    if (computedMinutes <= 0 || !task.trim()) return;
    onSave({
      date,
      client: client.trim(),
      project: project.trim(),
      task: task.trim(),
      ticket: ticket.trim() || undefined,
      notes: notes.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      billable,
      rate: Number(rate) || 0,
      minutes: computedMinutes,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">
            {initial ? "Edit time entry" : "New time entry"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Ticket / Ref #" hint="Optional">
              <input
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                placeholder="e.g. INC-1024"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Client">
              <input
                list="client-list"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Acme Corp"
                className={inputClass}
              />
              <datalist id="client-list">
                {clients.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Project / Engagement">
              <input
                list="project-list"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Network Refresh"
                className={inputClass}
              />
              <datalist id="project-list">
                {projects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Task / Summary">
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Configured firewall rules for new VLAN"
              className={inputClass}
            />
          </Field>

          <Field label="Work notes / details">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Detailed log of work performed, troubleshooting steps, outcomes…"
              className={`${inputClass} resize-y`}
            />
          </Field>

          {/* Time entry */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setMode("duration")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  mode === "duration"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Duration
              </button>
              <button
                onClick={() => setMode("range")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  mode === "range"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Start / End
              </button>
              <span className="ml-auto text-sm font-medium text-indigo-300">
                {Math.floor(computedMinutes / 60)}h {computedMinutes % 60}m
              </span>
            </div>

            {mode === "duration" ? (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Hours">
                  <input
                    type="number"
                    min={0}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, +e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Minutes">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={mins}
                    onChange={(e) =>
                      setMins(Math.min(59, Math.max(0, +e.target.value)))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start">
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="End">
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tags" hint="Comma separated">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="onsite, firewall"
                className={inputClass}
              />
            </Field>
            <Field label="Hourly rate">
              <input
                type="number"
                min={0}
                value={rate}
                onChange={(e) => setRate(Math.max(0, +e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 px-4 py-3">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            <div>
              <div className="text-sm font-medium text-slate-200">Billable</div>
              <div className="text-xs text-slate-500">
                Counts toward billable hours &amp; revenue reports
              </div>
            </div>
          </label>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={computedMinutes <= 0 || !task.trim()}
          >
            {initial ? "Save changes" : "Add entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
