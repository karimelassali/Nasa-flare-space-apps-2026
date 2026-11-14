import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config';

export default mergeConfig(base, defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    include: ['scripts/live-ai.verify.ts'],
    testTimeout: 50000,
  },
}));
