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
  // PERBAIKAN: Menggunakan hu_id
  const user = await db.prepare("SELECT balance, package_id FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')
  
  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY registration_fee ASC").all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Upgrade Paket">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Upgrade Hak Usaha</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Tingkatkan lisensi paket MLM Anda untuk membuka potensi komisi dan reward yang lebih besar.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {packages.map((pkg: any) => {
          const isCurrentPackage = user.package_id === pkg.id;
          
          return (
            <div class={`relative bg-[#151921] rounded-2xl overflow-hidden shadow-sm border flex flex-col ${isCurrentPackage ? 'border-emerald-500 shadow-emerald-500/10' : 'border-[#222731] hover:border-[#2D3342] transition-colors'}`}>
              {isCurrentPackage && (
                <div class="absolute top-0 right-0 bg-emerald-500 text-[#0B0E14] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl z-10">
                  Paket Aktif
                </div>
              )}
              
              <div class="p-6 border-b border-[#222731] text-center bg-[#1A1E26]">
                <h3 class="text-xl font-black text-white uppercase tracking-wider mb-2">{pkg.name}</h3>
                <div class="flex justify-center items-baseline mb-2">
                  <span class="text-sm text-[#8B949E] font-bold mr-1">Rp</span>
                  <span class="text-3xl font-black text-emerald-400">{pkg.registration_fee.toLocaleString('id-ID')}</span>
                </div>
                <div class="inline-flex items-center space-x-2">
                  <span class="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-emerald-500/20">{pkg.hu_count} HU</span>
                  <span class="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded border border-blue-500/20">{pkg.product_count} Produk</span>
                </div>
              </div>
              
              <div class="p-6 flex-1 flex flex-col">
                <ul class="space-y-4 mb-8 flex-1">
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-emerald-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm text-gray-300 font-medium">Diskon Produk <b class="text-white">{pkg.discount_percentage}%</b></span>
                  </li>
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-emerald-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm text-gray-300 font-medium">Bonus Sponsor <b class="text-white">Rp {pkg.sponsor_bonus_amount.toLocaleString('id-ID')}</b></span>
                  </li>
                  <li class="flex items-start">
                    {pkg.network_bonus_eligible ? (
                      <svg class="w-5 h-5 text-emerald-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <svg class="w-5 h-5 text-[#2D3342] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    <span class={`text-sm font-medium ${pkg.network_bonus_eligible ? 'text-gray-300' : 'text-[#8B949E] line-through'}`}>Bonus Jaringan & Pasangan</span>
                  </li>
                  <li class="flex items-start">
                    {pkg.leadership_bonus_eligible ? (
                      <svg class="w-5 h-5 text-emerald-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    ) : (
                      <svg class="w-5 h-5 text-[#2D3342] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    )}
                    <span class={`text-sm font-medium ${pkg.leadership_bonus_eligible ? 'text-gray-300' : 'text-[#8B949E] line-through'}`}>Bonus Leadership / Reward</span>
                  </li>
                </ul>
                
                {isCurrentPackage ? (
                  <button disabled class="w-full py-4 rounded-xl bg-[#0B0E14] border border-[#2D3342] text-[#8B949E] font-black cursor-not-allowed uppercase tracking-widest text-xs">
                    Paket Saat Ini
                  </button>
                ) : (
                  <form action="/checkout" method="GET">
                    <input type="hidden" name="type" value="package" />
                    <input type="hidden" name="id" value={pkg.id} />
                    <button type="submit" class="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">
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
