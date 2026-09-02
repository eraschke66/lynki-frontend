import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

// Deliberately separate from vite.config.ts: that config wires up the PWA,
// Sentry and manual chunking plugins, none of which are relevant to running
// tests and which would only slow the test runner down or require env vars
// that CI/local test runs shouldn't need.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
