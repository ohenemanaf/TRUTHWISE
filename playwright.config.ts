import { defineConfig, devices } from "@playwright/test";

const PORT = 3123;

/**
 * End-to-end tests against a production build. They use the locally installed
 * Microsoft Edge (`channel: "msedge"`), so no browser download is needed on
 * Windows. On other systems, change the channel or run `npx playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "msedge", viewport: { width: 1280, height: 900 } } },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], channel: "msedge", viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
