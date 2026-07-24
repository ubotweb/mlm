import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminPaketApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware proteksi Admin
adminPaketApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/loginadmin')
  try {
    const decoded: any = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.redirect('/loginadmin')
  }
})

// POST: Tambah Paket Baru
adminPaketApi.post('/create', async (c) => {
  const db = c.env.DB
  try {
    const formData = await c.req.formData()
    const id = 'pkg_' + Date.now().toString()
    const name = String(formData.get('name') || '').trim()
    const price = Number(formData.get('price')) || 0
    const pv = Number(formData.get('pv')) || 0
    const point = Number(formData.get('point')) || 0
    const maxPairing = Number(formData.get('max_pairing_per_day')) || 0
    const maxCashback = Number(formData.get('max_cashback')) || 0
    const roTarget = Number(formData.get('ro_target_per_month')) || 0
    const sponsorLevels = String(formData.get('sponsor_levels') || '[]').trim()

    // Validasi ketat format JSON Array untuk Persentase Sponsor
    try {
      const parsedSponsor = JSON.parse(sponsorLevels)
      if (!Array.isArray(parsedSponsor)) throw new Error("Bukan array")
    } catch {
      throw new Error("Format Persentase Sponsor harus berupa JSON Array, contoh yang benar: [10, 5, 3]")
    }

    if (!name || price <= 0) {
      throw new Error("Nama dan Harga paket tidak boleh kosong atau nol.")
    }

    // Injeksi database dengan paksaan Waktu WIB (UTC+7)
    await db.prepare(`
      INSERT INTO packages (id, name, price, pv, point, max_pairing_per_day, max_cashback, ro_target_per_month, sponsor_levels, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, DATETIME('now', '+7 hours'), DATETIME('now', '+7 hours'))
    `).bind(
      id, name, price, pv, point, maxPairing, maxCashback, roTarget, sponsorLevels
    ).run()

    return c.redirect('/admin/paket?success=Paket+kemitraan+baru+berhasil+ditambahkan')
  } catch (err: any) {
    return c.redirect(`/admin/paket?error=${encodeURIComponent(err.message)}`)
  }
})

// POST: Update Paket
adminPaketApi.post('/update', async (c) => {
  const db = c.env.DB
  try {
    const formData = await c.req.formData()
    const id = String(formData.get('id'))
    const name = String(formData.get('name') || '').trim()
    const price = Number(formData.get('price')) || 0
    const pv = Number(formData.get('pv')) || 0
    const point = Number(formData.get('point')) || 0
    const maxPairing = Number(formData.get('max_pairing_per_day')) || 0
    const maxCashback = Number(formData.get('max_cashback')) || 0
    const roTarget = Number(formData.get('ro_target_per_month')) || 0
    const sponsorLevels = String(formData.get('sponsor_levels') || '[]').trim()
    const isActive = formData.get('is_active') ? 1 : 0

    // Validasi ketat format JSON Array untuk Persentase Sponsor
    try {
      const parsedSponsor = JSON.parse(sponsorLevels)
      if (!Array.isArray(parsedSponsor)) throw new Error("Bukan array")
    } catch {
      throw new Error("Format Persentase Sponsor harus berupa JSON Array, contoh yang benar: [10, 5, 3]")
    }

    // Update database dengan paksaan Waktu WIB (UTC+7)
    await db.prepare(`
      UPDATE packages SET 
      name = ?, price = ?, pv = ?, point = ?, max_pairing_per_day = ?, max_cashback = ?, ro_target_per_month = ?, sponsor_levels = ?, is_active = ?, updated_at = DATETIME('now', '+7 hours')
      WHERE id = ?
    `).bind(
      name, price, pv, point, maxPairing, maxCashback, roTarget, sponsorLevels, isActive, id
    ).run()

    return c.redirect('/admin/paket?success=Data+paket+berhasil+diperbarui')
  } catch (err: any) {
    return c.redirect(`/admin/paket?error=${encodeURIComponent(err.message)}`)
  }
})

// POST: Hapus Paket
adminPaketApi.post('/delete', async (c) => {
  const db = c.env.DB
  try {
    const formData = await c.req.formData()
    const id = String(formData.get('id'))
    
    // Validasi: Jangan hapus jika ada member yang menggunakan paket ini
    const checkUser = await db.prepare("SELECT id FROM users WHERE package_id = ?").bind(id).first()
    if (checkUser) {
        throw new Error("Gagal menghapus! Paket ini sedang digunakan oleh member aktif.")
    }

    await db.prepare("DELETE FROM packages WHERE id = ?").bind(id).run()
    return c.redirect('/admin/paket?success=Paket+berhasil+dihapus+secara+permanen')
  } catch (err: any) {
    return c.redirect(`/admin/paket?error=${encodeURIComponent(err.message)}`)
  }
})

export default adminPaketApi
