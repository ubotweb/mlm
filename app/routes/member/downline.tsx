import DownlineList from '../../islands/DownlineList'

export default function DownlinePage() {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-blue-900 shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white">Daftar Downline Langsung</h1>
          <a href="/member" class="text-blue-200 hover:text-white transition">Kembali ke Dashboard</a>
        </div>
      </header>
      <main class="flex-grow w-full max-w-5xl mx-auto py-8 px-4">
        <DownlineList />
      </main>
    </div>
  )
}
