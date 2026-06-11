"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { useTaskEvents } from "@/hooks/use-task-events";

/** Mounted once inside the guard so the SSE stream opens only when logged in. */
function TaskEventsBridge() {
  useTaskEvents();
  return null;
}

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <Navbar />
      <TaskEventsBridge />
      {children}
    </AuthGuard>
  );
}
