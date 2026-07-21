import { useState, useEffect } from 'hono/jsx'

export default function DownlineList({ username }: { username: string }) {
  const [downlines, setDownlines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const referralLink = `https://hmmbeauty.pages.dev/register?ref=${username}`

  useEffect(() => {
    fetch('/api/member/downlines').then(res => res.json()).then(data => {
      setDownlines(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-6 shadow-sm">
          <div class="flex items-center mb-4">
            <div class="p-2 bg-blue-50 dark:bg-[#1C2333] text-blue-500 rounded-lg mr-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            </div>
            <h4 class="font-bold text-gray-900 dark:text-white">Tautan Undang Teman</h4>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Salin dan bagikan tautan ini. Anda akan mendapatkan bonus referral langsung saat teman Anda bergabung.</p>
          <div class="flex">
            <input type="text" readOnly value={referralLink} class="flex-grow bg-gray-50 dark:bg-[#1A1E26] border border-gray-300 dark:border-[#222731] text-gray-800 dark:text-gray-200 px-4 py-3 rounded-l-lg focus:outline-none text-sm" />
            <button onClick={() => { navigator.clipboard.writeText(referralLink); alert('Disalin!') }} class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg font-bold transition-colors">Salin</button>
          </div>
        </div>

        <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-6 shadow-sm flex flex-col justify-center">
          <div class="flex items-center mb-4">
            <div class="p-2 bg-yellow-50 dark:bg-[#332A1C] text-yellow-500 rounded-lg mr-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h4 class="font-bold text-gray-900 dark:text-white">Total Anggota</h4>
          </div>
          <h2 class="text-4xl font-black text-yellow-500 dark:text-yellow-400">{downlines.length}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Member aktif dalam jaringan langsung Anda.</p>
        </div>
      </div>

      <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
        <div class="p-5 border-b border-gray-200 dark:border-[#222731] flex justify-between items-center">
          <h4 class="font-bold text-gray-900 dark:text-white">Daftar Jaringan Anda (Downline)</h4>
          <span class="bg-gray-100 dark:bg-[#222731] text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full font-bold">{downlines.length} Anggota</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-[#1A1E26] text-gray-500 dark:text-gray-400">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Identitas Teman</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs">Tanggal Bergabung</th>
                <th class="px-6 py-4 font-bold tracking-wider uppercase text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-[#222731]">
              {loading ? (
                 <tr><td colSpan={3} class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
              ) : downlines.length === 0 ? (
                 <tr><td colSpan={3} class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Belum ada downline.</td></tr>
              ) : (
                downlines.map((d, i) => (
                  <tr key={i} class="hover:bg-gray-50 dark:hover:bg-[#1A1E26] transition-colors">
                    <td class="px-6 py-4">
                      <p class="font-bold text-gray-900 dark:text-white uppercase">{d.full_name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{d.email} • {d.phone}</p>
                    </td>
                    <td class="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {new Date(d.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span class={`px-3 py-1 text-xs rounded font-bold uppercase ${d.status === 'active' ? 'bg-emerald-100 dark:bg-[#1B2A24] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-red-100 dark:bg-[#331C1C] text-red-700 dark:text-red-400'}`}>
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
    </div>
  )
}
