"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskForm } from "@/components/tasks/task-form";
import { EmptyState, ErrorState, TaskList, TaskListSkeleton } from "@/components/tasks/task-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useDeleteTask } from "@/hooks/use-task-mutations";
import { useTasks } from "@/hooks/use-tasks";
import {
  parseTaskParams,
  taskParamsToSearch,
  type TaskListParams,
} from "@/lib/task-params";
import { useAuth } from "@/lib/auth";
import type { Task } from "@/lib/types";

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseTaskParams(searchParams);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const allScope = isAdmin && params.scope === "all";

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTasks(params);
  const deleteTask = useDeleteTask();

  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const applyParams = useCallback(
    (patch: Partial<TaskListParams>) => {
      const next = { ...params, ...patch };
      // Any change other than the page itself starts back at page 1
      if (!("page" in patch)) {
        next.page = 1;
      }
      const qs = taskParamsToSearch(next);
      router.replace(qs ? `/tasks?${qs}` : "/tasks", { scroll: false });
    },
    [params, router],
  );

  const hasActiveFilters = Boolean(params.status || params.search);

  function confirmDelete() {
    if (!deletingTask) return;
    deleteTask.mutate(deletingTask.id, {
      onSuccess: () => {
        toast.success("Task deleted");
        setDeletingTask(null);
      },
      onError: () => setDeletingTask(null),
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            {allScope ? "All users' tasks" : "Your tasks"}
          </h1>
          {isAdmin && (
            <div className="flex rounded-lg border border-edge bg-surface p-0.5 text-xs font-medium">
              <button
                onClick={() => applyParams({ scope: undefined })}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${
                  !allScope ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                Mine
              </button>
              <button
                onClick={() => applyParams({ scope: "all" })}
                className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${
                  allScope ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                All users
              </button>
            </div>
          )}
        </div>
        <Button onClick={() => setCreating(true)}>
          <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          New task
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <TaskFilters params={params} onChange={applyParams} />

        {isPending ? (
          <TaskListSkeleton />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Something went wrong."}
            onRetry={() => refetch()}
          />
        ) : data && data.data.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => applyParams({ status: undefined, search: undefined })}
            onCreate={() => setCreating(true)}
          />
        ) : data ? (
          <div className={`flex flex-col gap-4 ${isPlaceholderData ? "opacity-60" : ""}`}>
            <TaskList tasks={data.data} onEdit={setEditingTask} onDelete={setDeletingTask} />
            <Pagination meta={data.meta} onPageChange={(page) => applyParams({ page })} />
          </div>
        ) : null}
      </div>

      <Modal open={creating} title="New task" onClose={() => setCreating(false)}>
        <TaskForm onDone={() => setCreating(false)} />
      </Modal>

      <Modal open={Boolean(editingTask)} title="Edit task" onClose={() => setEditingTask(null)}>
        {editingTask && <TaskForm task={editingTask} onDone={() => setEditingTask(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete task?"
        description={`"${deletingTask?.title ?? ""}" will be permanently deleted. This cannot be undone.`}
        isLoading={deleteTask.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </main>
  );
}

export default function TasksPage() {
  return (
    <AuthGuard>
      <Navbar />
      <Suspense fallback={<FullPageSpinner />}>
        <TasksPageContent />
      </Suspense>
    </AuthGuard>
  );
}
