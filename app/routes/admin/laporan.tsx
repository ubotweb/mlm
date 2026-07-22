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
  const { results: reports } = await db.prepare(`
    SELECT o.invoice_number, u.username, o.total_amount, o.status, o.created_at
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.status IN ('paid', 'completed')
    ORDER BY o.created_at DESC LIMIT 100
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Laporan Penjualan">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white">Laporan Penjualan</h2>
        <p class="text-[#8B949E] text-sm mt-1">Rekap seluruh transaksi sukses.</p>
      </div>
      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal Transaksi</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Nomor Invoice</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Pembeli</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {reports.length === 0 ? (
                <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E]">Belum ada penjualan sukses.</td></tr>
              ) : reports.map((r: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 text-[#8B949E]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4 font-bold text-white">{r.invoice_number}</td>
                  <td class="px-6 py-4 text-blue-400 font-bold uppercase">{r.username}</td>
                  <td class="px-6 py-4 text-right font-black text-[#00E676]">{r.total_amount.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
})
