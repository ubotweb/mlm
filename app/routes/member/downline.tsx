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
  const user = await db.prepare("SELECT balance FROM users WHERE username = ?").bind(profile.sub).first()
  
  const { results: downlines } = await db.prepare(`
    SELECT full_name, email, phone, status, created_at
    FROM users WHERE sponsor_id = (SELECT id FROM users WHERE username = ?) ORDER BY created_at DESC
  `).bind(profile.sub).all()

  const referralLink = `https://hmmbeauty.pages.dev/register?ref=${profile.sub}`

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Referral Saya">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-white">Program Afiliasi / Referral</h2>
        <p class="text-[#8B949E] text-sm mt-1">Ajak teman bergabung dan dapatkan komisi pasif untuk setiap pesan sukses mereka!</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2 bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm">
          <div class="flex items-center mb-4">
            <div class="p-2 bg-[#1C2333] text-blue-400 rounded-lg mr-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            </div>
            <h4 class="font-bold text-white text-lg">Tautan Undang Teman</h4>
          </div>
          <p class="text-sm text-[#8B949E] mb-4">Salin dan bagikan tautan ini. Anda akan mendapatkan bonus per pesan yang mereka sebarkan.</p>
          <div class="flex border border-[#222731] rounded-lg bg-[#0B0E14] overflow-hidden">
            <input type="text" id="refLink" readOnly value={referralLink} class="flex-grow bg-transparent text-gray-300 px-4 py-3 focus:outline-none text-sm font-medium" />
            <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('refLink').value); alert('Tautan berhasil disalin!')" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 font-bold transition-colors">
              Salin
            </button>
          </div>
        </div>

        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div class="flex items-center mb-4">
            <div class="p-2 bg-[#332A1C] text-yellow-500 rounded-lg mr-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h4 class="font-bold text-white text-lg">Total Bonus Pasif</h4>
          </div>
          <h2 class="text-4xl font-black text-yellow-500 mb-2">Rp 0</h2>
          <p class="text-xs text-[#8B949E]">Bonus telah otomatis ditambahkan ke saldo Wallet Anda.</p>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 border-b border-[#222731] flex justify-between items-center bg-[#151921]">
          <h4 class="font-bold text-white">Daftar Jaringan Anda (Downline)</h4>
          <span class="bg-[#222731] text-gray-300 text-xs px-3 py-1 rounded-full font-bold border border-[#2D3342]">{downlines.length} Anggota</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#0B0E14] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Identitas Teman</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal Bergabung</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {downlines.length === 0 ? (
                 <tr><td colSpan={3} class="px-6 py-8 text-center text-[#8B949E]">Belum ada downline.</td></tr>
              ) : downlines.map((d: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-6 py-4">
                      <p class="font-bold text-white uppercase tracking-wide">{d.full_name}</p>
                      <p class="text-xs text-[#8B949E] mt-1">{d.email}</p>
                    </td>
                    <td class="px-6 py-4 text-[#8B949E] font-medium text-xs uppercase tracking-wide">
                      {new Date(d.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase ${d.status === 'active' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  )
})
