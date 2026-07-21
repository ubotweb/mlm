import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const orderApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

orderApi.use('/', async (c, next) => {
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

orderApi.get('/', async (c) => {
  const db = c.env.DB
  const user = c.get('jwtPayload')

  try {
    const currentUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(user.sub).first()
    if (!currentUser) return c.json({ error: 'User tidak ditemukan' }, 404)

    // Ambil data order beserta item produknya (menggunakan JSON_GROUP_ARRAY di SQLite)
    const query = `
      SELECT o.id, o.invoice_number, o.total_amount, o.status, o.created_at, o.tracking_number,
             json_group_array(json_object('name', p.name, 'qty', oi.quantity, 'price', oi.price_at_time)) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    const { results } = await db.prepare(query).bind(currentUser.id).all()
    
    // Parse JSON string kembali menjadi object
    const formattedResults = results.map((row: any) => ({
      ...row,
      items: JSON.parse(row.items)
    }))

    return c.json(formattedResults)
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data pesanan' }, 500)
  }
})

export default orderApi
