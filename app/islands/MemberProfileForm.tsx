import { useState, useEffect } from 'hono/jsx'

export default function MemberProfileForm({ username, role }: { username: string, role: string }) {
  const [formData, setFormData] = useState({ fullName: '', phone: '', newPassword: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/member/profile').then(res => res.json()).then(data => {
      setFormData({ fullName: data.user_data.full_name || '', phone: data.user_data.phone || '', newPassword: '' })
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/member/settings/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      })
      if (res.ok) alert('Profil berhasil diperbarui!')
    } catch (err) {}
  }

  if (loading) return <div class="text-gray-500">Memuat data...</div>

  return (
    <div class="space-y-6">
      {/* Header Info Card */}
      <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl p-6 shadow-sm flex items-center">
        <div class="h-14 w-14 bg-emerald-100 dark:bg-[#1B2A24] border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-2xl mr-4">
          {username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white capitalize">{username}</h2>
            <span class="bg-emerald-100 dark:bg-[#1B2A24] text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-200 dark:border-emerald-800/50">{role}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Sistem Keamanan Aktif</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Identitas Section */}
        <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
          <div class="bg-gray-50 dark:bg-[#1A1E26] px-6 py-4 border-b border-gray-200 dark:border-[#222731] flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-[#1C2333] text-blue-600 dark:text-blue-400 rounded-full mr-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div>
              <h4 class="font-bold text-gray-900 dark:text-white text-sm">Informasi Kontak & Wilayah (KYC)</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Data ini wajib dilengkapi untuk kelancaran verifikasi.</p>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap (Sesuai KTP)</label>
              <input type="text" value={formData.fullName} onChange={(e: any) => setFormData({...formData, fullName: e.target.value})} class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nomor WhatsApp Aktif</label>
              <input type="text" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium" />
            </div>
            <button type="submit" class="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold py-3 rounded-lg transition-colors">
              SIMPAN INFORMASI KONTAK
            </button>
          </div>
        </div>

        {/* Keamanan Section */}
        <div class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] rounded-xl overflow-hidden shadow-sm">
          <div class="bg-gray-50 dark:bg-[#1A1E26] px-6 py-4 border-b border-gray-200 dark:border-[#222731]">
            <h4 class="font-bold text-gray-900 dark:text-white text-sm">Keamanan & Password</h4>
          </div>
          <div class="p-6">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Password Baru</label>
            <input type="password" value={formData.newPassword} onChange={(e: any) => setFormData({...formData, newPassword: e.target.value})} class="w-full bg-white dark:bg-[#0B0E14] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 mb-4" placeholder="Minimal 6 karakter" />
            <button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-red-600/20">
              UBAH PASSWORD
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
