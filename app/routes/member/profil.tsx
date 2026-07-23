import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  // PERBAIKAN: Mengubah pencarian dari username menjadi hu_id
  const user = await db.prepare("SELECT full_name, email, phone, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Profil Saya">
      <div class="max-w-3xl">
        <h3 class="text-2xl font-bold text-white">Profil & Pengaturan</h3>
        <p class="text-[#8B949E] text-sm mt-1 mb-8">Kelola informasi akun, kontak, dan parameter keamanan sistem Anda.</p>

        {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 text-sm font-bold rounded-lg mb-6">{successMsg}</div>}
        {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-sm font-bold rounded-lg mb-6">{errorMsg}</div>}

        <div class="space-y-6">
          
          {/* Card 1: User Info */}
          <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm flex items-center">
            <div class="h-14 w-14 bg-[#1B2A24] border border-[#00E676]/30 text-[#00E676] rounded-full flex items-center justify-center font-black text-2xl mr-4">
              {profile.sub.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-lg font-bold text-white capitalize">{user?.full_name || profile.sub}</h2>
                <span class="bg-[#00E676]/10 text-[#00E676] text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-[#00E676]/30">{profile.role}</span>
              </div>
              <p class="text-xs text-[#8B949E] mt-1">{user?.email} • Ref: {profile.sub.toUpperCase()}</p>
            </div>
          </div>

          {/* Card 2: KYC (Yellow Submit) */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <div class="px-6 py-5 border-b border-[#222731] flex items-center">
              <div class="p-2 bg-[#332A1C] text-yellow-500 rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Informasi Kontak & Wilayah (KYC)</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Data ini wajib dilengkapi untuk kelancaran verifikasi pencairan dana (Withdrawal).</p>
              </div>
            </div>
            <div class="p-6 space-y-5">
              <input type="hidden" name="fullName" value={(user?.full_name as string) || ''} />
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nomor Whatsapp Aktif</label>
                <input type="text" name="phone" defaultValue={(user?.phone as string) || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Alamat Lengkap (Jalan, RT/RW, Patokan)</label>
                <input type="text" defaultValue="" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Provinsi</label>
                  <select class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none"><option>-- Pilih Provinsi Baru --</option></select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Kabupaten / Kota</label>
                  <select class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none"><option>-- Pilih Kabupaten/Kota --</option></select>
                </div>
              </div>
              <div class="pt-2">
                <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors text-sm">SIMPAN INFORMASI KONTAK</button>
              </div>
            </div>
          </form>

          {/* Card 3: Ubah Password (Red Submit) */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <input type="hidden" name="phone" value={(user?.phone as string) || ''} />
            <input type="hidden" name="fullName" value={(user?.full_name as string) || ''} />
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="md:col-span-2">
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Password Saat Ini</label>
                  <input type="password" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Password Baru</label>
                  <input type="password" name="newPassword" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Minimal 6 karakter" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                  <input type="password" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Ulangi password baru" />
                </div>
              </div>
              <button type="submit" class="w-full bg-[#E53935] hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors text-sm">Simpan Perubahan Password</button>
            </div>
          </form>

          {/* Card 4: Ubah Nama (Green Submit) */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <input type="hidden" name="phone" value={(user?.phone as string) || ''} />
            <div class="px-6 py-5 flex items-center border-b border-[#222731]">
              <div class="p-2 bg-[#1B2A24] text-[#00E676] rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Ubah Nama Akun</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Perbarui nama lengkap resmi Anda yang tertera pada sistem.</p>
              </div>
            </div>
            <div class="p-6">
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Lengkap Anda</label>
              <input type="text" name="fullName" defaultValue={(user?.full_name as string) || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none mb-4" />
              <button type="submit" class="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-bold py-3 rounded-lg transition-colors text-sm">Simpan Perubahan Nama</button>
            </div>
          </form>

          {/* Card 5: Email (Blue Submit) */}
          <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
             <div class="px-6 py-5 flex items-center border-b border-[#222731]">
              <div class="p-2 bg-[#1C2333] text-blue-400 rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Perbarui Alamat Email</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Ganti alamat surat elektronik untuk korespondensi dan login sistem.</p>
              </div>
            </div>
            <div class="p-6">
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Alamat Email Baru</label>
              <input type="email" value={user?.email || ''} readOnly class="w-full bg-[#0B0E14] border border-[#2D3342] text-gray-500 rounded-lg px-4 py-3 focus:outline-none mb-4 cursor-not-allowed" />
              <button type="button" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center">
                 Perbarui Alamat Email
              </button>
            </div>
          </div>

        </div>
      </div>
    </MemberLayout>
  )
})
