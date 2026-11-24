import { defineConfig, devices } from "@playwright/test";

// Tests run against the static export (`npm run build` → out/), served locally.
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1, // only network-dependent flakiness; retried tests are reported as "flaky"
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: { baseURL: "http://127.0.0.1:3311", trace: "off" },
  webServer: { command: "python3 -m http.server 3311 --bind 127.0.0.1 --directory out", url: "http://127.0.0.1:3311/", reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
