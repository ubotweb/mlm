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
  // Tarik array setting menjadi object format
  const { results } = await db.prepare("SELECT key, value FROM site_settings").all()
  const settings = results.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Pengaturan Website">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white">Pengaturan Website</h2>
        <p class="text-[#8B949E] text-sm mt-1">Kelola parameter inti sistem MLM dan data operasional utama.</p>
      </div>

      {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 rounded-lg mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 text-sm font-bold">{errorMsg}</div>}

      <form method="POST" action="/api/admin/settings" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm max-w-3xl">
        <div class="bg-[#1A1E26] px-6 py-4 border-b border-[#222731]">
          <h4 class="font-bold text-white text-sm">Parameter Sistem</h4>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Website (Brand)</label>
              <input type="text" name="site_name" defaultValue={settings.site_name || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Email Kontak Support</label>
              <input type="email" name="contact_email" defaultValue={settings.contact_email || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Tagline Perusahaan</label>
            <input type="text" name="tagline" defaultValue={settings.tagline || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Minimal Saldo Withdraw (Rp)</label>
              <input type="number" name="withdraw_min_amount" defaultValue={settings.withdraw_min_amount || '50000'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-[#00E676] font-bold rounded-lg px-4 py-3 focus:outline-none tracking-widest" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Status Environment</label>
              <select name="environment" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none font-bold text-xs uppercase">
                <option value="production" selected={settings.environment === 'production'}>Production (Live)</option>
                <option value="development" selected={settings.environment === 'development'}>Development (Uji Coba)</option>
              </select>
            </div>
          </div>
          
          <div class="pt-6 border-t border-[#222731]">
            <button type="submit" class="bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-bold py-3 px-8 rounded-lg transition-colors text-sm shadow-lg shadow-[#00E676]/20">Simpan Pengaturan</button>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
})
