import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@client": path.resolve(import.meta.dirname, "./src"),
      "@server": path.resolve(import.meta.dirname, "../server/src"),
      "@shared": path.resolve(import.meta.dirname, "../shared/src"),
      "@": path.resolve(import.meta.dirname, "./src")
    }
  }
})
