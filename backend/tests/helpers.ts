import request from "supertest";
import { app } from "../src/app.js";

export function api() {
  return request(app);
}

export interface TestUser {
  token: string;
  user: { id: string; email: string; role: string };
}

export async function signup(email: string, password = "password123"): Promise<TestUser> {
  const res = await api().post("/auth/signup").send({ email, password });
  if (res.status !== 201) {
    throw new Error(`Test signup failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user };
}

export async function makeTask(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; title: string; status: string; priority: string; dueDate: string | null }> {
  const res = await api()
    .post("/tasks")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Task", ...overrides });
  if (res.status !== 201) {
    throw new Error(`Test task creation failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}
