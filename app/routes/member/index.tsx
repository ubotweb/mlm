import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // 1. Verifikasi Sesi
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')

  let profile: any
  try {
    profile = await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch (err) {
    return c.redirect('/login?error=Sesi berakhir, silakan login kembali')
  }

  // 2. Tarik Data Database
  const db = c.env.DB
  
  const userStats = await db.prepare("SELECT balance FROM users WHERE username = ?").bind(profile.sub).first()
  const downlineStats = await db.prepare("SELECT COUNT(*) as count FROM users WHERE sponsor_id = (SELECT id FROM users WHERE username = ?)").bind(profile.sub).first()

  const balance = (userStats?.balance as number) || 0
  const totalDownlines = (downlineStats?.count as number) || 0

  // 3. Render UI Premium (Light & Dark Mode Auto-Adapt)
  return c.render(
    <div class="min-h-screen bg-gray-50 dark:bg-[#0B0E14] text-gray-800 dark:text-gray-200 flex font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside class="w-64 bg-white dark:bg-[#151921] border-r border-gray-200 dark:border-[#222731] hidden md:flex flex-col sticky top-0 h-screen">
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#222731]">
          <h1 class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 tracking-wider">
            HMM<span class="font-light text-gray-800 dark:text-white">BEAUTY</span>
          </h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Active Menu */}
          <a href="/member" class="flex items-center px-4 py-3 bg-blue-50 dark:bg-[#1C2333] text-blue-700 dark:text-blue-400 rounded-lg font-medium group">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </a>
          {/* Inactive Menus */}
          <a href="/member/jaringan" class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1E26] rounded-lg transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Pohon Jaringan
          </a>
          <a href="/member/bonus" class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1E26] rounded-lg transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Dompet & Keuangan
          </a>
          <a href="/member/profil" class="flex items-center px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1E26] rounded-lg transition-colors">
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Profil Saya
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div class="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header class="h-16 bg-white dark:bg-[#151921] border-b border-gray-200 dark:border-[#222731] flex items-center justify-between px-6 sticky top-0 z-10">
          <div class="flex items-center">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">Dashboard - HMM Beauty</h2>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="hidden sm:flex flex-col items-end mr-4">
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider">SALDO AKTIF</span>
              <span class="text-sm font-bold text-emerald-600 dark:text-[#00E676]">Rp {balance.toLocaleString('id-ID')}</span>
            </div>
            
            <div class="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer">
              {profile.sub.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main class="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* Welcome Header & Action Buttons */}
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
            <div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Halo, {profile.sub}!</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Pantau performa jaringan dan putaran bonus Anda hari ini.</p>
            </div>
            <div class="flex space-x-3">
              <a href="/member/withdraw" class="px-5 py-2 bg-white dark:bg-[#1A1E26] border border-gray-300 dark:border-[#2D3342] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222731] rounded-lg text-sm font-semibold transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Tarik Saldo
              </a>
              <a href="/checkout" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-[#00C853] dark:hover:bg-[#00E676] text-white rounded-lg text-sm font-semibold transition-colors flex items-center shadow-lg shadow-emerald-500/20">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Order Baru
              </a>
            </div>
          </div>

          {/* STATS GRID */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Card 1: Saldo */}
            <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-5 border-l-4 border-l-emerald-500 dark:border-l-[#00E676] shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div class="flex justify-between items-start mb-4">
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Saldo Rilis</p>
                <a href="/member/bonus" class="text-gray-400 hover:text-emerald-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>
              <h4 class="text-3xl font-black text-emerald-600 dark:text-[#00E676] mb-6">Rp {balance.toLocaleString('id-ID')}</h4>
              <div class="flex justify-between items-center text-xs border-t border-gray-100 dark:border-[#222731] pt-3">
                <span class="text-gray-500 dark:text-gray-400">Menunggu Pencairan:</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">Rp 0</span>
              </div>
            </div>

            {/* Card 2: Downline */}
            <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-5 shadow-sm flex items-center">
              <div class="p-4 bg-blue-50 dark:bg-[#1C2333] text-blue-600 dark:text-blue-400 rounded-lg mr-5">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Downline Langsung</p>
                <h4 class="text-3xl font-black text-gray-900 dark:text-white">{totalDownlines}</h4>
              </div>
            </div>

            {/* Card 3: Pesanan Aktif */}
            <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-5 shadow-sm flex items-center">
              <div class="p-4 bg-orange-50 dark:bg-[#33251C] text-orange-600 dark:text-orange-400 rounded-lg mr-5">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pesanan Bulan Ini</p>
                <h4 class="text-3xl font-black text-gray-900 dark:text-white">0</h4>
              </div>
            </div>

          </div>

          {/* TABLE SECTION (Mirip "Kampanye Terbaru") */}
          <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-[#222731]">
              <h4 class="font-bold text-gray-900 dark:text-white tracking-wide uppercase text-sm">Pendaftaran Downline Terbaru</h4>
              <a href="/member/downline" class="text-xs font-bold text-emerald-600 dark:text-[#00E676] flex items-center hover:underline">
                LIHAT SEMUA <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </a>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 dark:bg-[#1A1E26] text-gray-500 dark:text-gray-400">
                  <tr>
                    <th class="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Nama Downline</th>
                    <th class="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Paket</th>
                    <th class="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Status</th>
                    <th class="px-6 py-4 font-semibold text-xs tracking-wider uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-[#222731]">
                  {/* Empty State placeholder (karena query data baru belum ada di contoh ini) */}
                  <tr>
                    <td colSpan={4} class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      Belum ada data downline terbaru minggu ini.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
})
