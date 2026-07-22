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
  const { results: products } = await db.prepare("SELECT * FROM products ORDER BY created_at DESC").all()

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Produk">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-white">Katalog Produk Skincare</h2>
          <p class="text-[#8B949E] text-sm mt-1">Kelola daftar produk, harga member, dan stok inventori.</p>
        </div>
        <button class="px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] rounded-lg text-sm font-bold transition-colors">
          + Produk Baru
        </button>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-[#1A1E26] text-[#8B949E] border-b border-[#222731]">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Nama Produk</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Kategori</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Harga Normal</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Stok</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Status</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {products.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-8 text-center text-[#8B949E]">Katalog produk masih kosong.</td></tr>
              ) : products.map((p: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-6 py-4 font-bold text-white">{p.name}</td>
                  <td class="px-6 py-4 text-gray-400 capitalize">{p.category}</td>
                  <td class="px-6 py-4 text-[#00E676] font-bold">Rp {p.price.toLocaleString('id-ID')}</td>
                  <td class="px-6 py-4 text-white font-bold">{p.stock}</td>
                  <td class="px-6 py-4">
                    <span class={`px-2 py-1 text-[10px] rounded font-bold uppercase border ${p.is_active ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
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
