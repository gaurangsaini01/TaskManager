import { describe, expect, it } from "vitest";
import { api, signup } from "./helpers.js";

describe("POST /auth/signup", () => {
  it("creates an account, normalizes the email and never exposes the password hash", async () => {
    const res = await api()
      .post("/auth/signup")
      .send({ email: "New.User@Test.DEV", password: "password123", name: "New User" });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("new.user@test.dev");
    expect(res.body.user.role).toBe("USER");
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects duplicate emails with 409", async () => {
    await signup("dupe@test.dev");
    const res = await api().post("/auth/signup").send({ email: "dupe@test.dev", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects invalid payloads with field-level details", async () => {
    const res = await api().post("/auth/signup").send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toContain("email");
    expect(paths).toContain("password");
  });
});

describe("POST /auth/login", () => {
  it("returns a token and the user for valid credentials", async () => {
    await signup("login@test.dev", "password123");
    const res = await api().post("/auth/login").send({ email: "login@test.dev", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("login@test.dev");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects wrong passwords with a generic 401", async () => {
    await signup("victim@test.dev", "password123");
    const res = await api().post("/auth/login").send({ email: "victim@test.dev", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /auth/me", () => {
  it("returns the authenticated user for a valid token", async () => {
    const { token, user } = await signup("me@test.dev");
    const res = await api().get("/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it("rejects missing and malformed tokens with 401", async () => {
    const missing = await api().get("/auth/me");
    expect(missing.status).toBe(401);

    const malformed = await api().get("/auth/me").set("Authorization", "Bearer not-a-jwt");
    expect(malformed.status).toBe(401);
    expect(malformed.body.error.code).toBe("UNAUTHORIZED");
  });
});
