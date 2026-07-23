import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const checkoutApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

checkoutApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
  } catch (err) { return c.redirect('/login') }
  await next()
})

// MESIN CHECKOUT REPEAT ORDER (RO) - MIRIP DENGAN CETAK PIN
checkoutApi.post('/ro', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  const formData = await c.req.formData()
  const productId = String(formData.get('product_id'))

  try {
    // 1. Ambil Data Produk
    const product = await db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").bind(productId).first()
    if (!product) throw new Error("Produk tidak ditemukan atau tidak aktif.")

    // 2. Ambil Data User
    const user = await db.prepare("SELECT id, hu_id, full_name, email, phone FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Akses HU Ditolak")

    // 3. Buat Invoice Order
    const orderId = crypto.randomUUID()
    const invoiceNumber = `INV-RO-${Date.now()}`
    const amount = Number(product.member_price) // Menggunakan harga khusus member

    // Masukkan placeholder alamat untuk mencegah Error D1 NOT NULL
    await db.prepare(`
      INSERT INTO orders (id, invoice_number, user_id, subtotal, shipping_cost, total_amount, status, payment_method, shipping_address) 
      VALUES (?, ?, ?, ?, 0, ?, 'pending', 'Midtrans', 'Alamat Pengiriman Default (Update via Request)')
    `).bind(orderId, invoiceNumber, user.id, amount, amount).run()

    await db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, quantity, price_at_time) 
      VALUES (?, ?, ?, 1, ?)
    `).bind(crypto.randomUUID(), orderId, product.id, amount).run()

    // 4. Konfigurasi API Midtrans
    const { results: settingsData } = await db.prepare("SELECT key, value FROM site_settings WHERE key IN ('midtrans_server_key', 'midtrans_is_production')").all()
    const settings = settingsData.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc; }, {})
    
    const serverKey = settings.midtrans_server_key || ''
    const isProd = settings.midtrans_is_production === '1'
    const midtransUrl = isProd ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!serverKey) throw new Error("Kunci API Midtrans belum diatur oleh Administrator.")

    // 5. URL Dinamis & Override Notifikasi
    const requestUrl = new URL(c.req.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const webhookUrl = `${baseUrl}/api/webhook/payment-callback`
    const authString = btoa(`${serverKey}:`)

    // 6. Hit Midtrans Snap
    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'X-Override-Notification': webhookUrl
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: invoiceNumber,
          gross_amount: amount
        },
        customer_details: {
          first_name: user.full_name,
          email: user.email || 'noemail@hmmbeauty.com',
          phone: user.phone || '08000000000'
        },
        callbacks: {
          finish: `${baseUrl}/member/order?success=Pembayaran+RO+Sukses.+Menunggu+proses+pengiriman.`,
          unfinish: `${baseUrl}/member/belanja?error=Pembayaran+Repeat+Order+belum+diselesaikan.`,
          error: `${baseUrl}/member/belanja?error=Terjadi+kesalahan+saat+pembayaran+RO.`
        }
      })
    })

    const snap = await response.json()
    
    if (snap.redirect_url) {
      return c.redirect(snap.redirect_url)
    } else {
      throw new Error("Gagal mendapatkan token pembayaran dari Midtrans. Periksa konfigurasi API Key.")
    }

  } catch (err: any) {
    return c.redirect(`/member/belanja?error=${encodeURIComponent(err.message)}`)
  }
})

export default checkoutApi
