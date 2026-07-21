import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const profileApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware
profileApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.redirect('/login')
  }
})

// Fungsi Helper Hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

profileApi.post('/update', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')
  
  try {
    // Tangkap dari Native Form
    const body = await c.req.parseBody()
    const fullName = body.fullName as string
    const phone = body.phone as string
    const newPassword = body.newPassword as string
    
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword)
      await db.prepare("UPDATE users SET full_name = ?, phone = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?")
        .bind(fullName, phone, hashedPassword, user.sub).run()
    } else {
      await db.prepare("UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?")
        .bind(fullName, phone, user.sub).run()
    }

    return c.redirect('/member/profil?success=Profil berhasil diperbarui')
  } catch (err) {
    return c.redirect('/member/profil?error=Gagal memperbarui profil')
  }
})

export default profileApi
