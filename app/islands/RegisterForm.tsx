import { useState, useEffect } from 'hono/jsx'

export default function RegisterForm() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', fullName: '', phone: '', sponsorId: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setFormData(prev => ({ ...prev, sponsorId: ref }))
  }, [])

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleRegister = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal daftar.')
      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return <div class="text-center text-green-600 font-bold">Pendaftaran Berhasil! Mengarahkan ke login...</div>

  return (
    <form onSubmit={handleRegister} class="space-y-4">
      {error && <div class="bg-red-50 text-red-700 p-3 text-sm rounded">{error}</div>}
      <input type="text" name="sponsorId" value={formData.sponsorId} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="ID Sponsor (Opsional)" />
      <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="Nama Lengkap" />
      <input type="text" name="username" required value={formData.username} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="Username" />
      <input type="email" name="email" required value={formData.email} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="Email" />
      <input type="text" name="phone" required value={formData.phone} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="Nomor HP" />
      <input type="password" name="password" required value={formData.password} onChange={handleChange} class="block w-full border rounded-md py-2 px-3" placeholder="Password" />
      <button type="submit" disabled={loading} class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Daftar Sekarang</button>
    </form>
  )
}
