import { Hono } from 'hono'

const registerApi = new Hono<{ Bindings: Env }>()

// Fungsi Helper untuk Hashing Password dengan Web Crypto API (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

registerApi.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { username, email, password, fullName, phone, sponsorId } = body
    
    const db = c.env.DB

    // 1. Validasi apakah username / email sudah terdaftar
    const existingUser = await db.prepare(
      "SELECT id FROM users WHERE username = ? OR email = ?"
    ).bind(username, email).first()

    if (existingUser) {
      return c.json({ error: 'Username atau Email sudah digunakan!' }, 400)
    }

    // 2. Hash Password
    const hashedPassword = await hashPassword(password)
    const newUserId = crypto.randomUUID() // Built-in Cloudflare Workers UUID

    // 3. Validasi Sponsor (Jika Ada)
    let finalSponsorId = null
    if (sponsorId) {
      const sponsor = await db.prepare("SELECT id FROM users WHERE username = ?").bind(sponsorId).first()
      if (sponsor) {
        finalSponsorId = sponsor.id
      }
    }

    // 4. Masukkan ke Database (Default paket Starter jika belum bayar)
    await db.prepare(
      `INSERT INTO users (id, username, email, password_hash, full_name, phone, sponsor_id, package_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pkg_starter')`
    ).bind(newUserId, username, email, hashedPassword, fullName, phone, finalSponsorId).run()

    return c.json({ message: 'Registrasi berhasil', userId: newUserId }, 201)

  } catch (error: any) {
    return c.json({ error: 'Terjadi kesalahan pada server' }, 500)
  }
})

export default registerApi
