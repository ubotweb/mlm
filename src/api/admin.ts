import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware: Autentikasi & Verifikasi Role Admin
adminApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access only' }, 403)
    }
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// Endpoint Statistik untuk Admin Dashboard
adminApi.get('/stats', async (c) => {
  const db = c.env.DB

  try {
    // Jalankan query secara paralel untuk kecepatan (Batching D1)
    const batch = await db.batch([
      db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'"),
      db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'"),
      db.prepare("SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'"),
      db.prepare("SELECT SUM(amount) as total FROM commissions WHERE status = 'released'")
    ])

    const totalMembers = (batch[0].results[0] as any).count || 0
    const totalSales = (batch[1].results[0] as any).total || 0
    const pendingWithdrawals = (batch[2].results[0] as any).count || 0
    const totalBonuses = (batch[3].results[0] as any).total || 0

    return c.json({
      totalMembers,
      totalSales,
      pendingWithdrawals,
      totalBonuses
    })
  } catch (error) {
    return c.json({ error: 'Database query failed' }, 500)
  }
})

export default adminApi
