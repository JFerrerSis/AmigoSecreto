"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LocalUser } from "@/lib/types";

const USER_CACHE_KEY = "amigo-secreto:user";

interface ProfileInput {
  intent: "login" | "create";
  fullName?: string;
  email: string;
  website?: string;
}

interface LocalUserContextValue {
  user: LocalUser | null;
  loading: boolean;
  saving: boolean;
  saveProfile: (input: ProfileInput) => Promise<LocalUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const LocalUserContext = createContext<LocalUserContextValue | null>(null);

function readCachedUser(): LocalUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LocalUser;
    if (!parsed?.id || !parsed?.full_name) return null;

    return parsed;
  } catch {
    return null;
  }
}

function cacheUser(user: LocalUser | null) {
  if (typeof window === "undefined") return;

  try {
    if (user) {
      window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {
    return;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "No pudimos completar la operación.");
  }

  return payload as T;
}

export function LocalUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = await readJson<{ user: LocalUser | null }>(response);
      setUser(payload.user);
      cacheUser(payload.user);
    } catch {
      setUser(null);
      cacheUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readCachedUser();

    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    void refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (input: ProfileInput) => {
    setSaving(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(input),
      });
      const payload = await readJson<{ user: LocalUser }>(response);
      setUser(payload.user);
      cacheUser(payload.user);
      setLoading(false);
      return payload.user;
    } finally {
      setSaving(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/session", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined);
    setUser(null);
    cacheUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, saving, saveProfile, signOut, refresh }),
    [user, loading, saving, saveProfile, signOut, refresh],
  );

  return (
    <LocalUserContext.Provider value={value}>
      {children}
    </LocalUserContext.Provider>
  );
}

export function useLocalUser() {
  const context = useContext(LocalUserContext);

  if (!context) {
    throw new Error("useLocalUser debe usarse dentro de LocalUserProvider.");
  }

  return context;
}
