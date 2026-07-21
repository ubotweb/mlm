import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const networkApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware untuk memastikan hanya member yang login yang bisa melihat jaringannya
networkApi.use('/', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

networkApi.get('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')

  try {
    // Ambil ID user saat ini berdasarkan username di JWT
    const currentUser = await db.prepare("SELECT id, package_id FROM users WHERE username = ?").bind(user.sub).first()
    
    if (!currentUser) {
      return c.json({ error: 'User tidak ditemukan' }, 404)
    }

    // Query CTE Rekursif untuk mengambil kedalaman jaringan (dibatasi 5 level untuk performa)
    const query = `
      WITH RECURSIVE Downlines AS (
        -- Base case: Orang-orang yang upline_id-nya adalah user saat ini
        SELECT id, username, upline_id, package_id, 1 as level
        FROM users
        WHERE upline_id = ?
        
        UNION ALL
        
        -- Recursive step: Cari downline dari downline
        SELECT u.id, u.username, u.upline_id, u.package_id, d.level + 1
        FROM users u
        JOIN Downlines d ON u.upline_id = d.id
        WHERE d.level < 5
      )
      SELECT d.username, p.name as package_name, d.level
      FROM Downlines d
      LEFT JOIN packages p ON d.package_id = p.id
      ORDER BY d.level ASC;
    `
    const { results } = await db.prepare(query).bind(currentUser.id).all()

    // Kembalikan data untuk dirender oleh app/islands/NetworkTree.tsx
    return c.json({ 
      root: user.sub,
      network: results 
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Gagal memuat struktur jaringan' }, 500)
  }
})

export default networkApi
