import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    hmr: {
      host: '192.168.0.11',
      port: 5173,
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 200000,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});