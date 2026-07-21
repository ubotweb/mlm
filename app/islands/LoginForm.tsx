import { useState } from 'hono/jsx'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gagal login.')
      
      window.location.href = '/member'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} class="space-y-6">
      {error && <div class="bg-red-50 text-red-700 p-3 text-sm rounded">{error}</div>}
      <div>
        <label class="block text-sm font-medium text-gray-700">Username</label>
        <input type="text" required value={username} onChange={(e: any) => setUsername(e.target.value)} class="mt-1 block w-full border rounded-md py-2 px-3" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" required value={password} onChange={(e: any) => setPassword(e.target.value)} class="mt-1 block w-full border rounded-md py-2 px-3" />
      </div>
      <button type="submit" disabled={loading} class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
    </form>
  )
}
