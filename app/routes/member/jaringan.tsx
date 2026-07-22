import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } 
  catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  const currentUser = await db.prepare("SELECT id, balance FROM users WHERE username = ?").bind(profile.sub).first()
  if (!currentUser) return c.redirect('/login')

  // 1. QUERY UPLINE (Dari Root tertinggi turun ke Upline langsung)
  const uplineQuery = `
    WITH RECURSIVE Uplines AS (
      SELECT id, username, upline_id, package_id, 1 as level FROM users WHERE username = ?
      UNION ALL
      SELECT u.id, u.username, u.upline_id, u.package_id, up.level + 1
      FROM users u JOIN Uplines up ON u.id = up.upline_id
    )
    SELECT u.username, p.name as package_name, u.level
    FROM Uplines u LEFT JOIN packages p ON u.package_id = p.id
    WHERE u.username != ? 
    ORDER BY u.level DESC;
  `
  const { results: uplines } = await db.prepare(uplineQuery).bind(profile.sub, profile.sub).all()

  // 2. QUERY DOWNLINE (Dari User saat ini turun sampai ke dasar)
  const downlineQuery = `
    WITH RECURSIVE Downlines AS (
      SELECT id, username, upline_id, package_id, 0 as level FROM users WHERE username = ?
      UNION ALL
      SELECT u.id, u.username, u.upline_id, u.package_id, d.level + 1
      FROM users u JOIN Downlines d ON u.upline_id = d.id
    )
    SELECT d.id, d.username, d.upline_id, p.name as package_name, d.level
    FROM Downlines d LEFT JOIN packages p ON d.package_id = p.id
    ORDER BY d.level ASC;
  `
  const { results: downlines } = await db.prepare(downlineQuery).bind(profile.sub).all()

  // 3. Susun Data Downline Menjadi Tree (Bersarang)
  const nodeMap: Record<string, any> = {}
  downlines.forEach((row: any) => {
    nodeMap[row.id] = { ...row, children: [] }
  })

  let rootNode: any = null
  downlines.forEach((row: any) => {
    if (row.username === profile.sub) {
      rootNode = nodeMap[row.id]
    } else if (nodeMap[row.upline_id]) {
      nodeMap[row.upline_id].children.push(nodeMap[row.id])
    }
  })

  // 4. Komponen UI SSR untuk Pohon Interaktif (Bisa diklik tanpa JS)
  const renderTree = (node: any, isRoot = false) => {
    if (!node) return null;
    const hasChildren = node.children && node.children.length > 0;
    
    // Desain Kotak Akun
    const NodeContent = () => (
      <div class={`inline-flex items-center space-x-3 bg-[#1A1E26] border border-[#2D3342] p-2 pr-4 rounded-xl shadow-sm transition-colors ${isRoot ? 'border-[#00E676]/50' : 'hover:border-blue-500/50'}`}>
        <div class={`h-10 w-10 rounded-lg flex items-center justify-center font-black text-lg ${isRoot ? 'bg-[#00E676] text-[#0B0E14]' : 'bg-[#1B2A24] text-[#00E676] border border-[#00E676]/30'}`}>
           {node.username.charAt(0).toUpperCase()}
        </div>
        <div class="text-left">
          <p class="text-sm font-bold text-white leading-tight">{node.username}</p>
          <p class="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider mt-0.5">{node.package_name || 'Starter'}</p>
        </div>
      </div>
    );

    // Jika tidak punya anak, cukup tampilkan kotaknya
    if (!hasChildren) {
      return (
        <div class="relative pl-8 py-2">
          {!isRoot && <div class="absolute left-0 top-1/2 w-8 h-px bg-[#2D3342] -translate-y-1/2"></div>}
          <NodeContent />
        </div>
      );
    }

    // Jika punya anak, gunakan <details> agar bisa di-expand (Diklik)
    return (
      <details class="relative pl-8 py-2 group" open={isRoot}>
        <summary class="list-none cursor-pointer focus:outline-none block relative">
          {!isRoot && <div class="absolute left-0 top-1/2 w-8 h-px bg-[#2D3342] -translate-y-1/2"></div>}
          
          {/* Tombol Plus/Minus */}
          <div class="absolute left-[-10px] top-1/2 w-5 h-5 bg-[#151921] border border-[#2D3342] text-gray-400 rounded flex items-center justify-center z-10 group-open:text-[#00E676] group-open:border-[#00E676]/50 transition-colors -translate-y-1/2 font-mono text-xs">
            <span class="group-open:hidden">+</span>
            <span class="hidden group-open:block">-</span>
          </div>
          
          <NodeContent />
        </summary>
        
        {/* Garis vertikal & Anak-anak (Level bawahnya) */}
        <div class="relative border-l-2 border-[#2D3342] ml-4 mt-1 pl-2 pb-2">
          {node.children.map((child: any) => renderTree(child))}
        </div>
      </details>
    );
  }

  return c.render(
    <MemberLayout profile={profile} balance={(currentUser.balance as number) || 0} activeMenu="Pohon Jaringan">
      <div class="max-w-4xl">
        <h3 class="text-2xl font-bold text-white mb-2">Pohon Jaringan (Genealogy)</h3>
        <p class="text-[#8B949E] text-sm mb-8">Pantau hierarki jaringan MLM Anda secara lengkap.</p>

        {/* --- BAGIAN UPLINE --- */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm mb-6">
          <h4 class="font-bold text-white mb-4 border-b border-[#222731] pb-3 text-sm uppercase tracking-wider flex items-center">
            <svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            Jalur Upline
          </h4>
          
          {uplines.length === 0 ? (
            <p class="text-sm text-[#8B949E] italic px-2">Tidak memiliki upline.</p>
          ) : (
            <div class="space-y-2 ml-2">
              {uplines.map((up: any) => (
                <div class="flex items-center text-sm border-l-2 border-[#2D3342] pl-4 relative">
                  <div class="absolute left-[-5px] top-1/2 w-2 h-2 rounded-full bg-[#2D3342] -translate-y-1/2"></div>
                  <div class="flex-grow bg-[#1A1E26] border border-[#222731] rounded-lg p-3 flex justify-between items-center my-1">
                    <span class="font-bold text-gray-300">{up.username}</span>
                    <span class="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded font-bold uppercase">{up.package_name || 'Starter'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- BAGIAN DOWNLINE --- */}
        <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm overflow-x-auto">
          <h4 class="font-bold text-white mb-6 border-b border-[#222731] pb-3 text-sm uppercase tracking-wider flex items-center">
            <svg class="w-4 h-4 mr-2 text-[#00E676]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            Pohon Downline
          </h4>
          
          <div class="min-w-max ml-[-20px]">
            {rootNode && rootNode.children.length === 0 ? (
              <div class="pl-8">
                {renderTree(rootNode, true)}
                <p class="text-sm text-[#8B949E] italic mt-4 ml-14">Belum memiliki downline.</p>
              </div>
            ) : (
              renderTree(rootNode, true)
            )}
          </div>
        </div>

      </div>
    </MemberLayout>
  )
})
