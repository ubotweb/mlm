import { jsxRenderer } from 'hono/jsx-renderer'
import { Script } from 'honox/server' // 1. Import komponen Script

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - HMM Beauty & Health` : 'HMM Beauty & Health'}</title>
        
        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* 2. INI YANG KURANG: Wajib untuk mengaktifkan JavaScript / Hydration di sisi browser */}
        <Script src="/app/client.ts" async />
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
})
