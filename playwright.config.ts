import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    // iPhone-ish portrait viewport — Campus Ball is a portrait mobile game.
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    // Use the environment's preinstalled Chromium (never `playwright install`).
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
