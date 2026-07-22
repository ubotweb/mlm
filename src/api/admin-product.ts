import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env }>()

// 1. MIDDLEWARE AUTENTIKASI AMAN
adminProductApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  const decoded = await verify(token, c.env.JWT_SECRET, 'HS256').catch(() => null)
  if (!decoded || decoded.role !== 'admin') {
    return c.redirect('/member')
  }
  
  await next()
})

// 2. FUNGSI UPLOAD CLOUDINARY (Konversi File -> Blob Native)
async function uploadToCloudinary(file: File, env: Env): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Kredensial API Cloudinary belum disetting di Environment Variables.")
  }

  // Buat Signature SHA-1 (Web Crypto API)
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const strToSign = `timestamp=${timestamp}${apiSecret}`
  const encoder = new TextEncoder()
  const data = encoder.encode(strToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  // PERBAIKAN FATAL: Ekstrak File Hono menjadi Blob Native Cloudflare
  const fileBuffer = await file.arrayBuffer()
  const nativeBlob = new Blob([fileBuffer], { type: file.type })

  const formData = new FormData()
  formData.append('file', nativeBlob, file.name || 'upload.jpg')
  formData.append('api_key', apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  })

  const result: any = await res.json()
  if (!res.ok) {
    throw new Error(result.error?.message || "Gagal mengunggah gambar ke server Cloudinary")
  }
  return result.secure_url
}

// 3. ROUTE CREATE PRODUK (Diganti menjadi /upload agar URL tidak ambigu)
adminProductApi.post('/upload', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.parseBody({ all: true })
    const fileData = body['image']
    let imageUrl = ''
    
    // Validasi Keberadaan Gambar
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

    return c.redirect('/admin/produk?success=Produk+baru+berhasil+ditambahkan')
  } catch (err: any) {
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

// 4. ROUTE UPDATE/EDIT PRODUK
adminProductApi.post('/update', async (c) => {
  try {
    const db = c.env.DB
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

    // Proses unggah gambar baru jika Admin memilih file
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
    return c.redirect('/admin/produk?success=Data+produk+berhasil+diperbarui')
  } catch (err: any) {
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

// 5. ROUTE DELETE PRODUK
adminProductApi.post('/delete', async (c) => {
  try {
    const db = c.env.DB
    const body = await c.req.parseBody()
    await db.prepare("DELETE FROM products WHERE id = ?").bind(body.id as string).run()
    return c.redirect('/admin/produk?success=Produk+berhasil+dihapus')
  } catch (err: any) {
    return c.redirect(`/admin/produk?error=${encodeURIComponent(err.message)}`)
  }
})

export default adminProductApi
