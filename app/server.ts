import { Hono } from 'hono'
import { createApp } from 'honox/server'
import api from '../src/api/index'

const app = new Hono<{ Bindings: Env }>()

// 1. Backend / API Route
app.route('/api', api)

// 2. Frontend / HonoX Pages (Perbaikan Routing)
const honoxApp = createApp({
  // Baris ini memberi tahu Vite/HonoX untuk mengompilasi semua file di app/routes
  ROUTES: import.meta.glob('/app/routes/**/[a-z[-][a-z[0-9-_]*.(tsx|ts)', { eager: true }),
})

app.route('/', honoxApp)

export default app
