import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } 
  catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  // Ambil data user untuk mendapatkan ID (karena tabel orders memakai user_id)
  const user = await db.prepare("SELECT id, balance FROM users WHERE username = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  // Tarik riwayat pesanan (Upgrade Paket & Belanja RO)
  const { results: orders } = await db.prepare(`
    SELECT invoice_number, total_amount, status, payment_method, created_at 
    FROM orders 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).bind(user.id).all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Riwayat Pesanan">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-white">Riwayat Pesanan</h2>
        <p class="text-[#8B949E] text-sm mt-1">Pantau status pembayaran dan riwayat transaksi belanja (Repeat Order & Upgrade) Anda.</p>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
          <h4 class="font-bold text-white text-sm">Daftar Transaksi</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#0B0E14] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">No. Invoice</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Metode Bayar</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Total Pembayaran</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {orders.length === 0 ? (
                <tr><td colSpan={5} class="px-6 py-8 text-center text-[#8B949E]">Belum ada riwayat pesanan.</td></tr>
              ) : orders.map((o: any) => {
                // Penentuan warna badge berdasarkan status pesanan
                let statusClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                if (o.status === 'pending') statusClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                if (o.status === 'paid' || o.status === 'completed') statusClass = 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/20';
                if (o.status === 'cancelled') statusClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                if (o.status === 'processing' || o.status === 'shipped') statusClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                return (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-6 py-4 text-[#8B949E] text-xs font-medium">
                      {new Date(o.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td class="px-6 py-4 font-bold text-white uppercase tracking-wider">{o.invoice_number}</td>
                    <td class="px-6 py-4 text-gray-300 font-bold">{o.payment_method || '-'}</td>
                    <td class="px-6 py-4 font-black text-[#00E676]">Rp {o.total_amount.toLocaleString('id-ID')}</td>
                    <td class="px-6 py-4">
                      <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase border ${statusClass}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  )
})
