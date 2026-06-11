import { describe, expect, it } from "vitest";
import { api, makeTask, signup } from "./helpers.js";

describe("POST /tasks", () => {
  it("creates a task with server-side defaults applied", async () => {
    const { token } = await signup("creator@test.dev");
    const res = await api()
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Ship the API", description: "v1 scope" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: "Ship the API",
      description: "v1 scope",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
    });
    expect(res.body.data.id).toEqual(expect.any(String));
  });

  it("rejects a missing title with a 400 validation error", async () => {
    const { token } = await signup("creator@test.dev");
    const res = await api()
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "no title here" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toContain("title");
  });

  it("requires authentication", async () => {
    const res = await api().post("/tasks").send({ title: "Sneaky" });
    expect(res.status).toBe(401);
  });
});

describe("GET /tasks", () => {
  it("returns only the caller's tasks", async () => {
    const alice = await signup("alice@test.dev");
    const bob = await signup("bob@test.dev");
    await makeTask(alice.token, { title: "Alice 1" });
    await makeTask(alice.token, { title: "Alice 2" });
    await makeTask(bob.token, { title: "Bob secret" });

    const res = await api().get("/tasks").set("Authorization", `Bearer ${alice.token}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles).toHaveLength(2);
    expect(titles).not.toContain("Bob secret");
  });

  it("combines status filter with case-insensitive title search", async () => {
    const { token } = await signup("filter@test.dev");
    await makeTask(token, { title: "Pay rent", status: "TODO" });
    await makeTask(token, { title: "Pay taxes", status: "DONE" });
    await makeTask(token, { title: "Walk dog", status: "TODO" });

    const search = await api().get("/tasks?search=PAY").set("Authorization", `Bearer ${token}`);
    expect(search.body.meta.total).toBe(2);

    const combined = await api()
      .get("/tasks?search=pay&status=TODO")
      .set("Authorization", `Bearer ${token}`);
    expect(combined.body.meta.total).toBe(1);
    expect(combined.body.data[0].title).toBe("Pay rent");
  });

  it("sorts by priority with HIGH first when descending", async () => {
    const { token } = await signup("prio@test.dev");
    await makeTask(token, { title: "low", priority: "LOW" });
    await makeTask(token, { title: "high", priority: "HIGH" });
    await makeTask(token, { title: "medium", priority: "MEDIUM" });

    const res = await api()
      .get("/tasks?sortBy=priority&order=desc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.map((t: { priority: string }) => t.priority)).toEqual([
      "HIGH",
      "MEDIUM",
      "LOW",
    ]);
  });

  it("sorts by due date ascending with undated tasks last", async () => {
    const { token } = await signup("due@test.dev");
    await makeTask(token, { title: "july", dueDate: "2026-07-01" });
    await makeTask(token, { title: "undated" });
    await makeTask(token, { title: "june", dueDate: "2026-06-01" });

    const res = await api()
      .get("/tasks?sortBy=dueDate&order=asc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.map((t: { title: string }) => t.title)).toEqual([
      "june",
      "july",
      "undated",
    ]);
  });

  it("paginates with accurate metadata", async () => {
    const { token } = await signup("pager@test.dev");
    for (let i = 1; i <= 5; i++) {
      await makeTask(token, { title: `Task ${i}` });
    }

    const res = await api().get("/tasks?page=3&limit=2").set("Authorization", `Bearer ${token}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual({ page: 3, pageSize: 2, total: 5, totalPages: 3 });
  });

  it("rejects invalid query values", async () => {
    const { token } = await signup("badquery@test.dev");
    const res = await api()
      .get("/tasks?sortBy=sneaky&page=0")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET/PATCH/DELETE /tasks/:id", () => {
  it("updates fields and clears the due date with null", async () => {
    const { token } = await signup("editor@test.dev");
    const task = await makeTask(token, { title: "Before", dueDate: "2026-08-01" });

    const res = await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "After", status: "DONE", dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: "After", status: "DONE", dueDate: null });
  });

  it("rejects an empty PATCH body", async () => {
    const { token } = await signup("editor@test.dev");
    const task = await makeTask(token);

    const res = await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("hides other users' tasks behind 404 for read, update and delete", async () => {
    const alice = await signup("alice@test.dev");
    const bob = await signup("bob@test.dev");
    const task = await makeTask(alice.token, { title: "Alice's task" });

    const read = await api().get(`/tasks/${task.id}`).set("Authorization", `Bearer ${bob.token}`);
    const update = await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ title: "hijacked" });
    const remove = await api()
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${bob.token}`);

    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);

    // And the task is untouched for its owner
    const still = await api().get(`/tasks/${task.id}`).set("Authorization", `Bearer ${alice.token}`);
    expect(still.status).toBe(200);
    expect(still.body.data.title).toBe("Alice's task");
  });

  it("deletes own tasks and returns 404 afterwards", async () => {
    const { token } = await signup("deleter@test.dev");
    const task = await makeTask(token);

    const del = await api().delete(`/tasks/${task.id}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const gone = await api().get(`/tasks/${task.id}`).set("Authorization", `Bearer ${token}`);
    expect(gone.status).toBe(404);
  });
});
