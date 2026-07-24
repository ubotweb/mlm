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
  
  // Ambil data user yang sedang login untuk Layout
  const loggedInHu = profile.sub
  const user = await db.prepare("SELECT id, hu_id, full_name, balance FROM users WHERE hu_id = ?").bind(loggedInHu).first()
  if (!user) return c.redirect('/login')

  // Logika Traversal: Ambil target HU yang ingin dilihat (Default: HU yang sedang login)
  const viewHu = c.req.query('view') || loggedInHu
  // [DIUBAH]: Menarik data PV dari database baru untuk node yang sedang dilihat
  const viewNode = await db.prepare(`
    SELECT id, hu_id, full_name, upline_id, 
           pv_left_today, pv_right_today, sisa_pv_left, sisa_pv_right, reward_pv_left, reward_pv_right 
    FROM users WHERE hu_id = ?
  `).bind(viewHu).first()
  
  if (!viewNode) return c.redirect('/member/jaringan')

  // Cari Upline dari viewNode untuk fitur "Naik 1 Level" (Hanya jika bukan di root milik user sendiri)
  let parentHu = null
  if (viewNode.upline_id && viewHu !== loggedInHu) {
     const parent = await db.prepare("SELECT hu_id FROM users WHERE id = ?").bind(viewNode.upline_id).first()
     if (parent) parentHu = parent.hu_id
  }

  // Mengambil direct downline di pohon jaringan binary (left & right) berdasarkan viewNode
  const { results: binaryNodes } = await db.prepare(`
    SELECT u.id, u.hu_id, u.full_name, u.network_position, u.status, p.name as package_name
    FROM users u
    LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.upline_id = ?
  `).bind(viewNode.id).all()

  const leftNode = binaryNodes.find((n: any) => n.network_position === 'left')
  const rightNode = binaryNodes.find((n: any) => n.network_position === 'right')

  // [DIUBAH]: Mengambil PIN yang belum terpakai menyesuaikan nama kolom baru (owner_id & status = 'active')
  const { results: availablePins } = await db.prepare(`
    SELECT a.pin_code, p.name as package_name 
    FROM activation_pins a
    JOIN packages p ON a.package_id = p.id
    WHERE a.owner_id = ? AND a.status = 'active'
  `).bind(user.id).all()

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Pohon Jaringan">
      <div class="mb-8 flex justify-between items-end">
        <div>
          <h2 class="text-3xl font-black text-white">Pohon Jaringan Binary</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau struktur Hak Usaha (HU), telusuri ke bawah, dan aktivasi mitra baru di titik kosong.</p>
        </div>
        {parentHu && (
          <a href={`?view=${parentHu}`} class="bg-[#1A1E26] hover:bg-[#2D3342] text-white border border-[#2D3342] px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            Naik 1 Level
          </a>
        )}
      </div>

      {/* PANEL STATISTIK PV (Menyelipkan data PV tanpa merusak UI Jaringan Anda) */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-[#151921] border border-[#222731] p-5 rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <p class="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Kaki Kiri (Hari Ini / Sisa)</p>
              <p class="text-xl font-black text-emerald-400 mt-1">{viewNode.pv_left_today} <span class="text-sm text-gray-500">/ {viewNode.sisa_pv_left} PV</span></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Total Reward</p>
              <p class="text-lg font-black text-yellow-500 mt-1">{viewNode.reward_pv_left}</p>
            </div>
        </div>
        <div class="bg-[#151921] border border-[#222731] p-5 rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <p class="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Kaki Kanan (Hari Ini / Sisa)</p>
              <p class="text-xl font-black text-emerald-400 mt-1">{viewNode.pv_right_today} <span class="text-sm text-gray-500">/ {viewNode.sisa_pv_right} PV</span></p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-black text-[#8B949E] uppercase tracking-widest">Total Reward</p>
              <p class="text-lg font-black text-yellow-500 mt-1">{viewNode.reward_pv_right}</p>
            </div>
        </div>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm p-8 flex flex-col items-center">
        
        {/* Node Utama (View Root) */}
        <div class="flex flex-col items-center mb-10 relative z-10">
          <div class="w-16 h-16 bg-blue-600 rounded-full border-4 border-[#0B0E14] shadow-lg shadow-blue-600/30 flex items-center justify-center mb-3">
             <span class="font-black text-white text-xl">{String(viewNode.full_name).charAt(0).toUpperCase()}</span>
          </div>
          <div class="text-center bg-[#1A1E26] px-4 py-2 rounded-lg border border-[#2D3342]">
             <p class="font-black text-white text-sm">{viewNode.full_name}</p>
             <p class="text-[10px] font-mono text-emerald-400 mt-1">{viewNode.hu_id}</p>
             {viewNode.hu_id === loggedInHu && (
                <p class="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded mt-1 uppercase tracking-widest inline-block">Anda</p>
             )}
          </div>
        </div>

        {/* Garis Konektor */}
        <div class="w-full max-w-md h-10 border-t-2 border-x-2 border-[#2D3342] rounded-t-xl mb-4 -mt-14 relative z-0"></div>

        {/* Node Kiri dan Kanan */}
        <div class="w-full max-w-2xl flex justify-between px-4 md:px-10">
          
          {/* KIRI */}
          <div class="flex flex-col items-center w-1/2">
            {leftNode ? (
              <a href={`?view=${leftNode.hu_id}`} class="flex flex-col items-center group cursor-pointer">
                <div class={`w-14 h-14 rounded-full border-4 border-[#0B0E14] shadow-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${leftNode.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
                   <span class="font-black text-white text-lg">{String(leftNode.full_name).charAt(0).toUpperCase()}</span>
                </div>
                <div class="text-center bg-[#1A1E26] px-3 py-2 rounded-lg border border-[#2D3342] group-hover:border-emerald-500 transition-colors">
                   <p class="font-black text-white text-xs">{leftNode.full_name}</p>
                   <p class="text-[9px] font-mono text-emerald-400 mt-1">{leftNode.hu_id}</p>
                   <p class="text-[9px] text-[#8B949E] mt-1">{leftNode.package_name || 'Basic'}</p>
                </div>
              </a>
            ) : (
              <div onclick={`openActivation('${viewNode.hu_id}', 'left')`} class="flex flex-col items-center group cursor-pointer">
                <div class="w-14 h-14 bg-[#1A1E26] rounded-full border-4 border-[#222731] border-dashed flex items-center justify-center mb-3 group-hover:bg-[#2D3342] group-hover:border-emerald-500 transition-colors">
                   <span class="text-[#8B949E] group-hover:text-emerald-400 font-black text-xl">+</span>
                </div>
                <div class="text-center bg-[#0B0E14] px-3 py-2 rounded-lg border border-[#222731] group-hover:border-emerald-500 transition-colors">
                   <p class="font-bold text-[#8B949E] group-hover:text-emerald-400 text-[10px] uppercase tracking-widest">Tambah Kiri</p>
                </div>
              </div>
            )}
          </div>

          {/* KANAN */}
          <div class="flex flex-col items-center w-1/2">
            {rightNode ? (
              <a href={`?view=${rightNode.hu_id}`} class="flex flex-col items-center group cursor-pointer">
                <div class={`w-14 h-14 rounded-full border-4 border-[#0B0E14] shadow-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${rightNode.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
                   <span class="font-black text-white text-lg">{String(rightNode.full_name).charAt(0).toUpperCase()}</span>
                </div>
                <div class="text-center bg-[#1A1E26] px-3 py-2 rounded-lg border border-[#2D3342] group-hover:border-emerald-500 transition-colors">
                   <p class="font-black text-white text-xs">{rightNode.full_name}</p>
                   <p class="text-[9px] font-mono text-emerald-400 mt-1">{rightNode.hu_id}</p>
                   <p class="text-[9px] text-[#8B949E] mt-1">{rightNode.package_name || 'Basic'}</p>
                </div>
              </a>
            ) : (
              <div onclick={`openActivation('${viewNode.hu_id}', 'right')`} class="flex flex-col items-center group cursor-pointer">
                <div class="w-14 h-14 bg-[#1A1E26] rounded-full border-4 border-[#222731] border-dashed flex items-center justify-center mb-3 group-hover:bg-[#2D3342] group-hover:border-emerald-500 transition-colors">
                   <span class="text-[#8B949E] group-hover:text-emerald-400 font-black text-xl">+</span>
                </div>
                <div class="text-center bg-[#0B0E14] px-3 py-2 rounded-lg border border-[#222731] group-hover:border-emerald-500 transition-colors">
                   <p class="font-bold text-[#8B949E] group-hover:text-emerald-400 text-[10px] uppercase tracking-widest">Tambah Kanan</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Aktivasi PIN Bawaan HTML5 */}
      <dialog id="activationModal" class="bg-transparent m-auto p-0 w-[95vw] max-w-lg backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
        <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative text-left">
          <div class="bg-[#1A1E26] px-6 py-5 border-b border-[#222731] flex justify-between items-center">
            <div>
              <h4 class="font-black text-white text-sm uppercase tracking-widest text-emerald-400">Aktivasi Mitra Baru</h4>
              <p id="modal-subtitle" class="text-[10px] text-[#8B949E] mt-1 font-mono uppercase"></p>
            </div>
            <button onclick="document.getElementById('activationModal').close()" class="text-[#8B949E] hover:text-white font-bold bg-[#0B0E14] border border-[#222731] w-8 h-8 rounded-full flex items-center justify-center">✕</button>
          </div>
          <form method="POST" action="/api/member-pin/activate" class="p-6 space-y-4">
            <input type="hidden" name="upline_hu_id" id="modal-upline" value="" />
            <input type="hidden" name="position" id="modal-position" value="" />
            
            <div>
               <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Pilih PIN Tersedia (Dari Brankas)</label>
               <select name="pin_code" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-sm font-bold cursor-pointer">
                 {availablePins.length === 0 ? (
                   <option value="">-- Anda Belum Memiliki PIN --</option>
                 ) : (
                   availablePins.map((p: any) => <option value={p.pin_code}>{p.pin_code} ({p.package_name})</option>)
                 )}
               </select>
               {availablePins.length === 0 && (
                 <p class="text-[10px] text-red-400 mt-2 font-bold">Silakan beli paket di menu Brankas PIN terlebih dahulu.</p>
               )}
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Nama Lengkap Mitra Baru</label>
              <input type="text" name="new_full_name" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 text-sm" placeholder="Masukkan nama sesuai KTP" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Kata Sandi Akses</label>
              <input type="password" name="new_password" required class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-xl px-4 py-3 text-sm" placeholder="Minimal 6 Karakter" />
            </div>
            
            <button type="submit" disabled={availablePins.length === 0} class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#2D3342] text-[#0B0E14] disabled:text-gray-500 font-black py-4 rounded-xl mt-4 transition-colors shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs cursor-pointer disabled:cursor-not-allowed">
              Aktivasi Sekarang
            </button>
          </form>
        </div>
      </dialog>

      <script dangerouslySetInnerHTML={{ __html: `
        function openActivation(uplineId, position) {
          document.getElementById('modal-upline').value = uplineId;
          document.getElementById('modal-position').value = position;
          document.getElementById('modal-subtitle').innerText = 'Posisi: ' + uplineId + ' (' + position.toUpperCase() + ')';
          document.getElementById('activationModal').showModal();
        }
      `}} />

    </MemberLayout>
  )
})
