"use client";

import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";
import { TaskItem } from "./task-item";

export function TaskListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="animate-pulse rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 w-1/3 rounded bg-surface-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-surface-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-14 rounded-full bg-surface-muted" />
              <div className="h-5 w-14 rounded-full bg-surface-muted" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-edge-strong bg-surface px-6 py-14 text-center">
      <svg viewBox="0 0 24 24" className="size-10 stroke-muted" fill="none" strokeWidth="1.5" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      {hasActiveFilters ? (
        <>
          <h2 className="mt-3 font-medium text-foreground">No tasks match</h2>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Nothing matches the current search and filters.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={onClearFilters}>
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-medium text-foreground">No tasks yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Your list is empty. Created tasks show up here.
          </p>
        </>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-xl border border-danger/30 bg-danger-soft px-6 py-12 text-center"
    >
      <h2 className="font-medium text-danger">Couldn&apos;t load tasks</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}
