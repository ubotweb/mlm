import { Hono } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'

const profileApi = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// MIDDLEWARE: Proteksi sesi Member
profileApi.use('*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.redirect('/login')
  }
})

// ENDPOINT: Update Pengaturan Profil (Nama, Nomor HP, Password)
profileApi.post('/update', async (c) => {
  const db = c.env.DB
  const payload = c.get('jwtPayload')
  
  try {
    const formData = await c.req.formData()
    const fullName = String(formData.get('fullName') || '').trim()
    let phone = String(formData.get('phone') || '').trim()
    const newPassword = String(formData.get('newPassword') || '').trim()

    // ==============================================================
    // MESIN STANDARISASI NOMOR WHATSAPP (Format Internasional: 62)
    // ==============================================================
    if (phone) {
      // 1. Bersihkan semua karakter selain angka (menghapus +, spasi, strip, dll)
      phone = phone.replace(/\D/g, '')
      
      // 2. Jika nomor dimulai dengan angka 0, ubah menjadi 62
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1)
      }
    }

    // Ambil ID User dari database berdasarkan HU_ID yang ada di JWT
    const user = await db.prepare("SELECT id FROM users WHERE hu_id = ?").bind(payload.sub).first()
    if (!user) throw new Error("Akses Ditolak: Hak Usaha tidak ditemukan.")

    // PROSES 1: Update Nama & Nomor HP (KYC)
    // Walaupun formnya terpisah, kita menangkap nilai yang di-passing melalui <input type="hidden">
    if (fullName || phone) {
       await db.prepare("UPDATE users SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
         .bind(fullName, phone, user.id).run()
    }

    // PROSES 2: Update Password (Hanya dieksekusi jika form password diisi)
    if (newPassword) {
       if (newPassword.length < 6) {
         throw new Error("Password baru minimal harus terdiri dari 6 karakter.")
       }

       // Hash password baru ke format SHA-256 agar sepadan dengan sistem login
       const encoder = new TextEncoder()
       const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(newPassword))
       const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
       
       await db.prepare("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
         .bind(hashedPassword, user.id).run()
    }

    // Redirect kembali ke halaman Profil dengan parameter sukses
    return c.redirect('/member/profil?success=Profil+dan+pengaturan+keamanan+berhasil+diperbarui!')
    
  } catch (err: any) {
    // Redirect kembali ke halaman Profil dengan peringatan error
    return c.redirect(`/member/profil?error=${encodeURIComponent(err.message)}`)
  }
})

export default profileApi
