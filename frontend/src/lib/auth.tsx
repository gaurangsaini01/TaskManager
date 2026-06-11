"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, clearStoredToken, getStoredToken, setStoredToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  /** false until the stored token has been checked — render nothing auth-dependent before this */
  isReady: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Restore the session from localStorage on first mount (client-only)
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsReady(true);
      return;
    }
    apiFetch<{ user: User }>("/auth/me", { skipAuthRedirect: true })
      .then((res) => setUser(res.user))
      .catch(() => clearStoredToken())
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuthRedirect: true,
    });
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const res = await apiFetch<{ user: User; token: string }>("/auth/signup", {
      method: "POST",
      body: { email, password, ...(name ? { name } : {}) },
      skipAuthRedirect: true,
    });
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  const value = useMemo(
    () => ({ isReady, user, login, signup, logout }),
    [isReady, user, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
