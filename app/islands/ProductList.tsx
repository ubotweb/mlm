import { useState, useEffect } from 'hono/jsx'

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    return (
      <div class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map(product => (
        <div key={product.id} class="bg-[#1A1E26] p-5 rounded-2xl border border-[#2D3342] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group flex flex-col h-full">
          
          <div class="h-48 bg-[#151921] rounded-xl mb-5 flex items-center justify-center overflow-hidden border border-[#222731]">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <span class="text-gray-500 font-medium">Gambar Produk</span>
            )}
          </div>
          
          <div class="flex-grow">
            <span class="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              {product.category}
            </span>
            <h4 class="font-bold text-lg text-white mb-2 leading-snug">{product.name}</h4>
          </div>
          
          <div class="mt-4 pt-4 border-t border-[#2D3342]">
            <p class="text-emerald-400 font-bold text-xl mb-4">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
            <div class="flex gap-3">
              <button class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all text-sm">
                Beli Sekarang
              </button>
              <button class="flex-1 bg-[#2D3342] hover:bg-[#384050] text-gray-200 font-semibold py-2.5 rounded-lg transition-all text-sm">
                Detail
              </button>
            </div>
          </div>
          
        </div>
      ))}
    </div>
  )
}
