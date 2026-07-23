import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const memberPinApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

memberPinApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
  } catch (err) { return c.redirect('/login') }
  await next()
})

// MESIN 1: BUAT ORDER PEMBELIAN PAKET (GENERATE INVOICE & SNAP MIDTRANS)
memberPinApi.post('/buy', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  const formData = await c.req.formData()
  const packageId = String(formData.get('package_id'))

  try {
    const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").bind(packageId).first()
    if (!pkg) throw new Error("Paket tidak ditemukan")

    const user = await db.prepare("SELECT id, hu_id, full_name, email, phone FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Akses HU Ditolak")

    // Buat Invoice Order
    const orderId = crypto.randomUUID()
    const invoiceNumber = `INV-PIN-${Date.now()}`
    const amount = Number(pkg.registration_fee)

    // Menyuntikkan placeholder untuk shipping_address agar lolos validasi NOT NULL database
    await db.prepare(`
      INSERT INTO orders (id, invoice_number, user_id, subtotal, shipping_cost, total_amount, status, payment_method, shipping_address) 
      VALUES (?, ?, ?, ?, 0, ?, 'pending', 'Midtrans', 'Digital PIN (Produk belum diklaim)')
    `).bind(orderId, invoiceNumber, user.id, amount, amount).run()

    await db.prepare(`
      INSERT INTO order_items (id, order_id, package_id, quantity, price_at_time) 
      VALUES (?, ?, ?, 1, ?)
    `).bind(crypto.randomUUID(), orderId, pkg.id, amount).run()

    // Ambil Kunci Midtrans dari Pengaturan
    const { results: settingsData } = await db.prepare("SELECT key, value FROM site_settings WHERE key IN ('midtrans_server_key', 'midtrans_is_production')").all()
    const settings = settingsData.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc; }, {})
    
    const serverKey = settings.midtrans_server_key || ''
    const isProd = settings.midtrans_is_production === '1'
    const midtransUrl = isProd ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!serverKey) throw new Error("Kunci API Midtrans belum diatur oleh Administrator.")

    // === GENERATE WEBHOOK URL OTOMATIS BERDASARKAN DOMAIN SAAT INI ===
    const requestUrl = new URL(c.req.url)
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.host}/api/webhook/payment-callback`

    // Panggil Midtrans Snap API dengan tambahan Header X-Override-Notification
    const authString = btoa(`${serverKey}:`)
    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'X-Override-Notification': webhookUrl // <-- MIDTRANS AKAN OTOMATIS MENEMBAK KE SINI
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
    return c.redirect(`/member/pin?error=${encodeURIComponent(err.message)}`)
  }
})

// MESIN 2: AKTIVASI PIN KE JARINGAN (VALIDASI CROSSLINE)
memberPinApi.post('/activate', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  const formData = await c.req.formData()
  
  const pinCode = String(formData.get('pin_code'))
  const newName = String(formData.get('new_full_name'))
  const newPassword = String(formData.get('new_password'))
  const targetUplineHu = String(formData.get('upline_hu_id')).trim()
  const position = String(formData.get('position'))

  try {
    const user = await db.prepare("SELECT id, hu_id FROM users WHERE hu_id = ?").bind(payload.sub).first()
    
    // 1. Validasi Kepemilikan PIN
    const pin = await db.prepare("SELECT * FROM activation_pins WHERE pin_code = ? AND purchaser_hu_id = ? AND is_used = 0").bind(pinCode, user.hu_id).first()
    if (!pin) throw new Error("PIN tidak valid, sudah terpakai, atau bukan milik Anda.")

    // 2. Validasi Upline Target
    const upline = await db.prepare("SELECT id, hu_id FROM users WHERE hu_id = ?").bind(targetUplineHu).first()
    if (!upline) throw new Error("ID Upline (Penempatan) tidak ditemukan.")

    // 3. Validasi Posisi Kaki
    const checkLeg = await db.prepare("SELECT id FROM users WHERE upline_id = ? AND network_position = ?").bind(upline.id, position).first()
    if (checkLeg) throw new Error(`Kaki ${position.toUpperCase()} pada Upline tersebut sudah terisi.`)

    // 4. Validasi Anti Cross-Line (Pencarian silsilah ke atas)
    let currentId = upline.id
    let isDownline = false
    while(currentId) {
      if (currentId === user.id) { isDownline = true; break; }
      const parent = await db.prepare("SELECT upline_id FROM users WHERE id = ?").bind(currentId).first()
      if (parent && parent.upline_id) { currentId = parent.upline_id } else { break; }
    }
    if (!isDownline && upline.id !== user.id) throw new Error("Pelanggaran Cross-Line! Anda hanya bisa meletakkan HU baru di bawah jaringan Anda sendiri.")

    // 5. Generate HMMxxxxxxxxxx Baru
    const seq = await db.prepare("INSERT INTO hu_sequence DEFAULT VALUES RETURNING id").first()
    const newHuId = `HMM${String(seq.id).padStart(10, '0')}`
    const newUserId = crypto.randomUUID()

    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(newPassword))
    const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // 6. Eksekusi Aktivasi Otomatis Mengunci Level/Paket
    await db.prepare(`
      INSERT INTO users (id, hu_id, password_hash, role, full_name, package_id, sponsor_id, upline_id, network_position)
      VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?)
    `).bind(newUserId, newHuId, hashedPassword, newName, pin.package_id, user.id, upline.id, position).run()

    await db.prepare(`UPDATE activation_pins SET is_used = 1, used_by_hu_id = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(newHuId, pin.id).run()

    return c.redirect(`/member/pin?success=Aktivasi+Sukses!+HU+Baru+Telah+Lahir:+${newHuId}`)
  } catch (err: any) {
    return c.redirect(`/member/pin?error=${encodeURIComponent(err.message)}`)
  }
})

export default memberPinApi
