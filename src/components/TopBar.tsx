import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import type { TimerApi } from "../hooks/useTimer";
import { Button } from "./ui";
import {
  CloudIcon,
  GoogleIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
} from "./icons";

function fmtClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TopBar({
  user,
  enabled,
  source,
  syncing,
  onSignIn,
  onSignOut,
  onNewEntry,
  timer,
  onStopTimer,
}: {
  user: User | null;
  enabled: boolean;
  source: "cloud" | "local";
  syncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  timer: TimerApi;
  onStopTimer: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu when clicking anywhere outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur sm:px-6">
      {/* Quick timer */}
      {timer.running ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <div className="hidden sm:block">
            <div className="text-xs text-slate-400">
              {timer.running.task || "Tracking…"}
            </div>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-emerald-300">
            {fmtClock(timer.elapsedSeconds)}
          </span>
          <Button variant="danger" onClick={onStopTimer} className="!px-3 !py-1.5">
            <StopIcon className="h-4 w-4" />
            Stop
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && taskInput.trim()) {
                timer.start({ task: taskInput.trim(), client: "" });
                setTaskInput("");
              }
            }}
            placeholder="What are you working on?"
            className="w-44 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 sm:w-64"
          />
          <Button
            variant="secondary"
            onClick={() => {
              timer.start({ task: taskInput.trim(), client: "" });
              setTaskInput("");
            }}
            title="Start timer"
            className="!px-3"
          >
            <PlayIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Start</span>
          </Button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button onClick={onNewEntry} className="!px-3 sm:!px-4">
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">New entry</span>
        </Button>

        {/* Sync status */}
        <div
          className={`hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium sm:flex ${
            source === "cloud"
              ? "bg-sky-500/10 text-sky-300"
              : "bg-slate-800 text-slate-400"
          }`}
          title={source === "cloud" ? "Synced to the cloud" : "Stored on this device"}
        >
          <CloudIcon className="h-4 w-4" />
          {syncing ? "Syncing…" : source === "cloud" ? "Cloud" : "Local"}
        </div>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 py-1 pl-1 pr-3 hover:bg-slate-700"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-sm text-slate-200 sm:inline">
                {user.displayName ?? user.email}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="truncate text-sm font-medium text-white">
                    {user.displayName}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : enabled ? (
          <Button variant="secondary" onClick={onSignIn}>
            <GoogleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sign in</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
