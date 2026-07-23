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
  // PERBAIKAN: Mengambil data hu_id untuk tabel admin
  const { results: members } = await db.prepare(`
    SELECT u.id, u.hu_id, u.full_name, u.email, u.status, u.created_at, p.name as package_name 
    FROM users u 
    LEFT JOIN packages p ON u.package_id = p.id 
    WHERE u.role = 'member' 
    ORDER BY u.created_at DESC
  `).all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Member">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-black text-white">Database Member & Hak Usaha</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau jaringan mitra, lisensi aktif, dan status akun Hak Usaha (HU).</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
          <h4 class="font-black text-white text-sm uppercase tracking-widest">Daftar Jaringan Mitra</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
              <tr>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Tanggal Gabung</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">ID HU & Nama Mitra</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Kontak</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Paket Lisensi</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest">Status</th>
                <th class="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {members.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada member terdaftar.</td></tr>
              ) : members.map((m: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 text-[#8B949E] font-mono text-xs">
                    {new Date(m.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-bold text-white text-base">{m.full_name}</p>
                    <p class="text-[11px] text-emerald-400 font-mono mt-1">{m.hu_id}</p>
                  </td>
                  <td class="px-6 py-4 text-gray-300 text-xs">{m.email}</td>
                  <td class="px-6 py-4 text-gray-300 font-bold uppercase tracking-wider text-xs">{m.package_name || '-'}</td>
                  <td class="px-6 py-4">
                    <span class={`px-3 py-1.5 text-[10px] rounded border font-black uppercase tracking-widest ${m.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <form method="POST" action="/api/admin/action/suspend" onsubmit="return confirm('Ubah status member ini?');">
                      <input type="hidden" name="user_id" value={m.id} />
                      <button type="submit" class="text-yellow-500 hover:text-yellow-400 font-black text-xs bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg transition-colors">
                        Suspend
                      </button>
                    </form>
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
