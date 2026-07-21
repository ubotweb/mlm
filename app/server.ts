import { Hono } from 'hono'
import { createApp } from 'honox/server'
// Path import diubah karena posisi file sekarang berada di folder app/
import api from '../src/api/index'

const app = new Hono<{ Bindings: Env }>()

// 1. Backend / API Route 
app.route('/api', api)

// 2. Frontend / HonoX Pages
const honoxApp = createApp()
app.route('/', honoxApp)

export default app
