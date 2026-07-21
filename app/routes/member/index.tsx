import MemberDashboard from '../../islands/MemberDashboard'

export default function MemberArea() {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <header class="bg-blue-900 shadow">
        <div class="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white">HMM Member Area</h1>
          <a href="/" class="text-blue-200 hover:text-white">Beranda</a>
        </div>
      </header>
      <main class="flex-grow w-full max-w-7xl mx-auto py-8 px-4">
        <MemberDashboard />
      </main>
    </div>
  )
}
