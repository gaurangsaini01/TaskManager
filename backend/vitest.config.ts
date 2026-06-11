import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // All test files share one remote test database — run them strictly serially
    fileParallelism: false,
    maxWorkers: 1,
    // Neon round-trips from a local machine are slow-ish; be generous
    testTimeout: 10_000,
    hookTimeout: 60_000,
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
});
