import { useCallback, useEffect, useState } from "react";

const TIMER_KEY = "tt.timer.v1";

interface RunningTimer {
  startedAt: number;
  task: string;
  client: string;
}

function load(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? (JSON.parse(raw) as RunningTimer) : null;
  } catch {
    return null;
  }
}

export interface TimerApi {
  running: RunningTimer | null;
  elapsedSeconds: number;
  start: (info: { task: string; client: string }) => void;
  stop: () => { minutes: number; task: string; client: string } | null;
  cancel: () => void;
}

export function useTimer(): TimerApi {
  const [running, setRunning] = useState<RunningTimer | null>(load);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback((info: { task: string; client: string }) => {
    const t: RunningTimer = { startedAt: Date.now(), ...info };
    localStorage.setItem(TIMER_KEY, JSON.stringify(t));
    setRunning(t);
    setNow(Date.now());
  }, []);

  const stop = useCallback(() => {
    if (!running) return null;
    const minutes = Math.max(
      1,
      Math.round((Date.now() - running.startedAt) / 60000),
    );
    localStorage.removeItem(TIMER_KEY);
    const result = { minutes, task: running.task, client: running.client };
    setRunning(null);
    return result;
  }, [running]);

  const cancel = useCallback(() => {
    localStorage.removeItem(TIMER_KEY);
    setRunning(null);
  }, []);

  const elapsedSeconds = running
    ? Math.floor((now - running.startedAt) / 1000)
    : 0;

  return { running, elapsedSeconds, start, stop, cancel };
}
