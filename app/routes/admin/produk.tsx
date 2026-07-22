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
  const editId = c.req.query('edit')
  let editData: any = null
  
  if (editId) {
    editData = await db.prepare("SELECT * FROM products WHERE id = ?").bind(editId).first()
  }

  const { results: products } = await db.prepare("SELECT * FROM products ORDER BY created_at DESC").all()
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Produk">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-bold text-white">Katalog Produk Skincare & Kesehatan</h2>
          <p class="text-[#8B949E] text-sm mt-1">Kelola daftar produk, harga member, sertifikasi (BPOM/Halal), dan stok inventori.</p>
        </div>
        {editData && (
          <a href="/admin/produk" class="px-4 py-2 bg-[#1A1E26] border border-[#2D3342] text-gray-300 hover:text-white rounded-lg text-sm font-bold transition-colors">
            Batal Edit
          </a>
        )}
      </div>

      {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 rounded-lg mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form Tambah/Edit dengan Multipart Form Data */}
        <div class="xl:col-span-1 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">{editData ? 'Edit Produk' : 'Tambah Produk Baru'}</h4>
          </div>
          
          <form method="POST" action={editData ? "/api/admin/produk/update" : "/api/admin/produk"} enctype="multipart/form-data" class="p-6 space-y-4">
            {editData && <input type="hidden" name="id" value={editData.id} />}
            
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Produk</label>
              <input type="text" name="name" required defaultValue={editData?.name || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Kategori</label>
                <select name="category" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm uppercase">
                  <option value="skincare" selected={editData?.category === 'skincare'}>Skincare</option>
                  <option value="health" selected={editData?.category === 'health'}>Kesehatan</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Stok (Pcs)</label>
                <input type="number" name="stock" required defaultValue={editData?.stock || 0} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-bold rounded-lg px-4 py-3 focus:outline-none text-sm" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Harga Normal</label>
                <input type="number" name="price" required defaultValue={editData?.price || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-[#00E676] font-bold rounded-lg px-4 py-3 focus:outline-none text-sm tracking-widest" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Harga Member</label>
                <input type="number" name="member_price" required defaultValue={editData?.member_price || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-blue-400 font-bold rounded-lg px-4 py-3 focus:outline-none text-sm tracking-widest" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">No. BPOM</label>
                <input type="text" name="bpom_number" defaultValue={editData?.bpom_number || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">No. Halal</label>
                <input type="text" name="halal_number" defaultValue={editData?.halal_number || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Deskripsi Produk</label>
              <textarea name="description" rows={3} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm">{editData?.description || ''}</textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Foto Produk (Upload)</label>
              {editData?.image_url && (
                <div class="mb-3 p-2 bg-[#0B0E14] border border-[#2D3342] rounded-lg w-max">
                  <img src={editData.image_url} alt="Current" class="h-20 rounded" />
                  <p class="text-[10px] text-[#8B949E] mt-2">Abaikan form upload jika tidak ingin mengganti.</p>
                </div>
              )}
              {/* Type File untuk upload gambar fisik */}
              <input type="file" accept="image/*" name="image" class="w-full bg-[#0B0E14] border border-[#2D3342] text-[#8B949E] rounded-lg px-4 py-3 focus:outline-none text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1A1E26] file:text-white hover:file:bg-[#222731]" />
            </div>

            <div class="pt-4 border-t border-[#222731]">
               <label class="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" name="is_active" value="1" defaultChecked={editData ? editData.is_active === 1 : true} class="w-4 h-4 rounded bg-[#0B0E14] border-[#2D3342]" />
                 <span class="text-sm font-bold text-gray-300">Produk Aktif / Ditampilkan</span>
               </label>
            </div>

            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-colors shadow-lg shadow-blue-600/20">
              {editData ? 'Simpan Perubahan' : 'Upload & Simpan Produk'}
            </button>
          </form>
        </div>

        {/* Tabel Data Produk */}
        <div class="xl:col-span-2 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">Daftar Katalog Produk</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Produk</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Harga & Stok</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Status</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {products.length === 0 ? (
                   <tr><td colSpan={4} class="px-6 py-8 text-center text-[#8B949E]">Belum ada produk.</td></tr>
                ) : products.map((p: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-4 py-4 flex items-center space-x-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} class="w-12 h-12 rounded-lg object-cover border border-[#222731]" />
                      ) : (
                        <div class="w-12 h-12 rounded-lg bg-[#0B0E14] border border-[#222731] flex items-center justify-center text-[10px] text-gray-500 font-bold text-center">NO<br/>IMG</div>
                      )}
                      <div>
                        <p class="font-bold text-white leading-tight">{p.name}</p>
                        <p class="text-[10px] text-[#8B949E] uppercase tracking-wider mt-0.5">{p.category}</p>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <p class="text-xs text-gray-500 line-through mb-0.5">Rp {p.price.toLocaleString('id-ID')}</p>
                      <p class="font-black text-[#00E676]">Rp {p.member_price.toLocaleString('id-ID')}</p>
                      <p class="text-[10px] font-bold text-yellow-500 mt-1">Stok: {p.stock}</p>
                    </td>
                    <td class="px-4 py-4">
                      <span class={`text-[10px] px-2 py-1 rounded uppercase font-bold border ${p.is_active ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-right">
                      <div class="flex flex-col items-end space-y-2">
                        <a href={`/admin/produk?edit=${p.id}`} class="text-blue-400 hover:text-blue-300 font-bold text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg w-max transition-colors">Edit</a>
                        <form method="POST" action="/api/admin/produk/delete" onsubmit="return confirm('Yakin ingin menghapus produk ini secara permanen?');">
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" class="text-red-400 hover:text-red-300 font-bold text-xs bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg w-max transition-colors">Hapus</button>
                        </form>
                      </div>
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
