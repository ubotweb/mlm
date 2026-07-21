import { defineConfig } from 'vite'
import honox from 'honox/vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  plugins: [
    honox({
      clientEntryPoint: './app/client.ts',
      serverEntryPoint: './src/server.ts'
    }),
    pages()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
