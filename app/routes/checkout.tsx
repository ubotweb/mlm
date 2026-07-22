import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // 1. Verifikasi Sesi
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')

  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') }
  catch (err) { return c.redirect('/login') }

  // 2. Tangkap Parameter URL
  const db = c.env.DB
  const type = c.req.query('type') // 'package' | 'product'
  const id = c.req.query('id')

  if (!type || !id) {
    return c.redirect('/member')
  }

  // 3. Logika Penarikan Data dari Database D1
  let itemName = ''
  let itemPrice = 0
  let shippingCost = 0

  if (type === 'package') {
    const pkg = await db.prepare("SELECT name, registration_fee FROM packages WHERE id = ?").bind(id).first()
    if (!pkg) return c.redirect('/member/upgrade?error=Paket tidak ditemukan')
    
    itemName = `Upgrade Lisensi: Paket ${pkg.name}`
    itemPrice = pkg.registration_fee as number
    shippingCost = 0 // Paket lisensi digital tidak ada ongkir fisik
  } 
  else if (type === 'product') {
    const prod = await db.prepare("SELECT name, member_price FROM products WHERE id = ?").bind(id).first()
    if (!prod) return c.redirect('/member/belanja?error=Produk tidak ditemukan')
    
    itemName = prod.name as string
    itemPrice = prod.member_price as number
    shippingCost = 20000 // Contoh: Ongkir flat untuk produk fisik
  } 
  else {
    return c.redirect('/member')
  }

  const totalAmount = itemPrice + shippingCost

  // 4. Render UI Premium Checkout
  return c.render(
    <div class="min-h-screen bg-[#0B0E14] text-gray-200 font-sans selection:bg-emerald-500/30 p-6 md:p-12">
      {/* Header Bar */}
      <div class="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <h1 class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider">
          HMM<span class="font-light text-white">CHECKOUT</span>
        </h1>
        <a href="/member" class="text-[#8B949E] hover:text-white flex items-center text-sm font-bold transition-colors">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Batalkan / Kembali
        </a>
      </div>

      <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Kolom Kiri: Form Informasi & Pembayaran */}
        <div>
          <h2 class="text-xl font-bold text-white mb-6">Detail Tagihan & Pengiriman</h2>
          <form method="POST" action="/api/checkout" class="space-y-6">
            
            {/* Input Tersembunyi untuk dikirim ke Backend API */}
            <input type="hidden" name="item_type" value={type} />
            <input type="hidden" name="item_id" value={id} />
            <input type="hidden" name="subtotal" value={itemPrice} />
            <input type="hidden" name="shipping" value={shippingCost} />
            <input type="hidden" name="amount" value={totalAmount} />

            <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm">
              <h3 class="text-sm font-bold text-white mb-4 border-b border-[#222731] pb-2">Informasi Penerima</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Penerima</label>
                  <input type="text" name="recipient_name" required defaultValue={profile.sub} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" />
                </div>
                {type === 'product' && (
                  <div>
                    <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Alamat Pengiriman Lengkap</label>
                    <textarea name="shipping_address" required rows={3} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Tulis jalan, RT/RW, Kecamatan, dan Kota Anda..."></textarea>
                  </div>
                )}
              </div>
            </div>

            <div class="bg-[#151921] border border-[#222731] rounded-2xl p-6 shadow-sm">
              <h3 class="text-sm font-bold text-white mb-4 border-b border-[#222731] pb-2">Metode Pembayaran</h3>
              <div class="space-y-3">
                <label class="flex items-center p-4 border border-[#2D3342] rounded-lg cursor-pointer hover:border-[#00E676] bg-[#0B0E14] transition-colors">
                  <input type="radio" name="payment_method" value="Bank Transfer" required class="w-4 h-4 text-[#00E676] bg-[#1A1E26] border-[#2D3342] focus:ring-[#00E676]" />
                  <span class="ml-3 font-bold text-white text-sm">Transfer Bank Manual</span>
                </label>
                <label class="flex items-center p-4 border border-[#2D3342] rounded-lg cursor-pointer hover:border-[#00E676] bg-[#0B0E14] transition-colors">
                  <input type="radio" name="payment_method" value="QRIS" required class="w-4 h-4 text-[#00E676] bg-[#1A1E26] border-[#2D3342] focus:ring-[#00E676]" />
                  <span class="ml-3 font-bold text-white text-sm">QRIS Otomatis</span>
                </label>
              </div>
            </div>

            <button type="submit" class="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-black py-4 rounded-xl transition-colors shadow-lg shadow-[#00E676]/20 uppercase tracking-widest text-lg">
              Konfirmasi Pesanan
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan (Dinamis Sesuai DB) */}
        <div>
          <div class="bg-[#151921] border border-[#222731] rounded-2xl p-8 shadow-sm sticky top-10">
            <h2 class="text-xl font-bold text-white mb-6 border-b border-[#222731] pb-4">Ringkasan Pesanan</h2>

            {/* List Item yang Dibeli */}
            <div class="flex justify-between items-center mb-6">
              <div>
                <p class="font-bold text-gray-300 text-sm max-w-xs">{itemName}</p>
                <p class="text-xs text-[#8B949E] mt-1">Qty: 1 x Rp {itemPrice.toLocaleString('id-ID')}</p>
              </div>
              <p class="font-bold text-white">Rp {itemPrice.toLocaleString('id-ID')}</p>
            </div>

            {/* Kalkulasi */}
            <div class="border-t border-[#222731] pt-4 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-[#8B949E]">Subtotal</span>
                <span class="font-bold text-white">Rp {itemPrice.toLocaleString('id-ID')}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-[#8B949E]">Ongkos Kirim</span>
                <span class="font-bold text-white">Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Total Akhir */}
            <div class="border-t border-[#222731] mt-6 pt-6 flex justify-between items-center">
              <span class="font-bold text-gray-300">Total Tagihan</span>
              <span class="text-3xl font-black text-[#00E676]">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            
            <div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p class="text-[11px] text-blue-400 font-medium">Pembayaran Anda dilindungi dengan enkripsi end-to-end. Pastikan alamat pengiriman dan pesanan Anda sudah sesuai.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
})
