import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { AdminLayout } from '../../components/AdminLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  let profile: any
  try {
    profile = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (profile.role !== 'admin') return c.redirect('/member')
  } catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  
  const { results: withdrawals } = await db.prepare(`
    SELECT w.*, u.full_name, u.hu_id 
    FROM withdrawals w 
    JOIN users u ON w.user_id = u.id 
    ORDER BY w.created_at DESC LIMIT 20
  `).all()

  const { results: commissions } = await db.prepare(`
    SELECT c.*, u.full_name as receiver_name, u.hu_id as receiver_hu, s.hu_id as source_hu 
    FROM commissions c 
    JOIN users u ON c.user_id = u.id 
    LEFT JOIN users s ON c.source_user_id = s.id
    ORDER BY c.created_at DESC LIMIT 20
  `).all()

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Laporan Sistem">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-white">Laporan Keuangan & Komisi</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau arus kas penarikan dana dan pembagian bonus sistem MLM Binary.</p>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Pengajuan Withdraw</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Member (HU)</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Nominal</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada data penarikan.</td></tr>
                ) : withdrawals.map((w: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-5 py-4">
                      <p class="font-bold text-white text-xs">{w.full_name}</p>
                      <p class="text-[9px] font-mono text-emerald-400 mt-1">{w.hu_id}</p>
                      <p class="text-[9px] text-[#8B949E] uppercase mt-1">{w.bank_name} - {w.account_number}</p>
                    </td>
                    <td class="px-5 py-4 font-black text-emerald-400 text-xs">Rp {w.amount.toLocaleString('id-ID')}</td>
                    <td class="px-5 py-4">
                      <span class={`px-2 py-1 text-[9px] rounded border font-black uppercase tracking-widest ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : w.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right space-x-2">
                       {w.status === 'pending' ? (
                         <>
                           <button type="button" onclick={`openWithdrawModal('${w.id}', '${w.full_name}', ${w.amount}, '${w.bank_name}', '${w.account_number}', '${w.account_name}')`} class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer">ACC</button>
                           <form method="POST" action="/api/admin/action/withdrawals/process" class="inline-block" onsubmit="return confirm('Tolak penarikan dan kembalikan saldo?');">
                             <input type="hidden" name="withdrawId" value={w.id} />
                             <input type="hidden" name="action" value="reject" />
                             <button type="submit" class="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer">TOLAK</button>
                           </form>
                         </>
                       ) : (
                         <span class="text-[10px] text-gray-500 font-bold uppercase">Selesai</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Distribusi Komisi Terakhir</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Penerima (HU)</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Jenis Bonus</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Sumber</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Nominal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {commissions.length === 0 ? (
                   <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada distribusi bonus.</td></tr>
                ) : commissions.map((c: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-5 py-4">
                      <p class="font-bold text-white text-xs">{c.receiver_name}</p>
                      <p class="text-[9px] font-mono text-emerald-400 mt-1">{c.receiver_hu}</p>
                    </td>
                    <td class="px-5 py-4 font-black text-blue-400 uppercase tracking-wider text-[10px]">{c.type}</td>
                    <td class="px-5 py-4 font-mono text-[10px] text-gray-400">{c.source_hu || 'Sistem'}</td>
                    <td class="px-5 py-4 font-black text-emerald-400 text-xs">+ Rp {c.amount.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Konfirmasi Transfer Withdraw */}
      <dialog id="withdrawModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-md backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <h4 class="font-black text-white text-sm uppercase tracking-widest text-emerald-400">Konfirmasi Transfer Manual</h4>
            <button onclick="document.getElementById('withdrawModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center">✕</button>
          </div>
          <div class="p-6">
            
            {/* Pesan Peringatan Wajib */}
            <div class="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-4 rounded-xl mb-6 text-sm font-bold text-center">
              Pastikan dana sudah ditransfer!
            </div>
            
            <div class="bg-[#0B0E14] border border-[#222731] p-4 rounded-xl mb-6 space-y-2 text-sm">
              <p class="text-[#8B949E] flex justify-between">Penerima: <span id="modal-w-name" class="font-bold text-white uppercase"></span></p>
              <p class="text-[#8B949E] flex justify-between">Bank: <span id="modal-w-bank" class="font-bold text-blue-400 uppercase"></span></p>
              <p class="text-[#8B949E] flex justify-between">No. Rekening: <span id="modal-w-account" class="font-bold text-white font-mono"></span></p>
              <p class="text-[#8B949E] flex justify-between">A.N Rekening: <span id="modal-w-an" class="font-bold text-white uppercase"></span></p>
              <div class="border-t border-[#222731] my-2 pt-2"></div>
              <p class="text-[#8B949E] flex justify-between">Total Transfer: <span id="modal-w-amount" class="font-black text-emerald-400 text-lg"></span></p>
            </div>

            {/* Form Wajib Multipart */}
            <form method="POST" action="/api/admin/action/withdrawals/process" enctype="multipart/form-data" class="space-y-4">
              <input type="hidden" name="withdrawId" id="modal-w-id" value="" />
              <input type="hidden" name="action" value="approve" />
              
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Upload Bukti Transfer</label>
                <input type="file" name="proof_file" accept="image/*" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20" />
              </div>
              
              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-[#0B0E14] font-black py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs cursor-pointer">
                Ya, Dana Telah Ditransfer
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Script JS untuk menangkap data dan membuka Modal HTML5 */}
      <script dangerouslySetInnerHTML={{ __html: `
        function openWithdrawModal(id, name, amount, bank, account, an) {
          document.getElementById('modal-w-id').value = id;
          document.getElementById('modal-w-name').innerText = name;
          document.getElementById('modal-w-bank').innerText = bank;
          document.getElementById('modal-w-account').innerText = account;
          document.getElementById('modal-w-an').innerText = an;
          document.getElementById('modal-w-amount').innerText = 'Rp ' + amount.toLocaleString('id-ID');
          document.getElementById('withdrawModal').showModal();
        }
      `}} />

    </AdminLayout>
  )
})
