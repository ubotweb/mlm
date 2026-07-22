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
  } catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  const { results: broadcasts } = await db.prepare("SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 20").all()
  
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Broadcast Notifikasi">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white">Broadcast Notifikasi</h2>
        <p class="text-[#8B949E] text-sm mt-1">Kirim pesan massal ke seluruh member atau grup paket spesifik.</p>
      </div>

      {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 rounded-lg mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form SSR */}
        <div class="lg:col-span-1 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">Kirim Pesan Baru</h4>
          </div>
          <form method="POST" action="/api/admin/broadcasts" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Target Penerima</label>
              <select name="targetAudience" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none uppercase text-xs font-bold">
                <option value="all">Semua Member</option>
                <option value="pkg_starter">Hanya Starter</option>
                <option value="pkg_silver">Hanya Silver</option>
                <option value="pkg_gold">Hanya Gold</option>
                <option value="pkg_platinum">Hanya Platinum</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Judul Pesan</label>
              <input type="text" name="title" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Isi Pesan</label>
              <textarea name="message" required rows={5} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors text-sm shadow-lg shadow-blue-600/20">Kirim Broadcast</button>
          </form>
        </div>

        {/* Tabel Riwayat */}
        <div class="lg:col-span-2 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">Riwayat Pengiriman</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-6 py-4 font-bold uppercase text-xs tracking-wider">Tanggal</th>
                  <th class="px-6 py-4 font-bold uppercase text-xs tracking-wider">Target</th>
                  <th class="px-6 py-4 font-bold uppercase text-xs tracking-wider">Judul & Pesan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {broadcasts.length === 0 ? (
                   <tr><td colSpan={3} class="px-6 py-8 text-center text-[#8B949E]">Belum ada broadcast yang dikirim.</td></tr>
                ) : broadcasts.map((b: any) => (
                  <tr class="hover:bg-[#1A1E26]">
                    <td class="px-6 py-4 text-[#8B949E] text-xs font-medium">{new Date(b.created_at).toLocaleString('id-ID')}</td>
                    <td class="px-6 py-4"><span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase">{b.target_audience}</span></td>
                    <td class="px-6 py-4">
                      <p class="font-bold text-white">{b.title}</p>
                      <p class="text-xs text-gray-500 truncate max-w-xs">{b.message}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
})
