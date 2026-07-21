import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const bonusApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

bonusApi.use('/', async (c, next) => {
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

bonusApi.get('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')

  try {
    const currentUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(user.sub).first()
    if (!currentUser) return c.json({ error: 'User tidak ditemukan' }, 404)

    // Ambil riwayat bonus, urutkan dari yang terbaru
    const { results } = await db.prepare(
      `SELECT type, amount, status, created_at, description 
       FROM commissions 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 50`
    ).bind(currentUser.id).all()

    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data bonus' }, 500)
  }
})

export default bonusApi
