import { defineConfig } from 'vite';

export default defineConfig({
  base: '/equalab/',
  test: {
    environment: 'node',
    include: ['packages/**/*.test.js', 'src/**/*.test.js'],
  },
});