import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminSettingsApi = new Hono<{ Bindings: Env }>()

adminSettingsApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
  if (decoded.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  await next()
})

adminSettingsApi.get('/', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT key, value FROM site_settings").all()
  const settingsObj = results.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {})
  return c.json(settingsObj)
})

adminSettingsApi.post('/', async (c) => {
  const body = await c.req.json()
  const statements = Object.entries(body).map(([key, value]) => {
    return c.env.DB.prepare("UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?").bind(String(value), key)
  })
  
  await c.env.DB.batch(statements)
  return c.json({ message: 'Pengaturan berhasil disimpan' })
})

export default adminSettingsApi
