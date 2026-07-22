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
  const user = await db.prepare("SELECT balance FROM users WHERE username = ?").bind(profile.sub).first()
  const downlineStats = await db.prepare("SELECT COUNT(*) as count FROM users WHERE sponsor_id = (SELECT id FROM users WHERE username = ?)").bind(profile.sub).first()
  
  const { results: recentDownlines } = await db.prepare(`
    SELECT u.full_name, u.status, p.name as package_name, u.created_at
    FROM users u LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.sponsor_id = (SELECT id FROM users WHERE username = ?)
    ORDER BY u.created_at DESC LIMIT 5
  `).bind(profile.sub).all()

  const balance = (user?.balance as number) || 0
  const totalDownlines = (downlineStats?.count as number) || 0

  return c.render(
    <MemberLayout profile={profile} balance={balance} activeMenu="Dashboard">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 class="text-3xl font-bold text-white">Halo, {profile.sub}!</h2>
          <p class="text-[#8B949E] text-sm mt-1">Pantau performa jaringan dan perputaran bonus Anda hari ini.</p>
        </div>
        <div class="flex space-x-3">
          <a href="/member/upgrade" class="px-4 py-2 bg-[#1A1E26] border border-[#2D3342] text-blue-400 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center">
             Upgrade Paket
          </a>
          {/* Tombol diperbarui agar mengarah ke Belanja RO */}
          <a href="/member/belanja" class="px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] rounded-lg text-sm font-bold transition-colors flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Repeat Order
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-5 border-l-4 border-l-[#00E676] flex flex-col justify-between">
          <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Total Saldo Rilis</p>
          <h4 class="text-2xl font-black text-[#00E676] mb-4">Rp {balance.toLocaleString('id-ID')}</h4>
          <div class="flex justify-between text-xs border-t border-[#222731] pt-3 text-[#8B949E]">
            <span>Deposit Saldo:</span><span class="font-bold text-blue-400">Rp 0</span>
          </div>
        </div>
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-5 flex items-center">
          <div class="p-3 bg-[#1C2333] text-blue-400 rounded-lg mr-4">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <div>
            <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">Total Downline</p>
            <h4 class="text-2xl font-black text-white">{totalDownlines}</h4>
          </div>
        </div>
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-5 flex items-center">
          <div class="p-3 bg-[#2D1B2E] text-purple-400 rounded-lg mr-4">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
          </div>
          <div>
            <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">Pesanan Aktif</p>
            <h4 class="text-2xl font-black text-white">0</h4>
          </div>
        </div>
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-5 flex items-center">
          <div class="p-3 bg-[#33251C] text-orange-400 rounded-lg mr-4">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
          <div>
            <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">Total Bonus</p>
            <h4 class="text-2xl font-black text-white">0</h4>
          </div>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="flex justify-between items-center p-4 border-b border-[#222731]">
          <h4 class="font-bold text-white tracking-wide uppercase text-sm">Pendaftaran Downline Terbaru</h4>
          <a href="/member/downline" class="text-xs font-bold text-[#00E676] flex items-center hover:underline">
            LIHAT SEMUA <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold text-xs tracking-wider uppercase">Nama Downline</th>
                <th class="px-6 py-4 font-bold text-xs tracking-wider uppercase">Paket Target</th>
                <th class="px-6 py-4 font-bold text-xs tracking-wider uppercase">Status</th>
                <th class="px-6 py-4 font-bold text-xs tracking-wider uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {recentDownlines.length === 0 ? (
                <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E]">Belum ada pendaftaran terbaru.</td></tr>
              ) : recentDownlines.map((d: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 font-bold text-white">{d.full_name}</td>
                  <td class="px-6 py-4 text-[#8B949E] font-medium uppercase">{d.package_name || 'Starter'}</td>
                  <td class="px-6 py-4">
                    <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase ${d.status === 'active' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-[#00E676] cursor-pointer">DETAIL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  )
})
