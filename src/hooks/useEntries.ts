import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, firebaseEnabled } from "../lib/firebase";
import { loadLocalEntries, newId, saveLocalEntries } from "../lib/local";
import type { TimeEntry } from "../lib/types";

export type EntryDraft = Omit<TimeEntry, "id" | "createdAt" | "updatedAt">;

export interface EntriesApi {
  entries: TimeEntry[];
  loading: boolean;
  syncing: boolean;
  source: "cloud" | "local";
  error: string | null;
  clearError: () => void;
  addEntry: (draft: EntryDraft) => Promise<void>;
  updateEntry: (id: string, draft: EntryDraft) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

function entriesCollection(uid: string) {
  if (!db) throw new Error("Firestore not initialized");
  return collection(db, "users", uid, "entries");
}

/** Drop keys whose value is `undefined` so Firestore writes never throw. */
function clean<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

export function useEntries(user: User | null): EntriesApi {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cloud = Boolean(firebaseEnabled && user && db);
  const migratedRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  // ---- Local-only mode ----
  useEffect(() => {
    if (cloud) return;
    setEntries(loadLocalEntries());
    setLoading(false);
  }, [cloud]);

  // ---- Cloud mode: subscribe + one-time migration of local entries ----
  useEffect(() => {
    if (!cloud || !user) return;
    setLoading(true);

    // Migrate any local entries up to the cloud the first time we connect.
    const local = loadLocalEntries();
    if (local.length > 0 && !migratedRef.current) {
      migratedRef.current = true;
      setSyncing(true);
      const batch = writeBatch(db!);
      for (const e of local) {
        batch.set(doc(entriesCollection(user.uid), e.id), clean(e), {
          merge: true,
        });
      }
      batch
        .commit()
        .then(() => saveLocalEntries([]))
        .catch((e) => {
          // Migration failed (e.g. rules not set) — keep the local copy.
          migratedRef.current = false;
          setError(
            `Couldn't sync local entries to the cloud. ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        })
        .finally(() => setSyncing(false));
    }

    const unsub = onSnapshot(
      entriesCollection(user.uid),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as TimeEntry);
        setEntries(list);
        setLoading(false);
      },
      (e) => {
        setLoading(false);
        setError(
          `Couldn't load your cloud entries. Check that Firestore is enabled and the security rules are published. ${e.message}`,
        );
      },
    );
    return unsub;
  }, [cloud, user]);

  const persistLocal = useCallback((next: TimeEntry[]) => {
    setEntries(next);
    saveLocalEntries(next);
  }, []);

  const reportError = useCallback((e: unknown, action: string) => {
    const msg = e instanceof Error ? e.message : String(e);
    setError(`Couldn't ${action}. ${msg}`);
    setSyncing(false);
    // eslint-disable-next-line no-console
    console.error(`Failed to ${action}:`, e);
  }, []);

  const addEntry = useCallback(
    async (draft: EntryDraft) => {
      const now = Date.now();
      const entry: TimeEntry = {
        ...draft,
        id: newId(),
        createdAt: now,
        updatedAt: now,
      };
      if (cloud && user) {
        try {
          setSyncing(true);
          await setDoc(doc(entriesCollection(user.uid), entry.id), clean(entry));
          setSyncing(false);
        } catch (e) {
          reportError(e, "save entry");
        }
      } else {
        persistLocal([entry, ...entries]);
      }
    },
    [cloud, user, entries, persistLocal, reportError],
  );

  const updateEntry = useCallback(
    async (id: string, draft: EntryDraft) => {
      if (cloud && user) {
        const existing = entries.find((e) => e.id === id);
        const merged: TimeEntry = {
          ...draft,
          id,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        try {
          setSyncing(true);
          await setDoc(doc(entriesCollection(user.uid), id), clean(merged));
          setSyncing(false);
        } catch (e) {
          reportError(e, "update entry");
        }
      } else {
        persistLocal(
          entries.map((e) =>
            e.id === id ? { ...e, ...draft, updatedAt: Date.now() } : e,
          ),
        );
      }
    },
    [cloud, user, entries, persistLocal, reportError],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (cloud && user) {
        try {
          setSyncing(true);
          await deleteDoc(doc(entriesCollection(user.uid), id));
          setSyncing(false);
        } catch (e) {
          reportError(e, "delete entry");
        }
      } else {
        persistLocal(entries.filter((e) => e.id !== id));
      }
    },
    [cloud, user, entries, persistLocal, reportError],
  );

  return {
    entries,
    loading,
    syncing,
    source: cloud ? "cloud" : "local",
    error,
    clearError,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
