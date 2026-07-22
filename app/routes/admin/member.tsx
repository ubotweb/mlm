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
  // SSR Fetch Data
  const { results: members } = await db.prepare(`
    SELECT u.id, u.username, u.full_name, u.phone, u.status, u.created_at, p.name as package_name
    FROM users u LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.role = 'member' ORDER BY u.created_at DESC LIMIT 100
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Member">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Kelola Data Member</h2>
          <p class="text-[#8B949E] text-sm mt-1">Pantau dan kelola seluruh anggota jaringan HMM Beauty.</p>
        </div>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors">
          + Tambah Member
        </button>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Username / Nama</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Kontak</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Paket</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal Daftar</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Status</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {members.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-8 text-center text-[#8B949E]">Belum ada member terdaftar.</td></tr>
              ) : members.map((m: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-bold text-white">{m.username}</p>
                    <p class="text-xs text-[#8B949E] uppercase">{m.full_name}</p>
                  </td>
                  <td class="px-6 py-4 text-gray-300 font-medium">{m.phone || '-'}</td>
                  <td class="px-6 py-4 text-blue-400 font-bold uppercase text-[10px] tracking-wider">{m.package_name || 'Starter'}</td>
                  <td class="px-6 py-4 text-[#8B949E]">{new Date(m.created_at).toLocaleDateString('id-ID')}</td>
                  <td class="px-6 py-4">
                    <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase ${m.status === 'active' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="text-[#8B949E] hover:text-white transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
})
