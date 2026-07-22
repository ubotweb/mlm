import type { FC } from 'hono/jsx'

export const AdminLayout: FC<{ profile: any; activeMenu: string; children: any }> = ({ profile, activeMenu, children }) => {
  // Mapping daftar menu sesuai kebutuhan Anda
  const menus = [
    { name: 'Dashboard', path: '/admin', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z' },
    { name: 'Kelola Member', path: '/admin/member', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Kelola Produk', path: '/admin/produk', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { name: 'Order & Verifikasi', path: '/admin/order', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Bonus & Komisi', path: '/admin/bonus', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Laporan Penjualan', path: '/admin/laporan', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Broadcast Notifikasi', path: '/admin/broadcast', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    { name: 'Pengaturan Website', path: '/admin/pengaturan', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ]

  return (
    <div class="min-h-screen bg-[#0B0E14] text-gray-200 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      
      {/* SIDEBAR DESKTOP */}
      <aside class="w-72 bg-[#151921] border-r border-[#222731] hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0">
        <div class="h-16 flex items-center px-6 border-b border-[#222731]">
          <h1 class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-wider">
            ADMIN<span class="font-light text-white">PANEL</span>
          </h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menus.map(m => (
            <a href={m.path} class={`flex items-center px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeMenu === m.name ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'text-[#8B949E] hover:text-white hover:bg-[#1A1E26]'
              }`}>
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={m.icon}></path></svg>
              {m.name}
            </a>
          ))}
          <form method="POST" action="/api/logout" class="mt-8 border-t border-[#222731] pt-4">
            <button type="submit" class="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Keluar Sesi
            </button>
          </form>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div class="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR (Dengan Mobile Hamburger) */}
        <header class="h-16 bg-[#151921] border-b border-[#222731] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div class="flex items-center space-x-3">
            <details class="md:hidden relative group">
              <summary class="list-none cursor-pointer p-2 bg-[#1A1E26] border border-[#2D3342] rounded-lg text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </summary>
              <div class="absolute left-0 mt-3 w-64 bg-[#151921] border border-[#222731] rounded-2xl shadow-2xl p-3 z-50 space-y-1">
                {menus.map(m => (
                  <a href={m.path} class="block px-4 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#1A1E26] hover:text-white">{m.name}</a>
                ))}
              </div>
            </details>
            <h2 class="text-base md:text-xl font-bold text-white tracking-wide">{activeMenu}</h2>
          </div>
          <div class="flex items-center space-x-3">
            <span class="hidden md:inline text-sm font-bold text-gray-400 capitalize">Halo, {profile.sub}</span>
            <div class="h-9 w-9 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-full flex items-center justify-center font-black text-sm uppercase shadow-lg shadow-blue-500/20">
              {profile.sub.charAt(0)}
            </div>
          </div>
        </header>

        {/* CONTENT BODY */}
        <main class="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
