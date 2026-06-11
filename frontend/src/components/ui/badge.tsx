import type { ReactNode } from "react";
import { PRIORITY_LABELS, STATUS_LABELS, type TaskPriority, type TaskStatus } from "@/lib/types";

export function Badge({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_CLASSES: Record<TaskStatus, string> = {
  TODO: "bg-surface-muted text-muted",
  IN_PROGRESS: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>;
}

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  LOW: "bg-surface-muted text-muted",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge className={PRIORITY_CLASSES[priority]}>
      {priority === "HIGH" && (
        <svg viewBox="0 0 12 12" className="size-2.5 fill-current" aria-hidden="true">
          <path d="M6 1l5 9H1z" />
        </svg>
      )}
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
