import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-gray-200 font-sans selection:bg-emerald-500/30">
      {/* Navbar Publik */}
      <header class="border-b border-[#222731] bg-[#151921]/80 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
            HMM<span class="font-light text-white">BEAUTY</span>
          </h1>
          <nav class="hidden md:flex space-x-8">
            <a href="#produk" class="text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-wide">PRODUK</a>
            <a href="#peluang" class="text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-wide">PELUANG BISNIS</a>
          </nav>
          <div class="space-x-3 flex">
            <a href="/login" class="px-5 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">Masuk</a>
            <a href="/register" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all">Daftar Member</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main class="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between">
        <div class="md:w-1/2 space-y-6">
          <span class="px-3 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full tracking-widest">SISTEM MLM TERBAIK 2026</span>
          <h2 class="text-5xl md:text-6xl font-black text-white leading-tight">
            Cantik Alami, <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Sukses Bersama.</span>
          </h2>
          <p class="text-lg text-gray-400 leading-relaxed max-w-lg">
            HMM Beauty & Health menghadirkan produk skincare premium dengan peluang bisnis jaringan (MLM) yang transparan, otomatis, dan menguntungkan.
          </p>
          <div class="pt-4 flex space-x-4">
            <a href="/register" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-transform hover:-translate-y-1">Mulai Bisnis Anda</a>
            <a href="#produk" class="px-8 py-4 bg-[#1A1E26] hover:bg-[#222731] border border-[#2D3342] text-white font-bold rounded-xl transition-all">Lihat Katalog</a>
          </div>
        </div>
        
        {/* Hero Visual Dummy (Bisa diganti gambar asli nantinya) */}
        <div class="md:w-1/2 mt-12 md:mt-0 relative">
          <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 blur-3xl rounded-full"></div>
          <div class="relative bg-[#151921] border border-[#222731] p-8 rounded-2xl shadow-2xl">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-[#1A1E26] h-40 rounded-xl border border-[#2D3342] flex items-center justify-center p-4 text-center">
                <span class="text-gray-500 font-bold text-sm">Produk Skincare</span>
              </div>
              <div class="bg-gradient-to-br from-emerald-500/10 to-[#1A1E26] h-40 rounded-xl border border-emerald-500/30 flex items-center justify-center p-4 text-center">
                <span class="text-emerald-400 font-bold text-sm">Bonus Jaringan Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
})
