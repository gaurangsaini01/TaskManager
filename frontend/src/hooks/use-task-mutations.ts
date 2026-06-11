"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
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

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskPayload }) =>
      apiFetch<{ data: Task }>(`/tasks/${id}`, { method: "PATCH", body: input }).then(
        (res) => res.data,
      ),
    onSuccess: (_task, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't update the task");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't delete the task");
    },
  });
}
