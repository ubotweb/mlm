import { useState, useEffect } from 'hono/jsx'

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/member/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div class="text-center py-10 font-bold text-gray-500 animate-pulse">Memuat riwayat pesanan...</div>

  return (
    <div class="space-y-6">
      {orders.length === 0 ? (
        <p class="text-center text-gray-500 py-10">Anda belum memiliki riwayat pembelian.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} class="border rounded-lg p-5 bg-gray-50 shadow-sm">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-3">
              <div>
                <p class="text-sm text-gray-500">No. Invoice</p>
                <p class="font-bold text-blue-700">{order.invoice_number}</p>
                <p class="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString('id-ID')}</p>
              </div>
              <div class="mt-2 md:mt-0 text-right">
                <span class={`px-3 py-1 rounded text-xs font-bold uppercase ${
                  order.status === 'paid' || order.status === 'completed' ? 'bg-green-200 text-green-800' : 
                  order.status === 'shipped' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {order.status}
                </span>
                <p class="text-lg font-black text-gray-900 mt-2">Rp {order.total_amount.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div>
              <p class="text-sm font-bold text-gray-700 mb-2">Item Produk:</p>
              <ul class="space-y-1">
                {order.items.map((item: any, idx: number) => (
                  <li key={idx} class="text-sm flex justify-between text-gray-600">
                    <span>{item.name} (x{item.qty})</span>
                    <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {order.tracking_number && (
              <div class="mt-4 pt-3 border-t">
                <p class="text-sm text-gray-600">Resi Pengiriman: <span class="font-bold text-gray-900">{order.tracking_number}</span></p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
