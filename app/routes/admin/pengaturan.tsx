import AdminSettingsForm from '../../islands/AdminSettingsForm'

export default function AdminSettingsPage() {
  return (
    <div class="min-h-screen bg-gray-900 flex">
      {/* Sidebar Admin Placeholder */}
      <aside class="w-64 bg-gray-800 text-white min-h-screen p-4 space-y-2">
         <h1 class="text-xl font-black text-blue-400 mb-6 text-center">ADMIN HMM</h1>
         <a href="/admin" class="block py-2 px-4 hover:bg-gray-700 rounded">Dashboard</a>
         <a href="/admin/pengaturan" class="block py-2 px-4 bg-blue-600 rounded">Pengaturan</a>
      </aside>
      <main class="flex-grow p-8 bg-gray-50 h-screen overflow-y-auto">
        <h2 class="text-3xl font-bold mb-6">Pengaturan Sistem & API</h2>
        <AdminSettingsForm />
      </main>
    </div>
  )
}
