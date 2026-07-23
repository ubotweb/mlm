import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  // PERBAIKAN: Menggunakan hu_id, bukan username
  const user = await db.prepare("SELECT id, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  const { results: downlines } = await db.prepare(`
    SELECT u.full_name, u.hu_id, u.status, p.name as package_name, u.created_at
    FROM users u LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.sponsor_id = ?
    ORDER BY u.created_at DESC
  `).bind(user.id).all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Referral Saya">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Referral & Downline</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Daftar mitra yang mendaftar langsung menggunakan link referral Anda.</p>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
          <h4 class="font-black text-white text-sm uppercase tracking-widest">Daftar Mitra Jaringan</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#0B0E14] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">Tanggal Join</th>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">ID & Nama Mitra</th>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">Paket</th>
                <th class="px-6 py-4 font-black text-[11px] tracking-widest uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {downlines.length === 0 ? (
                <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E] font-medium">Anda belum memiliki mitra referral.</td></tr>
              ) : downlines.map((d: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 text-[#8B949E] font-mono text-xs">
                    {new Date(d.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-bold text-white text-base">{d.full_name}</p>
                    <p class="text-[11px] font-mono text-emerald-400 mt-1">{d.hu_id}</p>
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
