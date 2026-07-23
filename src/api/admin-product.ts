import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminProductApi = new Hono<{ Bindings: Env }>()

// [SISTEM KEAMANAN AMAN]
// Pengecekan Auth dipindah ke Fungsi Helper untuk mencegah Promise Loss 
// yang sering terjadi pada Middleware Hono saat menangani file stream besar di Cloudflare.
async function checkAdminAuth(c: any): Promise<boolean> {
  const token = getCookie(c, 'auth_token')
  if (!token) return false
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    return decoded.role === 'admin'
  } catch (err) {
    return false
  }
}

// [MESIN UPLOAD CLOUDINARY - KODE NATIVE CLOUDFLARE]
async function uploadToCloudinary(fileData: any, env: Env): Promise<string> {
  try {
    const cloudName = env.CLOUDINARY_CLOUD_NAME
    const apiKey = env.CLOUDINARY_API_KEY
    const apiSecret = env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Kredensial API Cloudinary (CLOUD_NAME, API_KEY, API_SECRET) tidak ditemukan di pengaturan Environment Variables Cloudflare.")
    }

    // Tanda Tangan Keamanan SHA-1 Murni (Web Crypto API)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const strToSign = `timestamp=${timestamp}${apiSecret}`
    const encoder = new TextEncoder()
    const data = encoder.encode(strToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    let nativeBlob: Blob;
    let fileName = 'upload.jpg';

    // Ekstraksi aman: Cegah Error "File is not defined" pada Cloudflare
    if (typeof fileData.arrayBuffer === 'function') {
      const buffer = await fileData.arrayBuffer()
      nativeBlob = new Blob([buffer], { type: fileData.type || 'image/jpeg' })
      fileName = fileData.name || fileName
    } else {
      throw new Error("Format file yang diunggah tidak valid atau rusak.")
    }

    const formData = new FormData()
    formData.append('file', nativeBlob, fileName)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp)
    formData.append('signature', signature)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Respon Cloudinary Gagal: ${errorText}`)
    }
    
    const result: any = await res.json()
    return result.secure_url
  } catch (err: any) {
    throw new Error(`Proses Upload Terhenti: ${err.message}`)
  }
}

// 1. ROUTE CREATE PRODUK (UPLOAD)
adminProductApi.post('/upload', async (c) => {
  try {
    // Autentikasi langsung di dalam handler
    const isAuth = await checkAdminAuth(c)
    if (!isAuth) return c.redirect('/login')

    const db = c.env.DB
    const body = await c.req.parseBody({ all: true })
    const fileData = body['image']
    let imageUrl = ''
    
    // Proses Upload Gambar
    if (fileData && typeof fileData === 'object' && typeof fileData.arrayBuffer === 'function') {
      imageUrl = await uploadToCloudinary(fileData, c.env)
    }

    const id = crypto.randomUUID()
    const nameStr = String(body.name || '')
    const slug = nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4)
    
    // Parsing Angka Aman untuk Database
    const price = Number(body.price) || 0
    const memberPrice = Number(body.member_price) || 0
    const stock = Number(body.stock) || 0
    const isActive = body.is_active ? 1 : 0

    await db.prepare(`
      INSERT INTO products (id, category, name, slug, description, price, member_price, stock, bpom_number, halal_number, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, String(body.category || 'skincare'), nameStr, slug, String(body.description || ''),
      price, memberPrice, stock,
      String(body.bpom_number || ''), String(body.halal_number || ''), imageUrl, isActive
    ).run()

    return c.redirect('/admin/produk?success=Produk+baru+berhasil+ditambahkan+ke+katalog')
  } catch (err: any) {
    // DEBUG LENGKAP: Mengembalikan JSON Debug murni ke layar Anda jika terjadi gagal (Bukan blank page / Error 500)
    return c.json({
      error_status: "CRITICAL_SYSTEM_DEBUG",
      route: "POST /api/admin/produk/upload",
      message: err.message,
      stack: err.stack,
      solution: "Periksa ukuran file, pastikan tabel DB tersedia, dan cek kredensial Cloudinary Anda."
    }, 500)
  }
})

// 2. ROUTE UPDATE PRODUK (EDIT)
adminProductApi.post('/update', async (c) => {
  try {
    const isAuth = await checkAdminAuth(c)
    if (!isAuth) return c.redirect('/login')

    const db = c.env.DB
    const body = await c.req.parseBody({ all: true })
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
      String(body.category || 'skincare'), String(body.name || ''), String(body.description || ''),
      price, memberPrice, stock,
      String(body.bpom_number || ''), String(body.halal_number || ''), isActive
    ]

    // Timpa gambar lama jika Admin mengirimkan gambar baru
    if (fileData && typeof fileData === 'object' && typeof fileData.arrayBuffer === 'function') {
       const imageUrl = await uploadToCloudinary(fileData, c.env)
       updateQuery += `, image_url = ?`
       params.push(imageUrl)
    }

    updateQuery += ` WHERE id = ?`
    params.push(id)

    await db.prepare(updateQuery).bind(...params).run()
    return c.redirect('/admin/produk?success=Informasi+produk+telah+sukses+diperbarui')
  } catch (err: any) {
    return c.json({
      error_status: "CRITICAL_SYSTEM_DEBUG",
      route: "POST /api/admin/produk/update",
      message: err.message,
      stack: err.stack
    }, 500)
  }
})

// 3. ROUTE DELETE PRODUK
adminProductApi.post('/delete', async (c) => {
  try {
    const isAuth = await checkAdminAuth(c)
    if (!isAuth) return c.redirect('/login')

    const db = c.env.DB
    const body = await c.req.parseBody()
    await db.prepare("DELETE FROM products WHERE id = ?").bind(String(body.id)).run()
    return c.redirect('/admin/produk?success=Data+produk+berhasil+dihapus+permanen')
  } catch (err: any) {
    return c.json({
      error_status: "CRITICAL_SYSTEM_DEBUG",
      route: "POST /api/admin/produk/delete",
      message: err.message,
      stack: err.stack
    }, 500)
  }
})

export default adminProductApi
