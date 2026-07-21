import NetworkTree from '../../islands/NetworkTree'

export default function NetworkPage() {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-blue-900 shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white">Pohon Jaringan (Genealogy)</h1>
          <a href="/member" class="text-blue-200 hover:text-white transition">Kembali ke Dashboard</a>
        </div>
      </header>

      <main class="flex-grow w-full max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div class="bg-white p-6 rounded-xl shadow border overflow-x-auto">
          <h2 class="text-xl font-bold text-gray-800 mb-4 text-center border-b pb-4">Struktur Downline Anda</h2>
          {/* Island untuk rendering Chart Interaktif Pohon MLM */}
          <NetworkTree />
        </div>
      </main>
    </div>
  )
}
