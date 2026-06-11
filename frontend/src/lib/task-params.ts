import type { ReadonlyURLSearchParams } from "next/navigation";
import type { TaskPriority, TaskStatus } from "./types";

export type SortBy = "dueDate" | "priority" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface TaskListParams {
  status?: TaskStatus;
  search?: string;
  sortBy: SortBy;
  order: SortOrder;
  page: number;
  scope?: "own" | "all";
}

export const DEFAULT_PARAMS: TaskListParams = {
  sortBy: "createdAt",
  order: "desc",
  page: 1,
};

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const SORT_FIELDS: SortBy[] = ["dueDate", "priority", "createdAt"];

export function parseTaskParams(searchParams: ReadonlyURLSearchParams): TaskListParams {
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy");
  const order = searchParams.get("order");
  const page = Number(searchParams.get("page"));
  const scope = searchParams.get("scope");

  return {
    status: STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : undefined,
    search: search?.trim() || undefined,
    sortBy: SORT_FIELDS.includes(sortBy as SortBy) ? (sortBy as SortBy) : DEFAULT_PARAMS.sortBy,
    order: order === "asc" || order === "desc" ? order : DEFAULT_PARAMS.order,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    scope: scope === "all" ? "all" : undefined,
  };
}

/** Serializes params to a URL query string, omitting defaults to keep URLs clean. */
export function taskParamsToSearch(params: TaskListParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.sortBy !== DEFAULT_PARAMS.sortBy) qs.set("sortBy", params.sortBy);
  if (params.order !== DEFAULT_PARAMS.order) qs.set("order", params.order);
  if (params.page > 1) qs.set("page", String(params.page));
  if (params.scope === "all") qs.set("scope", "all");
  return qs.toString();
}

/** Query string sent to the API (always explicit, fixed page size). */
export function taskParamsToApiQuery(params: TaskListParams, pageSize: number): string {
  const qs = new URLSearchParams({
    sortBy: params.sortBy,
    order: params.order,
    page: String(params.page),
    limit: String(pageSize),
  });
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.scope === "all") qs.set("scope", "all");
  return qs.toString();
}

export const PRIORITY_ORDER: Record<TaskPriority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
