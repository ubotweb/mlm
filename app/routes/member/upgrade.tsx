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
  // Tarik data user untuk mengetahui paket yang aktif saat ini
  const user = await db.prepare("SELECT balance, package_id FROM users WHERE username = ?").bind(profile.sub).first()
  
  // Tarik seluruh paket dari database
  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY registration_fee ASC").all()

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Upgrade Paket">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-white">Upgrade Level Kemitraan</h2>
        <p class="text-[#8B949E] text-sm mt-1">Tingkatkan lisensi paket MLM Anda untuk membuka potensi komisi dan reward yang lebih besar.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg: any) => {
          const isCurrentPackage = user?.package_id === pkg.id;
          
          return (
            <div class={`relative bg-[#151921] rounded-2xl overflow-hidden shadow-lg border flex flex-col ${isCurrentPackage ? 'border-[#00E676] shadow-[#00E676]/10' : 'border-[#222731]'}`}>
              {/* Badge Paket Saat Ini */}
              {isCurrentPackage && (
                <div class="absolute top-0 right-0 bg-[#00E676] text-[#0B0E14] text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg">
                  Paket Aktif
                </div>
              )}
              
              <div class="p-6 border-b border-[#222731] text-center">
                <h3 class="text-xl font-black text-white uppercase tracking-wider mb-2">{pkg.name}</h3>
                <div class="flex justify-center items-baseline">
                  <span class="text-sm text-[#8B949E] font-bold mr-1">Rp</span>
                  <span class="text-3xl font-black text-[#00E676]">{pkg.registration_fee.toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div class="p-6 flex-1 flex flex-col">
                <ul class="space-y-4 mb-8 flex-1">
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-[#00E676] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm text-gray-300">Diskon Produk <b class="text-white">{pkg.discount_percentage}%</b></span>
                  </li>
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-[#00E676] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm text-gray-300">Bonus Sponsor <b class="text-white">Rp {pkg.sponsor_bonus_amount.toLocaleString('id-ID')}</b></span>
                  </li>
                  <li class="flex items-start">
                    {pkg.network_bonus_eligible ? (
                      <svg class="w-5 h-5 text-[#00E676] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <svg class="w-5 h-5 text-[#2D3342] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    <span class={`text-sm ${pkg.network_bonus_eligible ? 'text-gray-300' : 'text-[#8B949E] line-through'}`}>Bonus Jaringan & Pasangan</span>
                  </li>
                  <li class="flex items-start">
                    {pkg.leadership_bonus_eligible ? (
                      <svg class="w-5 h-5 text-[#00E676] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <svg class="w-5 h-5 text-[#2D3342] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    <span class={`text-sm ${pkg.leadership_bonus_eligible ? 'text-gray-300' : 'text-[#8B949E] line-through'}`}>Bonus Leadership / Reward</span>
                  </li>
                </ul>
                
                {isCurrentPackage ? (
                  <button disabled class="w-full py-3 rounded-xl bg-[#1A1E26] text-gray-500 font-bold cursor-not-allowed">
                    Paket Saat Ini
                  </button>
                ) : (
                  <form action="/checkout" method="GET">
                    <input type="hidden" name="type" value="package" />
                    <input type="hidden" name="id" value={pkg.id} />
                    <button type="submit" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-600/20">
                      Pilih & Upgrade
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </MemberLayout>
  )
})
