import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware Proteksi Khusus Admin
adminProductApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    await next()
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

// GET: Ambil semua produk (termasuk yang tidak aktif)
adminProductApi.get('/', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY created_at DESC").all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Gagal mengambil data produk' }, 500)
  }
})

// POST: Tambah produk baru
adminProductApi.post('/', async (c) => {
  const db = c.env.DB
  try {
    const { name, category, price, member_price, stock, description } = await c.req.json()
    const id = crypto.randomUUID()
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Date.now()

    await db.prepare(
      `INSERT INTO products (id, category, name, slug, description, price, member_price, stock) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, category, name, slug, description, price, member_price, stock).run()

    return c.json({ message: 'Produk berhasil ditambahkan' }, 201)
  } catch (err) {
    return c.json({ error: 'Gagal menambah produk' }, 500)
  }
})

export default adminProductApi
