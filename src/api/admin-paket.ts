import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminPaketApi = new Hono<{ Bindings: Env }>()

adminPaketApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch (err) { 
    return c.redirect('/login') 
  }
  await next()
})

// CREATE PAKET BARU
adminPaketApi.post('/', async (c) => {
  try {
    const db = c.env.DB
    const formData = await c.req.formData()
    
    await db.prepare(`
      INSERT INTO packages (id, name, registration_fee, discount_percentage, sponsor_bonus_amount, hu_count, product_count, network_bonus_eligible, leadership_bonus_eligible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      String(formData.get('id')),
      String(formData.get('name')),
      Number(formData.get('registration_fee')) || 0,
      Number(formData.get('discount_percentage')) || 0,
      Number(formData.get('sponsor_bonus_amount')) || 0,
      Number(formData.get('hu_count')) || 1,
      Number(formData.get('product_count')) || 1,
      formData.get('network_bonus_eligible') ? 1 : 0,
      0
    ).run()

    return c.redirect('/admin/paket?success=Paket+Kemitraan+berhasil+ditambahkan')
  } catch (err: any) {
    return c.redirect(`/admin/paket?error=Gagal+menambah+paket.+ID+mungkin+sudah+ada.`)
  }
})

// UPDATE PAKET (EDIT)
adminPaketApi.post('/update', async (c) => {
  try {
    const db = c.env.DB
    const formData = await c.req.formData()
    
    await db.prepare(`
      UPDATE packages SET 
        name = ?, 
        registration_fee = ?, 
        discount_percentage = ?, 
        sponsor_bonus_amount = ?, 
        hu_count = ?, 
        product_count = ?, 
        network_bonus_eligible = ?
      WHERE id = ?
    `).bind(
      String(formData.get('name')),
      Number(formData.get('registration_fee')) || 0,
      Number(formData.get('discount_percentage')) || 0,
      Number(formData.get('sponsor_bonus_amount')) || 0,
      Number(formData.get('hu_count')) || 1,
      Number(formData.get('product_count')) || 1,
      formData.get('network_bonus_eligible') ? 1 : 0,
      String(formData.get('id'))
    ).run()

    return c.redirect('/admin/paket?success=Paket+Kemitraan+berhasil+diperbarui')
  } catch (err: any) {
    return c.redirect(`/admin/paket?error=Gagal+memperbarui+paket`)
  }
})

// HAPUS PAKET
adminPaketApi.post('/delete', async (c) => {
  try {
    const db = c.env.DB
    const formData = await c.req.formData()
    const paketId = String(formData.get('id'))

    const checkUser = await db.prepare("SELECT id FROM users WHERE package_id = ?").bind(paketId).first()
    if (checkUser) {
      return c.redirect('/admin/paket?error=Gagal+menghapus:+Ada+member+yang+sedang+menggunakan+paket+ini.')
    }

    await db.prepare("DELETE FROM packages WHERE id = ?").bind(paketId).run()
    return c.redirect('/admin/paket?success=Paket+berhasil+dihapus+permanen')
  } catch (err) {
    return c.redirect('/admin/paket?error=Terjadi+kesalahan+sistem')
  }
})

export default adminPaketApi
