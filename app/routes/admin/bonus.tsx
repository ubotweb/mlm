import AdminBonusList from '../../islands/AdminBonusList'

export default function AdminBonusPage() {
  return (
    <div class="min-h-screen bg-gray-900 flex">
      {/* Sidebar Admin */}
      <aside class="w-64 bg-gray-800 text-white min-h-screen p-4 space-y-2">
         <h1 class="text-xl font-black text-blue-400 mb-6 text-center">ADMIN HMM</h1>
         <a href="/admin" class="block py-2 px-4 hover:bg-gray-700 rounded">Dashboard</a>
         <a href="/admin/member" class="block py-2 px-4 hover:bg-gray-700 rounded">Kelola Member</a>
         <a href="/admin/bonus" class="block py-2 px-4 bg-blue-600 rounded">Laporan Bonus</a>
      </aside>
      <main class="flex-grow p-8 bg-gray-50 h-screen overflow-y-auto">
        <h2 class="text-3xl font-bold mb-6 text-gray-800">Laporan Bonus & Komisi Global</h2>
        <AdminBonusList />
      </main>
    </div>
  )
}
