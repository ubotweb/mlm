import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminBroadcastApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

adminBroadcastApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
  if (decoded.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  c.set('jwtPayload', decoded)
  await next()
})

adminBroadcastApi.get('/', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM broadcasts ORDER BY created_at DESC").all()
  return c.json(results)
})

adminBroadcastApi.post('/', async (c) => {
  const { title, message, targetAudience } = await c.req.json()
  const admin = c.get('jwtPayload')
  
  const adminUser = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(admin.sub).first()
  
  await c.env.DB.prepare(
    "INSERT INTO broadcasts (id, title, message, target_audience, created_by) VALUES (?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), title, message, targetAudience, adminUser!.id).run()
  
  return c.json({ message: 'Broadcast berhasil dikirim' })
})

export default adminBroadcastApi
