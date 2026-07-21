import { jsxRenderer } from 'hono/jsx-renderer'
import { HasIslands } from 'honox/server'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - HMM Beauty & Health` : 'HMM Beauty & Health'}</title>
        {/* Tailwind CSS CDN (Production Ready) */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* HonoX Islands Client Injection */}
        <HasIslands />
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
})
