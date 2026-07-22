import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminBroadcastApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

adminBroadcastApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) { return c.redirect('/login') }
})

adminBroadcastApi.post('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')
  try {
    // Tangkap data menggunakan parseBody (Native HTML Form)
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    
    await db.prepare(
      "INSERT INTO broadcasts (id, title, message, target_audience, created_by) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, body.title as string, body.message as string, body.targetAudience as string, user.sub).run()
    
    return c.redirect('/admin/broadcast?success=Pesan broadcast berhasil didistribusikan')
  } catch (err) {
    return c.redirect('/admin/broadcast?error=Gagal mengirim broadcast, periksa koneksi database.')
  }
})

export default adminBroadcastApi
