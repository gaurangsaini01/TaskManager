export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  /** Present on list/detail responses; relevant when an admin views all tasks. */
  owner?: { id: string; email: string; name: string | null };
}

export type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED";

export interface ActivityChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface Activity {
  id: string;
  action: ActivityAction;
  details: ActivityChange[] | null;
  createdAt: string;
  actor: { id: string; email: string; name: string | null } | null;
}

export interface Attachment {
  id: string;
  publicId: string;
  url: string;
  resourceType: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TaskListResponse {
  data: Task[];
  meta: ListMeta;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
