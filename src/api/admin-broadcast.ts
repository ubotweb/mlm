import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminBroadcastApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// PERBAIKAN: Gunakan '/*' agar mencakup semua sub-route
adminBroadcastApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/loginadmin')
  
  let decoded: any
  try {
    decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch (err) { 
    return c.redirect('/loginadmin') 
  }

  c.set('jwtPayload', decoded)
  // PERBAIKAN MUTLAK: Harus di-return dan diletakkan di luar try..catch agar Promise tidak crash
  return await next()
})

adminBroadcastApi.post('/', async (c) => {
  try {
    const db = c.env.DB
    const user = c.get('jwtPayload')
    
    // Tangkap data menggunakan parseBody (Aman dari crash form)
    const body = await c.req.parseBody()
    const id = crypto.randomUUID()
    
    await db.prepare(
      "INSERT INTO broadcasts (id, title, message, target_audience, created_by, created_at) VALUES (?, ?, ?, ?, ?, DATETIME('now', '+7 hours'))"
    ).bind(id, String(body['title']), String(body['message']), String(body['targetAudience']), user.sub).run()
    
    return c.redirect('/admin/broadcast?success=Pesan+broadcast+berhasil+didistribusikan')
  } catch (err: any) {
    console.error("\n[API ERROR - BROADCAST]", err.message, "\n")
    return c.redirect(`/admin/broadcast?error=${encodeURIComponent(err.message || 'Gagal mengirim broadcast.')}`)
  }
})

export default adminBroadcastApi
