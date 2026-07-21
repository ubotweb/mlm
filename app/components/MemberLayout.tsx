import type { FC } from 'hono/jsx'

export const MemberLayout: FC<{ profile: any; balance: number; activeMenu: string; children: any }> = ({ profile, balance, activeMenu, children }) => {
  const menus = [
    { name: 'Dashboard', path: '/member', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z' },
    { name: 'Referral & Downline', path: '/member/downline', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Pencairan (Withdraw)', path: '/member/withdraw', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'Profil Saya', path: '/member/profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ]

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-[#0B0E14] text-gray-800 dark:text-gray-200 flex font-sans transition-colors duration-300">
      {/* SIDEBAR */}
      <aside class="w-64 bg-white dark:bg-[#151921] border-r border-gray-200 dark:border-[#222731] hidden md:flex flex-col sticky top-0 h-screen">
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#222731]">
          <h1 class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400 tracking-wider">
            HMM<span class="font-light text-gray-800 dark:text-white">BEAUTY</span>
          </h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-1">
          {menus.map(m => (
            <a href={m.path} class={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeMenu === m.name ? 'bg-blue-50 dark:bg-[#1C2333] text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1E26]'}`}>
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={m.icon}></path></svg>
              {m.name}
            </a>
          ))}
          <form method="POST" action="/api/logout" class="mt-8 border-t border-gray-100 dark:border-[#222731] pt-4">
            <button type="submit" class="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-[#331C1C] rounded-lg transition-colors font-medium">
              Keluar
            </button>
          </form>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 bg-white dark:bg-[#151921] border-b border-gray-200 dark:border-[#222731] flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">{activeMenu} - HMM</h2>
          <div class="flex items-center space-x-4">
            <div class="hidden sm:flex flex-col items-end mr-4">
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wider">SALDO AKTIF</span>
              <span class="text-sm font-bold text-emerald-600 dark:text-[#00E676]">Rp {balance.toLocaleString('id-ID')}</span>
            </div>
            <div class="h-10 w-10 bg-emerald-100 dark:bg-[#1B2A24] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-lg">
              {profile.sub.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main class="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
