import { useState, useEffect } from 'hono/jsx'

export default function CheckoutForm() {
  // Dalam implementasi nyata, keranjang (cart) diambil dari State Management atau LocalStorage
  const [cart] = useState([
    { id: '1', name: 'Facial Wash', price: 75000, qty: 2 },
    { id: '2', name: 'Brightening Serum', price: 125000, qty: 1 }
  ])
  
  const [shippingAddress, setShippingAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const shippingCost = 20000 // Simulasi ongkir tetap
  const total = subtotal + shippingCost

  const handleCheckout = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          shippingAddress,
          subtotal,
          shippingCost,
          total
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses pesanan.')
      }

      // Redirect ke halaman Payment Gateway (Midtrans/Xendit)
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        window.location.href = '/member/order-success'
      }

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleCheckout} class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Kolom Kiri: Data Pengiriman */}
      <div>
        <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Informasi Pengiriman</h2>
        {error && <div class="bg-red-50 text-red-600 p-3 mb-4 rounded text-sm">{error}</div>}
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
          <textarea 
            required 
            rows={4}
            value={shippingAddress}
            onChange={(e: any) => setShippingAddress(e.target.value)}
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Jalan, RT/RW, Kecamatan, Kota, Kode Pos"
          ></textarea>
        </div>
      </div>

      {/* Kolom Kanan: Ringkasan Pesanan */}
      <div class="bg-gray-50 p-6 rounded-lg border">
        <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Ringkasan Pesanan</h2>
        
        <div class="space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.id} class="flex justify-between text-sm">
              <span class="text-gray-600">{item.name} (x{item.qty})</span>
              <span class="font-medium text-gray-900">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div class="border-t pt-3 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-medium text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Ongkos Kirim</span>
            <span class="font-medium text-gray-900">Rp {shippingCost.toLocaleString('id-ID')}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-3 mt-3">
            <span class="text-gray-900">Total Bayar</span>
            <span class="text-blue-700">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          class="w-full mt-6 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          {loading ? 'Memproses...' : 'Bayar Sekarang'}
        </button>
      </div>
    </form>
  )
}
