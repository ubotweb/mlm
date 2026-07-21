import { useState, useEffect } from 'hono/jsx'

export default function AdminProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // State untuk form tambah produk
  const [formData, setFormData] = useState({
    name: '', category: 'skincare', price: '', member_price: '', stock: '', description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProducts = () => {
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [])

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddProduct = async (e: Event) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          member_price: Number(formData.member_price),
          stock: Number(formData.stock)
        })
      })
      if (res.ok) {
        alert('Produk berhasil ditambahkan!')
        setFormData({ name: '', category: 'skincare', price: '', member_price: '', stock: '', description: '' })
        fetchProducts() // Refresh tabel
      }
    } catch (err) {
      alert('Gagal menambah produk')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div class="space-y-8">
      {/* Form Tambah Produk */}
      <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-xl font-bold mb-4 border-b pb-2">Tambah Produk Baru</h3>
        <form onSubmit={handleAddProduct} class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium">Nama Produk</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} class="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium">Kategori</label>
            <select name="category" value={formData.category} onChange={handleInputChange} class="mt-1 w-full border rounded p-2">
              <option value="skincare">Skincare</option>
              <option value="health">Health / Kesehatan</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium">Harga Umum (Rp)</label>
            <input type="number" name="price" required value={formData.price} onChange={handleInputChange} class="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium">Harga Member (Rp)</label>
            <input type="number" name="member_price" required value={formData.member_price} onChange={handleInputChange} class="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium">Stok Awal</label>
            <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} class="mt-1 w-full border rounded p-2" />
          </div>
          <div class="md:col-span-2">
            <button type="submit" disabled={isSubmitting} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Daftar Produk */}
      <div class="bg-white p-6 rounded-xl shadow border">
        <h3 class="text-xl font-bold mb-4 border-b pb-2">Daftar Produk</h3>
        {loading ? <p>Memuat data...</p> : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="p-3 border-b">Nama Produk</th>
                  <th class="p-3 border-b">Kategori</th>
                  <th class="p-3 border-b">Harga</th>
                  <th class="p-3 border-b">Stok</th>
                  <th class="p-3 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} class="hover:bg-gray-50">
                    <td class="p-3 border-b font-medium">{p.name}</td>
                    <td class="p-3 border-b uppercase text-xs">{p.category}</td>
                    <td class="p-3 border-b text-green-600 font-bold">Rp {p.price.toLocaleString('id-ID')}</td>
                    <td class="p-3 border-b">{p.stock}</td>
                    <td class="p-3 border-b">
                      <span class={`px-2 py-1 text-xs rounded text-white ${p.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
