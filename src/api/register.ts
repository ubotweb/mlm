import { Hono } from 'hono'

const registerApi = new Hono<{ Bindings: Env }>()

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

registerApi.post('/', async (c) => {
  try {
    // Tangkap data dari Native Form Submit
    const body = await c.req.parseBody()
    const username = body.username as string
    const email = body.email as string
    const password = body.password as string
    const fullName = body.fullName as string
    const phone = body.phone as string
    const sponsorId = body.sponsorId as string
    
    const db = c.env.DB

    const existingUser = await db.prepare(
      "SELECT id FROM users WHERE username = ? OR email = ?"
    ).bind(username, email).first()

    if (existingUser) {
      // Kembali ke halaman register dengan pesan error
      return c.redirect('/register?error=Username atau Email sudah digunakan!')
    }

    const hashedPassword = await hashPassword(password)
    const newUserId = crypto.randomUUID()

    let finalSponsorId = null
    if (sponsorId) {
      const sponsor = await db.prepare("SELECT id FROM users WHERE username = ?").bind(sponsorId).first()
      if (sponsor) finalSponsorId = sponsor.id
    }

    await db.prepare(
      `INSERT INTO users (id, username, email, password_hash, full_name, phone, sponsor_id, package_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pkg_starter')`
    ).bind(newUserId, username, email, hashedPassword, fullName, phone, finalSponsorId).run()

    // Redirect ke login dengan notifikasi sukses
    return c.redirect('/login?success=Pendaftaran berhasil, silakan masuk.')

  } catch (error: any) {
    return c.redirect('/register?error=Terjadi kesalahan pada server')
  }
})

export default registerApi
