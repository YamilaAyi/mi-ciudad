import { defineConfig } from 'vitest/config';

// Pruebas de los endpoints y del envío a Expo usando un servidor push local falso.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/notifications/**/*.e2e-spec.ts'],
    setupFiles: ['test/utilities/e2e-environment.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
