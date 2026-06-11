import { prisma } from "../db.js";
import type { ActivityAction, Prisma, Task } from "../generated/prisma/client.js";

export interface FieldChange {
  field: string;
  from: string | null;
  to: string | null;
}

const DIFF_FIELDS = ["title", "description", "status", "priority", "dueDate"] as const;

function fieldValue(task: Task, field: (typeof DIFF_FIELDS)[number]): string | null {
  const value = task[field];
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Field-level diff between two task snapshots (for UPDATED activity details). */
export function diffTasks(before: Task, after: Task): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of DIFF_FIELDS) {
    const from = fieldValue(before, field);
    const to = fieldValue(after, field);
    if (from !== to) {
      changes.push({ field, from, to });
    }
  }
  return changes;
}

export async function logActivity(
  taskId: string,
  actorId: string,
  action: ActivityAction,
  details?: FieldChange[],
): Promise<void> {
  await prisma.activity.create({
    data: {
      taskId,
      actorId,
      action,
      details:
        details && details.length > 0 ? (details as unknown as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listTaskActivity(taskId: string) {
  return prisma.activity.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, email: true, name: true } } },
  });
}
