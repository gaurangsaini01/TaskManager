import { describe, expect, it } from "vitest";
import { api, makeTask, signup } from "./helpers.js";

describe("POST /tasks/:id/attachments validation", () => {
  it("rejects unsupported file types", async () => {
    const { token } = await signup("uploader@test.dev");
    const task = await makeTask(token);

    const res = await api()
      .post(`/tasks/${task.id}/attachments`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("#!/bin/sh\necho hi"), {
        filename: "script.sh",
        contentType: "application/x-sh",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("rejects files over the 5 MB limit", async () => {
    const { token } = await signup("uploader@test.dev");
    const task = await makeTask(token);

    const res = await api()
      .post(`/tasks/${task.id}/attachments`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("LIMIT_FILE_SIZE");
  });

  it("rejects requests without a file", async () => {
    const { token } = await signup("uploader@test.dev");
    const task = await makeTask(token);

    const res = await api()
      .post(`/tasks/${task.id}/attachments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("NO_FILE");
  });

  it("hides other users' tasks behind 404 for attachment access", async () => {
    const alice = await signup("alice@test.dev");
    const bob = await signup("bob@test.dev");
    const task = await makeTask(alice.token);

    const list = await api()
      .get(`/tasks/${task.id}/attachments`)
      .set("Authorization", `Bearer ${bob.token}`);

    expect(list.status).toBe(404);
  });
});
