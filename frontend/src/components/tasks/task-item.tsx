"use client";

import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "DONE") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

export function TaskItem({ task }: { task: Task }) {
  const overdue = isOverdue(task);

  return (
    <li className="group rounded-xl border border-edge bg-surface p-4 transition-colors hover:border-edge-strong">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/tasks/${task.id}`}
            className={`block truncate font-medium text-foreground hover:text-primary ${
              task.status === "DONE" ? "text-muted line-through" : ""
            }`}
          >
            {task.title}
          </Link>
          {task.description && (
            <p className="mt-0.5 truncate text-sm text-muted">{task.description}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs ${overdue ? "font-medium text-danger" : "text-muted"}`}>
              {overdue ? "Overdue · " : "Due "}
              {formatDate(task.dueDate)}
            </span>
          )}
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>
      </div>
    </li>
  );
}
