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
  // MENGGUNAKAN hu_id
  const user = await db.prepare("SELECT id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  const { results: withdrawals } = await db.prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all()
  
  const errorMsg = c.req.query('error')
  const successMsg = c.req.query('success')

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Tarik Dana (Withdraw)">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Tarik Dana Bonus</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Cairkan saldo bonus Anda langsung ke rekening bank lokal yang terdaftar.</p>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Penarikan */}
        <div class="lg:col-span-1 bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm h-fit">
          <div class="mb-6 pb-6 border-b border-[#222731]">
            <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Saldo Tersedia</p>
            <h3 class="text-3xl font-black text-emerald-400">Rp {((user.balance as number) || 0).toLocaleString('id-ID')}</h3>
          </div>
          <form method="POST" action="/api/member/withdraw" class="space-y-4">
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nominal Penarikan (Rp)</label>
              <input type="number" name="amount" required class="w-full bg-[#0B0E14] border border-[#2D3342] focus:border-emerald-500 text-white font-black rounded-xl px-4 py-3 focus:outline-none text-sm tracking-widest" placeholder="Min. 50000" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Bank</label>
              <input type="text" name="bank_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none text-sm uppercase" placeholder="BCA / MANDIRI / BRI" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nomor Rekening</label>
              <input type="text" name="account_number" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono rounded-xl px-4 py-3 focus:outline-none text-sm tracking-widest" placeholder="1234567890" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Atas Nama Rekening</label>
              <input type="text" name="account_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none text-sm uppercase" />
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">
              Ajukan Penarikan
            </button>
          </form>
        </div>

        {/* Tabel Riwayat */}
        <div class="lg:col-span-2 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Riwayat Penarikan Dana</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Bank & Rekening</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Nominal</th>
                  <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada riwayat penarikan dana.</td></tr>
                ) : withdrawals.map((w: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-6 py-4 text-[#8B949E] font-mono text-xs">
                      {new Date(w.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-bold text-white uppercase">{w.bank_name} - {w.account_number}</p>
                      <p class="text-[10px] text-gray-500 uppercase mt-1">A.N: {w.account_name}</p>
                    </td>
                    <td class="px-6 py-4 font-black text-emerald-400">
                      Rp {w.amount.toLocaleString('id-ID')}
                    </td>
                    <td class="px-6 py-4">
                      <span class={`px-3 py-1.5 text-[10px] rounded border font-black uppercase tracking-widest 
                        ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          w.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {w.status}
                      </span>
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
