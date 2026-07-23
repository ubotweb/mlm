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
    SELECT o.*, u.full_name, u.hu_id 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    ORDER BY o.created_at DESC
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Data Transaksi">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-black text-white">Manajemen Transaksi & Order</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Lacak seluruh pesanan paket kemitraan dan repeat order produk fisik.</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
          <h4 class="font-black text-white text-sm uppercase tracking-widest">Daftar Semua Transaksi</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
              <tr>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Invoice & Tanggal</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Member (HU)</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Total & Pembayaran</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {orders.length === 0 ? (
                <tr><td colSpan={5} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada transaksi di sistem.</td></tr>
              ) : orders.map((o: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-bold text-white uppercase tracking-wider">{o.invoice_number}</p>
                    <p class="text-[10px] text-[#8B949E] font-mono mt-1">{new Date(o.created_at).toLocaleString('id-ID')}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-bold text-gray-300">{o.full_name}</p>
                    <p class="text-[10px] text-emerald-400 font-mono mt-1">{o.hu_id}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-black text-emerald-400">Rp {o.total_amount.toLocaleString('id-ID')}</p>
                    <p class="text-[10px] font-bold text-blue-400 uppercase mt-1 tracking-wider">{o.payment_method || '-'}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class={`px-3 py-1.5 text-[10px] rounded border font-black uppercase tracking-widest ${o.status === 'completed' || o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <form method="POST" action="/api/admin/action/update_order" class="inline-block">
                       <input type="hidden" name="order_id" value={o.id} />
                       <select name="status" onchange="this.form.submit()" class="bg-[#0B0E14] text-xs font-bold text-white border border-[#2D3342] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer">
                         <option value="pending" selected={o.status === 'pending'}>Pending</option>
                         <option value="paid" selected={o.status === 'paid'}>Paid</option>
                         <option value="processing" selected={o.status === 'processing'}>Proses</option>
                         <option value="completed" selected={o.status === 'completed'}>Selesai</option>
                       </select>
                    </form>
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
