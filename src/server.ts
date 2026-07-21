import { Hono } from 'hono'
import { createApp } from 'honox/server'
import api from './api/index'

const app = new Hono<{ Bindings: Env }>()

// 1. Backend / API Route (Terpisah, mencegah akses logic dari frontend langsung)
app.route('/api', api)

// 2. Frontend / HonoX Pages
const honoxApp = createApp()
app.route('/', honoxApp)

export default app
