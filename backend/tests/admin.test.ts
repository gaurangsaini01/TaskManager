import { describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { api, makeTask, signup } from "./helpers.js";

/** Promote a user and return a fresh token carrying the ADMIN role claim. */
async function makeAdmin(email: string, password = "password123") {
  await signup(email, password);
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  const res = await api().post("/auth/login").send({ email, password });
  return { token: res.body.token as string, user: res.body.user as { id: string } };
}

describe("admin scope=all", () => {
  it("rejects non-admin users with 403", async () => {
    const { token } = await signup("pleb@test.dev");
    const res = await api().get("/tasks?scope=all").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("lets admins list every user's tasks with owner info", async () => {
    const alice = await signup("alice@test.dev");
    const bob = await signup("bob@test.dev");
    await makeTask(alice.token, { title: "Alice work" });
    await makeTask(bob.token, { title: "Bob work" });
    const admin = await makeAdmin("root@test.dev");

    const all = await api().get("/tasks?scope=all").set("Authorization", `Bearer ${admin.token}`);
    expect(all.status).toBe(200);
    expect(all.body.meta.total).toBe(2);
    const owners = all.body.data.map((t: { owner: { email: string } }) => t.owner.email).sort();
    expect(owners).toEqual(["alice@test.dev", "bob@test.dev"]);

    // Default scope stays personal even for admins
    const own = await api().get("/tasks").set("Authorization", `Bearer ${admin.token}`);
    expect(own.body.meta.total).toBe(0);
  });

  it("lets admins read but not modify other users' tasks", async () => {
    const alice = await signup("alice@test.dev");
    const task = await makeTask(alice.token, { title: "Alice private" });
    const admin = await makeAdmin("root@test.dev");

    const read = await api().get(`/tasks/${task.id}`).set("Authorization", `Bearer ${admin.token}`);
    expect(read.status).toBe(200);
    expect(read.body.data.owner.email).toBe("alice@test.dev");

    const patch = await api()
      .patch(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "admin override" });
    expect(patch.status).toBe(403);

    const del = await api().delete(`/tasks/${task.id}`).set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(403);
  });
});
