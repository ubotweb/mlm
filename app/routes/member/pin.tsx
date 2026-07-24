import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } catch (err) { return c.redirect('/login') }

  try {
    const db = c.env.DB
    const user = await db.prepare("SELECT id, hu_id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
    if (!user) return c.redirect('/login')

    // PERBAIKAN FATAL 1: Kolom registration_fee sudah tidak ada di skema PV baru, gunakan 'price'.
    const { results: packages } = await db.prepare("SELECT id, name, price FROM packages WHERE is_active = 1 ORDER BY price ASC").all()

    // PERBAIKAN FATAL 2: Menyesuaikan kueri dengan kolom tabel activation_pins yang baru (owner_id, status, used_by_id).
    const { results: pins } = await db.prepare(`
      SELECT p.pin_code, p.status, p.created_at, p.used_at, pk.name as package_name, u.hu_id as used_by
      FROM activation_pins p
      JOIN packages pk ON p.package_id = pk.id
      LEFT JOIN users u ON p.used_by_id = u.id
      WHERE p.owner_id = ?
      ORDER BY p.created_at DESC
    `).bind(user.id).all()

    const activePins = pins.filter((p: any) => p.status === 'active')
    const successMsg = c.req.query('success')
    const errorMsg = c.req.query('error')

    return c.render(
      <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Brankas PIN">
        <div class="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h2 class="text-3xl font-black text-white">Brankas PIN & Aktivasi</h2>
            <p class="text-[#8B949E] text-sm mt-1 font-medium">Kelola PIN Anda dan daftarkan downline baru langsung ke jaringan.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <button onclick="document.getElementById('activateModal').showModal()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 text-sm whitespace-nowrap cursor-pointer flex items-center justify-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              Aktivasi Downline
            </button>
            <button onclick="document.getElementById('buyPinModal').showModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-sm whitespace-nowrap cursor-pointer flex items-center justify-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Beli PIN Baru
            </button>
          </div>
        </div>

        {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
        {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#1A1E26]">
                <tr>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Kode PIN</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Paket</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal Beli</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Digunakan Oleh</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {pins.length === 0 ? (
                  <tr><td colSpan={5} class="px-6 py-10 text-center text-[#8B949E] font-bold">Anda belum memiliki PIN Aktivasi di Brankas.</td></tr>
                ) : pins.map((pin: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center space-x-3">
                        <span id={`pin-${pin.pin_code}`} class="font-mono text-emerald-400 font-bold tracking-widest">{pin.pin_code}</span>
                        {pin.status === 'active' && (
                          <button type="button" onclick={`navigator.clipboard.writeText('${pin.pin_code}'); alert('PIN berhasil disalin!')`} class="text-[#8B949E] hover:text-white cursor-pointer" title="Salin PIN">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td class="px-6 py-4 font-bold text-white">{pin.package_name}</td>
                    <td class="px-6 py-4">
                      <span class={`inline-block px-2.5 py-1 text-[10px] rounded border font-black uppercase tracking-widest ${pin.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-[#222731] text-gray-500 border-gray-700'}`}>
                        {pin.status === 'active' ? 'Tersedia' : 'Terpakai'}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs text-[#8B949E] font-mono">{new Date(pin.created_at).toLocaleString('id-ID')}</td>
                    <td class="px-6 py-4">
                      {pin.status === 'used' ? (
                        <div>
                          <p class="text-white font-bold">{pin.used_by}</p>
                          <p class="text-[10px] text-[#8B949E] mt-0.5 font-mono">{new Date(pin.used_at).toLocaleString('id-ID')}</p>
                        </div>
                      ) : (
                        <span class="text-gray-600 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: PEMBELIAN PIN (MIDTRANS SNAP) */}
        <dialog id="buyPinModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-md backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
          <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
            <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
              <h4 class="font-black text-white text-sm uppercase tracking-widest text-blue-400">Beli PIN Aktivasi</h4>
              <button onclick="document.getElementById('buyPinModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">✕</button>
            </div>
            {/* ACTION URL ORISINAL ANDA */}
            <form method="POST" action="/api/member/pin/buy" class="p-6 space-y-4">
              
              <div class="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-xl text-xs font-medium leading-relaxed mb-2">
                Pembelian PIN akan diproses melalui <b class="text-white">Midtrans Payment Gateway</b>. Pastikan data akun Anda valid.
              </div>

              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Pilih Paket Kemitraan</label>
                <select name="package_id" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm cursor-pointer">
                  <option value="">-- Pilih Paket --</option>
                  {packages.map((p: any) => (
                    <option value={p.id}>{p.name} - Rp {Number(p.price).toLocaleString('id-ID')}</option>
                  ))}
                </select>
              </div>
              
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs cursor-pointer">
                Lanjutkan ke Pembayaran
              </button>
            </form>
          </div>
        </dialog>

        {/* MODAL 2: AKTIVASI MEMBER BARU OLEH UPLINE */}
        <dialog id="activateModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-xl backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
          <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
            <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
              <h4 class="font-black text-white text-sm uppercase tracking-widest text-emerald-400">Aktivasi Downline Baru</h4>
              <button onclick="document.getElementById('activateModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">✕</button>
            </div>
            
            {/* ACTION URL ORISINAL ANDA */}
            <form method="POST" action="/api/member/pin/activate" class="p-6">
              {activePins.length === 0 ? (
                <div class="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-6 rounded-xl text-sm font-bold text-center leading-relaxed">
                  Anda tidak memiliki PIN aktif di Brankas.<br/>Silakan Beli PIN terlebih dahulu untuk mendaftarkan member.
                </div>
              ) : (
                <div class="space-y-5">
                  <div>
                    <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Pilih PIN Tersedia *</label>
                    <select name="pin_code" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-mono font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm cursor-pointer">
                      <option value="">-- Pilih PIN Aktivasi --</option>
                      {activePins.map((p: any) => (
                        <option value={p.pin_code}>{p.pin_code} ({p.package_name})</option>
                      ))}
                    </select>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Lengkap Downline *</label>
                      <input type="text" name="new_full_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="Sesuai KTP" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Password Login Sementara *</label>
                      <input type="password" name="new_password" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="Minimal 6 karakter" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">ID Upline Penempatan *</label>
                      <input type="text" name="upline_hu_id" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono uppercase rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="HMMXXXXXXX" />
                      <p class="text-[10px] text-gray-500 mt-1">Harus berada di bawah jaringan Anda.</p>
                    </div>
                    <div>
                      <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Pilih Kaki Penempatan *</label>
                      <select name="position" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm cursor-pointer">
                        <option value="left">Kiri (Left)</option>
                        <option value="right">Kanan (Right)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-[#0B0E14] font-black py-4 rounded-xl mt-2 transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs cursor-pointer">
                    Proses Aktivasi Jaringan
                  </button>
                </div>
              )}
            </form>
          </div>
        </dialog>

      </MemberLayout>
    )
  } catch (err: any) {
    // Menangkap Error 500 dan menampilkannya di UI dengan rapi
    return c.render(
      <MemberLayout profile={profile} balance={0} activeMenu="Brankas PIN">
        <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-sm font-bold shadow-sm">
          <p class="uppercase tracking-widest text-[11px] text-red-500 mb-2">Terjadi Kesalahan Sistem</p>
          {err.message}
        </div>
      </MemberLayout>
    )
  }
})
