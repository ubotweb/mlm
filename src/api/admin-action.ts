import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminActionApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware proteksi Admin
adminActionApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET: Ambil daftar withdraw yang masih pending
adminActionApi.get('/withdrawals/pending', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare(`
      SELECT w.id, u.username, w.amount, w.net_amount, w.bank_name, w.account_number, w.account_name, w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pending'
      ORDER BY w.created_at ASC
    `).all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// POST: Proses Approval / Rejection
adminActionApi.post('/withdrawals/process', async (c) => {
  const db = c.env.DB
  const admin = c.get('jwtPayload')
  
  try {
    const { withdrawId, action } = await c.req.json() // action: 'approve' atau 'reject'
    
    const adminUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(admin.sub).first()
    const withdraw = await db.prepare("SELECT user_id, amount, status FROM withdrawals WHERE id = ?").bind(withdrawId).first()

    if (!withdraw || withdraw.status !== 'pending') {
      return c.json({ error: 'Data withdraw tidak valid atau sudah diproses' }, 400)
    }

    if (action === 'approve') {
      await db.prepare(
        "UPDATE withdrawals SET status = 'completed', processed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(adminUser!.id, withdrawId).run()
      return c.json({ message: 'Withdraw berhasil disetujui' })
    } 
    
    if (action === 'reject') {
      // Kembalikan saldo user jika ditolak
      await db.batch([
        db.prepare(
          "UPDATE withdrawals SET status = 'rejected', processed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(adminUser!.id, withdrawId),
        db.prepare(
          "UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(withdraw.amount, withdraw.user_id)
      ])
      return c.json({ message: 'Withdraw ditolak, saldo dikembalikan' })
    }

    return c.json({ error: 'Aksi tidak dikenal' }, 400)
  } catch (err) {
    return c.json({ error: 'Gagal memproses data' }, 500)
  }
})

export default adminActionApi
