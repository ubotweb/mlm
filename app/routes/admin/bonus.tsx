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
  const { results: commissions } = await db.prepare(`
    SELECT c.*, u.full_name as receiver_name, u.hu_id as receiver_hu, s.hu_id as source_hu 
    FROM commissions c 
    JOIN users u ON c.user_id = u.id 
    LEFT JOIN users s ON c.source_user_id = s.id
    ORDER BY c.created_at DESC
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Distribusi Bonus">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-black text-white">Distribusi Bonus & Komisi</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Catatan penyaluran seluruh bonus dari sistem MLM kepada mitra.</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
          <h4 class="font-black text-white text-sm uppercase tracking-widest">Riwayat Penyaluran Komisi</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
              <tr>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal Eksekusi</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Penerima Komisi (HU)</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Jenis & Sumber</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Nominal</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {commissions.length === 0 ? (
                <tr><td colSpan={5} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada komisi yang disalurkan.</td></tr>
              ) : commissions.map((c: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 text-[#8B949E] font-mono text-xs">
                    {new Date(c.created_at).toLocaleString('id-ID')}
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-bold text-white text-sm">{c.receiver_name}</p>
                    <p class="text-[10px] font-mono text-emerald-400 mt-1">{c.receiver_hu}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-1 rounded uppercase font-black tracking-widest">{c.type}</span>
                    <p class="text-[10px] text-gray-500 font-mono mt-2">Sumber: {c.source_hu || 'Sistem'}</p>
                  </td>
                  <td class="px-6 py-4 font-black text-emerald-400">
                    + Rp {c.amount.toLocaleString('id-ID')}
                  </td>
                  <td class="px-6 py-4">
                    <span class={`px-3 py-1.5 text-[10px] rounded border font-black uppercase tracking-widest ${c.status === 'released' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
})
