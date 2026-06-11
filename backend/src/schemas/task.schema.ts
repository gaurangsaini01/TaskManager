import { z } from "zod";
import { TaskStatus, TaskPriority } from "../generated/prisma/client.js";

/** Treat empty query-string values (?status=) as absent. */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(5000, "Description is too long").optional(),
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.coerce.date<Date>("Invalid due date").optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long").optional(),
    // null clears the field, undefined leaves it untouched
    description: z.string().trim().max(5000, "Description is too long").nullish(),
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    dueDate: z.coerce.date<Date>("Invalid due date").nullish(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    "At least one field must be provided",
  );

export const listTasksQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(TaskStatus).optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  sortBy: z.preprocess(emptyToUndefined, z.enum(["dueDate", "priority", "createdAt"]).default("createdAt")),
  order: z.preprocess(emptyToUndefined, z.enum(["asc", "desc"]).default("desc")),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(10)),
  // "all" lists every user's tasks — admin only, enforced in the service
  scope: z.preprocess(emptyToUndefined, z.enum(["own", "all"]).default("own")),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
