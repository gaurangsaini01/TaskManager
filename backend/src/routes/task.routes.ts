import { Router } from "express";
import multer from "multer";
import { requireAuth, authUser } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
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
import { addAttachment, listAttachments, removeAttachment } from "../services/attachment.service.js";

export const taskRouter = Router();

/** Express 5 types params as string | string[]; :id is always a single segment. */
function idParam(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Unsupported file type — allowed: images, PDF, DOCX", "UNSUPPORTED_FILE_TYPE"));
    }
  },
});

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

taskRouter.get("/:id/attachments", async (req, res) => {
  const task = await taskService.getTaskAuthorized(idParam(req.params.id), authUser(req));
  const data = await listAttachments(task.id);
  res.json({ data });
});

taskRouter.post("/:id/attachments", upload.single("file"), async (req, res) => {
  const task = await taskService.getTaskAuthorized(idParam(req.params.id), authUser(req), "write");
  if (!req.file) {
    throw new ApiError(400, 'No file provided — send multipart form-data with a "file" field', "NO_FILE");
  }
  const attachment = await addAttachment(task, authUser(req).id, req.file);
  res.status(201).json({ data: attachment });
});

taskRouter.delete("/:id/attachments/:attachmentId", async (req, res) => {
  const task = await taskService.getTaskAuthorized(idParam(req.params.id), authUser(req), "write");
  await removeAttachment(task, idParam(req.params.attachmentId), authUser(req).id);
  res.status(204).send();
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
