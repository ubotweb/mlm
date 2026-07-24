import { createRoute } from 'honox/factory'
import { PublicLayout } from '../components/PublicLayout'

export default createRoute(async (c) => {
  const db = c.env.DB
  
  const { results: products } = await db.prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC LIMIT 8").all()
  const { results: packages } = await db.prepare("SELECT * FROM packages WHERE is_active = 1 ORDER BY price ASC").all()

  // --- LOGIKA LINK REFERRAL WHATSAPP DINAMIS ---
  const ref = c.req.query('ref')
  let defaultPhone = '6280000000000' 
  const admin = await db.prepare("SELECT phone FROM users WHERE role = 'admin' AND phone IS NOT NULL LIMIT 1").first()
  
  if (admin && admin.phone) {
    let adminPhoneRaw = String(admin.phone).replace(/\D/g, '')
    if (adminPhoneRaw.startsWith('0')) {
      defaultPhone = '62' + adminPhoneRaw.substring(1)
    } else {
      defaultPhone = adminPhoneRaw
    }
  }

  let targetPhone = defaultPhone
  let waMessage = encodeURIComponent('Halo Admin HMM Beauty, saya ingin mendaftar kemitraan. Mohon panduannya.')

  if (ref) {
    const sponsor = await db.prepare("SELECT phone FROM users WHERE hu_id = ?").bind(ref).first()
    if (sponsor && sponsor.phone) {
      let sponsorPhone = String(sponsor.phone).replace(/\D/g, '')
      if (sponsorPhone.startsWith('0')) sponsorPhone = '62' + sponsorPhone.substring(1)
      
      targetPhone = sponsorPhone
      waMessage = encodeURIComponent(`Halo, saya tertarik bergabung dengan HMM Beauty melalui referensi Anda (ID Sponsor: ${ref}). Mohon panduannya.`)
    }
  }

  const waLink = `https://wa.me/${targetPhone}?text=${waMessage}`

  return c.render(
    <PublicLayout waLink={waLink} activeMenu="home">
      
      {/* Hero Section (Banner) */}
      <section class="container mx-auto px-6 py-20 text-center">
        <h2 class="text-5xl md:text-6xl font-black mb-6 leading-tight">Cantik Alami, Sehat Berkualitas,<br/> <span class="text-emerald-400">Sukses Bersama.</span></h2>
        <p class="text-[#8B949E] text-lg max-w-2xl mx-auto mb-10 font-medium">
          Bergabunglah dengan jaringan HMM Beauty. Nikmati produk kesehatan & kecantikan terbaik sekaligus bangun kebebasan finansial Anda tanpa batas.
        </p>
        <a href="#paket" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black transition-all inline-block shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">Mulai Perjalanan Anda</a>
      </section>

      {/* Section Paket MLM */}
      <section id="paket" class="bg-[#151921] py-20 border-y border-[#222731]">
        <div class="container mx-auto px-6">
          <h3 class="text-3xl font-black text-center mb-12">Pilihan <span class="text-emerald-400">Paket Kemitraan</span></h3>
          
          {packages.length === 0 ? (
             <div class="text-center text-[#8B949E] font-bold p-10 bg-[#1A1E26] rounded-2xl max-w-2xl mx-auto border border-[#2D3342]">
               Paket kemitraan sedang diperbarui. Silakan hubungi admin kami.
             </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-center">
              {packages.map((p: any) => {
                let sponsorLevels = [];
                try { sponsorLevels = JSON.parse(String(p.sponsor_levels)); } catch {}
                
                return (
                  <div class="bg-[#1A1E26] border border-[#2D3342] p-8 rounded-2xl hover:border-emerald-500 transition-all text-center flex flex-col group relative">
                    {p.name.toLowerCase() === 'gold' && (
                      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Populer</div>
                    )}
                    
                    <h4 class="text-xl font-bold mb-2 text-white mt-2">{p.name}</h4>
                    <p class="text-emerald-400 text-2xl font-black mb-6 whitespace-nowrap">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                    
                    <ul class="text-sm text-gray-400 space-y-4 mb-8 text-left flex-1">
                      <li class="flex items-start">
                        <span class="text-emerald-500 mr-2">✔️</span> 
                        <span><b class="text-white">{p.pv} PV</b> (Poin Pairing)</span>
                      </li>
                      <li class="flex items-start">
                        <span class="text-emerald-500 mr-2">✔️</span> 
                        <span><b class="text-white">{p.point} Poin</b> (Reward Fisik)</span>
                      </li>
                      <li class="flex items-start">
                        <span class="text-emerald-500 mr-2">✔️</span> 
                        <span>Bonus Sponsor: <b class="text-white">{sponsorLevels.length} Kedalaman</b></span>
                      </li>
                      <li class="flex items-start">
                        <span class="text-emerald-500 mr-2">✔️</span> 
                        <span>Maks. Pairing: <b class="text-white">{p.max_pairing_per_day} Ps/Hari</b></span>
                      </li>
                      <li class="flex items-start">
                        <span class="text-emerald-500 mr-2">✔️</span> 
                        <span>Limit Cashback: <b class="text-white">Rp {Number(p.max_cashback).toLocaleString('id-ID')}</b></span>
                      </li>
                    </ul>
                    
                    <a href={waLink} target="_blank" rel="noopener noreferrer" class={`block w-full text-white py-3 rounded-lg font-bold transition-colors mt-auto ${p.name.toLowerCase() === 'gold' ? 'bg-blue-600 hover:bg-blue-500 shadow-lg' : 'bg-[#2D3342] hover:bg-emerald-500 hover:text-[#0B0E14]'}`}>
                      Pilih {p.name}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section Katalog Produk */}
      <section class="container mx-auto px-6 py-20">
        <h3 class="text-3xl font-black text-center mb-4">Katalog <span class="text-emerald-400">Produk</span></h3>
        <p class="text-center text-[#8B949E] mb-12 font-medium">Rangkaian produk premium untuk menunjang kesehatan dan kecantikan Anda.</p>
        
        {products.length === 0 ? (
          <div class="bg-[#151921] border border-[#222731] rounded-2xl p-10 text-center max-w-2xl mx-auto">
             <p class="text-[#8B949E] font-bold">Produk belum tersedia. Katalog sedang dalam tahap pembaruan.</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p: any) => (
              <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-[#2D3342] transition-colors relative">
                
                <div class="h-56 bg-[#1A1E26] relative overflow-hidden flex items-center justify-center cursor-pointer" onclick={`document.getElementById('modal-${p.id}').showModal()`}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <svg class="w-16 h-16 text-[#2D3342]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  )}
                  <span class="absolute top-4 left-4 bg-[#0B0E14]/80 backdrop-blur border border-[#222731] text-[10px] font-black text-emerald-400 px-3 py-1.5 rounded uppercase tracking-widest">
                    {p.category}
                  </span>
                </div>
                
                <div class="p-6 flex-1 flex flex-col">
                  <h3 class="font-bold text-white text-lg mb-2 leading-tight">{p.name}</h3>
                  <p class="text-xs text-[#8B949E] line-clamp-2 mb-5 flex-1 leading-relaxed">{p.description || 'Produk unggulan HMM Beauty & Health.'}</p>
                  
                  <div class="mb-5">
                    <p class="text-xs text-gray-500 line-through mb-1">Rp {p.price.toLocaleString('id-ID')}</p>
                    <p class="text-2xl font-black text-emerald-400">Rp {p.member_price.toLocaleString('id-ID')}</p>
                    <p class="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-wider">Harga Khusus Member</p>
                  </div>
                  
                  <button onclick={`document.getElementById('modal-${p.id}').showModal()`} class="w-full text-center bg-[#1A1E26] hover:bg-emerald-500 text-gray-300 hover:text-[#0B0E14] border border-[#2D3342] hover:border-emerald-500 font-bold py-3 rounded-xl transition-colors text-sm">
                    Lihat Detail
                  </button>
                </div>

                <dialog id={`modal-${p.id}`} class="bg-transparent m-auto p-0 w-[95vw] max-w-4xl backdrop:bg-[#0B0E14]/90 backdrop:backdrop-blur-sm rounded-2xl open:animate-in open:fade-in-0 open:zoom-in-95">
                  <div class="bg-[#151921] border border-[#222731] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row text-left">
                    <button onclick={`document.getElementById('modal-${p.id}').close()`} class="absolute top-4 right-4 bg-[#0B0E14] hover:bg-red-500 text-[#8B949E] hover:text-white border border-[#2D3342] hover:border-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-colors z-20 font-bold">
                      ✕
                    </button>
                    
                    <div class="w-full md:w-2/5 h-64 md:h-auto bg-[#1A1E26] relative">
                      {p.image_url ? (
                        <img src={p.image_url} class="w-full h-full object-cover" />
                      ) : (
                        <div class="w-full h-full flex items-center justify-center"><svg class="w-20 h-20 text-[#2D3342]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>
                      )}
                    </div>

                    <div class="w-full md:w-3/5 p-6 md:p-10 flex flex-col">
                      <span class="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded w-max">{p.category}</span>
                      <h3 class="text-3xl font-black text-white mb-4 leading-tight">{p.name}</h3>
                      <p class="text-[#8B949E] text-sm mb-8 leading-relaxed flex-1">{p.description || 'Produk premium HMM Beauty & Health.'}</p>
                      
                      <div class="grid grid-cols-2 gap-6 mb-8 bg-[#0B0E14] border border-[#222731] p-5 rounded-xl">
                        <div>
                          <p class="text-xs text-[#8B949E] uppercase font-bold tracking-wider mb-1">Harga Normal</p>
                          <p class="text-sm text-gray-500 line-through">Rp {p.price.toLocaleString('id-ID')}</p>
                          <p class="text-xs text-[#8B949E] uppercase font-bold tracking-wider mb-1 mt-4">Harga Member</p>
                          <p class="text-2xl font-black text-emerald-400">Rp {p.member_price.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="space-y-3 text-sm text-[#8B949E] border-l border-[#222731] pl-6">
                          <p>Stok Tersedia: <br/><b class="text-white text-base">{p.stock} Pcs</b></p>
                          <p>No. BPOM: <br/><b class="text-white text-xs">{p.bpom_number || 'Dalam Proses'}</b></p>
                          <p>Sertifikasi Halal: <br/><b class="text-white text-xs">{p.halal_number || 'Dalam Proses'}</b></p>
                        </div>
                      </div>
                      
                      <a href={waLink} target="_blank" rel="noopener noreferrer" class="w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">
                        Beli & Gabung Kemitraan
                      </a>
                    </div>
                  </div>
                </dialog>

              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  )
})
