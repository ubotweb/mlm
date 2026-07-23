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
  const user = await db.prepare("SELECT id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  const { results: pins } = await db.prepare(`
    SELECT a.*, p.name as package_name 
    FROM activation_pins a 
    JOIN packages p ON a.package_id = p.id 
    WHERE a.purchaser_hu_id = ? 
    ORDER BY a.is_used ASC, a.created_at DESC
  `).bind(profile.sub).all()

  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY registration_fee ASC").all()

  const errorMsg = c.req.query('error')
  const successMsg = c.req.query('success')

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Brankas PIN">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Brankas PIN & Aktivasi</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Beli paket untuk mencetak PIN Hak Usaha, dan aktivasi PIN untuk menempatkan jaringan.</p>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form Beli Paket & Aktivasi */}
        <div class="xl:col-span-1 space-y-6">
          
          <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
            <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
              <h4 class="font-black text-white text-sm uppercase tracking-widest text-emerald-400">Beli Paket (Cetak PIN)</h4>
            </div>
            <form method="POST" action="/api/member/pin/buy" class="p-6 space-y-4">
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Pilih Paket Kemitraan</label>
                <select name="package_id" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm font-bold cursor-pointer">
                  {packages.map((p: any) => (
                    <option value={p.id}>{p.name} - Rp {p.registration_fee.toLocaleString('id-ID')} ({p.hu_count} HU)</option>
                  ))}
                </select>
              </div>
              <button type="submit" onsubmit="return confirm('Simulasi: Potong Saldo / Beli PIN?');" class="w-full bg-emerald-600 hover:bg-emerald-500 text-[#0B0E14] font-black py-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs">
                Cetak PIN Baru
              </button>
            </form>
          </div>

          <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
            <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
              <h4 class="font-black text-white text-sm uppercase tracking-widest text-blue-400">Aktivasi PIN ke Jaringan</h4>
            </div>
            <form method="POST" action="/api/member/pin/activate" class="p-6 space-y-4">
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Kode PIN</label>
                <input type="text" name="pin_code" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 font-mono text-sm uppercase" placeholder="HMM-XXX-XXXX" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Lengkap Member Baru</label>
                <input type="text" name="new_full_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 text-sm" placeholder="Nama Calon Mitra" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Kata Sandi Akun Baru</label>
                <input type="password" name="new_password" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 text-sm" placeholder="Minimal 6 Karakter" />
              </div>
              <div class="border-t border-[#222731] pt-4 mt-2">
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Penempatan Upline (HU Target)</label>
                <input type="text" name="upline_hu_id" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 font-mono text-sm uppercase" placeholder="HMM00000000XX" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Posisi Kaki</label>
                <select name="position" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 text-sm font-bold cursor-pointer">
                  <option value="left">Kiri (Left)</option>
                  <option value="right">Kanan (Right)</option>
                </select>
              </div>
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-2 transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">
                Eksekusi Aktivasi
              </button>
            </form>
          </div>

        </div>

        {/* Kolom Kanan: Tabel Brankas PIN */}
        <div class="xl:col-span-2 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Daftar PIN Milik Anda</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Kode PIN</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Paket Lisensi</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Status / Terpakai Oleh</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {pins.length === 0 ? (
                  <tr><td colSpan={3} class="px-6 py-8 text-center text-[#8B949E] font-medium">Brankas PIN kosong. Silakan beli paket untuk mencetak PIN.</td></tr>
                ) : pins.map((p: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-5 py-5">
                      <p class={`font-black font-mono tracking-widest ${p.is_used ? 'text-gray-500 line-through' : 'text-emerald-400 text-base'}`}>{p.pin_code}</p>
                      <p class="text-[9px] text-[#8B949E] font-bold mt-1">Dicetak: {new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td class="px-5 py-5">
                      <p class="font-bold text-white uppercase tracking-wider text-xs">{p.package_name}</p>
                    </td>
                    <td class="px-5 py-5">
                      {p.is_used ? (
                        <div>
                          <span class="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-1 rounded uppercase font-black tracking-widest">Terpakai</span>
                          <p class="text-[10px] text-blue-400 font-mono font-bold mt-2">HU: {p.used_by_hu_id}</p>
                        </div>
                      ) : (
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-1 rounded uppercase font-black tracking-widest">Tersedia</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MemberLayout>
  )
})
