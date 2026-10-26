import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "apps/web",
  // `npm run dev:worker` serves the API on 8787; the Worker allows this origin via ALLOWED_ORIGINS in .dev.vars.
  server: { proxy: { "/api": "http://localhost:8787" } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "web",
          environment: "jsdom",
          environmentOptions: { jsdom: { url: "http://localhost/" } },
          setupFiles: ["./src/test/setup.ts"],
          globals: true,
        },
      },
      {
        test: {
          name: "worker",
          root: fileURLToPath(new URL("./apps/worker", import.meta.url)),
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
    ],
  },
});
