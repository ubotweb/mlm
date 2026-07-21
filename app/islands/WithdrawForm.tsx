import { useState } from 'hono/jsx'

export default function WithdrawForm({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance)
  const [formData, setFormData] = useState({ amount: '', bankName: 'BCA', accountNumber: '', accountName: '' })
  const [loading, setLoading] = useState(false)

  const handleWithdraw = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/member/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: Number(formData.amount) })
      })
      const data = await res.json()
      if (res.ok) {
        alert('Berhasil diajukan!')
        setBalance(prev => prev - Number(formData.amount))
        setFormData({ ...formData, amount: '' })
      } else alert(data.error)
    } catch (err) { alert('Terjadi kesalahan') } 
    finally { setLoading(false) }
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Kartu Bank Style */}
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-[#151921] dark:to-[#0B0E14] border border-gray-700 dark:border-[#222731] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10">
          <svg class="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"></path></svg>
        </div>
        <div class="flex items-center mb-8 relative z-10">
          <div class="p-2 bg-white/10 rounded-lg mr-3">
             <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
          </div>
          <div>
            <h4 class="font-bold text-white uppercase tracking-wider text-sm">Target Pencairan</h4>
            <p class="text-xs text-gray-400">BANK / E-WALLET</p>
          </div>
        </div>
        <div class="relative z-10 mb-6">
          <p class="text-xs text-gray-400 mb-1 uppercase">Saldo Tersedia</p>
          <h2 class="text-3xl font-black text-emerald-400 tracking-widest">Rp {balance.toLocaleString('id-ID')}</h2>
        </div>
      </div>

      {/* Form Penarikan */}
      <form onSubmit={handleWithdraw} class="bg-white dark:bg-[#151921] border border-gray-200 dark:border-[#222731] p-6 rounded-2xl shadow-sm space-y-5">
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nominal (Min Rp 50.000)</label>
          <input type="number" required min="50000" max={balance} value={formData.amount} onChange={(e: any) => setFormData({...formData, amount: e.target.value})} class="w-full bg-gray-50 dark:bg-[#1A1E26] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 font-bold" placeholder="50000" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pilih Bank</label>
            <select value={formData.bankName} onChange={(e: any) => setFormData({...formData, bankName: e.target.value})} class="w-full bg-gray-50 dark:bg-[#1A1E26] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none font-bold uppercase">
              <option value="BCA">BCA</option><option value="MANDIRI">MANDIRI</option><option value="DANA">DANA (E-Wallet)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Atas Nama</label>
            <input type="text" required value={formData.accountName} onChange={(e: any) => setFormData({...formData, accountName: e.target.value})} class="w-full bg-gray-50 dark:bg-[#1A1E26] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none uppercase" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nomor Rekening / HP</label>
          <input type="text" required value={formData.accountNumber} onChange={(e: any) => setFormData({...formData, accountNumber: e.target.value})} class="w-full bg-gray-50 dark:bg-[#1A1E26] border border-gray-300 dark:border-[#2D3342] text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none font-bold" />
        </div>
        <button type="submit" disabled={loading || balance < 50000} class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20">
          {loading ? 'Memproses...' : 'Tarik Saldo Sekarang'}
        </button>
      </form>
    </div>
  )
}
