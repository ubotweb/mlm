import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // 1. Verifikasi Token di Sisi Server (SSR)
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.redirect('/login')
  }

  let profile: any
  try {
    profile = await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch (err) {
    return c.redirect('/login?error=Sesi berakhir, silakan login kembali')
  }

  // 2. Tarik Data dari Database D1 Langsung (Tanpa Fetch API Klien)
  const db = c.env.DB
  
  const userStats = await db.prepare(
    "SELECT balance FROM users WHERE username = ?"
  ).bind(profile.sub).first()

  const downlineStats = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE sponsor_id = (SELECT id FROM users WHERE username = ?)"
  ).bind(profile.sub).first()

  const balance = (userStats?.balance as number) || 0
  const totalDownlines = (downlineStats?.count as number) || 0

  // 3. Render HTML Utuh Secara Instan
  return c.render(
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-blue-900 shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white">HMM Member Area</h1>
          <a href="/" class="text-blue-200 hover:text-white transition">Ke Beranda</a>
        </div>
      </header>

      <main class="flex-grow w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Sidebar */}
          <div class="col-span-1 bg-white p-6 rounded-xl shadow border h-fit">
            <div class="text-center mb-6">
              <div class="h-24 w-24 bg-gray-300 rounded-full mx-auto mb-3"></div>
              <h2 class="text-xl font-bold text-gray-800">{profile.sub}</h2>
              <p class="text-sm text-blue-600 font-semibold uppercase">{profile.role}</p>
            </div>
            <nav class="space-y-2">
              <a href="/member" class="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">Dashboard</a>
              <a href="/member/jaringan" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Pohon Jaringan</a>
              <a href="/member/downline" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Downline</a>
              <a href="/member/bonus" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Bonus & Komisi</a>
              <a href="/member/order" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Riwayat Pesanan</a>
              <a href="/member/withdraw" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Withdraw</a>
              <a href="/member/profil" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Profil</a>
              
              {/* Native SSR Logout Form */}
              <form method="POST" action="/api/logout" class="mt-4">
                <button type="submit" class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition">
                  Keluar (Logout)
                </button>
              </form>
            </nav>
          </div>

          {/* Main Content */}
          <div class="col-span-1 md:col-span-2 space-y-6">
            <div class="bg-white p-6 rounded-xl shadow border">
              <h3 class="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Ringkasan Bisnis</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p class="text-sm text-green-600 font-medium">Total Saldo Aktif</p>
                  <p class="text-2xl font-bold text-green-800">Rp {balance.toLocaleString('id-ID')}</p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p class="text-sm text-blue-600 font-medium">Total Downline</p>
                  <p class="text-2xl font-bold text-blue-800">{totalDownlines} Member</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow border">
              <h3 class="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Link Referral Anda</h3>
              <div class="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={`https://hmmbeauty.pages.dev/register?ref=${profile.sub}`} 
                  class="flex-grow px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none"
                />
              </div>
              <p class="text-xs text-gray-500 mt-2">Bagikan link ini untuk mendapatkan bonus sponsor saat pendaftaran baru!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
})
