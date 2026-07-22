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
    SELECT c.id, u.username as receiver, su.username as source_user, c.type, c.amount, c.created_at
    FROM commissions c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN users su ON c.source_user_id = su.id
    ORDER BY c.created_at DESC LIMIT 100
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Bonus & Komisi">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Laporan Bonus & Komisi Global</h2>
          <p class="text-[#8B949E] text-sm mt-1">Seluruh riwayat pembagian komisi sponsor, jaringan, dan penjualan.</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Waktu Eksekusi</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Penerima Komisi</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Sumber (Downline)</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Jenis Komisi</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Nominal Rilis</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {commissions.length === 0 ? (
                <tr><td colSpan={5} class="px-6 py-8 text-center text-[#8B949E]">Sistem belum mencatat pembagian bonus.</td></tr>
              ) : commissions.map((c: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 text-[#8B949E]">{new Date(c.created_at).toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4 font-bold text-white">{c.receiver}</td>
                  <td class="px-6 py-4 text-gray-400">{c.source_user || 'Sistem Pusat'}</td>
                  <td class="px-6 py-4 text-blue-400 font-bold uppercase text-[10px] tracking-wider border border-blue-500/20 bg-blue-500/10 px-2 rounded inline-block mt-3 ml-6">{c.type.replace('_', ' ')}</td>
                  <td class="px-6 py-4 text-right font-black text-[#00E676]">Rp {c.amount.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
})
