import { useState, useEffect } from 'hono/jsx'

export default function MemberDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile-basic')
      .then(async (res) => {
        if (!res.ok) {
          window.location.href = '/login'
          throw new Error('Sesi habis')
        }
        return res.json()
      })
      .then((data) => {
        setProfile(data.user_data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) return <div>Memuat...</div>

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="col-span-1 bg-white p-6 rounded-xl shadow border">
        <h2 class="text-xl font-bold text-gray-800 text-center">{profile?.sub}</h2>
        <nav class="mt-6 space-y-2">
          <a href="/member" class="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">Dashboard</a>
          <a href="/member/jaringan" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Pohon Jaringan</a>
          <a href="/member/downline" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Downline</a>
          <a href="/member/bonus" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Bonus</a>
          <a href="/member/order" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Pesanan</a>
          <a href="/member/withdraw" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Withdraw</a>
          <a href="/member/profil" class="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Profil</a>
          <button onClick={handleLogout} class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Logout</button>
        </nav>
      </div>
      <div class="col-span-1 md:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow border">
          <h3 class="text-lg font-bold mb-4">Link Referral Anda</h3>
          <input type="text" readOnly value={`https://hmmbeautyhealth.com/register?ref=${profile?.sub}`} class="w-full p-2 border rounded bg-gray-50 text-gray-600"/>
        </div>
      </div>
    </div>
  )
}
