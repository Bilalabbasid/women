import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // .claude/worktrees/* are separate git worktrees for parallel UI sessions, each
    // a full copy of the repo at its own branch tip — exclude them or every test
    // here runs 1 + N(worktrees) times and failures get misattributed to this checkout.
    exclude: ['**/node_modules/**', '**/.claude/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
