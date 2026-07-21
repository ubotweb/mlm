import { useState, useEffect } from 'hono/jsx'

export default function BonusHistory() {
  const [bonuses, setBonuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/member/bonus')
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal mengambil data bonus')
        return res.json()
      })
      .then(data => {
        setBonuses(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div class="text-center py-10 text-gray-500 animate-pulse">Memuat riwayat bonus...</div>
  if (error) return <div class="text-red-500 text-center py-10">{error}</div>

  return (
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Bonus</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {bonuses.length === 0 ? (
            <tr>
              <td colSpan={4} class="px-6 py-4 text-center text-sm text-gray-500">Belum ada riwayat bonus.</td>
            </tr>
          ) : (
            bonuses.map((bonus, index) => (
              <tr key={index} class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(bonus.created_at).toLocaleDateString('id-ID')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                  {bonus.type.replace('_', ' ')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  Rp {bonus.amount.toLocaleString('id-ID')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    bonus.status === 'released' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bonus.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
