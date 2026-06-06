import type { ReactNode } from "react";
import {
  ChartIcon,
  ClockIcon,
  DashboardIcon,
  ListIcon,
  SettingsIcon,
} from "./icons";

export type View = "dashboard" | "entries" | "reports" | "settings";

const items: { id: View; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "entries", label: "Time Entries", icon: <ListIcon /> },
  { id: "reports", label: "Reports", icon: <ChartIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

export function Sidebar({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/40 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <ClockIcon />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight text-white">
              TimeTracker
            </div>
            <div className="text-xs text-slate-500">MSP time logging</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                view === it.id
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-800 bg-slate-900/95 px-2 py-1.5 backdrop-blur md:hidden">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition ${
              view === it.id ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            {it.icon}
            {it.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </>
  );
}
