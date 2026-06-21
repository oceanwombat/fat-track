import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * E2E config. Tests run against the production build served by `vite preview`,
 * so the service worker, manifest, and bundled output match what ships.
 * Playwright starts (and tears down) the server automatically.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Dummy key so the Estimate UI renders in tests; the real Gemini endpoint is
    // intercepted via page.route, so no real network calls are made.
    env: { ...process.env, VITE_GEMINI_API_KEY: 'test-dummy-key' },
  },
});
