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
  } catch (err) { 
    return c.redirect('/login') 
  }
  // PERBAIKAN MUTLAK: Wajib menggunakan return agar Promise Cloudflare tidak nyangkut/crash
  return await next()
})

// =======================================================================================
// MESIN 1: BUAT ORDER PEMBELIAN PAKET (GENERATE INVOICE & SNAP MIDTRANS)
// =======================================================================================
memberPinApi.post('/buy', async (c) => {
  let step = "Inisialisasi Awal";
  let redirectUrl = '/member/pin';

  try {
    step = "Membaca Form Data Buy";
    const formData = await c.req.formData();
    if (formData.get('redirect_url')) redirectUrl = String(formData.get('redirect_url'));
    
    const db = c.env.DB
    const payload = c.get('jwtPayload')
    const packageId = String(formData.get('package_id'))

    step = "Validasi Paket";
    const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").bind(packageId).first()
    if (!pkg) throw new Error("Paket tidak ditemukan")

    step = "Validasi User Login";
    const user = await db.prepare("SELECT id, hu_id, full_name, email, phone FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Akses HU Ditolak")

    step = "Membuat Invoice Baru";
    const orderId = crypto.randomUUID()
    const invoiceNumber = `INV-PIN-${Date.now()}`
    const amount = Number(pkg.price) 
    const pvAmount = Number(pkg.pv)

    step = "Menyimpan ke Tabel Orders";
    await db.prepare(`
      INSERT INTO orders (id, user_id, order_type, total_amount, total_pv, status, payment_method, payment_reference, created_at, updated_at) 
      VALUES (?, ?, 'buy_pin', ?, ?, 'pending', 'Midtrans', ?, DATETIME('now', '+7 hours'), DATETIME('now', '+7 hours'))
    `).bind(orderId, user.id, amount, pvAmount, invoiceNumber).run()

    step = "Menyimpan ke Tabel Order Items";
    await db.prepare(`
      INSERT INTO order_items (id, order_id, package_id, quantity, price_per_item, pv_per_item, created_at) 
      VALUES (?, ?, ?, 1, ?, ?, DATETIME('now', '+7 hours'))
    `).bind(crypto.randomUUID(), orderId, pkg.id, amount, pvAmount).run()

    step = "Mengambil Config Midtrans";
    const { results: settingsData } = await db.prepare("SELECT key, value FROM site_settings WHERE key IN ('midtrans_server_key', 'midtrans_is_production')").all()
    const settings = settingsData.reduce((acc: any, curr: any) => { acc[curr.key] = curr.value; return acc; }, {})
    
    const serverKey = settings.midtrans_server_key || ''
    const isProd = settings.midtrans_is_production === '1'
    const midtransUrl = isProd ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

    if (!serverKey) throw new Error("Kunci API Midtrans belum diatur oleh Administrator.")

    step = "Memanggil API Midtrans";
    const requestUrl = new URL(c.req.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const webhookUrl = `${baseUrl}/api/webhook/payment-callback`

    const authString = btoa(`${serverKey}:`)
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
          finish: `${baseUrl}${redirectUrl}?success=Pembayaran+sedang+diproses.+Silakan+tunggu+beberapa+saat+hingga+PIN+muncul.`,
          unfinish: `${baseUrl}${redirectUrl}?error=Pembayaran+belum+selesai+atau+dibatalkan.`,
          error: `${baseUrl}${redirectUrl}?error=Pembayaran+gagal+dilakukan.`
        }
      })
    })

    step = "Membaca Respon Midtrans";
    const snap = await response.json() as any
    
    if (snap.redirect_url) {
      return c.redirect(snap.redirect_url)
    } else {
      throw new Error("Gagal mendapatkan token pembayaran dari Midtrans.")
    }

  } catch (err: any) {
    console.error(`[BUY ERROR] Tahap: ${step} | Error: ${err.message}`);
    return c.redirect(`${redirectUrl}?error=${encodeURIComponent(`[Tahap: ${step}] ${err.message}`)}`)
  }
})


