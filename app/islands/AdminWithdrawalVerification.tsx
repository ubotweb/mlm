import { useState, useEffect } from 'hono/jsx'

export default function AdminWithdrawalVerification() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWithdrawals = () => {
    fetch('/api/admin/action/withdrawals/pending')
      .then(res => res.json())
      .then(data => {
        setWithdrawals(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const processWithdraw = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'MENYETUJUI' : 'MENOLAK'} penarikan ini?`)) return

    try {
      const res = await fetch('/api/admin/action/withdrawals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawId: id, action })
      })
      
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        fetchWithdrawals() // Refresh tabel
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan')
    }
  }

  if (loading) return <div class="p-5 text-gray-600 font-bold">Memuat data request withdraw...</div>

  return (
    <div class="bg-white rounded-lg shadow border p-6 mt-6">
      <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Menunggu Verifikasi Withdraw</h3>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal (Net)</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank/Tujuan</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {withdrawals.length === 0 ? (
              <tr><td colSpan={4} class="px-4 py-4 text-center text-gray-500">Tidak ada permintaan pending.</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id}>
                  <td class="px-4 py-3 font-medium text-gray-900">{w.username}</td>
                  <td class="px-4 py-3 font-bold text-blue-600">Rp {w.net_amount.toLocaleString('id-ID')}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">
                    <p class="font-bold">{w.bank_name}</p>
                    <p>{w.account_number} (a.n {w.account_name})</p>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button onClick={() => processWithdraw(w.id, 'approve')} class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Setujui</button>
                    <button onClick={() => processWithdraw(w.id, 'reject')} class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Tolak</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
