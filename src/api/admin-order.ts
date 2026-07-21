import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminOrderApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

adminOrderApi.use('/*', async (c, next) => {
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

// GET: Ambil semua pesanan
adminOrderApi.get('/', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare(`
      SELECT o.id, o.invoice_number, u.username, o.total_amount, o.status, o.created_at, o.tracking_number
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Gagal mengambil data pesanan' }, 500)
  }
})

// POST: Update status resi atau konfirmasi pembayaran manual
adminOrderApi.post('/update', async (c) => {
  const db = c.env.DB
  try {
    const { orderId, status, trackingNumber } = await c.req.json()

    if (trackingNumber) {
      await db.prepare("UPDATE orders SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, trackingNumber, orderId).run()
    } else {
      await db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, orderId).run()
      
      // Jika status diset menjadi 'paid' secara manual, picu antrean kalkulasi bonus MLM
      if (status === 'paid') {
        const order = await db.prepare("SELECT user_id FROM orders WHERE id = ?").bind(orderId).first()
        if (order) {
          await c.env.BONUS_QUEUE.send({
            orderId: orderId,
            userId: order.user_id,
            type: 'calculate_bonus'
          })
        }
      }
    }
    return c.json({ message: 'Pesanan berhasil diupdate' })
  } catch (err) {
    return c.json({ error: 'Gagal mengupdate pesanan' }, 500)
  }
})

export default adminOrderApi
