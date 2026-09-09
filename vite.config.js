import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.js', 'src/**/*.test.js'],
  },
});
