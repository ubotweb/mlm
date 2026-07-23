import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const withdrawApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// Middleware proteksi Member Area
withdrawApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
  } catch (err) { 
    return c.redirect('/login') 
  }
  await next()
})

// POST: Proses Pengajuan Penarikan Dana (Withdraw)
withdrawApi.post('/', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  
  try {
    // Membaca form HTML menggunakan formData(), bukan json()
    const formData = await c.req.formData()
    const amount = Number(formData.get('amount'))
    const bankName = String(formData.get('bank_name')).toUpperCase()
    const accountNumber = String(formData.get('account_number'))
    const accountName = String(formData.get('account_name')).toUpperCase()

    // Validasi kelengkapan form
    if (!amount || amount <= 0 || !bankName || !accountNumber || !accountName) {
      throw new Error("Semua kolom formulir wajib diisi dengan format yang benar.")
    }

    // Ambil data user yang mengajukan beserta saldonya
    const user = await db.prepare("SELECT id, balance FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) {
      throw new Error("Sesi pengguna tidak ditemukan. Silakan login kembali.")
    }

    // Ambil batas minimal penarikan dari tabel pengaturan (Default: Rp 50.000)
    const { value: minWithdrawStr } = await db.prepare("SELECT value FROM site_settings WHERE key = 'withdraw_min_amount'").first() || { value: '50000' }
    const minWithdraw = Number(minWithdrawStr) || 50000

    // Validasi batas minimal
    if (amount < minWithdraw) {
      throw new Error(`Minimal penarikan dana adalah Rp ${minWithdraw.toLocaleString('id-ID')}`)
    }

    // Validasi kecukupan saldo
    if (Number(user.balance) < amount) {
      throw new Error("Saldo Anda tidak mencukupi untuk melakukan penarikan ini.")
    }

    // Eksekusi pemotongan saldo dan pencatatan riwayat withdraw menggunakan D1 Batch (Atomic Transaction)
    const withdrawId = crypto.randomUUID()
    
    await db.batch([
      // 1. Potong saldo user saat ini juga
      db.prepare("UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(amount, user.id),
      // 2. Buat tiket antrean penarikan dengan status 'pending'
      db.prepare(`
        INSERT INTO withdrawals (id, user_id, amount, net_amount, bank_name, account_number, account_name, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `).bind(withdrawId, user.id, amount, amount, bankName, accountNumber, accountName)
    ])

    // Redirect kembali ke halaman Withdraw dengan notifikasi sukses hijau
    return c.redirect('/member/withdraw?success=Permintaan+penarikan+dana+berhasil+diajukan+dan+sedang+diproses+admin.')
  } catch (err: any) {
    // Redirect kembali ke halaman Withdraw dengan pesan error merah jika gagal
    return c.redirect(`/member/withdraw?error=${encodeURIComponent(err.message)}`)
  }
})

export default withdrawApi
