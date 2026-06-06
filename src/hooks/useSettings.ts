import { useCallback, useEffect, useState } from "react";
import { loadSettings, saveSettings } from "../lib/local";
import type { UserSettings } from "../lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const update = useCallback((patch: Partial<UserSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  return { settings, update };
}
