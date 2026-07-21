import { useState, useEffect } from 'hono/jsx'

export default function WithdrawForm() {
  const [balance, setBalance] = useState(0)
  const [formData, setFormData] = useState({
    amount: '', bankName: '', accountNumber: '', accountName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Ambil data profile untuk mendapatkan saldo terkini
  useEffect(() => {
    fetch('/api/member/profile')
      .then(res => res.json())
      .then(data => {
         // Disarankan API /profile juga mengembalikan data balance dari DB
         setBalance(data.user_data.balance || 0) 
      })
      .catch(console.error)
  }, [])

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleWithdraw = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const withdrawAmount = Number(formData.amount)

    if (withdrawAmount > balance) {
      setError('Saldo Anda tidak mencukupi.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/member/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setSuccess(data.message)
      setBalance(prev => prev - withdrawAmount)
      setFormData({ amount: '', bankName: '', accountNumber: '', accountName: '' })
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div class="bg-green-50 p-4 rounded-lg border border-green-200 mb-6 flex justify-between items-center">
        <div>
          <p class="text-sm text-green-700 font-medium">Saldo Tersedia</p>
          <p class="text-3xl font-bold text-green-800">Rp {balance.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <form onSubmit={handleWithdraw} class="space-y-5">
        {error && <div class="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
        {success && <div class="bg-blue-50 text-blue-600 p-3 rounded text-sm font-bold">{success}</div>}

        <div>
          <label class="block text-sm font-medium text-gray-700">Nominal Penarikan (Rp)</label>
          <input type="number" name="amount" required min="50000" value={formData.amount} onChange={handleChange} class="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" placeholder="Minimal Rp 50.000" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Nama Bank / E-Wallet</label>
          <input type="text" name="bankName" required value={formData.bankName} onChange={handleChange} class="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" placeholder="BCA / Mandiri / Dana / Gopay" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Nomor Rekening / HP</label>
          <input type="text" name="accountNumber" required value={formData.accountNumber} onChange={handleChange} class="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Atas Nama (Pemilik Rekening)</label>
          <input type="text" name="accountName" required value={formData.accountName} onChange={handleChange} class="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <button type="submit" disabled={loading || balance < 50000} class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 mt-4 transition">
          {loading ? 'Memproses...' : 'Ajukan Penarikan'}
        </button>
      </form>
    </div>
  )
}
