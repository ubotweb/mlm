import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env }>()

// [FUNGSI NATIVE CLOUDINARY UPLOAD]
// Menggunakan Web Crypto murni & FormData C++ Native Cloudflare
async function uploadToCloudinary(file: File, env: Env): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Kredensial Cloudinary (CLOUD_NAME, API_KEY, API_SECRET) tidak ditemukan di Environment Variables!")
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const strToSign = `timestamp=${timestamp}${apiSecret}`
  
  const encoder = new TextEncoder()
  const data = encoder.encode(strToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const cloudinaryFormData = new FormData()
  cloudinaryFormData.append('file', file) // Langsung teruskan Native File Object
  cloudinaryFormData.append('api_key', apiKey)
  cloudinaryFormData.append('timestamp', timestamp)
  cloudinaryFormData.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: cloudinaryFormData
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gagal Upload ke Cloudinary: ${errText}`)
  }
  
  const result: any = await res.json()
  return result.secure_url
}

// 1. ROUTE CREATE PRODUK BARU
adminProductApi.post('/upload', async (c) => {
  // Pengecekan Autentikasi Manual (Mencegah Hono Middleware Crash)
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch { return c.redirect('/login') }

  try {
    const db = c.env.DB
    
    // PERBAIKAN FATAL: Menggunakan Native CF Workers FormData (Bukan Hono parseBody)
    const formData = await c.req.formData()
    
    const fileData = formData.get('image')
    let imageUrl = ''
    
    if (fileData && fileData instanceof File && fileData.size > 0) {
      imageUrl = await uploadToCloudinary(fileData, c.env)
    }

    const id = crypto.randomUUID()
    const nameStr = String(formData.get('name') || '')
    const slug = nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    
    const price = Number(formData.get('price')) || 0
    const memberPrice = Number(formData.get('member_price')) || 0
    const stock = Number(formData.get('stock')) || 0
    const isActive = formData.get('is_active') ? 1 : 0

    await db.prepare(`
      INSERT INTO products (id, category, name, slug, description, price, member_price, stock, bpom_number, halal_number, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, String(formData.get('category') || 'skincare'), nameStr, slug, String(formData.get('description') || ''),
      price, memberPrice, stock,
      String(formData.get('bpom_number') || ''), String(formData.get('halal_number') || ''), imageUrl, isActive
    ).run()

    return c.redirect('/admin/produk?success=Produk+baru+berhasil+ditambahkan')
  } catch (err: any) {
    // Memaksa pengembalian Response Native Web API agar Cloudflare tidak memutus koneksi
    return new Response(`[SYSTEM DEBUG] Terjadi kegagalan saat Upload: ${err.message}`, { status: 500 })
  }
})

// 2. ROUTE UPDATE/EDIT PRODUK
adminProductApi.post('/update', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch { return c.redirect('/login') }

  try {
    const db = c.env.DB
    const formData = await c.req.formData() // NATIVE WEB API
    
    const id = String(formData.get('id'))
    const fileData = formData.get('image')
    
    const price = Number(formData.get('price')) || 0
    const memberPrice = Number(formData.get('member_price')) || 0
    const stock = Number(formData.get('stock')) || 0
    const isActive = formData.get('is_active') ? 1 : 0
    
    let updateQuery = `
      UPDATE products SET 
      category = ?, name = ?, description = ?, price = ?, member_price = ?, 
      stock = ?, bpom_number = ?, halal_number = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    `
    const params: any[] = [
      String(formData.get('category') || 'skincare'), String(formData.get('name') || ''), String(formData.get('description') || ''),
      price, memberPrice, stock,
      String(formData.get('bpom_number') || ''), String(formData.get('halal_number') || ''), isActive
    ]

    if (fileData && fileData instanceof File && fileData.size > 0) {
       const imageUrl = await uploadToCloudinary(fileData, c.env)
       updateQuery += `, image_url = ?`
       params.push(imageUrl)
    }

    updateQuery += ` WHERE id = ?`
    params.push(id)

    await db.prepare(updateQuery).bind(...params).run()
    return c.redirect('/admin/produk?success=Informasi+produk+berhasil+diperbarui')
  } catch (err: any) {
    return new Response(`[SYSTEM DEBUG] Terjadi kegagalan saat Update: ${err.message}`, { status: 500 })
  }
})

// 3. ROUTE DELETE PRODUK
adminProductApi.post('/delete', async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
  } catch { return c.redirect('/login') }

  try {
    const db = c.env.DB
    const formData = await c.req.formData() // NATIVE WEB API
    await db.prepare("DELETE FROM products WHERE id = ?").bind(String(formData.get('id'))).run()
    
    return c.redirect('/admin/produk?success=Produk+berhasil+dihapus+permanen')
  } catch (err: any) {
    return new Response(`[SYSTEM DEBUG] Terjadi kegagalan saat Delete: ${err.message}`, { status: 500 })
  }
})

export default adminProductApi
