import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const errorMsg = c.req.query('error')

  // --- LOGIKA LINK WHATSAPP (Dinamis dari Admin DB) ---
  let waLink = 'https://wa.me/6280000000000?text=Halo%20Admin%20HMM%20Beauty%2C%20saya%20ingin%20mendaftar%20kemitraan.'
  try {
    const db = c.env?.DB
    if (db) {
      const admin = await db.prepare("SELECT phone FROM users WHERE role = 'admin' AND phone IS NOT NULL LIMIT 1").first()
      if (admin && admin.phone) {
        let adminPhoneRaw = String(admin.phone).replace(/\D/g, '')
        if (adminPhoneRaw.startsWith('0')) {
          adminPhoneRaw = '62' + adminPhoneRaw.substring(1)
        }
        const waMessage = encodeURIComponent('Halo Admin HMM Beauty, saya ingin mendaftar kemitraan. Mohon panduannya.')
        waLink = `https://wa.me/${adminPhoneRaw}?text=${waMessage}`
      }
    }
  } catch (err) {
    console.error('[LOGIN WA FETCH ERROR]:', err)
  }
  
  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center font-sans selection:bg-emerald-500/30 p-6">
      <div class="max-w-md w-full bg-[#151921] border border-[#222731] p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Dekorasi Glow Latar */}
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* Tombol Kembali ke Homepage */}
        <div class="relative z-10 mb-6">
          <a href="/" class="inline-flex items-center text-xs font-bold text-[#8B949E] hover:text-emerald-400 transition-colors uppercase tracking-widest">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Beranda
          </a>
        </div>

        <div class="text-center mb-8 relative z-10">
          <h1 class="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider mb-2">
            HMM<span class="font-light text-white">LOGIN</span>
          </h1>
          <p class="text-[#8B949E] text-sm font-medium">Masukkan ID Hak Usaha (HU) dan Kata Sandi Anda untuk mengakses Member Area.</p>
        </div>

        {errorMsg && (
          <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold rounded-xl text-center relative z-10">
            {errorMsg}
          </div>
        )}

        <form method="POST" action="/api/login" class="space-y-5 relative z-10">
          <div>
            <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-widest mb-2">ID Hak Usaha (HU ID)</label>
            <input 
              type="text" 
              name="hu_id" 
              required 
              placeholder="Contoh: HMM0000000001 atau admin" 
              class="w-full bg-[#0B0E14] border border-[#2D3342] focus:border-emerald-500 text-white rounded-xl px-5 py-3.5 focus:outline-none transition-colors font-mono" 
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-widest mb-2">Kata Sandi</label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••" 
              class="w-full bg-[#0B0E14] border border-[#2D3342] focus:border-emerald-500 text-white rounded-xl px-5 py-3.5 focus:outline-none transition-colors" 
            />
          </div>
          
          <div class="pt-2">
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm cursor-pointer">
              Masuk Sesi
            </button>
          </div>
        </form>

        {/* PERBAIKAN: Registrasi diarahkan ke WhatsApp Admin dengan tab baru */}
        <div class="mt-8 text-center text-sm text-[#8B949E] relative z-10">
          Belum memiliki Hak Usaha? <a href={waLink} target="_blank" rel="noopener noreferrer" class="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">Daftar Kemitraan</a>
        </div>
      </div>
    </div>
  )
})
