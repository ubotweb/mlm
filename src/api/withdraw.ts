import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const withdrawApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

withdrawApi.use('/', async (c, next) => {
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

withdrawApi.post('/', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  
  try {
    const body = await c.req.json()
    const { amount, bankName, accountNumber, accountName } = body

    const user = await db.prepare("SELECT id, balance FROM users WHERE username = ?").bind(payload.sub).first()
    
    if (!user) return c.json({ error: 'User tidak ditemukan' }, 404)
    if ((user.balance as number) < amount) {
      return c.json({ error: 'Saldo tidak mencukupi untuk withdraw' }, 400)
    }

    const adminFee = 5000 // Biaya admin flat Rp 5.000
    const netAmount = amount - adminFee

    if (netAmount <= 0) {
      return c.json({ error: 'Nominal withdraw terlalu kecil' }, 400)
    }

    const withdrawId = crypto.randomUUID()

    // Gunakan batch agar balance berkurang bersamaan dengan pembuatan record withdrawal (Atomic)
    await db.batch([
      db.prepare(
        `INSERT INTO withdrawals (id, user_id, amount, admin_fee, net_amount, bank_name, account_number, account_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(withdrawId, user.id, amount, adminFee, netAmount, bankName, accountNumber, accountName),
      
      db.prepare(
        `UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(amount, user.id)
    ])

    return c.json({ message: 'Permintaan Withdraw berhasil diajukan dan menunggu verifikasi Admin.' }, 201)

  } catch (error) {
    return c.json({ error: 'Terjadi kesalahan sistem' }, 500)
  }
})

export default withdrawApi
