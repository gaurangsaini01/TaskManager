import { Router } from "express";
import { requireAuth, authUser } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
  type CreateTaskInput,
  type ListTasksQuery,
  type UpdateTaskInput,
} from "../schemas/task.schema.js";
import * as taskService from "../services/task.service.js";
import { listTaskActivity } from "../services/activity.service.js";

export const taskRouter = Router();

/** Express 5 types params as string | string[]; :id is always a single segment. */
function idParam(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

taskRouter.use(requireAuth);

taskRouter.get("/", validateQuery(listTasksQuerySchema), async (req, res) => {
  const result = await taskService.listTasks(authUser(req), res.locals.query as ListTasksQuery);
  res.json(result);
});

taskRouter.post("/", validateBody(createTaskSchema), async (req, res) => {
  const task = await taskService.createTask(authUser(req), req.body as CreateTaskInput);
  res.status(201).json({ data: task });
});

taskRouter.get("/:id/activity", async (req, res) => {
  const task = await taskService.getTaskAuthorized(idParam(req.params.id), authUser(req));
  const data = await listTaskActivity(task.id);
  res.json({ data });
});

taskRouter.get("/:id", async (req, res) => {
  const task = await taskService.getTaskAuthorized(idParam(req.params.id), authUser(req));
  res.json({ data: task });
});

taskRouter.patch("/:id", validateBody(updateTaskSchema), async (req, res) => {
  const task = await taskService.updateTask(authUser(req), idParam(req.params.id), req.body as UpdateTaskInput);
  res.json({ data: task });
});

taskRouter.delete("/:id", async (req, res) => {
  await taskService.deleteTask(authUser(req), idParam(req.params.id));
  res.status(204).send();
});
