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
  const user = await db.prepare("SELECT full_name, balance FROM users WHERE username = ?").bind(profile.sub).first()
  const errorMsg = c.req.query('error')
  const successMsg = c.req.query('success')

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Buku Rekening">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h2 class="text-3xl font-bold text-white">Buku Rekening Payout</h2>
          <p class="text-[#8B949E] text-sm mt-1">Kelola daftar rekening Bank dan E-Wallet Anda untuk keperluan pencairan dana komisi.</p>
        </div>
        <button class="px-4 py-2 border border-[#00E676] text-[#00E676] hover:bg-[#00E676]/10 rounded-lg text-sm font-bold transition-colors flex items-center">
          + Tambah Rekening
        </button>
      </div>

      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-sm font-bold rounded-lg mb-6">{errorMsg}</div>}
      {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 text-sm font-bold rounded-lg mb-6">{successMsg}</div>}

      {/* Grid Rekening Bank (Visual dari Screenshot 15) */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-5 shadow-sm relative">
          <div class="absolute top-4 right-4 text-[#8B949E] hover:text-red-400 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </div>
          <div class="flex items-center mb-6">
            <div class="p-2 bg-[#1B2A24] text-[#00E676] rounded-lg mr-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">BCA</h4>
              <p class="text-[10px] text-[#8B949E] uppercase tracking-wider">BANK NASIONAL</p>
            </div>
          </div>
          <p class="text-[10px] text-[#8B949E] uppercase tracking-wider mb-1">NOMOR REKENING</p>
          <div class="bg-[#0B0E14] border border-[#222731] rounded-lg px-4 py-3 mb-4">
             <span class="text-white font-bold tracking-widest">4310485174</span>
          </div>
          <p class="text-xs font-bold text-[#00E676] uppercase flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
            {user?.full_name}
          </p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm max-w-2xl">
        <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
          <h4 class="font-bold text-white text-sm">Form Penarikan Dana (Withdraw)</h4>
        </div>
        <form method="POST" action="/api/member/withdraw" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Pilih Rekening Tujuan</label>
            <select name="bankName" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none">
              <option value="BCA">BCA - 4310485174</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nominal (Min Rp 50.000)</label>
            <input type="number" name="amount" required min="50000" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Contoh: 100000" />
            {/* Input Tersembunyi untuk melengkapi API tanpa interaksi Island */}
            <input type="hidden" name="accountNumber" value="4310485174" />
            <input type="hidden" name="accountName" value={user?.full_name} />
          </div>
          <button type="submit" class="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-bold py-3 rounded-lg mt-2 transition-colors">Ajukan Pencairan</button>
        </form>
      </div>
    </MemberLayout>
  )
})
