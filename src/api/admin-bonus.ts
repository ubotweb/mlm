import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminBonusApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware proteksi khusus Admin
adminBonusApi.use('/*', async (c, next) => {
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

// GET: Ambil semua riwayat komisi global
adminBonusApi.get('/', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare(`
      SELECT c.id, u.username as receiver, su.username as source_user, c.type, c.amount, c.status, c.created_at
      FROM commissions c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users su ON c.source_user_id = su.id
      ORDER BY c.created_at DESC
      LIMIT 200
    `).all()
    
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Gagal mengambil laporan bonus' }, 500)
  }
})

export default adminBonusApi
