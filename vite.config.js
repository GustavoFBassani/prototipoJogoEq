import { defineConfig } from 'vite';

export default defineConfig({
  base: '/igualai/',
  test: {
    environment: 'node',
    include: ['packages/**/*.test.js', 'src/**/*.test.js'],
  },
});