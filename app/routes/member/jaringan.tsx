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
  // MENGGUNAKAN hu_id SEBAGAI KUNCI PENCARIAN
  const user = await db.prepare("SELECT id, hu_id, full_name, balance FROM users WHERE hu_id = ?").bind(profile.sub).first()
  if (!user) return c.redirect('/login')

  // Mengambil direct downline di pohon jaringan binary (left & right)
  const { results: binaryNodes } = await db.prepare(`
    SELECT u.id, u.hu_id, u.full_name, u.network_position, u.status, p.name as package_name
    FROM users u
    LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.upline_id = ?
  `).bind(user.id).all()

  const leftNode = binaryNodes.find((n: any) => n.network_position === 'left')
  const rightNode = binaryNodes.find((n: any) => n.network_position === 'right')

  return c.render(
    <MemberLayout profile={profile} balance={(user.balance as number) || 0} activeMenu="Pohon Jaringan">
      <div class="mb-8">
        <h2 class="text-3xl font-black text-white">Pohon Jaringan Binary</h2>
        <p class="text-[#8B949E] text-sm mt-1 font-medium">Pantau struktur Hak Usaha (HU) dan downline di jaringan Anda.</p>
      </div>

      <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm p-8 flex flex-col items-center">
        
        {/* Node Utama (Anda) */}
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-blue-600 rounded-full border-4 border-[#0B0E14] shadow-lg shadow-blue-600/30 flex items-center justify-center mb-3">
             <span class="font-black text-white text-xl">{String(user.full_name).charAt(0).toUpperCase()}</span>
          </div>
          <div class="text-center bg-[#1A1E26] px-4 py-2 rounded-lg border border-[#2D3342]">
             <p class="font-black text-white text-sm">{user.full_name}</p>
             <p class="text-[10px] font-mono text-emerald-400 mt-1">{user.hu_id}</p>
             <p class="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded mt-1 uppercase tracking-widest">Anda</p>
          </div>
        </div>

        {/* Garis Konektor */}
        <div class="w-full max-w-md h-10 border-t-2 border-x-2 border-[#2D3342] rounded-t-xl mb-4"></div>

        {/* Node Kiri dan Kanan */}
        <div class="w-full max-w-2xl flex justify-between px-10">
          {/* KIRI */}
          <div class="flex flex-col items-center w-1/2">
            {leftNode ? (
              <>
                <div class={`w-14 h-14 rounded-full border-4 border-[#0B0E14] shadow-lg flex items-center justify-center mb-3 ${leftNode.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
                   <span class="font-black text-white text-lg">{String(leftNode.full_name).charAt(0).toUpperCase()}</span>
                </div>
                <div class="text-center bg-[#1A1E26] px-3 py-2 rounded-lg border border-[#2D3342]">
                   <p class="font-black text-white text-xs">{leftNode.full_name}</p>
                   <p class="text-[9px] font-mono text-emerald-400 mt-1">{leftNode.hu_id}</p>
                   <p class="text-[9px] text-[#8B949E] mt-1">{leftNode.package_name || 'Basic'}</p>
                </div>
              </>
            ) : (
              <>
                <div class="w-14 h-14 bg-[#1A1E26] rounded-full border-4 border-[#222731] border-dashed flex items-center justify-center mb-3">
                   <span class="text-[#2D3342] font-black">+</span>
                </div>
                <div class="text-center bg-[#0B0E14] px-3 py-2 rounded-lg border border-[#222731]">
                   <p class="font-bold text-[#8B949E] text-[10px] uppercase tracking-widest">Kiri Kosong</p>
                </div>
              </>
            )}
          </div>

          {/* KANAN */}
          <div class="flex flex-col items-center w-1/2">
            {rightNode ? (
              <>
                <div class={`w-14 h-14 rounded-full border-4 border-[#0B0E14] shadow-lg flex items-center justify-center mb-3 ${rightNode.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'}`}>
                   <span class="font-black text-white text-lg">{String(rightNode.full_name).charAt(0).toUpperCase()}</span>
                </div>
                <div class="text-center bg-[#1A1E26] px-3 py-2 rounded-lg border border-[#2D3342]">
                   <p class="font-black text-white text-xs">{rightNode.full_name}</p>
                   <p class="text-[9px] font-mono text-emerald-400 mt-1">{rightNode.hu_id}</p>
                   <p class="text-[9px] text-[#8B949E] mt-1">{rightNode.package_name || 'Basic'}</p>
                </div>
              </>
            ) : (
              <>
                <div class="w-14 h-14 bg-[#1A1E26] rounded-full border-4 border-[#222731] border-dashed flex items-center justify-center mb-3">
                   <span class="text-[#2D3342] font-black">+</span>
                </div>
                <div class="text-center bg-[#0B0E14] px-3 py-2 rounded-lg border border-[#222731]">
                   <p class="font-bold text-[#8B949E] text-[10px] uppercase tracking-widest">Kanan Kosong</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  )
})
