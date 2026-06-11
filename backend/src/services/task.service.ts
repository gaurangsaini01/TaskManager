import { prisma } from "../db.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { Prisma, Role, Task } from "../generated/prisma/client.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../schemas/task.schema.js";

/*
 * Single mutation funnel for tasks: every create/update/delete goes through
 * this service, so cross-cutting concerns (activity log, real-time events)
 * hook in one place instead of every route.
 */

export interface Actor {
  id: string;
  role: Role;
}

export interface ListTasksResult {
  data: Task[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

function buildOrderBy(
  sortBy: ListTasksQuery["sortBy"],
  order: ListTasksQuery["order"],
): Prisma.TaskOrderByWithRelationInput[] {
  const primary: Prisma.TaskOrderByWithRelationInput =
    sortBy === "dueDate"
      ? { dueDate: { sort: order, nulls: "last" } }
      : sortBy === "priority"
        ? { priority: order } // PG enum order: LOW < MEDIUM < HIGH
        : { createdAt: order };
  // Stable tiebreaker so pagination never shows duplicates across pages
  return [primary, { id: "asc" }];
}

export async function listTasks(actor: Actor, query: ListTasksQuery): Promise<ListTasksResult> {
  const where: Prisma.TaskWhereInput = {
    userId: actor.id,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" as const } } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: query.page,
      pageSize: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/**
 * Loads a task and enforces ownership. Foreign tasks return 404 (not 403)
 * so the API never reveals whether someone else's task id exists.
 */
export async function getTaskAuthorized(taskId: string, actor: Actor): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== actor.id) {
    throw new ApiError(404, "Task not found", "NOT_FOUND");
  }
  return task;
}

export async function createTask(actor: Actor, input: CreateTaskInput): Promise<Task> {
  const task = await prisma.task.create({
    data: { ...input, userId: actor.id },
  });
  return task;
}

export async function updateTask(actor: Actor, taskId: string, input: UpdateTaskInput): Promise<Task> {
  const existing = await getTaskAuthorized(taskId, actor);
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: input,
  });
  return task;
}

export async function deleteTask(actor: Actor, taskId: string): Promise<void> {
  const existing = await getTaskAuthorized(taskId, actor);
  await prisma.task.delete({ where: { id: existing.id } });
}
