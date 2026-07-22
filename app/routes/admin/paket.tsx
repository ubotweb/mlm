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
  // Ambil data paket dari DB
  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY registration_fee ASC").all()
  
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Kelola Paket MLM">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white">Kelola Paket Registrasi MLM</h2>
        <p class="text-[#8B949E] text-sm mt-1">Atur level keanggotaan, harga pendaftaran, dan struktur bonus sponsor secara dinamis.</p>
      </div>

      {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 rounded-lg mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form Tambah Paket */}
        <div class="xl:col-span-1 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm h-fit">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">Tambah Paket Baru</h4>
          </div>
          <form method="POST" action="/api/admin/paket" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Kode ID Paket</label>
              <input type="text" name="id" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" placeholder="Contoh: pkg_diamond" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Paket (Level)</label>
              <input type="text" name="name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" placeholder="Diamond" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Biaya Pendaftaran (Rp)</label>
              <input type="number" name="registration_fee" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-[#00E676] font-bold rounded-lg px-4 py-3 focus:outline-none text-sm tracking-widest" placeholder="5000000" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Bonus Sponsor (Rp)</label>
              <input type="number" name="sponsor_bonus_amount" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm tracking-widest" placeholder="500000" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Diskon Produk (%)</label>
              <input type="number" name="discount_percentage" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none text-sm" placeholder="40" />
            </div>
            <div class="pt-4 border-t border-[#222731]">
               <label class="flex items-center space-x-3 mb-3 cursor-pointer">
                 <input type="checkbox" name="network_bonus_eligible" value="1" class="w-4 h-4 rounded bg-[#0B0E14] border-[#2D3342]" />
                 <span class="text-sm font-bold text-gray-300">Dapat Bonus Jaringan</span>
               </label>
               <label class="flex items-center space-x-3 cursor-pointer">
                 <input type="checkbox" name="leadership_bonus_eligible" value="1" class="w-4 h-4 rounded bg-[#0B0E14] border-[#2D3342]" />
                 <span class="text-sm font-bold text-gray-300">Dapat Bonus Leadership</span>
               </label>
            </div>
            <button type="submit" class="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-bold py-3 rounded-lg mt-4 transition-colors">Simpan Paket</button>
          </form>
        </div>

        {/* Tabel Data Paket */}
        <div class="xl:col-span-2 bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
          <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
            <h4 class="font-bold text-white text-sm">Daftar Paket Terdaftar</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]">
                <tr>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Level Paket</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Pendaftaran</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Bonus Sponsor</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider">Hak Bonus</th>
                  <th class="px-4 py-4 font-bold uppercase text-xs tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#222731]">
                {packages.map((p: any) => (
                  <tr class="hover:bg-[#1A1E26]">
                    <td class="px-4 py-4">
                      <p class="font-bold text-white uppercase">{p.name}</p>
                      <p class="text-[10px] text-gray-500 font-mono mt-1">{p.id}</p>
                    </td>
                    <td class="px-4 py-4 font-black text-[#00E676]">Rp {p.registration_fee.toLocaleString('id-ID')}</td>
                    <td class="px-4 py-4 font-bold text-blue-400">Rp {p.sponsor_bonus_amount.toLocaleString('id-ID')}</td>
                    <td class="px-4 py-4">
                      <div class="flex flex-col space-y-1">
                        <span class={`text-[9px] px-2 py-0.5 rounded uppercase font-bold w-max ${p.network_bonus_eligible ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-500'}`}>Jaringan</span>
                        <span class={`text-[9px] px-2 py-0.5 rounded uppercase font-bold w-max ${p.leadership_bonus_eligible ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-gray-800 text-gray-500'}`}>Leadership</span>
                      </div>
                    </td>
                    <td class="px-4 py-4 text-right">
                      <form method="POST" action="/api/admin/paket/delete" onsubmit="return confirm('Yakin ingin menghapus paket ini? Pastikan tidak ada member yang menggunakannya.');">
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" class="text-red-400 hover:text-red-300 font-bold text-xs">Hapus</button>
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
