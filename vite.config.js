import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames(chunkInfo) {
          return chunkInfo.name.toLowerCase().includes('basecamp')
            ? 'basecamp-assets/[name]-[hash].js'
            : 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
