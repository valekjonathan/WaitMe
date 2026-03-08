/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    fs: {
      deny: ['**/ios__backup*/**', '**/DerivedData/**', '**/ios/**'],
    },
    watch: {
      usePolling: false,
      ignored: ['**/ios__backup*/**', '**/DerivedData/**', '**/ios/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  base: './',
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 200000,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/contracts/**/*.test.js'],
  },
});
