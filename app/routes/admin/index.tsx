import AdminDashboard from '../../islands/AdminDashboard'

export default function AdminArea() {
  return (
    <div class="min-h-screen bg-gray-900 flex">
      <aside class="w-64 bg-gray-800 text-white flex flex-col shadow-xl">
        <div class="p-6 text-center border-b border-gray-700">
          <h1 class="text-2xl font-black text-blue-400">ADMIN HMM</h1>
        </div>
        <nav class="flex-grow p-4 space-y-2">
          <a href="/admin" class="block py-2 px-4 bg-blue-600 rounded">Dashboard</a>
          <a href="/admin/member" class="block py-2 px-4 hover:bg-gray-700 rounded">Kelola Member</a>
          <a href="/admin/produk" class="block py-2 px-4 hover:bg-gray-700 rounded">Kelola Produk</a>
          <a href="/admin/order" class="block py-2 px-4 hover:bg-gray-700 rounded">Pesanan</a>
          <a href="/admin/bonus" class="block py-2 px-4 hover:bg-gray-700 rounded">Laporan Bonus</a>
          <a href="/admin/broadcast" class="block py-2 px-4 hover:bg-gray-700 rounded">Broadcast</a>
          <a href="/admin/pengaturan" class="block py-2 px-4 hover:bg-gray-700 rounded">Pengaturan</a>
        </nav>
      </aside>
      <main class="flex-grow p-8 bg-gray-50 text-gray-900">
        <AdminDashboard />
      </main>
    </div>
  )
}
