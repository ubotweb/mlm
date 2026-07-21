import ProductList from '../islands/ProductList'

export default function Home() {
  return (
    <>
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">HMM Beauty & Health</h1>
            <p class="text-sm text-gray-500 mt-1">Cantik Alami, Sehat Berkualitas, Sukses Bersama.</p>
          </div>
          <nav class="space-x-4 hidden md:flex">
            <a href="/login" class="text-gray-600 hover:text-gray-900">Member Area</a>
            <a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Daftar Member</a>
          </nav>
        </div>
      </header>

      <main class="flex-grow max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <section class="mb-12 text-center md:text-left">
            <h2 class="text-3xl font-semibold mb-4 text-blue-900">Selamat Datang di HMM Beauty & Health</h2>
            <p class="text-lg text-gray-700 max-w-3xl">
              HMM Beauty & Health menghadirkan produk skincare premium dan suplemen kesehatan berkualitas dengan peluang bisnis jaringan (MLM) yang transparan dan menguntungkan.
            </p>
          </section>
          
          <section>
            <h3 class="text-2xl font-bold mb-6 border-b pb-2">Katalog Produk</h3>
            {/* Memanggil komponen interaktif (Island) */}
            <ProductList />
          </section>
        </div>
      </main>

      <footer class="bg-gray-800 text-white text-center py-6">
        <p>&copy; 2026 HMM Beauty & Health. All rights reserved.</p>
      </footer>
    </>
  )
}
