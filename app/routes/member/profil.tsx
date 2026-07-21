import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } 
  catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  
  // Tarik data profil langsung secara SSR! Tidak ada lagi loading blank
  const user = await db.prepare("SELECT balance, full_name, phone FROM users WHERE username = ?").bind(profile.sub).first()
  
  // Tangkap parameter query dari API jika ada sukses/error
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Profil Saya">
      <div class="max-w-4xl">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Profil & Pengaturan</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-8">Kelola informasi akun, kontak, dan parameter keamanan sistem Anda.</p>
        
        {/* Notifikasi Sistem */}
        {successMsg && <div class="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 p-4 rounded-lg mb-6 font-bold text-sm border border-emerald-200 dark:border-emerald-800">{successMsg}</div>}
        {errorMsg && <div class="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6 font-bold text-sm border border-red-200 dark:border-red-800">{errorMsg}</div>}

        <div class="space-y-6">
          {/* Header Info Card */}
          <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-6 shadow-sm flex items-center">
            <div class="h-14 w-14 bg-emerald-100 dark:bg-[#1B2A24] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-2xl mr-4">
              {profile.sub.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white capitalize">{profile.sub}</h2>
                <span class="bg-emerald-100 dark:bg-[#1B2A24] text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-200 dark:border-emerald-800/50">{profile.role}</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Sistem Keamanan Aktif</p>
            </div>
          </div>

          {/* Main Settings Form (Method POST, Tanpa JS Klien) */}
          <form method="POST" action="/api/member/settings/update" class="space-y-6">
            
            {/* Identitas Section */}
            <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
              <div class="bg-gray-50 dark:bg-[#1A1E26] px-6 py-4 border-b border-gray-200 dark:border-[#222731] flex items-center">
                <div class="p-2 bg-blue-100 dark:bg-[#1C2333] text-blue-600 dark:text-blue-400 rounded-full mr-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900 dark:text-white text-sm">Informasi Kontak & Wilayah (KYC)</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Data ini wajib dilengkapi untuk kelancaran verifikasi.</p>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap (Sesuai KTP)</label>
                  {/* Gunakan defaultValue agar nilai lama otomatis terisi dari DB */}
                  <input type="text" name="fullName" defaultValue={(user?.full_name as string) || ''} class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nomor WhatsApp Aktif</label>
                  <input type="text" name="phone" defaultValue={(user?.phone as string) || ''} class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium" />
                </div>
                <button type="submit" class="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold py-3 rounded-lg transition-colors">
                  SIMPAN INFORMASI KONTAK
                </button>
              </div>
            </div>

            {/* Keamanan Section */}
            <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
              <div class="bg-gray-50 dark:bg-[#1A1E26] px-6 py-4 border-b border-gray-200 dark:border-[#222731]">
                <h4 class="font-bold text-gray-900 dark:text-white text-sm">Keamanan & Password</h4>
              </div>
              <div class="p-6">
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Password Baru</label>
                <input type="password" name="newPassword" class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 mb-4" placeholder="Kosongkan jika tidak ingin ganti" />
                <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-600/20">
                  UBAH PASSWORD
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MemberLayout>
  )
})
