import { useState, useEffect } from 'hono/jsx'

export default function AdminSettingsForm() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings').then(res => res.json()).then(data => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleChange = (e: any) => setSettings({ ...settings, [e.target.name]: e.target.value })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    await fetch('/api/admin/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
    })
    alert('Pengaturan Tersimpan!')
  }

  if (loading) return <div>Memuat...</div>

  return (
    <form onSubmit={handleSubmit} class="bg-white p-6 rounded-xl shadow border space-y-6 max-w-4xl">
      <div>
        <h3 class="font-bold text-lg border-b pb-2 mb-4">Informasi Website</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-sm font-medium">Nama Brand</label><input type="text" name="site_name" value={settings.site_name || ''} onChange={handleChange} class="w-full border p-2 mt-1 rounded"/></div>
          <div><label class="text-sm font-medium">Tagline</label><input type="text" name="tagline" value={settings.tagline || ''} onChange={handleChange} class="w-full border p-2 mt-1 rounded"/></div>
        </div>
      </div>

      <div>
        <h3 class="font-bold text-lg border-b pb-2 mb-4 mt-6">Payment Gateway (Midtrans)</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-sm font-medium">Client Key</label><input type="text" name="payment_client_key" value={settings.payment_client_key || ''} onChange={handleChange} class="w-full border p-2 mt-1 rounded"/></div>
          <div><label class="text-sm font-medium">Server Key</label><input type="password" name="payment_server_key" value={settings.payment_server_key || ''} onChange={handleChange} class="w-full border p-2 mt-1 rounded"/></div>
        </div>
      </div>
      
      <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">Simpan Pengaturan</button>
    </form>
  )
}
