import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const checkoutApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Pastikan hanya member yang bisa checkout
checkoutApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Harap login terlebih dahulu' }, 401)
  
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Sesi tidak valid' }, 401)
  }
})

checkoutApi.post('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')
  
  try {
    const body = await c.req.json()
    const { items, shippingAddress, subtotal, shippingCost, total } = body

    // Ambil user ID
    const userData = await db.prepare("SELECT id FROM users WHERE username = ?").bind(user.sub).first()
    if (!userData) return c.json({ error: 'User tidak ditemukan' }, 404)

    const orderId = crypto.randomUUID()
    const invoiceNumber = `INV-${Date.now()}`

    // Gunakan transaksi Batch D1 untuk memastikan Header Order dan Items tersimpan semua
    const statements = []

    // 1. Insert Header
    statements.push(
      db.prepare(
        `INSERT INTO orders (id, invoice_number, user_id, subtotal, shipping_cost, total_amount, shipping_address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(orderId, invoiceNumber, userData.id, subtotal, shippingCost, total, shippingAddress)
    )

    // 2. Insert Items
    for (const item of items) {
      statements.push(
        db.prepare(
          `INSERT INTO order_items (id, order_id, product_id, quantity, price_at_time)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(crypto.randomUUID(), orderId, item.id, item.qty, item.price)
      )
    }

    // Eksekusi Batch
    await db.batch(statements)

    // TODO: Integrasi Payment Gateway (Misal Midtrans Snap API)
    // const paymentRes = await fetch(c.env.PAYMENT_GATEWAY_URL + '/transactions', { ... })
    // const paymentData = await paymentRes.json()
    // const paymentUrl = paymentData.redirect_url

    // Simulasi respons sukses (Bypass Payment Gateway untuk testing)
    return c.json({ 
      message: 'Pesanan berhasil dibuat',
      orderId,
      invoiceNumber,
      paymentUrl: null // Ganti dengan URL dari Payment Gateway di production
    })

  } catch (error) {
    console.error(error)
    return c.json({ error: 'Gagal memproses pesanan' }, 500)
  }
})

export default checkoutApi
