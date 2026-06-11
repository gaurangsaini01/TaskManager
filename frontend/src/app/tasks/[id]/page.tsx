"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TaskActivity } from "@/components/tasks/task-activity";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { CompleteToggle, formatDate, isOverdue } from "@/components/tasks/task-item";
import { TaskForm } from "@/components/tasks/task-form";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { useDeleteTask } from "@/hooks/use-task-mutations";
import { useTask } from "@/hooks/use-tasks";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function TaskDetailSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-edge bg-surface p-6" aria-hidden="true">
      <div className="h-6 w-2/3 rounded bg-surface-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-surface-muted" />
        <div className="h-5 w-16 rounded-full bg-surface-muted" />
      </div>
      <div className="mt-6 h-4 w-full rounded bg-surface-muted" />
      <div className="mt-2 h-4 w-3/4 rounded bg-surface-muted" />
    </div>
  );
}

function TaskDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: task, isPending, isError, error, refetch } = useTask(id);
  const deleteTask = useDeleteTask();

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isPending) {
    return <TaskDetailSkeleton />;
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div role="alert" className="rounded-xl border border-edge bg-surface px-6 py-12 text-center">
        <h2 className="font-medium text-foreground">
          {notFound ? "Task not found" : "Couldn't load this task"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {notFound
            ? "It may have been deleted, or the link is wrong."
            : error instanceof Error
              ? error.message
              : "Something went wrong."}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {!notFound && (
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => router.push("/tasks")}>
            Back to tasks
          </Button>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(task);
  const isOwn = !user || task.userId === user.id;

  return (
    <>
      <div className="rounded-xl border border-edge bg-surface p-6">
        <div className="flex items-start gap-3">
          {isOwn && <CompleteToggle task={task} className="mt-1" />}
          <div className="min-w-0 flex-1">
            <h1
              className={`text-xl font-semibold ${
                task.status === "DONE" ? "text-muted line-through" : "text-foreground"
              }`}
            >
              {task.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span className={`text-xs ${overdue ? "font-medium text-danger" : "text-muted"}`}>
                  {overdue ? "Overdue · " : "Due "}
                  {formatDate(task.dueDate)}
                </span>
              )}
              {!isOwn && task.owner && (
                <span className="text-xs text-muted">
                  Owned by <span className="font-medium text-foreground">{task.owner.email}</span>
                </span>
              )}
            </div>
          </div>
          {isOwn && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>

        {task.description && (
          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {task.description}
          </p>
        )}

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-1 border-t border-edge pt-4 text-xs text-muted">
          <div className="flex gap-1">
            <dt>Created</dt>
            <dd>{formatDate(task.createdAt)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Last updated</dt>
            <dd>{formatDate(task.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <TaskAttachments taskId={task.id} canEdit={isOwn} />
      </div>

      <div className="mt-4">
        <TaskActivity taskId={task.id} />
      </div>

      <Modal open={editing} title="Edit task" onClose={() => setEditing(false)}>
        {editing && <TaskForm task={task} onDone={() => setEditing(false)} />}
      </Modal>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete task?"
        description={`"${task.title}" will be permanently deleted. This cannot be undone.`}
        isLoading={deleteTask.isPending}
        onConfirm={() =>
          deleteTask.mutate(task.id, {
            onSuccess: () => {
              toast.success("Task deleted");
              router.push("/tasks");
            },
            onError: () => setConfirmingDelete(false),
          })
        }
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}

export default function TaskDetailPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/tasks"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.78 4.22a.75.75 0 010 1.06L8.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to tasks
        </Link>
        <TaskDetailContent />
      </main>
  );
}
