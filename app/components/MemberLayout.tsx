import type { FC } from 'hono/jsx'

export const MemberLayout: FC<{ profile: any; balance: number; activeMenu: string; children: any }> = ({ profile, balance, activeMenu, children }) => {
  // Menu diperbarui dengan penambahan Upgrade Paket & Belanja (RO)
  const menus = [
    { name: 'Dashboard', path: '/member', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
    { name: 'Pohon Jaringan', path: '/member/jaringan', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Referral Saya', path: '/member/downline', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { name: 'Upgrade Paket', path: '/member/upgrade', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Belanja (Repeat Order)', path: '/member/belanja', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { name: 'Riwayat Pesanan', path: '/member/order', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Buku Rekening', path: '/member/withdraw', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Profil Saya', path: '/member/profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ]

  return (
    <div class="min-h-screen bg-[#0B0E14] text-gray-200 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR DESKTOP */}
      <aside class="w-72 bg-[#151921] border-r border-[#222731] hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0">
        <div class="h-16 flex items-center px-6 border-b border-[#222731]">
          <h1 class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
            HMM<span class="font-light text-white">BEAUTY</span>
          </h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menus.map(m => (
            <a 
              href={m.path} 
              class={`flex items-center px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeMenu === m.name 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
                  : 'text-[#8B949E] hover:text-white hover:bg-[#1A1E26]'
              }`}
            >
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
        
        {/* TOP NAVBAR */}
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
            <div class="flex flex-col items-end">
              <span class="text-[10px] text-[#8B949E] font-bold tracking-wider uppercase">SALDO CAIR</span>
              <span class="text-xs md:text-sm font-extrabold text-[#00E676]">Rp {balance.toLocaleString('id-ID')}</span>
            </div>
            <div class="h-9 w-9 bg-[#1B2A24] border border-[#00E676]/30 text-[#00E676] rounded-full flex items-center justify-center font-black text-sm uppercase">
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
