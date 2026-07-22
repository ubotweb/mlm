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
  } catch (err) { 
    return c.redirect('/login') 
  }

  const db = c.env.DB

  // SSR: Ambil Ringkasan Statistik Langsung dari D1
  const memberStat = await db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'member'").first()
  const salesStat = await db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'paid' OR status = 'completed'").first()
  const withdrawStat = await db.prepare("SELECT COUNT(*) as total FROM withdrawals WHERE status = 'pending'").first()
  const bonusStat = await db.prepare("SELECT SUM(amount) as total FROM commissions").first()

  const totalMembers = (memberStat?.total as number) || 0
  const totalSales = (salesStat?.total as number) || 0
  const pendingWithdrawals = (withdrawStat?.total as number) || 0
  const totalBonuses = (bonusStat?.total as number) || 0

  return c.render(
    <AdminLayout profile={profile} activeMenu="Dashboard">
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 class="text-3xl font-bold text-white">Ringkasan Sistem</h2>
          <p class="text-[#8B949E] text-sm mt-1">Pantau performa operasional dan finansial HMM Beauty hari ini.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm border-l-4 border-l-blue-500">
          <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Total Member Aktif</p>
          <h4 class="text-3xl font-black text-white">{totalMembers}</h4>
        </div>

        {/* Card 2 */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm border-l-4 border-l-[#00E676]">
          <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Total Penjualan</p>
          <h4 class="text-3xl font-black text-[#00E676]">Rp {totalSales.toLocaleString('id-ID')}</h4>
        </div>

        {/* Card 3 */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm border-l-4 border-l-yellow-500">
          <div class="flex justify-between items-start">
             <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Withdrawal Pending</p>
             {pendingWithdrawals > 0 && <span class="flex h-3 w-3"><span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
          </div>
          <h4 class="text-3xl font-black text-yellow-500">{pendingWithdrawals}</h4>
        </div>

        {/* Card 4 */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm border-l-4 border-l-purple-500">
          <p class="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Total Bonus Dibagikan</p>
          <h4 class="text-3xl font-black text-purple-400">Rp {totalBonuses.toLocaleString('id-ID')}</h4>
        </div>

      </div>
    </AdminLayout>
  )
})
