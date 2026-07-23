import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  const errorMsg = c.req.query('error')
  
  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center font-sans selection:bg-emerald-500/30 p-6">
      <div class="max-w-md w-full bg-[#151921] border border-[#222731] p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Dekorasi Glow Latar */}
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

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
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">
              Masuk Sesi
            </button>
          </div>
        </form>

        <div class="mt-8 text-center text-sm text-[#8B949E] relative z-10">
          Belum memiliki Hak Usaha? <a href="/register" class="text-emerald-400 font-bold hover:text-emerald-300">Daftar Kemitraan</a>
        </div>
      </div>
    </div>
  )
})
