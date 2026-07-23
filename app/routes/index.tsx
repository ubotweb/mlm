import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB
  
  // Menarik data maksimal 8 produk aktif terbaru langsung dari database D1
  const { results: products } = await db.prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC LIMIT 8").all()

  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-emerald-500/30">
      
      {/* 1. Header & Navigasi */}
      <header class="container mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
          HMM<span class="font-light text-white">BEAUTY</span>
        </h1>
        <div class="flex items-center space-x-3 md:space-x-4">
          <a href="/login" class="text-gray-300 hover:text-white font-bold transition text-sm md:text-base whitespace-nowrap">Masuk Sesi</a>
          <a href="/register" class="bg-emerald-500 hover:bg-emerald-600 text-[#0B0E14] px-4 py-2 md:px-5 md:py-2.5 rounded-full font-black transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-wider text-xs md:text-sm whitespace-nowrap">Daftar Kemitraan</a>
        </div>
      </header>

      {/* 2. Hero Section (Banner) */}
      <section class="container mx-auto px-6 py-20 text-center">
        <h2 class="text-5xl md:text-6xl font-black mb-6 leading-tight">Cantik Alami, Sehat Berkualitas,<br/> <span class="text-emerald-400">Sukses Bersama.</span></h2>
        <p class="text-[#8B949E] text-lg max-w-2xl mx-auto mb-10 font-medium">
          Bergabunglah dengan jaringan HMM Beauty. Nikmati produk kesehatan & kecantikan terbaik sekaligus bangun kebebasan finansial Anda tanpa batas.
        </p>
        <a href="#paket" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black transition-all inline-block shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">Mulai Perjalanan Anda</a>
      </section>

      {/* 3. Section Paket MLM */}
      <section id="paket" class="bg-[#151921] py-20 border-y border-[#222731]">
        <div class="container mx-auto px-6">
          <h3 class="text-3xl font-black text-center mb-12">Pilihan <span class="text-emerald-400">Paket Kemitraan</span></h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Starter */}
            <div class="bg-[#1A1E26] border border-[#2D3342] p-8 rounded-2xl hover:border-emerald-500 transition-all text-center">
              <h4 class="text-xl font-bold mb-2 text-white">Starter</h4>
              <p class="text-emerald-400 text-3xl font-black mb-6">Rp 100Rb</p>
              <ul class="text-sm text-gray-400 space-y-3 mb-8 text-left">
                <li>✔️ Bonus Sponsor: Rp 20.000</li>
                <li class="opacity-50">❌ Diskon Produk</li>
                <li class="opacity-50">❌ Bonus Jaringan</li>
              </ul>
              <a href="/register?paket=starter" class="block w-full bg-[#2D3342] hover:bg-emerald-500 hover:text-[#0B0E14] text-white py-3 rounded-lg font-bold transition-colors">Pilih Starter</a>
            </div>

            {/* Silver */}
            <div class="bg-[#1A1E26] border border-[#2D3342] p-8 rounded-2xl hover:border-emerald-500 transition-all text-center">
              <h4 class="text-xl font-bold mb-2 text-white">Silver</h4>
              <p class="text-emerald-400 text-3xl font-black mb-6">Rp 500Rb</p>
              <ul class="text-sm text-gray-400 space-y-3 mb-8 text-left">
                <li>✔️ Bonus Sponsor: Rp 50.000</li>
                <li>✔️ Diskon Produk 10%</li>
                <li>✔️ Bonus Jaringan</li>
              </ul>
              <a href="/register?paket=silver" class="block w-full bg-[#2D3342] hover:bg-emerald-500 hover:text-[#0B0E14] text-white py-3 rounded-lg font-bold transition-colors">Pilih Silver</a>
            </div>

            {/* Gold (Populer) */}
            <div class="bg-[#1A1E26] border-2 border-blue-500 p-8 rounded-2xl relative text-center transform md:-translate-y-4 shadow-2xl shadow-blue-500/20">
              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Terbaik</div>
              <h4 class="text-xl font-bold mb-2 text-white mt-2">Gold</h4>
              <p class="text-blue-400 text-3xl font-black mb-6">Rp 1,5 Jt</p>
              <ul class="text-sm text-gray-300 space-y-3 mb-8 text-left">
                <li>✔️ Bonus Sponsor: Rp 150.000</li>
                <li>✔️ Diskon Produk 20%</li>
                <li>✔️ Bonus Jaringan & Leadership</li>
              </ul>
              <a href="/register?paket=gold" class="block w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg">Pilih Gold</a>
            </div>

            {/* Platinum */}
            <div class="bg-[#1A1E26] border border-[#2D3342] p-8 rounded-2xl hover:border-emerald-500 transition-all text-center">
              <h4 class="text-xl font-bold mb-2 text-white">Platinum</h4>
              <p class="text-emerald-400 text-3xl font-black mb-6">Rp 3 Jt</p>
              <ul class="text-sm text-gray-400 space-y-3 mb-8 text-left">
                <li>✔️ Bonus Sponsor: Rp 300.000</li>
                <li>✔️ Diskon Produk 30%</li>
                <li>✔️ Semua Bonus Terbuka</li>
              </ul>
              <a href="/register?paket=platinum" class="block w-full bg-[#2D3342] hover:bg-emerald-500 hover:text-[#0B0E14] text-white py-3 rounded-lg font-bold transition-colors">Pilih Platinum</a>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Section Katalog Produk Terintegrasi (SSR Murni + Native Modal) */}
      <section class="container mx-auto px-6 py-20">
        <h3 class="text-3xl font-black text-center mb-4">Katalog <span class="text-emerald-400">Produk</span></h3>
        <p class="text-center text-[#8B949E] mb-12 font-medium">Rangkaian produk premium untuk menunjang kesehatan dan kecantikan Anda.</p>
        
        {products.length === 0 ? (
          <div class="bg-[#151921] border border-[#222731] rounded-2xl p-10 text-center max-w-2xl mx-auto">
             <p class="text-[#8B949E] font-bold">Produk belum tersedia. Katalog sedang dalam tahap pembaruan.</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p: any) => (
              <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-[#2D3342] transition-colors relative">
                
                {/* Visual Kartu Produk */}
                <div class="h-56 bg-[#1A1E26] relative overflow-hidden flex items-center justify-center cursor-pointer" onclick={`document.getElementById('modal-${p.id}').showModal()`}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <svg class="w-16 h-16 text-[#2D3342]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  )}
                  <span class="absolute top-4 left-4 bg-[#0B0E14]/80 backdrop-blur border border-[#222731] text-[10px] font-black text-emerald-400 px-3 py-1.5 rounded uppercase tracking-widest">
                    {p.category}
                  </span>
                </div>
                
                <div class="p-6 flex-1 flex flex-col">
                  <h3 class="font-bold text-white text-lg mb-2 leading-tight">{p.name}</h3>
                  <p class="text-xs text-[#8B949E] line-clamp-2 mb-5 flex-1 leading-relaxed">{p.description || 'Produk unggulan HMM Beauty & Health.'}</p>
                  
                  <div class="mb-5">
                    <p class="text-xs text-gray-500 line-through mb-1">Rp {p.price.toLocaleString('id-ID')}</p>
                    <p class="text-2xl font-black text-emerald-400">Rp {p.member_price.toLocaleString('id-ID')}</p>
                    <p class="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-wider">Harga Khusus Member</p>
                  </div>
                  
                  {/* Tombol Pemicu Modal HTML5 */}
                  <button onclick={`document.getElementById('modal-${p.id}').showModal()`} class="w-full text-center bg-[#1A1E26] hover:bg-emerald-500 text-gray-300 hover:text-[#0B0E14] border border-[#2D3342] hover:border-emerald-500 font-bold py-3 rounded-xl transition-colors text-sm">
                    Lihat Detail
                  </button>
                </div>

                {/* Elemen Modal Bawaan HTML5 (Native Dialog) */}
                <dialog id={`modal-${p.id}`} class="bg-transparent m-auto p-0 w-[95vw] max-w-4xl backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
                  <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row text-left">
                    
                    {/* Tombol Tutup */}
                    <button onclick={`document.getElementById('modal-${p.id}').close()`} class="absolute top-4 right-4 bg-[#0B0E14] hover:bg-red-500 text-[#8B949E] hover:text-white border border-[#2D3342] hover:border-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-colors z-20 font-bold">
                      ✕
                    </button>
                    
                    {/* Gambar Modal */}
                    <div class="w-full md:w-2/5 h-64 md:h-auto bg-[#1A1E26] relative">
                      {p.image_url ? (
                        <img src={p.image_url} class="w-full h-full object-cover" />
                      ) : (
                        <div class="w-full h-full flex items-center justify-center"><svg class="w-20 h-20 text-[#2D3342]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>
                      )}
                    </div>

                    {/* Informasi Lengkap Produk */}
                    <div class="w-full md:w-3/5 p-6 md:p-10 flex flex-col">
                      <span class="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded w-max">{p.category}</span>
                      <h3 class="text-3xl font-black text-white mb-4 leading-tight">{p.name}</h3>
                      <p class="text-[#8B949E] text-sm mb-8 leading-relaxed flex-1">{p.description || 'Produk premium HMM Beauty & Health.'}</p>
                      
                      <div class="grid grid-cols-2 gap-6 mb-8 bg-[#0B0E14] border border-[#222731] p-5 rounded-xl">
                        <div>
                          <p class="text-xs text-[#8B949E] uppercase font-bold tracking-wider mb-1">Harga Normal</p>
                          <p class="text-sm text-gray-500 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                          <p class="text-xs text-[#8B949E] uppercase font-bold tracking-wider mb-1 mt-4">Harga Member</p>
                          <p class="text-2xl font-black text-emerald-400">Rp {p.member_price.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="space-y-3 text-sm text-[#8B949E] border-l border-[#222731] pl-6">
                          <p>Stok Tersedia: <br/><b class="text-white text-base">{p.stock} Pcs</b></p>
                          <p>No. BPOM: <br/><b class="text-white text-xs">{p.bpom_number || 'Dalam Proses'}</b></p>
                          <p>Sertifikasi Halal: <br/><b class="text-white text-xs">{p.halal_number || 'Dalam Proses'}</b></p>
                        </div>
                      </div>
                      
                      <a href="/login" class="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">
                        Beli & Gabung Kemitraan
                      </a>
                    </div>
                  </div>
                </dialog>

              </div>
            ))}
          </div>
        )}
      </section>

      <footer class="border-t border-[#222731] py-8 text-center text-sm text-[#8B949E] font-medium bg-[#0B0E14]">
        &copy; {new Date().getFullYear()} HMM Beauty & Health. All rights reserved.
      </footer>
    </div>
  )
})
