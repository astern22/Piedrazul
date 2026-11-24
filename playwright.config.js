// @ts-check
import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de Playwright para pruebas de punta a punta (E2E)
 * Proyecto: Piedrazul
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Inicia el servidor de desarrollo del frontend automáticamente si no está corriendo */
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'cd frontend && npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60 * 1000,
      },
})
