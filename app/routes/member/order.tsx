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
  const user = await db.prepare("SELECT id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  // Query disesuaikan mutlak dengan skema Database baru (WIB & PV)
  const { results: orders } = await db.prepare(`
    SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `).bind(user.id).all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Riwayat Transaksi">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Riwayat Transaksi & Order</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau status pembelian PIN, produk, dan transaksi jaringan Anda.</p>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-[#8B949E] border-b border-[#222731] bg-[#1A1E26]">
              <tr>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">No. Referensi</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Jenis Transaksi</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Total Bayar</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Total PV</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal (WIB)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {orders.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-10 text-center text-[#8B949E] font-bold">Belum ada riwayat transaksi.</td></tr>
              ) : orders.map((o: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 font-mono text-emerald-400 font-bold">{o.payment_reference || o.id.split('_')[1]}</td>
                  <td class="px-6 py-4 font-bold text-white uppercase text-xs tracking-wider">
                    {o.order_type === 'buy_pin' ? 'Beli PIN Aktivasi' : o.order_type}
                  </td>
                  <td class="px-6 py-4 font-black text-white">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4 font-bold text-blue-400">{o.total_pv} PV</td>
                  <td class="px-6 py-4">
                    <span class={`inline-block px-2.5 py-1 text-[10px] rounded border font-black uppercase tracking-widest ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-xs text-[#8B949E] font-mono">{new Date(o.created_at).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  )
})
