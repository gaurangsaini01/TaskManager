"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { taskParamsToApiQuery, type TaskListParams } from "@/lib/task-params";
import type { Task, TaskListResponse } from "@/lib/types";

export const PAGE_SIZE = 10;

export const taskKeys = {
  all: ["tasks"] as const,
  list: (params: TaskListParams) => ["tasks", "list", params] as const,
  detail: (id: string) => ["task", id] as const,
};

export function useTasks(params: TaskListParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => apiFetch<TaskListResponse>(`/tasks?${taskParamsToApiQuery(params, PAGE_SIZE)}`),
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiFetch<{ data: Task }>(`/tasks/${id}`).then((res) => res.data),
  });
}
