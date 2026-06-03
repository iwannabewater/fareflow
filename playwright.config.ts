import { defineConfig, devices } from "@playwright/test";

const ciBrowserChannel = process.env.CI ? ("chrome" as const) : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(ciBrowserChannel ? { channel: ciBrowserChannel } : {}),
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
        ...(ciBrowserChannel ? { channel: ciBrowserChannel } : {}),
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm exec next start -p 3100 -H 127.0.0.1",
    url: "http://127.0.0.1:3100/fareflow/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
