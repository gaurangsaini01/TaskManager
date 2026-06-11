"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Attachment } from "@/lib/types";

export const attachmentKeys = {
  forTask: (taskId: string) => ["attachments", taskId] as const,
};

export function useTaskAttachments(taskId: string) {
  return useQuery({
    queryKey: attachmentKeys.forTask(taskId),
    queryFn: () =>
      apiFetch<{ data: Attachment[] }>(`/tasks/${taskId}/attachments`).then((res) => res.data),
  });
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<{ data: Attachment }>(`/tasks/${taskId}/attachments`, {
        method: "POST",
        body: form,
      }).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.forTask(taskId) });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
      toast.success("Attachment uploaded");
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't upload the file");
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      apiFetch<void>(`/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.forTask(taskId) });
      queryClient.invalidateQueries({ queryKey: ["activity", taskId] });
      toast.success("Attachment removed");
    },
    onError: (error) => {
      toast.error(error.message || "Couldn't remove the attachment");
    },
  });
}
