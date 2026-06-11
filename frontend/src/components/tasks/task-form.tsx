"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateTask, useUpdateTask } from "@/hooks/use-task-mutations";
import { ApiError } from "@/lib/api";
import { PRIORITY_LABELS, STATUS_LABELS, type Task } from "@/lib/types";
import { taskFormSchema, type TaskFormValues } from "@/lib/validators";

interface TaskFormProps {
  /** When provided the form edits this task, otherwise it creates a new one. */
  task?: Task;
  onDone: () => void;
}

export function TaskForm({ task, onDone }: TaskFormProps) {
  const isEdit = Boolean(task);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({
          id: task.id,
          input: {
            title: values.title,
            description: values.description?.trim() ? values.description : null,
            status: values.status,
            priority: values.priority,
            dueDate: values.dueDate ? values.dueDate : null,
          },
        });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync({
          title: values.title,
          description: values.description?.trim() ? values.description : undefined,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate ? values.dueDate : undefined,
        });
        toast.success("Task created");
      }
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <Input
        label="Title"
        placeholder="What needs doing?"
        autoFocus
        error={errors.title?.message}
        {...register("title")}
      />

      <Textarea
        label="Description (optional)"
        placeholder="Add details…"
        rows={3}
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select label="Status" error={errors.status?.message} {...register("status")}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select label="Priority" error={errors.priority?.message} {...register("priority")}>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEdit ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
