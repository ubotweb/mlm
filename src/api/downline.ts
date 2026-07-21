import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const downlineApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

downlineApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

downlineApi.get('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')

  try {
    const currentUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(user.sub).first()
    
    // Ambil daftar user yang diajak langsung oleh member ini (Sponsor ID)
    const { results } = await db.prepare(`
      SELECT u.username, u.full_name, u.phone, u.status, p.name as package_name, u.created_at
      FROM users u
      LEFT JOIN packages p ON u.package_id = p.id
      WHERE u.sponsor_id = ?
      ORDER BY u.created_at DESC
    `).bind(currentUser!.id).all()

    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data downline' }, 500)
  }
})

export default downlineApi
