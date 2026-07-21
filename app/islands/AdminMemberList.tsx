import { useState, useEffect } from 'hono/jsx'

export default function AdminMemberList() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div class="p-5 font-bold text-gray-500">Memuat data member...</div>

  return (
    <div class="bg-white p-6 rounded-xl shadow border">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-blue-50 border-b-2 border-blue-100">
              <th class="p-3 text-sm text-blue-800">Tanggal Gabung</th>
              <th class="p-3 text-sm text-blue-800">Data Member</th>
              <th class="p-3 text-sm text-blue-800">Paket</th>
              <th class="p-3 text-sm text-blue-800">Saldo (Bonus)</th>
              <th class="p-3 text-sm text-blue-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={5} class="p-4 text-center">Belum ada member yang terdaftar.</td></tr>
            ) : (
              members.map(m => (
                <tr key={m.id} class="hover:bg-gray-50 border-b">
                  <td class="p-3 text-sm">{new Date(m.created_at).toLocaleDateString('id-ID')}</td>
                  <td class="p-3">
                    <p class="font-bold text-gray-800">{m.full_name}</p>
                    <p class="text-xs text-gray-500">@{m.username} | {m.phone}</p>
                  </td>
                  <td class="p-3">
                    <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">
                      {m.package_name || 'Belum Ada'}
                    </span>
                  </td>
                  <td class="p-3 font-bold text-green-600">Rp {m.balance.toLocaleString('id-ID')}</td>
                  <td class="p-3">
                    <span class={`px-2 py-1 text-xs rounded text-white ${m.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {m.status}
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
