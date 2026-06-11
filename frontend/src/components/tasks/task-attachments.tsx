"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useDeleteAttachment,
  useTaskAttachments,
  useUploadAttachment,
} from "@/hooks/use-attachments";
import type { Attachment } from "@/lib/types";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/gif,image/webp,application/pdf,.docx";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === "application/pdf";
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
        isPdf ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-primary-soft text-primary"
      }`}
    >
      {isPdf ? "PDF" : "DOC"}
    </span>
  );
}

export function TaskAttachments({ taskId, canEdit }: { taskId: string; canEdit: boolean }) {
  const { data: attachments, isPending, isError } = useTaskAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  function handleFileChosen(file: File | undefined) {
    setSizeError(null);
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
      setSizeError(`"${file.name}" is ${formatBytes(file.size)} — the limit is 5 MB.`);
      return;
    }
    upload.mutate(file);
  }

  return (
    <section className="rounded-xl border border-edge bg-surface p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">Attachments</h2>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleFileChosen(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              isLoading={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              Upload file
            </Button>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">Images, PDF or DOCX — up to 5 MB.</p>

      {sizeError && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          {sizeError}
        </p>
      )}

      {isPending ? (
        <div className="mt-4 flex animate-pulse items-center gap-3" aria-hidden="true">
          <div className="size-10 rounded-lg bg-surface-muted" />
          <div className="h-3 w-1/3 rounded bg-surface-muted" />
        </div>
      ) : isError ? (
        <p className="mt-4 text-sm text-muted">Couldn&apos;t load attachments.</p>
      ) : !attachments || attachments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No attachments yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-3 rounded-lg border border-edge p-2.5"
            >
              {attachment.resourceType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary thumbnail
                <img
                  src={attachment.url}
                  alt={attachment.originalName}
                  className="size-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <FileIcon mimeType={attachment.mimeType} />
              )}

              <div className="min-w-0 flex-1">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-foreground hover:text-primary"
                  title={attachment.originalName}
                >
                  {attachment.originalName}
                </a>
                <p className="text-xs text-muted">{formatBytes(attachment.sizeBytes)}</p>
              </div>

              {canEdit && (
                <button
                  aria-label={`Remove ${attachment.originalName}`}
                  onClick={() => setDeleting(attachment)}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443l-2.722.36a.75.75 0 10.194 1.487l.493-.066.738 9.96A2.75 2.75 0 007.444 18.5h5.112a2.75 2.75 0 002.741-2.566l.738-9.96.493.066a.75.75 0 10.194-1.487L14 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4.5c.84 0 1.673.025 2.5.075V3.75a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 007.5 3.75v.825c.827-.05 1.66-.075 2.5-.075z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove attachment?"
        description={`"${deleting?.originalName ?? ""}" will be deleted from this task.`}
        confirmLabel="Remove"
        isLoading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, { onSettled: () => setDeleting(null) });
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
