import { useState, useEffect } from 'hono/jsx'

export default function MemberProfileForm() {
  const [formData, setFormData] = useState({ fullName: '', phone: '', newPassword: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/member/profile')
      .then(res => res.json())
      .then(data => {
        setFormData({ fullName: data.user_data.full_name || '', phone: data.user_data.phone || '', newPassword: '' })
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/member/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) alert('Profil berhasil diperbarui!')
      else alert('Gagal memperbarui profil')
    } catch (err) {
      alert('Terjadi kesalahan')
    }
  }

  if (loading) return <div>Memuat data...</div>

  return (
    <form onSubmit={handleSubmit} class="bg-white p-6 rounded-xl shadow border space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
        <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: (e.target as any).value})} class="mt-1 w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Nomor HP</label>
        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: (e.target as any).value})} class="mt-1 w-full border rounded p-2" />
      </div>
      <div class="pt-4 border-t">
        <label class="block text-sm font-medium text-gray-700">Password Baru (Kosongkan jika tidak ingin ganti)</label>
        <input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: (e.target as any).value})} class="mt-1 w-full border rounded p-2" placeholder="******" />
      </div>
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Simpan Perubahan</button>
    </form>
  )
}
