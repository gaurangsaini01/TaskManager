"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/tasks" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            T
          </span>
          TaskManager
        </Link>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted sm:block" title={user.email}>
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
