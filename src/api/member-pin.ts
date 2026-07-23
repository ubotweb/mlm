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

// MESIN 1: GENERATE PIN & CAIRKAN BONUS SPONSOR
memberPinApi.post('/buy', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  const formData = await c.req.formData()
  const packageId = String(formData.get('package_id'))

  try {
    const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").bind(packageId).first()
    if (!pkg) throw new Error("Paket tidak ditemukan")

    const user = await db.prepare("SELECT id, hu_id FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Akses HU Ditolak")

    const huCount = Number(pkg.hu_count) || 1
    const sponsorBonus = Number(pkg.sponsor_bonus_amount) || 0
    
    // Generate PIN Acak per HU dalam paket
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < huCount; i++) {
      let pinCode = `HMM-${pkg.name.toString().substring(0,3).toUpperCase()}-`
      for(let j=0; j<8; j++) pinCode += chars.charAt(Math.floor(Math.random() * chars.length))
      
      const pinId = crypto.randomUUID()
      await db.prepare(`
        INSERT INTO activation_pins (id, pin_code, package_id, purchaser_hu_id, is_used) 
        VALUES (?, ?, ?, ?, 0)
      `).bind(pinId, pinCode, pkg.id, user.hu_id).run()
    }

    // Cairkan Bonus Sponsor Langsung ke Pembeli PIN
    const commId = crypto.randomUUID()
    await db.prepare(`
      INSERT INTO commissions (id, user_id, type, amount, description, status)
      VALUES (?, ?, 'sponsor', ?, ?, 'released')
    `).bind(commId, user.id, sponsorBonus, `Bonus Sponsor Pembelian Paket ${pkg.name}`).run()

    await db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(sponsorBonus, user.id).run()

    return c.redirect('/member/pin?success=Pembelian+Berhasil!+PIN+Tercetak+dan+Bonus+Sponsor+Telah+Masuk.')
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
  const position = String(formData.get('position')) // 'left' atau 'right'

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

    // 6. Eksekusi Aktivasi
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
