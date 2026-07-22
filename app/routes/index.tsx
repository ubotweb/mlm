import { createRoute } from 'honox/factory'
import ProductList from '../islands/ProductList' // Memanggil komponen produk

export default createRoute((c) => {
  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-emerald-500/30">
      
      {/* 1. Header & Navigasi */}
      <header class="container mx-auto px-6 py-6 flex justify-between items-center">
        <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
          HMM<span class="font-light text-white">BEAUTY</span>
        </h1>
        <div class="space-x-4">
          <a href="/login" class="text-gray-300 hover:text-white font-semibold transition">Masuk</a>
          <a href="/register" class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full font-bold transition-all shadow-lg shadow-emerald-500/20">Daftar Kemitraan</a>
        </div>
      </header>

      {/* 2. Hero Section (Banner) */}
      <section class="container mx-auto px-6 py-20 text-center">
        <h2 class="text-5xl md:text-6xl font-bold mb-6">Cantik Alami, Sehat Berkualitas,<br/> <span class="text-emerald-400">Sukses Bersama.</span></h2>
        <p class="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          Bergabunglah dengan jaringan HMM Beauty. Nikmati produk kesehatan & kecantikan terbaik sekaligus bangun kebebasan finansial Anda.
        </p>
        <a href="#paket" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-all inline-block">Mulai Perjalanan Anda</a>
      </section>

      {/* 3. Section Paket MLM */}
      <section id="paket" class="bg-[#151921] py-20 border-y border-[#222731]">
        <div class="container mx-auto px-6">
          <h3 class="text-3xl font-bold text-center mb-12">Pilihan <span class="text-emerald-400">Paket Kemitraan</span></h3>
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
              <a href="/register?paket=starter" class="block w-full bg-[#2D3342] hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all">Pilih Starter</a>
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
              <a href="/register?paket=silver" class="block w-full bg-[#2D3342] hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all">Pilih Silver</a>
            </div>

            {/* Gold (Populer) */}
            <div class="bg-[#1A1E26] border-2 border-blue-500 p-8 rounded-2xl relative text-center transform md:-translate-y-4 shadow-2xl shadow-blue-500/20">
              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Terbaik</div>
              <h4 class="text-xl font-bold mb-2 text-white mt-2">Gold</h4>
              <p class="text-blue-400 text-3xl font-black mb-6">Rp 1,5 Jt</p>
              <ul class="text-sm text-gray-300 space-y-3 mb-8 text-left">
                <li>✔️ Bonus Sponsor: Rp 150.000</li>
                <li>✔️ Diskon Produk 20%</li>
                <li>✔️ Bonus Jaringan & Leadership</li>
              </ul>
              <a href="/register?paket=gold" class="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all shadow-lg">Pilih Gold</a>
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
              <a href="/register?paket=platinum" class="block w-full bg-[#2D3342] hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all">Pilih Platinum</a>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Section Katalog Produk Terintegrasi */}
      <section class="container mx-auto px-6 py-20">
        <h3 class="text-3xl font-bold text-center mb-4">Katalog <span class="text-emerald-400">Produk</span></h3>
        <p class="text-center text-gray-400 mb-12">Rangkaian produk premium untuk menunjang kesehatan dan kecantikan Anda.</p>
        
        {/* Island Component untuk Produk */}
        <ProductList />
      </section>

      <footer class="border-t border-[#222731] py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} HMM Beauty & Health. All rights reserved.
      </footer>
    </div>
  )
})
