import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  // 1. Autentikasi Sesi
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } 
  catch (err) { return c.redirect('/login') }

  const db = c.env.DB

  // 2. Tarik Data User & Root Node
  const currentUser = await db.prepare("SELECT id, balance, package_id FROM users WHERE username = ?").bind(profile.sub).first()
  if (!currentUser) return c.redirect('/login')

  const rootPackage = await db.prepare("SELECT name FROM packages WHERE id = ?").bind(currentUser.package_id).first()

  // 3. Tarik Data Downline menggunakan Recursive CTE (Hirarki Jaringan)
  const query = `
    WITH RECURSIVE Downlines AS (
      SELECT id, username, upline_id, package_id, 1 as level
      FROM users
      WHERE upline_id = ?
      UNION ALL
      SELECT u.id, u.username, u.upline_id, u.package_id, d.level + 1
      FROM users u
      JOIN Downlines d ON u.upline_id = d.id
      WHERE d.level < 5
    )
    SELECT d.id, d.username, d.upline_id, p.name as package_name, d.level
    FROM Downlines d
    LEFT JOIN packages p ON d.package_id = p.id
    ORDER BY d.level ASC;
  `
  const { results } = await db.prepare(query).bind(currentUser.id).all()

  // 4. Susun Data Menjadi Format Pohon (Tree / Bersarang)
  const rootNode = {
    id: currentUser.id,
    username: profile.sub,
    package_name: rootPackage?.name || 'Starter',
    children: [] as any[]
  }

  const nodeMap: Record<string, any> = { [currentUser.id as string]: rootNode }

  // Masukkan semua data ke map
  results.forEach((row: any) => {
    nodeMap[row.id] = { ...row, children: [] }
  })

  // Sambungkan child ke parent (upline)
  results.forEach((row: any) => {
    if (nodeMap[row.upline_id]) {
      nodeMap[row.upline_id].children.push(nodeMap[row.id])
    }
  })

  // 5. Fungsi Rekursif untuk Merender UI Pohon secara SSR
  const renderNode = (node: any) => {
    return (
      <div class="flex flex-col items-center">
        {/* Node Member (Kotak) */}
        <div class="border border-emerald-300 dark:border-[#222731] rounded-2xl p-5 w-44 text-center bg-white dark:bg-[#151921] shadow-lg relative z-10 transition-transform hover:scale-105">
          <div class="h-14 w-14 bg-emerald-100 dark:bg-[#1B2A24] border border-emerald-200 dark:border-emerald-800/50 rounded-full mx-auto mb-3 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-xl">
             {node.username.charAt(0).toUpperCase()}
          </div>
          <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{node.username}</p>
          <span class="inline-block mt-2 text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {node.package_name || 'Starter'}
          </span>
        </div>

        {/* Garis Penghubung dan Downline (Children) */}
        {node.children && node.children.length > 0 && (
          <div class="flex flex-col items-center mt-6 relative">
            {/* Garis Vertikal Turun */}
            <div class="w-[2px] h-6 bg-gray-300 dark:bg-[#2D3342] absolute -top-6"></div>
            
            {/* Cabang Horizontal & Child Node */}
            <div class="flex space-x-12 border-t-2 border-gray-300 dark:border-[#2D3342] pt-6 relative">
              {node.children.map((child: any, idx: number) => (
                <div key={idx} class="relative flex flex-col items-center">
                  {/* Garis Vertikal ke Child */}
                  <div class="absolute -top-6 w-[2px] h-6 bg-gray-300 dark:bg-[#2D3342]"></div>
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 6. Render Layout Utama
  return c.render(
    <MemberLayout profile={profile} balance={(currentUser.balance as number) || 0} activeMenu="Pohon Jaringan">
      <div class="max-w-full overflow-x-auto pb-10">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Genealogy Tree</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Struktur hierarki jaringan downline Anda (Sistem otomatis membatasi tampilan hingga kedalaman 5 level).</p>
        </div>

        {/* Kanvas Pohon Jaringan */}
        <div class="bg-gray-100 dark:bg-[#0B0E14] border border-gray-200 dark:border-[#222731] rounded-3xl p-10 min-w-max flex justify-center overflow-x-auto shadow-inner">
          {renderNode(rootNode)}
        </div>
      </div>
    </MemberLayout>
  )
})
