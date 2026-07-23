import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminActionApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// =========================================================================
// FUNGSI HELPER: Konversi File ke Base64 
// (Kunci Utama pencegah V8 Engine Crash di Cloudflare Worker)
// =========================================================================
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// FUNGSI UPLOAD CLOUDINARY (Anti-Crash & Signed)
async function uploadToCloudinary(file: File, env: any): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Kredensial API Cloudinary tidak ditemukan di pengaturan Environment Variables!")
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const strToSign = `timestamp=${timestamp}${apiSecret}`
  const encoder = new TextEncoder()
  const data = encoder.encode(strToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  // Ektraksi File menjadi teks Base64 untuk menghindari Panic Stream
  const buffer = await file.arrayBuffer()
  const base64 = arrayBufferToBase64(buffer)
  const dataUri = `data:${file.type || 'image/jpeg'};base64,${base64}`

  const fd = new FormData()
  fd.append('file', dataUri) // Dikirim sebagai TEKS, Cloudflare aman 100%
  fd.append('api_key', apiKey)
  fd.append('timestamp', timestamp)
  fd.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: fd
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Upload Cloudinary Gagal: ${errText}`)
  }
  
  const result: any = await res.json()
  return result.secure_url
}
// =========================================================================

// Middleware proteksi Admin
adminActionApi.use('/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded: any = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (decoded.role !== 'admin') return c.redirect('/member')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.redirect('/login')
  }
})

// GET: Ambil daftar withdraw yang masih pending (Untuk kebutuhan fetch via JSON)
adminActionApi.get('/withdrawals/pending', async (c) => {
  const db = c.env.DB
  try {
    const { results } = await db.prepare(`
      SELECT w.id, u.hu_id as username, w.amount, w.net_amount, w.bank_name, w.account_number, w.account_name, w.created_at
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pending'
      ORDER BY w.created_at ASC
    `).all()
    return c.json(results)
  } catch (err) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// POST: Proses Approval / Rejection (Mendukung FormData untuk Upload File)
adminActionApi.post('/withdrawals/process', async (c) => {
  const db = c.env.DB
  const admin = c.get('jwtPayload')
  
  try {
    const formData = await c.req.formData()
    const withdrawId = String(formData.get('withdrawId'))
    const action = String(formData.get('action'))
    const proofFile = formData.get('proof_file')
    
    // Cari admin user berdasarkan hu_id (sub)
    const adminUser = await db.prepare("SELECT id FROM users WHERE hu_id = ?").bind(admin.sub).first()
    const withdraw = await db.prepare("SELECT user_id, amount, status FROM withdrawals WHERE id = ?").bind(withdrawId).first()

    if (!withdraw || withdraw.status !== 'pending') {
      return c.redirect('/admin/laporan?error=Data+withdraw+tidak+valid+atau+sudah+diproses')
    }

    if (action === 'approve') {
      let proofUrl = ''
      
      // Upload file ke Cloudinary menggunakan fungsi helper anti-crash
      if (proofFile && proofFile instanceof File && proofFile.size > 0) {
        proofUrl = await uploadToCloudinary(proofFile, c.env)
      }

      await db.prepare(
        "UPDATE withdrawals SET status = 'completed', processed_by = ?, url_bukti_transfer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(adminUser!.id, proofUrl, withdrawId).run()
      
      return c.redirect('/admin/laporan?success=Withdraw+berhasil+disetujui+dan+telah+ditransfer')
    } 
    
    if (action === 'reject') {
      // Kembalikan saldo user jika ditolak
      await db.batch([
        db.prepare(
          "UPDATE withdrawals SET status = 'rejected', processed_by = ?, notes = 'Ditolak', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(adminUser!.id, withdrawId),
        db.prepare(
          "UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(withdraw.amount, withdraw.user_id)
      ])
      return c.redirect('/admin/laporan?error=Withdraw+ditolak,+saldo+dikembalikan')
    }

    return c.redirect('/admin/laporan?error=Aksi+tidak+dikenal')
  } catch (err: any) {
    return c.redirect(`/admin/laporan?error=${encodeURIComponent(err.message)}`)
  }
})

// ENDPOINT: UPDATE STATUS ORDER 
adminActionApi.post('/update_order', async (c) => {
  const db = c.env.DB
  try {
    const formData = await c.req.formData()
    const orderId = String(formData.get('order_id'))
    const status = String(formData.get('status'))

    if (!orderId || !status) {
      throw new Error("Data order ID atau status tidak lengkap")
    }

    await db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(status, orderId).run()

    return c.redirect('/admin/order?success=Status+transaksi+berhasil+diperbarui')
  } catch (err: any) {
    return c.redirect(`/admin/order?error=${encodeURIComponent(err.message)}`)
  }
})

export default adminActionApi
