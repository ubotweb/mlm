import { useState, useEffect } from 'hono/jsx'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login'
          throw new Error('Akses ditolak.')
        }
        return res.json()
      })
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Memuat data Admin...</div>

  return (
    <div>
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold text-gray-800">Ringkasan Sistem</h2>
        <button onClick={() => {
            fetch('/api/logout', { method: 'POST' }).then(() => window.location.href = '/')
        }} class="bg-red-500 text-white px-4 py-2 rounded shadow">Logout Admin</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p class="text-sm text-gray-500 font-medium">Total Member</p>
          <p class="text-3xl font-black">{stats?.totalMembers || 0}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p class="text-sm text-gray-500 font-medium">Total Penjualan</p>
          <p class="text-3xl font-black">Rp {stats?.totalSales?.toLocaleString('id-ID') || 0}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <p class="text-sm text-gray-500 font-medium">Withdrawal Pending</p>
          <p class="text-3xl font-black">{stats?.pendingWithdrawals || 0}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <p class="text-sm text-gray-500 font-medium">Total Bonus</p>
          <p class="text-3xl font-black">Rp {stats?.totalBonuses?.toLocaleString('id-ID') || 0}</p>
        </div>
      </div>
    </div>
  )
}
