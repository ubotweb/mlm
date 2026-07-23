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

  return c.render(
    <AdminLayout profile={profile} activeMenu="Laporan Sistem">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-white">Laporan Keuangan & Komisi</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau arus kas penarikan dana dan pembagian bonus sistem MLM Binary.</p>
      </div>

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
                    </td>
                    <td class="px-5 py-4 font-black text-emerald-400 text-xs">Rp {w.amount.toLocaleString('id-ID')}</td>
                    <td class="px-5 py-4">
                      <span class={`px-2 py-1 text-[9px] rounded border font-black uppercase tracking-widest ${w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right">
                       <form method="POST" action="/api/admin/action/approve_withdraw" onsubmit="return confirm('Proses pencairan dana ini?');">
                         <input type="hidden" name="id" value={w.id} />
                         <button type="submit" disabled={w.status === 'completed'} class="bg-blue-600 hover:bg-blue-500 disabled:bg-[#2D3342] text-white disabled:text-gray-500 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer disabled:cursor-not-allowed">ACC</button>
                       </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
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
    </AdminLayout>
  )
})
