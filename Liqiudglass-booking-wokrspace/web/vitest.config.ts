import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/pwa/**/*.spec.ts",
      "tests/unit/**/*.spec.ts"
    ],
    exclude: ["tests/e2e/**"]
  }
});
