import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminPaketApi = new Hono<{ Bindings: Env }>()

adminPaketApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    await next()
  } catch (err) { return c.redirect('/login') }
})

// CREATE PAKET BARU
adminPaketApi.post('/', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody()
    
    await db.prepare(`
      INSERT INTO packages (id, name, registration_fee, discount_percentage, sponsor_bonus_amount, network_bonus_eligible, leadership_bonus_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.id as string,
      body.name as string,
      Number(body.registration_fee),
      Number(body.discount_percentage),
      Number(body.sponsor_bonus_amount),
      body.network_bonus_eligible ? 1 : 0,
      body.leadership_bonus_eligible ? 1 : 0
    ).run()

    return c.redirect('/admin/paket?success=Paket berhasil ditambahkan')
  } catch (err) {
    return c.redirect('/admin/paket?error=Gagal menambah paket. ID Paket mungkin sudah ada.')
  }
})

// HAPUS PAKET
adminPaketApi.post('/delete', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody()
    const paketId = body.id as string

    // Pastikan untuk mencegah penghapusan jika ada user yang menggunakan paket ini
    const checkUser = await db.prepare("SELECT id FROM users WHERE package_id = ?").bind(paketId).first()
    if (checkUser) {
      return c.redirect('/admin/paket?error=Gagal menghapus: Ada member yang sedang menggunakan paket ini.')
    }

    await db.prepare("DELETE FROM packages WHERE id = ?").bind(paketId).run()
    return c.redirect('/admin/paket?success=Paket berhasil dihapus')
  } catch (err) {
    return c.redirect('/admin/paket?error=Terjadi kesalahan saat menghapus paket.')
  }
})

export default adminPaketApi
