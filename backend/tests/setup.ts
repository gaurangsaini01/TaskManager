import "dotenv/config";
import { afterAll, beforeEach } from "vitest";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is not set — refusing to run tests.");
}
if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL — tests truncate all tables.");
}

// Must happen before src/config.ts is first imported (the dynamic import below
// and every test-file import of the app resolve to the same module instance).
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const { prisma } = await import("../src/db.js");

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks", "users" CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
