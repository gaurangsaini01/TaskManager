import type { Response } from "express";
import type { Role } from "../generated/prisma/client.js";

export interface TaskEvent {
  type: "task.created" | "task.updated" | "task.deleted";
  taskId: string;
}

interface SseClient {
  userId: string;
  role: Role;
  res: Response;
}

/*
 * In-memory connection registry — single-instance by design. Running multiple
 * API processes would need a shared bus (e.g. Postgres LISTEN/NOTIFY or Redis
 * pub/sub) behind the same interface.
 */
const clients = new Set<SseClient>();
let heartbeat: NodeJS.Timeout | null = null;

function ensureHeartbeat(): void {
  if (heartbeat) return;
  // Comment frames keep proxies and browsers from closing idle streams
  heartbeat = setInterval(() => {
    for (const client of clients) {
      client.res.write(":ka\n\n");
    }
  }, 25_000);
  heartbeat.unref();
}

export function addSseClient(userId: string, role: Role, res: Response): () => void {
  const client: SseClient = { userId, role, res };
  clients.add(client);
  ensureHeartbeat();
  return () => {
    clients.delete(client);
  };
}

/** Notify the task owner's connections plus all connected admins. */
export function broadcastTaskEvent(ownerId: string, event: TaskEvent): void {
  if (clients.size === 0) return;
  const frame = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    if (client.userId === ownerId || client.role === "ADMIN") {
      client.res.write(frame);
    }
  }
}
