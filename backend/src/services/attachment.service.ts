import { prisma } from "../db.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { Attachment, Task } from "../generated/prisma/client.js";
import { logActivity } from "./activity.service.js";
import { destroyFile, uploadBuffer } from "./cloudinary.js";
import { broadcastTaskEvent } from "./sse.js";

export async function listAttachments(taskId: string): Promise<Attachment[]> {
  return prisma.attachment.findMany({ where: { taskId }, orderBy: { createdAt: "desc" } });
}

export async function addAttachment(
  task: Task,
  actorId: string,
  file: Express.Multer.File,
): Promise<Attachment> {
  const uploaded = await uploadBuffer(file.buffer, `taskmanager/${task.id}`);

  const attachment = await prisma.attachment.create({
    data: {
      taskId: task.id,
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
      resourceType: uploaded.resource_type,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
  });

  await logActivity(task.id, actorId, "ATTACHMENT_ADDED", [
    { field: "attachment", from: null, to: file.originalname },
  ]);
  broadcastTaskEvent(task.userId, { type: "task.updated", taskId: task.id });

  return attachment;
}

export async function removeAttachment(
  task: Task,
  attachmentId: string,
  actorId: string,
): Promise<void> {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || attachment.taskId !== task.id) {
    throw new ApiError(404, "Attachment not found", "NOT_FOUND");
  }

  // Best-effort remote cleanup — a failed Cloudinary call must not strand the row
  try {
    await destroyFile(attachment.publicId, attachment.resourceType);
  } catch (err) {
    console.error(`Cloudinary destroy failed for ${attachment.publicId}:`, err);
  }

  await prisma.attachment.delete({ where: { id: attachment.id } });
  await logActivity(task.id, actorId, "ATTACHMENT_REMOVED", [
    { field: "attachment", from: attachment.originalName, to: null },
  ]);
  broadcastTaskEvent(task.userId, { type: "task.updated", taskId: task.id });
}

/** Best-effort Cloudinary cleanup before a task row (and its attachment rows) cascade away. */
export async function destroyRemoteFilesForTask(taskId: string): Promise<void> {
  const attachments = await prisma.attachment.findMany({ where: { taskId } });
  if (attachments.length === 0) return;
  await Promise.allSettled(
    attachments.map((attachment) => destroyFile(attachment.publicId, attachment.resourceType)),
  );
}
