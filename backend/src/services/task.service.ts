import { prisma } from "../db.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { Prisma, Role, Task } from "../generated/prisma/client.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "../schemas/task.schema.js";
import { diffTasks, logActivity } from "./activity.service.js";
import { destroyRemoteFilesForTask } from "./attachment.service.js";
import { broadcastTaskEvent } from "./sse.js";

/*
 * Single mutation funnel for tasks: every create/update/delete goes through
 * this service, so cross-cutting concerns (activity log, real-time events)
 * hook in one place instead of every route.
 */

export interface Actor {
  id: string;
  role: Role;
}

export interface TaskOwner {
  id: string;
  email: string;
  name: string | null;
}

export type TaskWithOwner = Task & { owner: TaskOwner };

export interface ListTasksResult {
  data: TaskWithOwner[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const ownerSelect = { select: { id: true, email: true, name: true } } as const;

function withOwner<T extends Task & { user: TaskOwner }>(task: T): TaskWithOwner {
  const { user, ...rest } = task;
  return { ...rest, owner: user };
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
  const allScope = query.scope === "all";
  if (allScope && actor.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required to view all users' tasks", "FORBIDDEN");
  }

  const where: Prisma.TaskWhereInput = {
    ...(allScope ? {} : { userId: actor.id }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" as const } } : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy: buildOrderBy(query.sortBy, query.order),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { user: ownerSelect },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: rows.map(withOwner),
    meta: {
      page: query.page,
      pageSize: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/**
 * Loads a task and enforces access rules:
 * - owners can read and write their own tasks
 * - admins can read anyone's task but modify only their own
 * - everyone else gets 404 (not 403) so foreign task ids are never confirmed
 */
export async function getTaskAuthorized(
  taskId: string,
  actor: Actor,
  intent: "read" | "write" = "read",
): Promise<TaskWithOwner> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { user: ownerSelect },
  });
  if (!task) {
    throw new ApiError(404, "Task not found", "NOT_FOUND");
  }
  if (task.userId !== actor.id) {
    if (actor.role === "ADMIN") {
      if (intent === "read") {
        return withOwner(task);
      }
      throw new ApiError(403, "Admins can view but not modify other users' tasks", "FORBIDDEN");
    }
    throw new ApiError(404, "Task not found", "NOT_FOUND");
  }
  return withOwner(task);
}

export async function createTask(actor: Actor, input: CreateTaskInput): Promise<Task> {
  const task = await prisma.task.create({
    data: { ...input, userId: actor.id },
  });
  await logActivity(task.id, actor.id, "CREATED");
  broadcastTaskEvent(task.userId, { type: "task.created", taskId: task.id });
  return task;
}

export async function updateTask(actor: Actor, taskId: string, input: UpdateTaskInput): Promise<Task> {
  const existing = await getTaskAuthorized(taskId, actor, "write");
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: input,
  });

  const changes = diffTasks(existing, task);
  if (changes.length > 0) {
    const onlyStatus = changes.length === 1 && changes[0]?.field === "status";
    await logActivity(task.id, actor.id, onlyStatus ? "STATUS_CHANGED" : "UPDATED", changes);
  }
  broadcastTaskEvent(task.userId, { type: "task.updated", taskId: task.id });

  return task;
}

export async function deleteTask(actor: Actor, taskId: string): Promise<void> {
  const existing = await getTaskAuthorized(taskId, actor, "write");
  await destroyRemoteFilesForTask(existing.id);
  await prisma.task.delete({ where: { id: existing.id } });
  broadcastTaskEvent(existing.userId, { type: "task.deleted", taskId: existing.id });
}
