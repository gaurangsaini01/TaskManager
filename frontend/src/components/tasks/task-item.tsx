"use client";

import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { useUpdateTask } from "@/hooks/use-task-mutations";
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

export function CompleteToggle({ task, className = "" }: { task: Task; className?: string }) {
  const updateTask = useUpdateTask();
  const done = task.status === "DONE";

  return (
    <button
      aria-label={done ? "Mark as not done" : "Mark as done"}
      title={done ? "Mark as not done" : "Mark as done"}
      onClick={() =>
        updateTask.mutate({ id: task.id, input: { status: done ? "TODO" : "DONE" } })
      }
      className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-edge-strong text-transparent hover:border-emerald-500 hover:text-emerald-500"
      } ${className}`}
    >
      <svg viewBox="0 0 16 16" className="size-3.5 fill-current" aria-hidden="true">
        <path d="M12.78 4.22a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06l1.97 1.97 4.97-4.97a.75.75 0 011.06 0z" />
      </svg>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
        danger ? "text-muted hover:bg-danger-soft hover:text-danger" : "text-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const overdue = isOverdue(task);

  return (
    <li className="group rounded-xl border border-edge bg-surface p-4 transition-colors hover:border-edge-strong">
      <div className="flex items-start gap-3">
        <CompleteToggle task={task} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/tasks/${task.id}`}
                className={`block truncate font-medium hover:text-primary ${
                  task.status === "DONE" ? "text-muted line-through" : "text-foreground"
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
        </div>

        <div className="flex shrink-0 items-center">
          <IconButton label="Edit task" onClick={() => onEdit(task)}>
            <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.793 8.793a1 1 0 01-.44.255l-3.182.91a.5.5 0 01-.618-.619l.91-3.181a1 1 0 01.255-.44l8.793-8.793.247.247z" />
            </svg>
          </IconButton>
          <IconButton label="Delete task" danger onClick={() => onDelete(task)}>
            <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443l-2.722.36a.75.75 0 10.194 1.487l.493-.066.738 9.96A2.75 2.75 0 007.444 18.5h5.112a2.75 2.75 0 002.741-2.566l.738-9.96.493.066a.75.75 0 10.194-1.487L14 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4.5c.84 0 1.673.025 2.5.075V3.75a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 007.5 3.75v.825c.827-.05 1.66-.075 2.5-.075zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clipRule="evenodd"
              />
            </svg>
          </IconButton>
        </div>
      </div>
    </li>
  );
}
