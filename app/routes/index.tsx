import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  const error = c.req.query('error')
  const success = c.req.query('success')

  return c.render(
    <div class="min-h-screen bg-[#0B0E14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500/30">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 class="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider inline-block mb-4">
          HMM<span class="font-light text-white">BEAUTY</span>
        </h1>
        <h2 class="text-2xl font-bold text-white">Masuk ke Akun Anda</h2>
        <p class="mt-2 text-sm text-gray-400">
          Belum punya akun? <a href="/register" class="font-bold text-emerald-400 hover:text-emerald-300">Daftar sekarang</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-[#151921] py-8 px-4 shadow-xl border border-[#222731] sm:rounded-2xl sm:px-10">
          
          <form method="POST" action="/api/login" class="space-y-6">
            {error && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-sm font-bold rounded-lg text-center">{error}</div>}
            {success && <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 text-sm font-bold rounded-lg text-center">{success}</div>}
            
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <input type="text" name="username" required class="w-full bg-[#1A1E26] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Masukkan username Anda" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input type="password" name="password" required class="w-full bg-[#1A1E26] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" />
            </div>
            
            <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg shadow-lg shadow-emerald-500/20 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all">
              Masuk Dashboard
            </button>
          </form>

        </div>
      </div>
    </div>
  )
})
