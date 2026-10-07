import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  test: {
    environment: 'node',
    include: ['packages/**/*.test.js', 'src/**/*.test.js'],
  },
});