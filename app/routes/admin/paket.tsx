import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { AdminLayout } from '../../components/AdminLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/loginadmin')
  let admin: any
  try { admin = await verify(token, c.env.JWT_SECRET, 'HS256') } catch (err) { return c.redirect('/loginadmin') }

  const db = c.env.DB
  // Mengambil daftar paket, urutkan berdasarkan harga
  const { results: packages } = await db.prepare("SELECT * FROM packages ORDER BY price ASC").all()

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout admin={admin} activeMenu="Manajemen Paket">
      <div class="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-black text-white">Manajemen Paket MLM</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Atur harga, nilai PV, batasan komisi, dan persentase sponsor multi-generasi.</p>
        </div>
        <button onclick="document.getElementById('createModal').showModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-sm flex items-center w-fit cursor-pointer">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Paket
        </button>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-[#8B949E] border-b border-[#222731] bg-[#1A1E26]">
              <tr>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Nama Paket</th>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Harga & PV</th>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Limit Komisi</th>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Sponsor Level</th>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest whitespace-nowrap">Status</th>
                <th class="px-5 py-4 font-black uppercase text-[10px] tracking-widest text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#222731]">
              {packages.length === 0 ? (
                <tr><td colSpan={6} class="px-6 py-8 text-center text-[#8B949E] font-medium">Belum ada paket kemitraan yang dibuat.</td></tr>
              ) : packages.map((p: any) => (
                <tr class="hover:bg-[#1A1E26] transition-colors">
                  <td class="px-5 py-4">
                    <p class="font-bold text-white text-sm">{p.name}</p>
                    <p class="text-[10px] text-[#8B949E] font-mono mt-1">ID: {p.id}</p>
                  </td>
                  <td class="px-5 py-4">
                    <p class="font-black text-emerald-400 whitespace-nowrap">Rp {p.price.toLocaleString('id-ID')}</p>
                    <p class="text-xs text-blue-400 font-bold mt-1 whitespace-nowrap">PV: {p.pv} | Poin: {p.point}</p>
                  </td>
                  <td class="px-5 py-4 whitespace-nowrap">
                    <p class="text-xs text-white"><span class="text-[#8B949E]">Pairing:</span> Max {p.max_pairing_per_day} Ps/hr</p>
                    <p class="text-xs text-white mt-1"><span class="text-[#8B949E]">CB Global:</span> Rp {p.max_cashback.toLocaleString('id-ID')}</p>
                    <p class="text-[10px] text-yellow-500 font-bold mt-1 bg-yellow-500/10 px-2 py-0.5 rounded w-fit">Auto-RO: Rp {p.ro_target_per_month.toLocaleString('id-ID')}</p>
                  </td>
                  <td class="px-5 py-4">
                    <div class="bg-[#0B0E14] border border-[#2D3342] px-3 py-1.5 rounded inline-block font-mono text-xs text-white">
                      {p.sponsor_levels}
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span class={`inline-block px-2.5 py-1 text-[10px] rounded border font-black uppercase tracking-widest ${p.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {p.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right space-x-3 whitespace-nowrap">
                    <button type="button" onclick={`openEditModal('${p.id}', '${p.name}', ${p.price}, ${p.pv}, ${p.point}, ${p.max_pairing_per_day}, ${p.max_cashback}, ${p.ro_target_per_month}, '${p.sponsor_levels}', ${p.is_active})`} class="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-wider cursor-pointer">Edit</button>
                    <form method="POST" action="/api/admin/paket/delete" class="inline" onsubmit="return confirm('Yakin ingin menghapus paket ini secara permanen?')">
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" class="text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider cursor-pointer">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREATE PAKET BARU */}
      <dialog id="createModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-2xl backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Tambah Paket Kemitraan</h4>
            <button onclick="document.getElementById('createModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">✕</button>
          </div>
          <form method="POST" action="/api/admin/paket/create" class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Paket</label>
                <input type="text" name="name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="Contoh: Diamond" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Harga Beli (Rp)</label>
                <input type="number" name="price" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="20000000" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nilai PV (Poin Pairing)</label>
                <input type="number" name="pv" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-blue-400 font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="4200" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nilai Point Fisik (Reward)</label>
                <input type="number" name="point" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="22000" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Maks. Pairing / Hari</label>
                <input type="number" name="max_pairing_per_day" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="1250" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Limit Cashback Global (Rp)</label>
                <input type="number" name="max_cashback" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="60000000" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Target Saldo Auto-RO (Rp)</label>
                <input type="number" name="ro_target_per_month" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-yellow-500 font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="300000" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Persentase Sponsor Multi-Generasi (JSON)</label>
                <input type="text" name="sponsor_levels" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" placeholder="[10, 5, 3, 3, 2]" defaultValue="[]" />
                <p class="text-[10px] text-gray-500 mt-1 font-medium">Format wajib menggunakan tanda kurung siku (JSON Array). Contoh: [10, 5] artinya Level 1 = 10%, Level 2 = 5%.</p>
              </div>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-6 transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs cursor-pointer">
              Simpan Paket
            </button>
          </form>
        </div>
      </dialog>

      {/* MODAL EDIT PAKET */}
      <dialog id="editModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-2xl backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <h4 class="font-black text-white text-sm uppercase tracking-widest">Edit Paket Kemitraan</h4>
            <button onclick="document.getElementById('editModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">✕</button>
          </div>
          <form method="POST" action="/api/admin/paket/update" class="p-6">
            <input type="hidden" name="id" id="edit_id" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Paket</label>
                <input type="text" name="name" id="edit_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Harga Beli (Rp)</label>
                <input type="number" name="price" id="edit_price" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nilai PV (Poin Pairing)</label>
                <input type="number" name="pv" id="edit_pv" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-blue-400 font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nilai Point Fisik (Reward)</label>
                <input type="number" name="point" id="edit_point" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Maks. Pairing / Hari</label>
                <input type="number" name="max_pairing_per_day" id="edit_max_pairing_per_day" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Limit Cashback Global (Rp)</label>
                <input type="number" name="max_cashback" id="edit_max_cashback" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Target Saldo Auto-RO (Rp)</label>
                <input type="number" name="ro_target_per_month" id="edit_ro_target_per_month" required min="0" class="w-full bg-[#0B0E14] border border-[#2D3342] text-yellow-500 font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Persentase Sponsor Multi-Generasi (JSON)</label>
                <input type="text" name="sponsor_levels" id="edit_sponsor_levels" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
                <p class="text-[10px] text-gray-500 mt-1 font-medium">Contoh penulisan: [10, 5, 3] (Untuk bonus level 1: 10%, level 2: 5%, level 3: 3%).</p>
              </div>
              <div class="md:col-span-2 pt-2">
                <label class="flex items-center space-x-3 cursor-pointer p-3 bg-[#0B0E14] border border-[#2D3342] rounded-xl">
                  <input type="checkbox" name="is_active" id="edit_is_active" value="1" class="w-5 h-5 accent-emerald-500 bg-[#1A1E26] border-[#2D3342] rounded" />
                  <span class="text-sm font-bold text-white">Status Paket Aktif (Bisa dibeli)</span>
                </label>
              </div>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl mt-6 transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs cursor-pointer">
              Simpan Perubahan
            </button>
          </form>
        </div>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: `
        function openEditModal(id, name, price, pv, point, maxPair, maxCB, roTarget, sponsorJson, isActive) {
          document.getElementById('edit_id').value = id;
          document.getElementById('edit_name').value = name;
          document.getElementById('edit_price').value = price;
          document.getElementById('edit_pv').value = pv;
          document.getElementById('edit_point').value = point;
          document.getElementById('edit_max_pairing_per_day').value = maxPair;
          document.getElementById('edit_max_cashback').value = maxCB;
          document.getElementById('edit_ro_target_per_month').value = roTarget;
          document.getElementById('edit_sponsor_levels').value = sponsorJson;
          document.getElementById('edit_is_active').checked = isActive === 1;
          document.getElementById('editModal').showModal();
        }
      `}} />

    </AdminLayout>
  )
})
