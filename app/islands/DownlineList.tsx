import { useState, useEffect } from 'hono/jsx'

export default function DownlineList() {
  const [downlines, setDownlines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/member/downlines')
      .then(res => res.json())
      .then(data => {
        setDownlines(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div class="text-center py-10 font-bold text-gray-500">Memuat data downline...</div>

  return (
    <div class="bg-white p-6 rounded-xl shadow border">
      <h3 class="text-lg font-bold mb-4 border-b pb-2">Member yang Anda Sponsori</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase">Username / Nama</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase">Kontak</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase">Paket</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase">Tanggal Bergabung</th>
              <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {downlines.length === 0 ? (
              <tr><td colSpan={5} class="px-4 py-6 text-center text-gray-500">Anda belum memiliki downline langsung.</td></tr>
            ) : (
              downlines.map((d, i) => (
                <tr key={i} class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <p class="font-bold text-gray-900">{d.username}</p>
                    <p class="text-xs text-gray-500">{d.full_name}</p>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{d.phone || '-'}</td>
                  <td class="px-4 py-3 font-semibold text-blue-600">{d.package_name || 'Starter'}</td>
                  <td class="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString('id-ID')}</td>
                  <td class="px-4 py-3">
                    <span class={`px-2 py-1 text-xs rounded text-white ${d.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {d.status}
                    </span>
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
