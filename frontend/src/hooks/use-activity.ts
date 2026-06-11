"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Activity } from "@/lib/types";

export const activityKeys = {
  forTask: (taskId: string) => ["activity", taskId] as const,
};

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: activityKeys.forTask(taskId),
    queryFn: () =>
      apiFetch<{ data: Activity[] }>(`/tasks/${taskId}/activity`).then((res) => res.data),
  });
}
