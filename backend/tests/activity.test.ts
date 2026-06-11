import { describe, expect, it } from "vitest";
import { api, makeTask, signup } from "./helpers.js";

describe("GET /tasks/:id/activity", () => {
  it("records creation, status changes and field diffs", async () => {
    const { token } = await signup("history@test.dev");
    const task = await makeTask(token, { title: "Original", priority: "LOW" });

    await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "DONE" });
    await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed", priority: "HIGH" });

    const res = await api()
      .get(`/tasks/${task.id}/activity`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Newest first: UPDATED, STATUS_CHANGED, CREATED
    const actions = res.body.data.map((a: { action: string }) => a.action);
    expect(actions).toEqual(["UPDATED", "STATUS_CHANGED", "CREATED"]);

    const statusChange = res.body.data[1];
    expect(statusChange.details).toEqual([{ field: "status", from: "TODO", to: "DONE" }]);
    expect(statusChange.actor.email).toBe("history@test.dev");

    const update = res.body.data[0];
    const changedFields = update.details.map((d: { field: string }) => d.field).sort();
    expect(changedFields).toEqual(["priority", "title"]);
  });

  it("denies activity access on other users' tasks", async () => {
    const alice = await signup("alice@test.dev");
    const bob = await signup("bob@test.dev");
    const task = await makeTask(alice.token);

    const res = await api()
      .get(`/tasks/${task.id}/activity`)
      .set("Authorization", `Bearer ${bob.token}`);

    expect(res.status).toBe(404);
  });
});
