"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { FullPageSpinner } from "./ui/spinner";

/**
 * Client-side guard for authenticated pages. The token lives in localStorage,
 * which the server can't see, so guarding happens after hydration — the brief
 * spinner is the accepted tradeoff (documented in the README).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return <FullPageSpinner />;
  }

  return <>{children}</>;
}
