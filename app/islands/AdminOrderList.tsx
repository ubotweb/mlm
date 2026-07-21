import { useState, useEffect } from 'hono/jsx'

export default function AdminOrderList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleUpdate = async (id: string, newStatus: string, currentTracking: string) => {
    let tracking = currentTracking
    if (newStatus === 'shipped') {
      const resi = prompt('Masukkan Nomor Resi Pengiriman:', currentTracking || '')
      if (resi === null) return // dibatalkan
      tracking = resi
    }

    try {
      const res = await fetch('/api/admin/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: newStatus, trackingNumber: tracking })
      })
      
      if (res.ok) {
        alert('Pesanan berhasil diperbarui!')
        fetchOrders()
      } else {
        alert('Gagal memperbarui pesanan')
      }
    } catch (err) {
      alert('Terjadi kesalahan')
    }
  }

  if (loading) return <div class="p-5 font-bold text-gray-500">Memuat data pesanan...</div>

  return (
    <div class="bg-white p-6 rounded-xl shadow border">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-3 border-b">Tgl / Invoice</th>
              <th class="p-3 border-b">Username</th>
              <th class="p-3 border-b">Total Bayar</th>
              <th class="p-3 border-b">Resi</th>
              <th class="p-3 border-b">Status & Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} class="p-4 text-center">Tidak ada pesanan.</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o.id} class="hover:bg-gray-50 border-b">
                  <td class="p-3 text-sm">
                    <p class="font-bold text-blue-700">{o.invoice_number}</p>
                    <p class="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('id-ID')}</p>
                  </td>
                  <td class="p-3 font-medium">{o.username}</td>
                  <td class="p-3 font-bold text-green-600">Rp {o.total_amount.toLocaleString('id-ID')}</td>
                  <td class="p-3 text-sm">{o.tracking_number || '-'}</td>
                  <td class="p-3">
                    <div class="flex items-center space-x-2">
                      <span class={`px-2 py-1 text-xs rounded text-white font-bold uppercase ${
                        o.status === 'pending' ? 'bg-yellow-500' :
                        o.status === 'paid' ? 'bg-green-500' :
                        o.status === 'shipped' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {o.status}
                      </span>
                      
                      <select 
                        class="text-xs border rounded p-1"
                        onChange={(e: any) => handleUpdate(o.id, e.target.value, o.tracking_number)}
                        value=""
                      >
                        <option value="" disabled>Update...</option>
                        <option value="paid">Set: Paid</option>
                        <option value="shipped">Set: Shipped</option>
                        <option value="completed">Set: Completed</option>
                        <option value="cancelled">Set: Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
