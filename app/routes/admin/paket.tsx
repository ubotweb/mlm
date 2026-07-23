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
  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY registration_fee ASC").all()
  
  // Tangkap parameter query ?edit=ID_PAKET
  const editId = c.req.query('edit')
  let editData: any = null
  if (editId) {
    editData = packages.find((p: any) => p.id === editId)
  }

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Paket MLM">
      <div class="mb-6">
        <h2 class="text-2xl font-black text-white">Kelola Paket Registrasi Binary</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Atur rasio Hak Usaha (HU), jumlah produk fisik, dan bonus sponsor per level.</p>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form Tambah / Edit Paket */}
        <div class="xl:col-span-1 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">{editData ? 'Edit Paket Kemitraan' : 'Tambah Paket Baru'}</h4>
            {editData && <a href="/admin/paket" class="text-xs text-blue-400 font-bold hover:text-white">Batal Edit</a>}
          </div>
          <form method="POST" action={editData ? "/api/admin/paket/update" : "/api/admin/paket"} class="p-6 space-y-5">
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Kode ID Paket</label>
              <input type="text" name="id" value={editData?.id || ''} required readOnly={!!editData} class={`w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm font-mono ${editData ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Contoh: pkg_diamond" />
              {editData && <p class="text-[10px] text-gray-500 mt-1">ID Paket tidak dapat diubah.</p>}
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Level</label>
              <input type="text" name="name" value={editData?.name || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="Diamond" />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Jml Hak Usaha (HU)</label>
                <input type="number" name="hu_count" value={editData?.hu_count || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-black rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm text-center" placeholder="1" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Jml Produk</label>
                <input type="number" name="product_count" value={editData?.product_count || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-blue-400 font-black rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm text-center" placeholder="1" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Biaya Daftar (Rp)</label>
              <input type="number" name="registration_fee" value={editData?.registration_fee || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm tracking-widest" placeholder="150000" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Bonus Sponsor (Rp)</label>
              <input type="number" name="sponsor_bonus_amount" value={editData?.sponsor_bonus_amount || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm tracking-widest" placeholder="50000" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Diskon Produk RO (%)</label>
              <input type="number" name="discount_percentage" value={editData?.discount_percentage || ''} required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="10" />
            </div>
            <div class="pt-4 border-t border-[#222731]">
               <label class="flex items-center space-x-3 mb-3 cursor-pointer">
                 <input type="checkbox" name="network_bonus_eligible" value="1" defaultChecked={editData ? editData.network_bonus_eligible === 1 : true} class="w-4 h-4 rounded bg-[#0B0E14] border-[#2D3342]" />
                 <span class="text-sm font-bold text-gray-300">Dapat Bonus Jaringan/Pasangan</span>
               </label>
            </div>
            <button type="submit" class={`w-full text-white font-black py-4 rounded-xl mt-2 transition-colors shadow-lg uppercase tracking-widest text-xs ${editData ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}>
              {editData ? 'Perbarui Paket' : 'Simpan Paket'}
            </button>
          </form>
        </div>

        {/* Tabel Data Paket */}
        <div class="xl:col-span-2 bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731]">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Daftar Level Kemitraan</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Level</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest text-center">Formasi</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest">Harga & Sponsor</th>
                  <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {packages.map((p: any) => (
                  <tr class="hover:bg-[#1A1E26] transition-colors">
                    <td class="px-5 py-5">
                      <p class="font-black text-white uppercase text-base">{p.name}</p>
                      <p class="text-[10px] text-gray-500 font-mono mt-1">{p.id}</p>
                    </td>
                    <td class="px-5 py-5 text-center">
                      <div class="inline-flex flex-col items-center">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-lg px-3 py-1 rounded-lg mb-1">{p.hu_count} HU</span>
                        <span class="text-[10px] text-[#8B949E] font-bold uppercase tracking-wider">{p.product_count} Produk</span>
                      </div>
                    </td>
                    <td class="px-5 py-5">
                      <p class="font-black text-white mb-1">Rp {p.registration_fee.toLocaleString('id-ID')}</p>
                      <p class="text-xs text-blue-400 font-bold">Sponsor: Rp {p.sponsor_bonus_amount.toLocaleString('id-ID')}</p>
                    </td>
                    <td class="px-5 py-5 text-right whitespace-nowrap">
                      <a href={`/admin/paket?edit=${p.id}`} class="inline-block text-blue-400 hover:text-blue-300 font-black text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-colors mr-2">Edit</a>
                      <form method="POST" action="/api/admin/paket/delete" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus paket ini?');">
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" class="text-red-400 hover:text-red-300 font-black text-xs bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors">Hapus</button>
                      </form>
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
