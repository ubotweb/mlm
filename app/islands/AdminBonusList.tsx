import { useState, useEffect } from 'hono/jsx'

export default function AdminBonusList() {
  const [bonuses, setBonuses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/bonuses')
      .then(res => res.json())
      .then(data => {
        setBonuses(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div class="text-gray-500 font-bold p-5">Memuat laporan komisi...</div>

  return (
    <div class="bg-white p-6 rounded-xl shadow border">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-blue-50 border-b-2 border-blue-100">
              <th class="p-3 text-sm text-blue-800">Waktu Pembagian</th>
              <th class="p-3 text-sm text-blue-800">Penerima (User)</th>
              <th class="p-3 text-sm text-blue-800">Sumber (Downline)</th>
              <th class="p-3 text-sm text-blue-800">Jenis Komisi</th>
              <th class="p-3 text-sm text-blue-800">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {bonuses.length === 0 ? (
              <tr><td colSpan={5} class="p-4 text-center">Belum ada riwayat pembagian komisi.</td></tr>
            ) : (
              bonuses.map(b => (
                <tr key={b.id} class="hover:bg-gray-50 border-b">
                  <td class="p-3 text-sm text-gray-600">{new Date(b.created_at).toLocaleString('id-ID')}</td>
                  <td class="p-3 font-bold text-gray-800">{b.receiver}</td>
                  <td class="p-3 text-gray-600">{b.source_user || 'Sistem / Penjualan Pribadi'}</td>
                  <td class="p-3 text-xs uppercase font-bold text-indigo-600">{b.type.replace('_', ' ')}</td>
                  <td class="p-3 font-bold text-green-600">Rp {b.amount.toLocaleString('id-ID')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
