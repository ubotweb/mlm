import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Default WhatsApp Fallback jika DB tidak dapat dijangkau
  let waLink = 'https://wa.me/6280000000000?text=Halo%20Admin%20HMM%20Beauty%2C%20saya%20ingin%20bertanya%20mengenai%20Marketing%20Plan.'

  try {
    const db = c.env?.DB
    const ref = c.req.query('ref')
    let defaultPhone = '6280000000000'

    // Eksekusi DB secara aman jika D1 Binding tersedia
    if (db) {
      try {
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
        let waMessage = encodeURIComponent('Halo Admin HMM Beauty, saya ingin bertanya lebih lanjut mengenai Marketing Plan dan panduan pendaftaran.')

        if (ref) {
          const sponsor = await db.prepare("SELECT phone FROM users WHERE hu_id = ?").bind(ref).first()
          if (sponsor && sponsor.phone) {
            let sponsorPhone = String(sponsor.phone).replace(/\D/g, '')
            if (sponsorPhone.startsWith('0')) sponsorPhone = '62' + sponsorPhone.substring(1)
            
            targetPhone = sponsorPhone
            waMessage = encodeURIComponent(`Halo, saya tertarik bergabung dengan HMM Beauty setelah membaca Marketing Plan melalui referensi Anda (ID Sponsor: ${ref}). Mohon panduannya.`)
          }
        }

        waLink = `https://wa.me/${targetPhone}?text=${waMessage}`
      } catch (dbErr) {
        console.error('[MARKETING PLAN DB ERROR]:', dbErr)
      }
    }

    return c.render(
      <div class="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-emerald-500/30">
        
        {/* 1. Header & Navigasi */}
        <header class="container mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 border-b border-[#222731]">
          <a href="/" class="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-wider hover:opacity-80 transition-opacity">
            HMM<span class="font-light text-white">BEAUTY</span>
          </a>
          <div class="flex items-center space-x-3 md:space-x-4">
            <a href="/" class="text-gray-300 hover:text-white font-bold transition text-sm md:text-base whitespace-nowrap">Beranda</a>
            <a href="/login" class="text-gray-300 hover:text-white font-bold transition text-sm md:text-base whitespace-nowrap">Masuk Sesi</a>
            <a href={waLink} target="_blank" rel="noopener noreferrer" class="bg-emerald-500 hover:bg-emerald-600 text-[#0B0E14] px-4 py-2 md:px-5 md:py-2.5 rounded-full font-black transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-wider text-xs md:text-sm whitespace-nowrap">
              Daftar Mitra
            </a>
          </div>
        </header>

        {/* 2. Hero Section Marketing Plan */}
        <section class="container mx-auto px-6 py-16 md:py-24 text-center relative overflow-hidden">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>
          <div class="relative z-10">
            <span class="text-emerald-400 font-black tracking-widest uppercase text-xs md:text-sm mb-4 block">Peluang Bisnis Tanpa Batas</span>
            <h2 class="text-4xl md:text-6xl font-black mb-6 leading-tight">Business <span class="text-blue-400">Plan</span> HMM Beauty</h2>
            <p class="text-[#8B949E] text-sm md:text-lg max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
              Sistem kompensasi Hibrida revolusioner yang memadukan keadilan, kedalaman jaringan, dan potensi pasif income jangka panjang. Pahami bagaimana setiap langkah Anda dihargai maksimal.
            </p>
            <div class="inline-flex items-center justify-center bg-[#151921] border border-[#2D3342] px-6 py-3 rounded-full shadow-lg">
              <span class="text-white font-bold mr-2">Nilai Konversi Dasar:</span>
              <span class="text-emerald-400 font-black text-lg">1 PV = Rp 5.000</span>
            </div>
          </div>
        </section>

        {/* 3. Section Bonus Sponsor (Generasi) */}
        <section class="bg-[#151921] py-16 md:py-20 border-y border-[#222731]">
          <div class="container mx-auto px-6">
            <div class="text-center mb-12">
              <h3 class="text-2xl md:text-3xl font-black mb-3">1. Bonus Sponsor Langsung <span class="text-emerald-400">(23% Total)</span></h3>
              <p class="text-[#8B949E] text-sm font-medium">Bonus instan yang dibayarkan real-time (per detik) setiap kali jaringan Anda bertumbuh hingga kedalaman 5 generasi, bergantung pada Paket Kemitraan Anda.</p>
            </div>

            <div class="overflow-x-auto bg-[#1A1E26] rounded-2xl border border-[#222731] shadow-xl">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]/50">
                  <tr>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest">Level Paket</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest">Nilai Paket</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-center">Kedalaman Bonus (Persentase)</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-right">Potensi Kantong / RO</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#222731]">
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white">Silver</td>
                    <td class="px-6 py-4 text-emerald-400 font-mono">Rp 300.000 (100 PV)</td>
                    <td class="px-6 py-4 text-center"><span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs">Gen 1: 10%</span></td>
                    <td class="px-6 py-4 text-right text-gray-400 font-mono text-xs">Rp 5 Juta / RO 100Rb</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white">Gold</td>
                    <td class="px-6 py-4 text-emerald-400 font-mono">Rp 1.500.000 (300 PV)</td>
                    <td class="px-6 py-4 text-center">
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">10%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs">5%</span>
                    </td>
                    <td class="px-6 py-4 text-right text-gray-400 font-mono text-xs">Rp 15 Juta / RO 150Rb</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white">Platinum</td>
                    <td class="px-6 py-4 text-emerald-400 font-mono">Rp 3.500.000 (700 PV)</td>
                    <td class="px-6 py-4 text-center">
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">10%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">5%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs">3%</span>
                    </td>
                    <td class="px-6 py-4 text-right text-gray-400 font-mono text-xs">Rp 50 Juta / RO 200Rb</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white">Titanium</td>
                    <td class="px-6 py-4 text-emerald-400 font-mono">Rp 7.500.000 (1500 PV)</td>
                    <td class="px-6 py-4 text-center">
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">10%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">5%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs mr-1">3%</span>
                      <span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded font-bold text-xs">3%</span>
                    </td>
                    <td class="px-6 py-4 text-right text-gray-400 font-mono text-xs">Rp 100 Juta / RO 250Rb</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-black text-yellow-500">Diamond</td>
                    <td class="px-6 py-4 text-emerald-400 font-mono font-bold">Rp 20.000.000 (4200 PV)</td>
                    <td class="px-6 py-4 text-center">
                      <span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded font-bold text-xs mr-1">10%</span>
                      <span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded font-bold text-xs mr-1">5%</span>
                      <span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded font-bold text-xs mr-1">3%</span>
                      <span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded font-bold text-xs mr-1">3%</span>
                      <span class="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded font-bold text-xs">2%</span>
                    </td>
                    <td class="px-6 py-4 text-right text-yellow-500/80 font-mono text-xs font-bold">Rp 250 Juta / RO 300Rb</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. Section Bonus Pairing (Binary) */}
        <section class="py-16 md:py-24">
          <div class="container mx-auto px-6">
            <div class="text-center mb-12">
              <h3 class="text-2xl md:text-3xl font-black mb-3">2. Bonus Pairing / Pasangan <span class="text-blue-400">(Total 8%)</span></h3>
              <p class="text-[#8B949E] text-sm font-medium max-w-2xl mx-auto">Sistem Binary (Kaki Kiri & Kanan) yang dihitung per periode (pukul 00:00). Menggunakan sistem *Tiering* dan jaminan <b class="text-white">Sisa PV Disimpan (Carry Forward)</b> untuk pencairan berikutnya tanpa hangus.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Aturan Tiering */}
              <div class="bg-[#151921] border border-[#222731] p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">Aturan Kalkulasi</div>
                <h4 class="text-xl font-bold text-white mb-6">Tiering Pasangan</h4>
                
                <div class="space-y-4">
                  <div class="bg-[#1A1E26] border border-[#2D3342] p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p class="font-bold text-white">Tier 1: 1 - 50 Pasang</p>
                      <p class="text-[10px] text-[#8B949E] mt-1 uppercase tracking-widest">Rumus: 5% * Rp 5.000 * PV Terkecil</p>
                    </div>
                    <span class="text-2xl font-black text-emerald-400">5%</span>
                  </div>
                  
                  <div class="bg-[#1A1E26] border border-[#2D3342] p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <p class="font-bold text-white">Tier 2: 51 - 1.000 Pasang</p>
                      <p class="text-[10px] text-[#8B949E] mt-1 uppercase tracking-widest">Rumus: 3% * Rp 5.000 * PV Terkecil</p>
                    </div>
                    <span class="text-2xl font-black text-blue-400">3%</span>
                  </div>
                </div>

                <div class="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
                  <p class="text-emerald-400 font-bold text-sm mb-2 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Contoh Asimetris (Carry Forward)
                  </p>
                  <p class="text-xs text-gray-400 leading-relaxed">
                    Jika terjadi pasangan <b class="text-white">Silver (100 PV)</b> vs <b class="text-white">Platinum (700 PV)</b>, maka yang cair adalah 100 PV (Rp 25.000). Sisa <b class="text-emerald-400">600 PV di kaki Platinum AKAN DISIMPAN (Sisa PV)</b> untuk next pairing!
                  </p>
                </div>
              </div>

              {/* Batas Maksimal / Flush Out */}
              <div class="bg-[#151921] border border-[#222731] p-8 rounded-3xl shadow-lg">
                <h4 class="text-xl font-bold text-white mb-6">Batas Maksimal (Flush Out) per Hari</h4>
                <div class="grid gap-3">
                  <div class="flex justify-between items-center border-b border-[#222731] pb-3">
                    <span class="text-gray-300 font-bold text-sm">Silver</span>
                    <span class="text-white font-black bg-[#1A1E26] px-3 py-1 rounded text-sm">50 Pasang</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-[#222731] pb-3">
                    <span class="text-gray-300 font-bold text-sm">Gold</span>
                    <span class="text-white font-black bg-[#1A1E26] px-3 py-1 rounded text-sm">300 Pasang</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-[#222731] pb-3">
                    <span class="text-gray-300 font-bold text-sm">Platinum</span>
                    <span class="text-white font-black bg-[#1A1E26] px-3 py-1 rounded text-sm">500 Pasang</span>
                  </div>
                  <div class="flex justify-between items-center border-b border-[#222731] pb-3">
                    <span class="text-gray-300 font-bold text-sm">Titanium</span>
                    <span class="text-white font-black bg-[#1A1E26] px-3 py-1 rounded text-sm">800 Pasang</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-yellow-500 font-black text-sm">Diamond</span>
                    <span class="text-yellow-500 font-black bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded text-sm">1.250 Pasang</span>
                  </div>
                </div>
                <p class="text-[10px] text-[#8B949E] mt-6 italic text-center">Tingkatkan paket kemitraan (Upgrade) Anda untuk menaikkan batas maksimal Pairing harian dan menghindari PV hangus.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Bonus Cash Back (Global Pool) & Auto RO */}
        <section class="bg-[#151921] py-16 md:py-24 border-y border-[#222731]">
          <div class="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <span class="text-emerald-400 font-black tracking-widest uppercase text-[10px] mb-2 block">Dibagikan Setiap Tanggal 1</span>
              <h3 class="text-2xl md:text-3xl font-black mb-6">3. Bonus Cash Back <span class="text-yellow-500">Global Pool</span></h3>
              <p class="text-[#8B949E] text-sm leading-relaxed mb-6">
                Nikmati sistem bagi hasil tingkat perusahaan! HMM Beauty menyisihkan <b class="text-white">3% dari Omset Global Perhari</b> untuk dibagikan kembali kepada seluruh member tanpa syarat harus melakukan Repeat Order (RO).
              </p>
              
              <div class="bg-[#1A1E26] border border-[#2D3342] rounded-xl overflow-hidden mb-6">
                <table class="w-full text-left text-xs sm:text-sm">
                  <thead class="bg-[#0B0E14]/50 text-[#8B949E] border-b border-[#222731]">
                    <tr>
                      <th class="px-4 py-3 font-bold uppercase">Level</th>
                      <th class="px-4 py-3 font-bold uppercase text-right">Batas Max Cashback</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#222731]">
                    <tr><td class="px-4 py-3 font-medium">Silver</td><td class="px-4 py-3 text-right text-red-400 font-bold">Tidak Dapat (No Cash Back)</td></tr>
                    <tr><td class="px-4 py-3 font-medium">Gold</td><td class="px-4 py-3 text-right text-white font-mono">Rp 1.500.000</td></tr>
                    <tr><td class="px-4 py-3 font-medium">Platinum</td><td class="px-4 py-3 text-right text-white font-mono">Rp 5.250.000</td></tr>
                    <tr><td class="px-4 py-3 font-medium">Titanium</td><td class="px-4 py-3 text-right text-white font-mono">Rp 15.000.000</td></tr>
                    <tr><td class="px-4 py-3 font-bold text-yellow-500">Diamond</td><td class="px-4 py-3 text-right text-yellow-500 font-mono font-bold">Rp 60.000.000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="relative">
              <div class="absolute inset-0 bg-blue-600/10 blur-[60px] rounded-full z-0"></div>
              <div class="bg-[#0B0E14] border border-[#2D3342] p-8 rounded-3xl shadow-2xl relative z-10">
                <h4 class="text-xl font-black text-white mb-4">Sistem Cerdas <span class="text-blue-400">Plan B (Auto RO)</span></h4>
                <p class="text-sm text-gray-400 leading-relaxed mb-6">
                  Untuk memastikan pasif income jangka panjang, sistem akan otomatis melakukan pemotongan komisi yang masuk ke <b class="text-emerald-400">Dompet RO (Saldo di Lock)</b> sesuai target level Anda.
                </p>
                <ul class="space-y-4 text-sm font-medium text-gray-300">
                  <li class="flex items-start">
                    <span class="text-blue-500 mr-3">✓</span> 
                    <span>Target RO otomatis terpenuhi, menciptakan <b class="text-white">Omset Poin Gabungan (Plan B)</b>.</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-500 mr-3">✓</span> 
                    <span>Omset Plan B tidak memiliki batas kedalaman (No Limit).</span>
                  </li>
                  <li class="flex items-start">
                    <span class="text-blue-500 mr-3">✓</span> 
                    <span>Memicu sistem Reward Peringkat dan Reward Titik Kiri-Kanan secara otomatis.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* 6. Reward Peringkat Fisik */}
        <section class="py-16 md:py-24">
          <div class="container mx-auto px-6">
            <div class="text-center mb-12">
              <h3 class="text-2xl md:text-3xl font-black mb-3">4. Bonus Peringkat <span class="text-emerald-400">(Reward Pencapaian)</span></h3>
              <p class="text-[#8B949E] text-sm font-medium max-w-2xl mx-auto">Akumulasi titik PV Kiri dan Kanan yang tidak akan pernah hangus. Cukup capai 1x per peringkat dan bawa pulang hadiah mewahnya!</p>
            </div>

            <div class="overflow-x-auto bg-[#1A1E26] rounded-2xl border border-[#222731] shadow-xl">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="text-[#8B949E] border-b border-[#222731] bg-[#0B0E14]/50">
                  <tr>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest">Peringkat</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-center">Akumulasi Kiri : Kanan</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-center">Total Omset yg Dihasilkan</th>
                    <th class="px-6 py-5 font-black uppercase text-[10px] tracking-widest text-right">Hadiah Fisik / Tunai</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#222731]">
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center"><span class="w-2 h-2 rounded-full bg-blue-400 mr-3"></span> Rising Star</td>
                    <td class="px-6 py-4 text-center font-mono">100 : 100 <span class="text-xs text-gray-500">(50 Jt : 50 Jt)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-gray-400">Rp 100.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-emerald-400">iPad / Rp 7.500.000</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center"><span class="w-2 h-2 rounded-full bg-blue-500 mr-3"></span> Prestige Partner</td>
                    <td class="px-6 py-4 text-center font-mono">500 : 500 <span class="text-xs text-gray-500">(250 Jt : 250 Jt)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-gray-400">Rp 500.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-emerald-400">Umroh / Rp 40.000.000</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center"><span class="w-2 h-2 rounded-full bg-indigo-500 mr-3"></span> Elite Leader</td>
                    <td class="px-6 py-4 text-center font-mono">1600 : 1600 <span class="text-xs text-gray-500">(800 Jt : 800 Jt)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-gray-400">Rp 1.600.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-emerald-400">Paket Wisata / Rp 96.000.000</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center"><span class="w-2 h-2 rounded-full bg-purple-500 mr-3"></span> Diamond Director</td>
                    <td class="px-6 py-4 text-center font-mono">4000 : 4000 <span class="text-xs text-gray-500">(2 M : 2 M)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-gray-400">Rp 4.000.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-emerald-400">Mobil / Rp 200.000.000</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center"><span class="w-2 h-2 rounded-full bg-pink-500 mr-3"></span> Royal Ambassador</td>
                    <td class="px-6 py-4 text-center font-mono">10.000 : 10.000 <span class="text-xs text-gray-500">(5 M : 5 M)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-gray-400">Rp 10.000.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-emerald-400">Mobil Mewah / Rp 500.000.000</td>
                  </tr>
                  <tr class="hover:bg-[#2D3342]/20 transition-colors">
                    <td class="px-6 py-4 font-bold text-yellow-500 flex items-center"><span class="w-2 h-2 rounded-full bg-yellow-500 mr-3 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></span> Legacy Crown</td>
                    <td class="px-6 py-4 text-center font-mono text-yellow-500">20.000 : 20.000 <span class="text-xs text-yellow-600">(10 M : 10 M)</span></td>
                    <td class="px-6 py-4 text-center font-mono text-yellow-600">Rp 20.000.000.000</td>
                    <td class="px-6 py-4 text-right font-black text-yellow-500 text-base">Mobil Super / Rp 1 Miliar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 7. CTA Akhir */}
        <section class="bg-gradient-to-b from-[#151921] to-[#0B0E14] py-24 text-center border-t border-[#222731]">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl md:text-5xl font-black mb-6">Siap Meraih <span class="text-emerald-400">Mimpi Anda?</span></h2>
            <p class="text-[#8B949E] text-lg max-w-xl mx-auto mb-10 font-medium">Jangan lewatkan momentum emas ini. Posisikan diri Anda di puncak jaringan HMM Beauty sekarang juga.</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer" class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-full font-black transition-all inline-flex items-center shadow-lg shadow-blue-600/30 uppercase tracking-widest text-sm animate-pulse">
              <svg class="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Hubungi Sponsor Sekarang
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer class="border-t border-[#222731] py-8 text-center text-sm text-[#8B949E] font-medium bg-[#0B0E14]">
          &copy; {new Date().getFullYear()} HMM Beauty & Health. All rights reserved.
        </footer>

        {/* STICKY WHATSAPP BUTTON */}
        <a href={waLink} target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_15px_rgba(37,211,102,0.4)] hover:bg-[#128C7E] hover:scale-110 transition-all z-50 flex items-center justify-center">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    )
  } catch (err: any) {
    console.error('[MARKETING PLAN CRASH]:', err)
    
    // Fallback UI aman untuk memastikan Cloudflare selalu menerima Response HTTP 200
    return c.render(
      <div class="min-h-screen bg-[#0B0E14] text-white p-10 text-center font-sans flex flex-col items-center justify-center">
        <h1 class="text-3xl font-black text-red-500 mb-4">Terjadi Kesalahan Memuat Halaman</h1>
        <p class="text-gray-400 text-sm max-w-md mb-8">{err?.message || String(err)}</p>
        <a href="/" class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg">
          Kembali ke Beranda
        </a>
      </div>
    )
  }
})
