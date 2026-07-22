import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const checkoutApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware Verifikasi Sesi
checkoutApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) { return c.redirect('/login') }
})

// Proses Order Baru
checkoutApi.post('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')

  try {
    // Tangkap data dari Native Form
    const body = await c.req.parseBody()
    const itemType = body.item_type as string
    const itemId = body.item_id as string
    const subtotal = Number(body.subtotal)
    const shipping = Number(body.shipping)
    const amount = Number(body.amount)
    const paymentMethod = body.payment_method as string
    const shippingAddress = (body.shipping_address as string) || 'Lisensi Sistem Digital'

    // Dapatkan ID User (Karena JWT hanya menyimpan Username/Sub)
    const dbUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(user.sub).first()
    if (!dbUser) return c.redirect('/login')

    const orderId = crypto.randomUUID()
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`

    // Insert ke tabel orders
    await db.prepare(`
      INSERT INTO orders (id, invoice_number, user_id, subtotal, shipping_cost, total_amount, status, payment_method, shipping_address)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      orderId, invoiceNumber, dbUser.id, subtotal, shipping, amount, paymentMethod, shippingAddress
    ).run()

    // Insert ke tabel order_items
    const orderItemId = crypto.randomUUID()
    await db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, quantity, price_at_time)
      VALUES (?, ?, ?, 1, ?)
    `).bind(orderItemId, orderId, itemId, subtotal).run()

    // Redirect otomatis ke Riwayat Pesanan dengan notifikasi sukses
    return c.redirect('/member/order?success=Pesanan berhasil dibuat! Silakan lakukan verifikasi pembayaran.')
  } catch (err) {
    return c.redirect('/member/order?error=Gagal memproses pesanan, silakan coba lagi.')
  }
})

export default checkoutApi
