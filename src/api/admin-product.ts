import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env }>()

// 1. MIDDLEWARE YANG BENAR UNTUK CLOUDFLARE
adminProductApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    
    // SANGAT PENTING: Harus di-return agar resolve ke Response
    return await next() 
  } catch (err) { return c.redirect('/login') }
})

// 2. FUNGSI UPLOAD CLOUDINARY (Native SHA-1 Web Crypto)
async function uploadToCloudinary(file: File, env: Env): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Kredensial API Cloudinary belum diatur di sistem!")
  }

  // Generate Signature untuk Keamanan Cloudinary
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const strToSign = `timestamp=${timestamp}${apiSecret}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(strToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  })

  const result: any = await res.json()
  if (!res.ok) {
    throw new Error(result.error?.message || "Gagal mengunggah gambar ke Cloudinary")
  }
  return result.secure_url
}

// 3. HANDLER CREATE PRODUK BARU
adminProductApi.post('/', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody({ all: true }) // Izinkan parsing file
    const fileData = body['image']
    let imageUrl = ''
    
    // Pastikan validasi bahwa file benar-benar dipilih
    if (fileData && typeof fileData !== 'string') {
      const f = Array.isArray(fileData) ? fileData[0] : fileData
      if (f instanceof File && f.size > 0) {
        imageUrl = await uploadToCloudinary(f, c.env)
      }
    }

    const id = crypto.randomUUID()
    const slug = (body.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)

    await db.prepare(`
      INSERT INTO products (id, category, name, slug, description, price, member_price, stock, bpom_number, halal_number, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.category as string, body.name as string, slug, body.description as string,
      Number(body.price), Number(body.member_price), Number(body.stock),
      body.bpom_number as string, body.halal_number as string, imageUrl,
      body.is_active ? 1 : 0
    ).run()

    return c.redirect('/admin/produk?success=Produk berhasil ditambahkan ke katalog.')
  } catch (err: any) {
    // encodeURIComponent WAJIB MENCEGAH HEADER ERROR 500
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

// 4. HANDLER UPDATE/EDIT PRODUK
adminProductApi.post('/update', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody({ all: true })
    const id = body.id as string
    const fileData = body['image']
    
    let updateQuery = `
      UPDATE products SET 
      category = ?, name = ?, description = ?, price = ?, member_price = ?, 
      stock = ?, bpom_number = ?, halal_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    `
    const params: any[] = [
      body.category as string, body.name as string, body.description as string,
      Number(body.price), Number(body.member_price), Number(body.stock),
      body.bpom_number as string, body.halal_number as string, body.is_active ? 1 : 0
    ]

    if (fileData && typeof fileData !== 'string') {
      const f = Array.isArray(fileData) ? fileData[0] : fileData
      if (f instanceof File && f.size > 0) {
         const imageUrl = await uploadToCloudinary(f, c.env)
         updateQuery += `, image_url = ?`
         params.push(imageUrl)
      }
    }

    updateQuery += ` WHERE id = ?`
    params.push(id)

    await db.prepare(updateQuery).bind(...params).run()
    return c.redirect('/admin/produk?success=Informasi produk berhasil diperbarui.')
  } catch (err: any) {
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

// 5. HANDLER DELETE PRODUK
adminProductApi.post('/delete', async (c) => {
  const db = c.env.DB
  try {
    const body = await c.req.parseBody()
    await db.prepare("DELETE FROM products WHERE id = ?").bind(body.id as string).run()
    return c.redirect('/admin/produk?success=Produk berhasil dihapus selamanya.')
  } catch (err: any) {
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

export default adminProductApi
