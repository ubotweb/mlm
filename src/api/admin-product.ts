import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env }>()

// 1. MIDDLEWARE AMAN: Menggunakan "return next()" agar rantai Promise tidak terputus
adminProductApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch (err) {
    return c.redirect('/login')
  }
  
  return next() 
})

// 2. FUNGSI UPLOAD CLOUDINARY (Menggunakan objek File bawaan langsung)
async function uploadToCloudinary(file: File, env: Env): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Kredensial API Cloudinary belum diatur di sistem!")
  }

  // Generate Signature Keamanan Cloudinary (Web Crypto API)
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

  if (!res.ok) {
    const result: any = await res.json().catch(() => ({}))
    throw new Error(result.error?.message || "Gagal mengunggah gambar ke Cloudinary")
  }
  
  const result: any = await res.json()
  return result.secure_url
}

// 3. ROUTE CREATE PRODUK
adminProductApi.post('/upload', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.parseBody() // Tanpa {all: true} mencegah memory leak array
    const fileData = body['image']
    let imageUrl = ''
    
    // Validasi file yang ketat
    if (fileData && typeof fileData !== 'string' && fileData instanceof File && fileData.size > 0) {
      imageUrl = await uploadToCloudinary(fileData, c.env)
    }

    const id = crypto.randomUUID()
    const slug = String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    
    // Konversi statis untuk mencegah D1 Database Crash karena nilai NaN / Undefined
    const price = Number(body.price) || 0
    const memberPrice = Number(body.member_price) || 0
    const stock = Number(body.stock) || 0
    const isActive = body.is_active ? 1 : 0

    await db.prepare(`
      INSERT INTO products (id, category, name, slug, description, price, member_price, stock, bpom_number, halal_number, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, String(body.category), String(body.name), slug, String(body.description || ''),
      price, memberPrice, stock,
      String(body.bpom_number || ''), String(body.halal_number || ''), imageUrl, isActive
    ).run()

    return c.redirect('/admin/produk?success=Produk+baru+berhasil+ditambahkan')
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err)
    // Teks statis mematikan potensi crash dari karakter ilegal di err.message
    return c.redirect('/admin/produk?error=Gagal+menyimpan+produk.+Pastikan+isian+valid.')
  }
})

// 4. ROUTE UPDATE/EDIT PRODUK
adminProductApi.post('/update', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.parseBody()
    const id = String(body.id)
    const fileData = body['image']
    
    const price = Number(body.price) || 0
    const memberPrice = Number(body.member_price) || 0
    const stock = Number(body.stock) || 0
    const isActive = body.is_active ? 1 : 0
    
    let updateQuery = `
      UPDATE products SET 
      category = ?, name = ?, description = ?, price = ?, member_price = ?, 
      stock = ?, bpom_number = ?, halal_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    `
    const params: any[] = [
      String(body.category), String(body.name), String(body.description || ''),
      price, memberPrice, stock,
      String(body.bpom_number || ''), String(body.halal_number || ''), isActive
    ]

    // Proses unggah gambar baru jika Admin memilih file
    if (fileData && typeof fileData !== 'string' && fileData instanceof File && fileData.size > 0) {
       const imageUrl = await uploadToCloudinary(fileData, c.env)
       updateQuery += `, image_url = ?`
       params.push(imageUrl)
    }

    updateQuery += ` WHERE id = ?`
    params.push(id)

    await db.prepare(updateQuery).bind(...params).run()
    return c.redirect('/admin/produk?success=Informasi+produk+berhasil+diperbarui')
  } catch (err: any) {
    console.error("UPDATE ERROR:", err)
    return c.redirect('/admin/produk?error=Gagal+memperbarui+produk')
  }
})

// 5. ROUTE DELETE PRODUK
adminProductApi.post('/delete', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.parseBody()
    await db.prepare("DELETE FROM products WHERE id = ?").bind(String(body.id)).run()
    return c.redirect('/admin/produk?success=Produk+berhasil+dihapus')
  } catch (err: any) {
    console.error("DELETE ERROR:", err)
    return c.redirect('/admin/produk?error=Gagal+menghapus+produk')
  }
})

export default adminProductApi
