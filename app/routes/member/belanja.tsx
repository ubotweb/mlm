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
  const user = await db.prepare("SELECT balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')
  
  const { results: products } = await db.prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, created_at DESC").all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Belanja (Repeat Order)">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Katalog Produk & RO</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Belanja ulang (Repeat Order) produk skincare & kesehatan HMM dengan harga khusus member.</p>
      </div>

      {products.length === 0 ? (
        <div class="bg-[#151921] border border-[#222731] rounded-2xl p-10 text-center">
           <p class="text-[#8B949E] font-bold">Katalog produk sedang kosong.</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p: any) => (
            <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-[#2D3342] transition-colors">
              <div class="h-48 bg-[#1A1E26] flex items-center justify-center relative overflow-hidden">
                {p.image_url ? (
                   <img src={p.image_url} alt={p.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                   <svg class="w-16 h-16 text-[#2D3342]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                )}
                <span class="absolute top-3 left-3 bg-[#0B0E14]/80 backdrop-blur border border-[#222731] text-[10px] font-black text-emerald-400 px-2.5 py-1 rounded uppercase tracking-widest">
                  {p.category}
                </span>
              </div>
              
              <div class="p-5 flex-1 flex flex-col">
                <h3 class="font-bold text-white text-lg mb-1 leading-tight">{p.name}</h3>
                <p class="text-xs text-[#8B949E] line-clamp-2 mb-4 flex-1">{p.description || 'Produk premium HMM Beauty & Health.'}</p>
                
                <div class="mb-5">
                  <p class="text-xs text-gray-500 line-through mb-0.5">Rp {p.price.toLocaleString('id-ID')}</p>
                  <p class="text-xl font-black text-emerald-400">Rp {p.member_price.toLocaleString('id-ID')}</p>
                  <p class="text-[10px] text-yellow-500 font-bold mt-1">Stok: {p.stock} Pcs</p>
                </div>
                
                <form action="/checkout" method="GET">
                  <input type="hidden" name="type" value="product" />
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" class="w-full bg-[#1A1E26] hover:bg-emerald-500 text-gray-300 hover:text-[#0B0E14] border border-[#2D3342] hover:border-emerald-500 font-black py-3 rounded-xl transition-colors text-xs uppercase tracking-widest">
                    Beli Produk
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  )
})
