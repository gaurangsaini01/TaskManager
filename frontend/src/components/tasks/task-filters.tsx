"use client";

import { useEffect, useRef, useState } from "react";
import { Select } from "@/components/ui/select";
import type { SortBy, SortOrder, TaskListParams } from "@/lib/task-params";
import { STATUS_LABELS, type TaskStatus } from "@/lib/types";

interface TaskFiltersProps {
  params: TaskListParams;
  onChange: (patch: Partial<TaskListParams>) => void;
}

const STATUS_TABS: { value: TaskStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "TODO", label: STATUS_LABELS.TODO },
  { value: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS },
  { value: "DONE", label: STATUS_LABELS.DONE },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "createdAt", label: "Created" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
];

export function TaskFilters({ params, onChange }: TaskFiltersProps) {
  const [searchText, setSearchText] = useState(params.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL changes from elsewhere (back button, clear filters)
  useEffect(() => {
    setSearchText(params.search ?? "");
  }, [params.search]);

  function handleSearchChange(value: string) {
    setSearchText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ search: value.trim() || undefined });
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter by status" className="flex rounded-lg border border-edge bg-surface p-0.5">
          {STATUS_TABS.map((tab) => {
            const active = params.status === tab.value;
            return (
              <button
                key={tab.label}
                role="tab"
                aria-selected={active}
                onClick={() => onChange({ status: tab.value })}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Select
            aria-label="Sort by"
            value={params.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as SortBy })}
            className="!h-9 w-32"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <button
            aria-label={`Sort ${params.order === "asc" ? "ascending" : "descending"} — click to flip`}
            title={params.order === "asc" ? "Ascending" : "Descending"}
            onClick={() => onChange({ order: (params.order === "asc" ? "desc" : "asc") as SortOrder })}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-edge-strong bg-surface text-muted transition-colors hover:text-foreground"
          >
            <svg
              viewBox="0 0 16 16"
              className={`size-4 fill-current transition-transform ${params.order === "asc" ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path d="M8 12L3 6h10z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 fill-muted"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tasks by title…"
          aria-label="Search tasks by title"
          className="h-10 w-full rounded-lg border border-edge-strong bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-2 focus:outline-offset-1 focus:outline-primary"
        />
      </div>
    </div>
  );
}
