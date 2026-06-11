import "dotenv/config";
import { execSync } from "node:child_process";

/** Runs once before the suite: applies migrations to the test database. */
export default function globalSetup(): void {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a disposable database/Neon branch — the test suite TRUNCATES ALL TABLES.",
    );
  }
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL must differ from DATABASE_URL — tests truncate all tables and would wipe your dev data.",
    );
  }

  // Neon pooled hosts contain "-pooler"; migrations need the direct host.
  const directUrl = testUrl.replace("-pooler", "");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: directUrl },
  });
}
