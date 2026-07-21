import OrderHistory from '../../islands/OrderHistory'

export default function OrderPage() {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-blue-900 shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white">Riwayat Pembelian</h1>
          <a href="/member" class="text-blue-200 hover:text-white transition">Kembali</a>
        </div>
      </header>

      <main class="flex-grow w-full max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <div class="bg-white p-6 rounded-xl shadow border">
          <OrderHistory />
        </div>
      </main>
    </div>
  )
}
