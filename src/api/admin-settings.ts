import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminSettingsApi = new Hono<{ Bindings: Env }>()

adminSettingsApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded: any = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    await next()
  } catch { return c.redirect('/login') }
})

// Update Parameter Bonus MLM & Midtrans
adminSettingsApi.post('/', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody()
    
    for (const [key, value] of Object.entries(body)) {
      await db.prepare(`
        INSERT INTO site_settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).bind(key, String(value)).run()
    }
    
    return c.redirect('/admin/pengaturan?success=Pengaturan+bonus+dan+sistem+berhasil+disimpan')
  } catch (err: any) {
    return c.redirect(`/admin/pengaturan?error=${encodeURIComponent(err.message)}`)
  }
})

export default adminSettingsApi
