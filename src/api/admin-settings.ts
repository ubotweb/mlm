import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminSettingsApi = new Hono<{ Bindings: Env }>()

adminSettingsApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    await next()
  } catch (err) { return c.redirect('/login') }
})

adminSettingsApi.post('/', async (c) => {
  const db = c.env.DB
  try {
    // Tangkap data Form
    const body = await c.req.parseBody()
    
    // Loop dan perbarui seluruh key yang disubmit ke database
    for (const [key, value] of Object.entries(body)) {
      await db.prepare(
        "UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?"
      ).bind(value as string, key).run()
    }
    
    return c.redirect('/admin/pengaturan?success=Pengaturan website berhasil disimpan')
  } catch (err) {
    return c.redirect('/admin/pengaturan?error=Gagal menyimpan pengaturan')
  }
})

export default adminSettingsApi
