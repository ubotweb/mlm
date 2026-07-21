import AdminMemberList from '../../islands/AdminMemberList'

export default function AdminMemberPage() {
  return (
    <div class="min-h-screen bg-gray-900 flex">
      {/* Sidebar (Sama seperti halaman Admin Produk) */}
      <aside class="w-64 bg-gray-800 text-white flex flex-col shadow-xl min-h-screen">
        <div class="p-6 text-center border-b border-gray-700">
          <h1 class="text-2xl font-black text-blue-400">ADMIN HMM</h1>
        </div>
        <nav class="flex-grow p-4 space-y-2">
          <a href="/admin" class="block py-2.5 px-4 rounded transition text-gray-400 hover:bg-gray-700 hover:text-white">Dashboard</a>
          <a href="/admin/member" class="block py-2.5 px-4 rounded transition bg-blue-600 text-white">Kelola Member</a>
          <a href="/admin/produk" class="block py-2.5 px-4 rounded transition text-gray-400 hover:bg-gray-700 hover:text-white">Kelola Produk</a>
        </nav>
      </aside>

      <main class="flex-grow p-8 bg-gray-50 text-gray-900 overflow-y-auto h-screen">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">Daftar Member Aktif</h2>
        </div>
        <AdminMemberList />
      </main>
    </div>
  )
}
