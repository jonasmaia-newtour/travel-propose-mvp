import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";
const authDir = "playwright/.auth";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "anonymous",
      testMatch: /(accessibility|dashboard-rbac)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "desktop-agent",
      testMatch: /(proposal-create-publish|dashboard-rbac)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: `${authDir}/agent.json`,
      },
      dependencies: ["setup"],
    },
    {
      name: "tablet-agent",
      testMatch: /proposal-create-publish\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        storageState: `${authDir}/agent.json`,
      },
      dependencies: ["setup"],
    },
    {
      name: "mobile-agent",
      testMatch: /proposal-create-publish\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        storageState: `${authDir}/agent.json`,
      },
      dependencies: ["setup"],
    },
    {
      name: "desktop-owner",
      testMatch: /dashboard-rbac\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: `${authDir}/owner.json`,
      },
      dependencies: ["setup"],
    },
    {
      name: "desktop-manager",
      testMatch: /dashboard-rbac\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: `${authDir}/manager.json`,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "node ./node_modules/next/dist/bin/next start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
