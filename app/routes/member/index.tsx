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
  
  // PERBAIKAN MUTLAK: Mengambil seluruh kolom mesin PV dan RO dari Database Baru
  const user = await db.prepare(`
    SELECT id, hu_id, full_name, balance, ro_balance, pv_left_today, pv_right_today, sisa_pv_left, sisa_pv_right 
    FROM users WHERE hu_id = ?
  `).bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  const downlineStats = await db.prepare("SELECT COUNT(*) as count FROM users WHERE sponsor_id = ?").bind(user.id).first()
  
  const { results: recentDownlines } = await db.prepare(`
    SELECT u.full_name, u.hu_id, u.status, p.name as package_name, u.created_at
    FROM users u LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.sponsor_id = ?
    ORDER BY u.created_at DESC LIMIT 5
  `).bind(user.id).all()

  const balance = (user.balance as number) || 0
  const roBalance = (user.ro_balance as number) || 0
  const totalDownlines = (downlineStats?.count as number) || 0

  return c.render(
    <MemberLayout profile={profile} balance={balance} activeMenu="Dashboard">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 class="text-3xl font-black text-white leading-tight">Halo, {user.full_name}!</h2>
          <p class="text-emerald-400 font-mono text-sm mt-1 font-bold tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-md w-max">
            ID HU: {user.hu_id}
          </p>
        </div>
        <div class="flex space-x-3">
          <a href="/member/upgrade" class="px-4 py-2 bg-[#1A1E26] border border-[#2D3342] text-blue-400 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center">
             Upgrade Paket
          </a>
          <a href="/member/belanja" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0B0E14] rounded-lg text-sm font-black transition-colors flex items-center shadow-lg shadow-emerald-500/20">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Repeat Order
          </a>
        </div>
      </div>

      {/* PERBAIKAN: Menjadi lg:grid-cols-5 untuk menampung panel RO tanpa merusak layout */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        
        {/* PANEL 1: Saldo Rilis */}
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between">
          <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Total Saldo Rilis</p>
          <h4 class="text-2xl font-black text-emerald-400 mb-4">Rp {balance.toLocaleString('id-ID')}</h4>
        </div>

        {/* PANEL 2 (BARU): Saldo Auto-RO */}
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 border-l-4 border-l-yellow-500 shadow-sm flex flex-col justify-between">
          <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Dompet Auto-RO</p>
          <h4 class="text-2xl font-black text-yellow-500 mb-4">Rp {roBalance.toLocaleString('id-ID')}</h4>
        </div>

        {/* PANEL 3: Total Downline */}
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm flex items-center">
          <div class="p-3 bg-blue-500/10 text-blue-400 rounded-xl mr-4 border border-blue-500/20">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <div>
            <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-1">Total Downline</p>
            <h4 class="text-2xl font-black text-white">{totalDownlines}</h4>
          </div>
        </div>

        {/* PANEL 4: PV Kiri */}
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm flex items-center">
          <div class="p-3 bg-purple-500/10 text-purple-400 rounded-xl mr-4 border border-purple-500/20">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
          </div>
          <div>
            <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-1">PV Kiri (Hari/Sisa)</p>
            <h4 class="text-xl font-black text-white">{user.pv_left_today} <span class="text-xs text-gray-500">/ {user.sisa_pv_left}</span></h4>
          </div>
        </div>

        {/* PANEL 5: PV Kanan */}
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm flex items-center">
          <div class="p-3 bg-orange-500/10 text-orange-400 rounded-xl mr-4 border border-orange-500/20">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
          </div>
          <div>
            <p class="text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-1">PV Kanan (Hari/Sisa)</p>
            <h4 class="text-xl font-black text-white">{user.pv_right_today} <span class="text-xs text-gray-500">/ {user.sisa_pv_right}</span></h4>
          </div>
        </div>

      </div>

      {/* Tabel Downline */}
      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="flex justify-between items-center p-6 border-b border-[#222731] bg-[#1A1E26]">
          <h4 class="font-black text-white tracking-wide uppercase text-sm">Pendaftaran Downline Terbaru</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#0B0E14] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">ID & Nama Downline</th>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">Paket</th>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {recentDownlines.length === 0 ? (
                <tr><td colSpan={3} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada mitra di jaringan Anda.</td></tr>
              ) : recentDownlines.map((d: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-bold text-white">{d.full_name}</p>
                    <p class="text-[10px] font-mono text-emerald-400 mt-1">{d.hu_id}</p>
                  </td>
                  <td class="px-6 py-4 text-gray-300 font-bold uppercase tracking-wider text-xs">{d.package_name || '-'}</td>
                  <td class="px-6 py-4">
                    <span class={`px-3 py-1.5 text-[10px] rounded border font-black uppercase tracking-widest ${d.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  )
})
