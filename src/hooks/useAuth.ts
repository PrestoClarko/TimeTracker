import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, firebaseEnabled, googleProvider } from "../lib/firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
  enabled: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(firebaseEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn() {
    if (!firebaseEnabled || !auth) {
      setError("Cloud sync is not configured. Running in local-only mode.");
      return;
    }
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      // Don't surface user-cancelled popups as errors.
      if (!/popup-closed|cancelled-popup/i.test(msg)) setError(msg);
    }
  }

  async function signOut() {
    if (auth) await fbSignOut(auth);
  }

  return {
    user,
    loading,
    enabled: firebaseEnabled,
    signIn,
    signOut,
    error,
  };
}
