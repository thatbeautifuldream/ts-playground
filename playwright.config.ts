import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: { baseURL: "http://localhost:3110", channel: "chrome", headless: true },
  webServer: { command: "pnpm dev --port 3110", url: "http://localhost:3110", reuseExistingServer: !process.env.CI },
});