// =======================================================================================
// MESIN 2: AKTIVASI PIN KE JARINGAN DENGAN SISTEM DEBUGGING EKSTREM
// =======================================================================================
memberPinApi.post('/activate', async (c) => {
  console.log("\n[DEBUG] ==========================================");
  console.log("[DEBUG] MEMULAI PROSES AKTIVASI JARINGAN");
  console.log("[DEBUG] ==========================================\n");

  let step = "Inisialisasi Awal";
  let redirectUrl = '/member/pin';

  try {
    step = "Membaca Form Data Aktivasi";
    const formData = await c.req.formData();
    if (formData.get('redirect_url')) redirectUrl = String(formData.get('redirect_url'));
    
    const db = c.env.DB
    const payload = c.get('jwtPayload')
    
    const pinCode = String(formData.get('pin_code'))
    const newName = String(formData.get('new_full_name'))
    const newPassword = String(formData.get('new_password'))
    const targetUplineHu = String(formData.get('upline_hu_id')).trim()
    const position = String(formData.get('position')).toLowerCase()

    console.log(`[DEBUG] Data Form Diterima:`);
    console.log(`  - PIN Code: ${pinCode}`);
    console.log(`  - Nama: ${newName}`);
    console.log(`  - Target Upline: ${targetUplineHu}`);
    console.log(`  - Posisi: ${position}`);

    step = "Mencari User Login";
    const user = await db.prepare("SELECT id, hu_id FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Sesi pengguna tidak valid.")
    console.log(`[DEBUG] User Login Valid: ID=${user.id}`);
    
    step = "Validasi Kepemilikan PIN";
    const pin = await db.prepare(`
      SELECT p.id, p.package_id, pk.pv, pk.price, pk.sponsor_levels 
      FROM activation_pins p
      JOIN packages pk ON p.package_id = pk.id
      WHERE UPPER(p.pin_code) = UPPER(?) AND p.owner_id = ? AND p.status = 'active'
    `).bind(pinCode, user.id).first()
    if (!pin) throw new Error("PIN tidak valid, sudah terpakai, atau bukan milik Anda.")
    console.log(`[DEBUG] PIN Valid: ID=${pin.id}`);

    step = "Validasi Upline Target";
    const upline = await db.prepare("SELECT id, hu_id FROM users WHERE UPPER(hu_id) = UPPER(?)").bind(targetUplineHu).first()
    if (!upline) throw new Error("ID Upline (Penempatan) tidak ditemukan.")
    console.log(`[DEBUG] Upline Valid: ID=${upline.id}`);

    step = "Validasi Posisi Kaki";
    const checkLeg = await db.prepare("SELECT id FROM users WHERE upline_id = ? AND network_position = ?").bind(upline.id, position).first()
    if (checkLeg) throw new Error(`Kaki ${position.toUpperCase()} pada Upline tersebut sudah terisi.`)
    console.log(`[DEBUG] Kaki Kosong dan Siap Diisi.`);

    step = "Validasi Anti Cross-Line Silsilah";
    let currentId = upline.id
    let isDownline = false
    let crosslineSafetyCounter = 0
    while(currentId && crosslineSafetyCounter < 1000) {
      crosslineSafetyCounter++
      if (currentId === user.id) { isDownline = true; break; }
      const parent = await db.prepare("SELECT upline_id FROM users WHERE id = ?").bind(currentId).first()
      if (parent && parent.upline_id) { currentId = parent.upline_id } else { break; }
    }
    if (!isDownline && upline.id !== user.id) throw new Error("Pelanggaran Cross-Line! Anda hanya bisa meletakkan HU baru di bawah jaringan Anda sendiri.")
    console.log(`[DEBUG] Uji Crossline Lolos. Iterasi: ${crosslineSafetyCounter}`);

    step = "Generate HMMxxxxxxxx Baru";
    const lastUser = await db.prepare("SELECT hu_id FROM users WHERE hu_id LIKE 'HMM%' ORDER BY CAST(SUBSTR(hu_id, 4) AS INTEGER) DESC LIMIT 1").first()
    let nextNum = 1
    if (lastUser && lastUser.hu_id) {
      nextNum = parseInt(String(lastUser.hu_id).replace('HMM', '')) + 1
    }
    const newHuId = `HMM${String(nextNum).padStart(7, '0')}`
    const newUserId = 'usr_' + crypto.randomUUID()
    console.log(`[DEBUG] HU Baru Tercipta: ${newHuId}`);

    step = "Hashing Password Baru";
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(newPassword))
    const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    step = "Eksekusi Insert User Baru";
    await db.prepare(`
      INSERT INTO users (id, hu_id, password_hash, role, full_name, package_id, sponsor_id, upline_id, network_position, status, created_at, updated_at)
      VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?, 'active', DATETIME('now', '+7 hours'), DATETIME('now', '+7 hours'))
    `).bind(newUserId, newHuId, hashedPassword, newName, pin.package_id, user.id, upline.id, position).run()
    console.log(`[DEBUG] Insert User Berhasil`);

    step = "Update Status PIN Terpakai";
    await db.prepare(`UPDATE activation_pins SET status = 'used', used_by_id = ?, used_at = DATETIME('now', '+7 hours') WHERE id = ?`).bind(newUserId, pin.id).run()
    console.log(`[DEBUG] Status PIN Diupdate`);

    step = "Mesin PV Binary Injeksi";
    let currentUpPV = upline.id as string
    let currentPosPV = position
    let pvSafetyCounter = 0
    while (currentUpPV && pvSafetyCounter < 1000) {
      pvSafetyCounter++
      if (currentPosPV === 'left' || currentPosPV === 'kiri') {
        await db.prepare("UPDATE users SET pv_left_today = pv_left_today + ?, reward_pv_left = reward_pv_left + ? WHERE id = ?").bind(pin.pv, pin.pv, currentUpPV).run()
      } else {
        await db.prepare("UPDATE users SET pv_right_today = pv_right_today + ?, reward_pv_right = reward_pv_right + ? WHERE id = ?").bind(pin.pv, pin.pv, currentUpPV).run()
      }
      const parentNode = await db.prepare("SELECT upline_id, network_position FROM users WHERE id = ?").bind(currentUpPV).first()
      if (!parentNode || !parentNode.upline_id) break
      currentUpPV = parentNode.upline_id as string
      currentPosPV = parentNode.network_position as string
    }
    console.log(`[DEBUG] Mesin PV Selesai. Total Node Naik: ${pvSafetyCounter}`);

    step = "Mesin Bonus Sponsor Multi-Generasi";
    let sponsorLevelsPct: number[] = []
    try { sponsorLevelsPct = JSON.parse(String(pin.sponsor_levels)) } catch { sponsorLevelsPct = [10] }

    let currentSponsorId = user.id as string
    let sponsorDepth = 0
    for (let i = 0; i < sponsorLevelsPct.length; i++) {
      sponsorDepth++
      if (!currentSponsorId) break
      const percentage = Number(sponsorLevelsPct[i])
      const bonusAmount = (Number(pin.price) * percentage) / 100

      if (bonusAmount > 0) {
        const commId = 'com_' + crypto.randomUUID()
        await db.prepare(`
          INSERT INTO commissions (id, user_id, source_user_id, type, amount, description, created_at) 
          VALUES (?, ?, ?, 'sponsor', ?, ?, DATETIME('now', '+7 hours'))
        `).bind(commId, currentSponsorId, newUserId, bonusAmount, `Bonus Sponsor Level ${i+1} dari Aktivasi ${newHuId} (${percentage}%)`).run()
        
        await db.prepare("UPDATE users SET balance = balance + ?, updated_at = DATETIME('now', '+7 hours') WHERE id = ?").bind(bonusAmount, currentSponsorId).run()
      }
      
      const nextSp = await db.prepare("SELECT sponsor_id FROM users WHERE id = ?").bind(currentSponsorId).first()
      if (!nextSp || !nextSp.sponsor_id) break
      currentSponsorId = nextSp.sponsor_id as string
    }
    console.log(`[DEBUG] Mesin Sponsor Selesai. Total Kedalaman: ${sponsorDepth}`);

    console.log("[DEBUG] ==========================================");
    console.log("[DEBUG] AKTIVASI SELESAI SEMPURNA");
    console.log("[DEBUG] ==========================================\n");

    return c.redirect(`${redirectUrl}?success=Aktivasi+Sukses!+HU+Baru+Telah+Lahir:+${newHuId}`)
  } catch (err: any) {
    console.error("\n[!!! FATAL DEBUG ERROR !!!]");
    console.error(`Gagal pada tahap : ${step}`);
    console.error(`Pesan Error      : ${err.message}`);
    console.error("[!!! FATAL DEBUG ERROR !!!]\n");

    // Melempar error spesifik ke layar UI Anda
    return c.redirect(`${redirectUrl}?error=${encodeURIComponent(`[Tahap: ${step}] ${err.message}`)}`)
  }
})

export default memberPinApi
