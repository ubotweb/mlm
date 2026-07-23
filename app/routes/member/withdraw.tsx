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
  const user = await db.prepare("SELECT id, hu_id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  const { results: withdrawals } = await db.prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all()

  // Ambil batas minimal penarikan dari tabel pengaturan (Default: Rp 50.000)
  const { value: minWithdrawStr } = await db.prepare("SELECT value FROM site_settings WHERE key = 'withdraw_min_amount'").first() || { value: '50000' }
  const minWithdraw = Number(minWithdrawStr) || 50000

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Buku Rekening">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Penarikan Dana</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Cairkan saldo bonus ke rekening bank Anda (Minimal Rp {minWithdraw.toLocaleString('id-ID')}).</p>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form Penarikan */}
        <div class="xl:col-span-1 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Form Withdraw</h4>
          </div>
          <form method="POST" action="/api/withdraw" class="p-6 space-y-4">
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nominal Penarikan (Rp)</label>
              <input type="number" name="amount" min={minWithdraw} max={user.balance} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="50000" />
              <p class="text-[10px] text-gray-500 mt-1 font-bold">Saldo Maks: Rp {(user.balance as number).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Bank</label>
              <input type="text" name="bank_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white uppercase rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="BCA / MANDIRI / BRI" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nomor Rekening</label>
              <input type="text" name="account_number" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="1234567890" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Atas Nama (Sesuai Rekening)</label>
              <input type="text" name="account_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white uppercase rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm" placeholder="NAMA LENGKAP" />
            </div>
            <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-[#0B0E14] font-black py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs">
              Ajukan Penarikan
            </button>
          </form>
        </div>

        {/* Riwayat Withdraw */}
        <div class="xl:col-span-2 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Riwayat Transaksi</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Rekening Tujuan</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Nominal</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Status / Bukti</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada riwayat penarikan dana.</td></tr>
                ) : withdrawals.map((w: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-5 py-4">
                      <p class="font-bold text-white text-xs">{new Date(w.created_at).toLocaleDateString('id-ID')}</p>
                      <p class="text-[9px] text-[#8B949E] font-mono mt-1">{new Date(w.created_at).toLocaleTimeString('id-ID')}</p>
                    </td>
                    <td class="px-5 py-4">
                      <p class="font-black text-blue-400 uppercase text-xs">{w.bank_name}</p>
                      <p class="text-[10px] text-white font-mono mt-1">{w.account_number}</p>
                      <p class="text-[9px] text-[#8B949E] uppercase mt-1">A.N {w.account_name}</p>
                    </td>
                    <td class="px-5 py-4 font-black text-emerald-400 text-sm">Rp {w.amount.toLocaleString('id-ID')}</td>
                    <td class="px-5 py-4">
                      <span class={`inline-block px-2 py-1 text-[9px] rounded border font-black uppercase tracking-widest mb-2 ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : w.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {w.status}
                      </span>
                      {w.status === 'completed' && w.url_bukti_transfer && (
                        <div class="mt-1">
                           <button type="button" onclick={`openProofModal('${w.url_bukti_transfer}')`} class="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer">Lihat bukti transfer</button>
                        </div>
                      )}
                      {w.status === 'rejected' && (
                         <p class="text-[9px] text-red-400 mt-1 font-bold">Saldo dikembalikan.</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tampil Bukti Transfer HTML5 */}
      <dialog id="proofModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-lg backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <h4 class="font-black text-white text-sm uppercase tracking-widest text-blue-400">Bukti Transfer Dana</h4>
            <button onclick="document.getElementById('proofModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">✕</button>
          </div>
          <div class="p-6 flex justify-center items-center bg-[#0B0E14] min-h-[300px]">
            <img id="proofImage" src="" alt="Bukti Transfer" class="max-w-full max-h-[60vh] object-contain rounded-lg border border-[#222731] shadow-lg" />
          </div>
        </div>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: `
        function openProofModal(imgUrl) {
          document.getElementById('proofImage').src = imgUrl;
          document.getElementById('proofModal').showModal();
        }
      `}} />

    </MemberLayout>
  )
})
