import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminMemberApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

adminMemberApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

adminMemberApi.get('/', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.balance, u.status, p.name as package_name, u.created_at
      FROM users u
      LEFT JOIN packages p ON u.package_id = p.id
      WHERE u.role = 'member'
      ORDER BY u.created_at DESC
    `).all()
    
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Gagal mengambil data member' }, 500)
  }
})

export default adminMemberApi
