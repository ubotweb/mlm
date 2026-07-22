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
  const { results: orders } = await db.prepare(`
    SELECT o.id, o.invoice_number, u.username, o.total_amount, o.status, o.created_at
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 100
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Order & Verifikasi">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Order & Verifikasi Pembayaran</h2>
          <p class="text-[#8B949E] text-sm mt-1">Verifikasi pembayaran manual dan pantau pengiriman produk.</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Invoice</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Pembeli</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Total Pembayaran</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Status</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {orders.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-8 text-center text-[#8B949E]">Belum ada pesanan masuk.</td></tr>
              ) : orders.map((o: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 font-bold text-white">{o.invoice_number}</td>
                  <td class="px-6 py-4 text-gray-300 font-bold">{o.username}</td>
                  <td class="px-6 py-4 text-[#00E676] font-black">Rp {o.total_amount.toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4 text-[#8B949E]">{new Date(o.created_at).toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4">
                    <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase border 
                      ${o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                        o.status === 'paid' ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    {o.status === 'pending' ? (
                      <button class="bg-[#00E676] text-[#0B0E14] px-3 py-1 rounded text-xs font-bold hover:bg-[#00C853] transition-colors">Verifikasi</button>
                    ) : (
                      <button class="text-[#8B949E] hover:text-white transition-colors text-xs font-bold">Lihat Detail</button>
                    )}
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
