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
  const { results } = await db.prepare("SELECT * FROM site_settings").all()
  
  const settings = results.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <AdminLayout profile={profile} activeMenu="Pengaturan Sistem">
      <div class="mb-6 flex justify-between items-end">
        <div>
          <h2 class="text-2xl font-black text-white">Pengaturan Global Sistem</h2>
          <p class="text-[#8B949E] text-sm mt-1 font-medium">Konfigurasi parameter MLM Binary, batas pencairan, dan API Midtrans.</p>
        </div>
      </div>

      {successMsg && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 text-sm font-bold">{successMsg}</div>}
      {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

      <form method="POST" action="/api/admin/pengaturan" class="space-y-6 max-w-4xl bg-[#151921] border border-[#222731] rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
        
        <h4 class="text-white font-black uppercase tracking-widest text-sm mb-4 border-b border-[#222731] pb-4">Parameter Bonus MLM Binary</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Bonus Pasangan (Rp)</label>
            <input type="number" name="pairing_bonus_amount" value={settings.pairing_bonus_amount || '50000'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Batas Flush Out (Pasang/Hari)</label>
            <input type="number" name="pairing_flush_limit" value={settings.pairing_flush_limit || '12'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Bonus Titik RO (Rp)</label>
            <input type="number" name="ro_bonus_amount" value={settings.ro_bonus_amount || '5000'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Batas Kedalaman Bonus RO (Level)</label>
            <input type="number" name="ro_bonus_depth_limit" value={settings.ro_bonus_depth_limit || '10'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
        </div>

        <h4 class="text-white font-black uppercase tracking-widest text-sm mb-4 border-b border-[#222731] pb-4">Integrasi Midtrans Gateway & Penarikan</h4>
        <div class="grid grid-cols-1 gap-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Minimal Withdraw (Rp)</label>
              <input type="number" name="withdraw_min_amount" value={settings.withdraw_min_amount || '50000'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Mode Midtrans (1 = Produksi, 0 = Sandbox)</label>
              <input type="number" name="midtrans_is_production" value={settings.midtrans_is_production || '0'} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-black tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Midtrans Server Key</label>
            <input type="password" name="midtrans_server_key" value={settings.midtrans_server_key || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
          <div>
            <label class="block text-[11px] font-black text-[#8B949E] uppercase tracking-widest mb-2">Midtrans Client Key</label>
            <input type="text" name="midtrans_client_key" value={settings.midtrans_client_key || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white font-mono tracking-widest rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-sm" />
          </div>
        </div>

        <div class="pt-4 border-t border-[#222731]">
          <button type="submit" class="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-xl transition-colors shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">
            Simpan Konfigurasi
          </button>
        </div>
      </form>
    </AdminLayout>
  )
})
