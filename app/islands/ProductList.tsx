import { useState, useEffect } from 'hono/jsx'

// Karena ini di dalam map `app/islands/`, komponen ini akan berjalan di Client-side (Browser)
export default function ProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data dari backend (src/api)
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Gagal mengambil produk:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div class="text-center py-10 text-gray-500">Memuat katalog produk...</div>
  }

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <div key={product.id} class="bg-white p-5 rounded-xl shadow-md border hover:shadow-lg transition">
          <div class="h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
            <span class="text-gray-400">Gambar Produk</span>
          </div>
          <span class="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full uppercase">
            {product.category}
          </span>
          <h4 class="font-bold text-xl mt-3 text-gray-800">{product.name}</h4>
          <p class="text-green-600 font-bold text-lg mt-1">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
          <div class="mt-5 flex gap-2">
            <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
              Beli Sekarang
            </button>
            <button class="w-full bg-gray-100 text-gray-700 py-2 rounded-lg border hover:bg-gray-200 transition">
              Detail
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
