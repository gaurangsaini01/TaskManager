"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { TaskFilters } from "@/components/tasks/task-filters";
import { EmptyState, ErrorState, TaskList, TaskListSkeleton } from "@/components/tasks/task-list";
import { Pagination } from "@/components/ui/pagination";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useTasks } from "@/hooks/use-tasks";
import {
  parseTaskParams,
  taskParamsToSearch,
  type TaskListParams,
} from "@/lib/task-params";

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = parseTaskParams(searchParams);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTasks(params);

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

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Your tasks</h1>
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
          />
        ) : data ? (
          <div className={`flex flex-col gap-4 ${isPlaceholderData ? "opacity-60" : ""}`}>
            <TaskList tasks={data.data} />
            <Pagination meta={data.meta} onPageChange={(page) => applyParams({ page })} />
          </div>
        ) : null}
      </div>
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
