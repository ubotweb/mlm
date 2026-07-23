import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const adminActionApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

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
      
      // Proses file bukti transfer
      if (proofFile && typeof proofFile === 'object' && 'name' in proofFile) {
        // [OPSIONAL] Di level production, Anda akan mengunggah file ini ke Cloudflare R2 / AWS S3.
        // Untuk tahap ini, kita menyimulasikan URL dengan menyimpan nama filenya ke kolom url_bukti_transfer
        proofUrl = `/uploads/${(proofFile as File).name}` 
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
