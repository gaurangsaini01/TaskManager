"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_URL, getStoredToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { taskKeys } from "./use-tasks";

interface TaskEvent {
  type: "task.created" | "task.updated" | "task.deleted";
  taskId: string;
}

/**
 * Subscribes to the server-sent event stream and invalidates the affected
 * query caches, so task changes made elsewhere (another tab, another user,
 * an admin) appear live. Reconnects with exponential backoff — browsers
 * don't reliably auto-retry, especially on non-2xx responses.
 */
export function useTaskEvents() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1_000;
    let stopped = false;

    const connect = () => {
      const token = getStoredToken();
      if (!token || stopped) return;

      source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);

      source.onopen = () => {
        retryDelay = 1_000;
      };

      source.onmessage = (e) => {
        let event: TaskEvent;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        queryClient.invalidateQueries({ queryKey: taskKeys.all });
        if (event.taskId) {
          queryClient.invalidateQueries({ queryKey: taskKeys.detail(event.taskId) });
          queryClient.invalidateQueries({ queryKey: ["activity", event.taskId] });
        }
      };

      source.onerror = () => {
        source?.close();
        if (stopped) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15_000);
      };
    };

    connect();

    return () => {
      stopped = true;
      source?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [userId, queryClient]);
}
