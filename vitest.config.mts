import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// The same import aliases as electron.vite.config.ts, so renderer tests resolve
// `@/` and `@shared/` like the app does.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve("src/renderer/src"),
      "@shared": resolve("src/shared"),
    },
  },
});
