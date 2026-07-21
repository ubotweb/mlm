import { useState, useEffect } from 'hono/jsx'

export default function AdminBroadcastForm() {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [form, setForm] = useState({ title: '', message: '', targetAudience: 'all' })

  const fetchBroadcasts = () => {
    fetch('/api/admin/broadcasts').then(res => res.json()).then(setBroadcasts)
  }

  useEffect(() => { fetchBroadcasts() }, [])

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    await fetch('/api/admin/broadcasts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    alert('Terkirim!')
    setForm({ title: '', message: '', targetAudience: 'all' })
    fetchBroadcasts()
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} class="bg-white p-6 rounded-xl shadow border space-y-4 h-fit">
        <div>
          <label class="block font-medium">Judul</label>
          <input type="text" required value={form.title} onChange={e => setForm({...form, title: (e.target as any).value})} class="w-full border p-2 rounded mt-1"/>
        </div>
        <div>
          <label class="block font-medium">Target Paket</label>
          <select value={form.targetAudience} onChange={e => setForm({...form, targetAudience: (e.target as any).value})} class="w-full border p-2 rounded mt-1">
            <option value="all">Semua Member</option>
            <option value="pkg_starter">Starter Saja</option>
            <option value="pkg_platinum">Platinum Saja</option>
          </select>
        </div>
        <div>
          <label class="block font-medium">Pesan</label>
          <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: (e.target as any).value})} class="w-full border p-2 rounded mt-1"></textarea>
        </div>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Kirim Pesan</button>
      </form>

      <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="font-bold mb-4 border-b pb-2">Riwayat Broadcast</h3>
        <div class="space-y-4">
          {broadcasts.map(b => (
            <div key={b.id} class="p-3 border rounded bg-gray-50">
              <p class="font-bold text-sm">{b.title} <span class="text-xs text-gray-500 font-normal">({b.target_audience})</span></p>
              <p class="text-gray-600 text-sm mt-1">{b.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
