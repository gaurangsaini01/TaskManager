"use client";

import { useTaskActivity } from "@/hooks/use-activity";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Activity,
  type ActivityChange,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
import { formatDate } from "./task-item";

function timeAgo(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return formatDate(iso);
}

const FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  dueDate: "due date",
};

function humanizeValue(field: string, value: string | null): string {
  if (value === null || value === "") return "none";
  if (field === "status") return STATUS_LABELS[value as TaskStatus] ?? value;
  if (field === "priority") return PRIORITY_LABELS[value as TaskPriority] ?? value;
  if (field === "dueDate") return formatDate(value);
  return value.length > 40 ? `${value.slice(0, 40)}…` : value;
}

function changeLine(change: ActivityChange): string {
  const label = FIELD_LABELS[change.field] ?? change.field;
  if (change.field === "attachment") {
    return change.to ?? change.from ?? "";
  }
  return `${label}: ${humanizeValue(change.field, change.from)} → ${humanizeValue(change.field, change.to)}`;
}

function summary(entry: Activity): string {
  switch (entry.action) {
    case "CREATED":
      return "created this task";
    case "STATUS_CHANGED": {
      const change = entry.details?.[0];
      return change
        ? `changed status: ${humanizeValue("status", change.from)} → ${humanizeValue("status", change.to)}`
        : "changed status";
    }
    case "UPDATED":
      return "updated the task";
    case "ATTACHMENT_ADDED":
      return `added an attachment${entry.details?.[0]?.to ? ` — ${entry.details[0].to}` : ""}`;
    case "ATTACHMENT_REMOVED":
      return `removed an attachment${entry.details?.[0]?.from ? ` — ${entry.details[0].from}` : ""}`;
  }
}

const ACTION_COLORS: Record<Activity["action"], string> = {
  CREATED: "bg-emerald-500",
  UPDATED: "bg-sky-500",
  STATUS_CHANGED: "bg-amber-500",
  ATTACHMENT_ADDED: "bg-violet-500",
  ATTACHMENT_REMOVED: "bg-red-400",
};

export function TaskActivity({ taskId }: { taskId: string }) {
  const { data: entries, isPending, isError } = useTaskActivity(taskId);

  return (
    <section className="rounded-xl border border-edge bg-surface p-6">
      <h2 className="text-sm font-semibold text-foreground">Activity</h2>

      {isPending ? (
        <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="size-2 rounded-full bg-surface-muted" />
              <div className="h-3 w-2/3 rounded bg-surface-muted" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="mt-4 text-sm text-muted">Couldn&apos;t load the activity history.</p>
      ) : !entries || entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {entries.map((entry, idx) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {idx < entries.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[3.5px] top-3 h-full w-px bg-edge"
                />
              )}
              <span
                aria-hidden="true"
                className={`relative mt-1.5 size-2 shrink-0 rounded-full ${ACTION_COLORS[entry.action]}`}
              />
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{entry.actor?.email ?? "Someone"}</span>{" "}
                  {summary(entry)}
                </p>
                {entry.action === "UPDATED" && entry.details && (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {entry.details.map((change, i) => (
                      <li key={i} className="text-xs text-muted">
                        {changeLine(change)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-0.5 text-xs text-muted" title={new Date(entry.createdAt).toLocaleString()}>
                  {timeAgo(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
