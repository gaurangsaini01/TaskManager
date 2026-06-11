"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Task, TaskListResponse, TaskPriority, TaskStatus } from "@/lib/types";
import { taskKeys } from "./use-tasks";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

type ListSnapshot = [readonly unknown[], TaskListResponse | undefined][];

function applyTaskPatch(task: Task, input: UpdateTaskPayload): Task {
  return {
    ...task,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.dueDate !== undefined
      ? { dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null }
      : {}),
    updatedAt: new Date().toISOString(),
  };
}

function restoreListSnapshots(queryClient: QueryClient, snapshots: ListSnapshot) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskPayload) =>
      apiFetch<{ data: Task }>("/tasks", { method: "POST", body: input }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't create the task");
    },
  });
}

/**
 * Optimistic update: every cached task list (any filter/sort/page — prefix
 * match on the key) plus the detail entry is patched immediately; on failure
 * the snapshots are restored and the user is told.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskPayload }) =>
      apiFetch<{ data: Task }>(`/tasks/${id}`, { method: "PATCH", body: input }).then(
        (res) => res.data,
      ),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      const listSnapshots: ListSnapshot = queryClient.getQueriesData<TaskListResponse>({
        queryKey: taskKeys.all,
      });
      const detailSnapshot = queryClient.getQueryData<Task>(taskKeys.detail(id));

      queryClient.setQueriesData<TaskListResponse>({ queryKey: taskKeys.all }, (old) =>
        old
          ? { ...old, data: old.data.map((t) => (t.id === id ? applyTaskPatch(t, input) : t)) }
          : old,
      );
      if (detailSnapshot) {
        queryClient.setQueryData(taskKeys.detail(id), applyTaskPatch(detailSnapshot, input));
      }

      return { listSnapshots, detailSnapshot };
    },
    onError: (error, { id }, context) => {
      if (context) {
        restoreListSnapshots(queryClient, context.listSnapshots);
        if (context.detailSnapshot) {
          queryClient.setQueryData(taskKeys.detail(id), context.detailSnapshot);
        }
      }
      toast.error(`${error.message || "Couldn't update the task"} — changes were rolled back`);
    },
    onSettled: (_task, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

/** Optimistic delete: the row disappears immediately and returns on failure. */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const listSnapshots: ListSnapshot = queryClient.getQueriesData<TaskListResponse>({
        queryKey: taskKeys.all,
      });

      queryClient.setQueriesData<TaskListResponse>({ queryKey: taskKeys.all }, (old) =>
        old
          ? {
              ...old,
              data: old.data.filter((t) => t.id !== id),
              meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
            }
          : old,
      );

      return { listSnapshots };
    },
    onError: (error, _id, context) => {
      if (context) {
        restoreListSnapshots(queryClient, context.listSnapshots);
      }
      toast.error(`${error.message || "Couldn't delete the task"} — the task was restored`);
    },
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
