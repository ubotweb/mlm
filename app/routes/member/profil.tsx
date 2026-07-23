import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { MemberLayout } from '../../components/MemberLayout'

export default createRoute(async (c) => {
  const token = getCookie(c, 'auth_token')
  if (!token) return c.redirect('/login')
  let profile: any
  try { profile = await verify(token, c.env.JWT_SECRET, 'HS256') } catch (err) { return c.redirect('/login') }

  const db = c.env.DB
  
  // PERBAIKAN: Menambahkan kolom address, province, city, district, dan village
  const user = await db.prepare("SELECT full_name, email, phone, balance, address, province, city, district, village FROM users WHERE hu_id = ?").bind(profile.sub).first()
  
  const successMsg = c.req.query('success')
  const errorMsg = c.req.query('error')

  return c.render(
    <MemberLayout profile={profile} balance={(user?.balance as number) || 0} activeMenu="Profil Saya">
      
      {/* INJEKSI ALPINE.JS UNTUK DROPDOWN WILAYAH */}
      <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

      <div class="max-w-3xl">
        <h3 class="text-2xl font-bold text-white">Profil & Pengaturan</h3>
        <p class="text-[#8B949E] text-sm mt-1 mb-8">Kelola informasi akun, kontak, dan parameter keamanan sistem Anda.</p>

        {successMsg && <div class="bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] p-4 text-sm font-bold rounded-lg mb-6">{successMsg}</div>}
        {errorMsg && <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-sm font-bold rounded-lg mb-6">{errorMsg}</div>}

        <div class="space-y-6">
          
          {/* Card 1: User Info */}
          <div class="bg-[#151921] border border-[#222731] rounded-xl p-6 shadow-sm flex items-center">
            <div class="h-14 w-14 bg-[#1B2A24] border border-[#00E676]/30 text-[#00E676] rounded-full flex items-center justify-center font-black text-2xl mr-4">
              {profile.sub.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-lg font-bold text-white capitalize">{user?.full_name || profile.sub}</h2>
                <span class="bg-[#00E676]/10 text-[#00E676] text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-[#00E676]/30">{profile.role}</span>
              </div>
              <p class="text-xs text-[#8B949E] mt-1">{user?.email} • Ref: {profile.sub.toUpperCase()}</p>
            </div>
          </div>

          {/* Card 2: KYC & Alamat (Yellow Submit) Terintegrasi dengan Alpine.js */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <div class="px-6 py-5 border-b border-[#222731] flex items-center">
              <div class="p-2 bg-[#332A1C] text-yellow-500 rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Informasi Kontak & Wilayah (KYC)</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Data ini wajib dilengkapi untuk kelancaran verifikasi pencairan dana dan pengiriman produk.</p>
              </div>
            </div>
            
            <div class="p-6 space-y-5">
              <input type="hidden" name="fullName" value={(user?.full_name as string) || ''} />
              
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nomor Whatsapp Aktif</label>
                <input type="text" name="phone" defaultValue={(user?.phone as string) || ''} placeholder="Contoh: 08123456789" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500" />
              </div>
              
              <div>
                <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Alamat Lengkap (Jalan, RT/RW, Patokan)</label>
                <textarea name="address" rows={2} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 resize-none">{user?.address || ''}</textarea>
              </div>

              {/* BLOK ALPINE.JS UNTUK PENGAMBILAN DATA API WILAYAH */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4" {...{"x-data": `{
                baseUrl: 'https://assets.pasblast.com/wilayah',
                provinces: [], regencies: [], districts: [], villages: [],
                provId: '', regId: '', distId: '', villId: '',
                provName: '${user?.province || ''}', 
                cityName: '${user?.city || ''}', 
                distName: '${user?.district || ''}', 
                villName: '${user?.village || ''}',

                init() {
                  fetch(this.baseUrl + '/provinces.json').then(r => r.json()).then(d => this.provinces = d).catch(e => console.error('Gagal memuat provinsi'));
                },
                fetchRegencies() {
                  this.provName = this.provinces.find(p => p.id === this.provId)?.name || '';
                  this.regencies = []; this.districts = []; this.villages = [];
                  this.regId = ''; this.distId = ''; this.villId = '';
                  this.cityName = ''; this.distName = ''; this.villName = '';
                  if(this.provId) fetch(this.baseUrl + '/regencies/' + this.provId + '.json').then(r => r.json()).then(d => this.regencies = d);
                },
                fetchDistricts() {
                  this.cityName = this.regencies.find(r => r.id === this.regId)?.name || '';
                  this.districts = []; this.villages = [];
                  this.distId = ''; this.villId = '';
                  this.distName = ''; this.villName = '';
                  if(this.regId) fetch(this.baseUrl + '/districts/' + this.regId + '.json').then(r => r.json()).then(d => this.districts = d);
                },
                fetchVillages() {
                  this.distName = this.districts.find(d => d.id === this.distId)?.name || '';
                  this.villages = []; this.villId = ''; this.villName = '';
                  if(this.distId) fetch(this.baseUrl + '/villages/' + this.distId + '.json').then(r => r.json()).then(d => this.villages = d);
                },
                setVillage() {
                  this.villName = this.villages.find(v => v.id === this.villId)?.name || '';
                }
              }`}}>
                
                {/* Input tersembunyi agar nama teks dikirim, bukan ID angka */}
                <input type="hidden" name="province" {...{"x-bind:value": "provName"}} />
                <input type="hidden" name="city" {...{"x-bind:value": "cityName"}} />
                <input type="hidden" name="district" {...{"x-bind:value": "distName"}} />
                <input type="hidden" name="village" {...{"x-bind:value": "villName"}} />

                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Provinsi <span class="text-gray-500 lowercase font-normal">(Saat ini: {user?.province || 'Belum diatur'})</span></label>
                  <select {...{"x-model": "provId", "@change": "fetchRegencies()"}} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 text-sm cursor-pointer">
                    <option value="">-- Pilih Provinsi Baru --</option>
                    <template {...{"x-for": "p in provinces", ":key": "p.id"}}>
                      <option {...{":value": "p.id", "x-text": "p.name"}}></option>
                    </template>
                  </select>
                </div>
                
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Kabupaten / Kota <span class="text-gray-500 lowercase font-normal">(Saat ini: {user?.city || '-'})</span></label>
                  <select {...{"x-model": "regId", "@change": "fetchDistricts()", ":disabled": "regencies.length === 0"}} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 text-sm cursor-pointer disabled:opacity-50">
                    <option value="">-- Pilih Kabupaten/Kota --</option>
                    <template {...{"x-for": "r in regencies", ":key": "r.id"}}>
                      <option {...{":value": "r.id", "x-text": "r.name"}}></option>
                    </template>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Kecamatan <span class="text-gray-500 lowercase font-normal">(Saat ini: {user?.district || '-'})</span></label>
                  <select {...{"x-model": "distId", "@change": "fetchVillages()", ":disabled": "districts.length === 0"}} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 text-sm cursor-pointer disabled:opacity-50">
                    <option value="">-- Pilih Kecamatan --</option>
                    <template {...{"x-for": "d in districts", ":key": "d.id"}}>
                      <option {...{":value": "d.id", "x-text": "d.name"}}></option>
                    </template>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Desa / Kelurahan <span class="text-gray-500 lowercase font-normal">(Saat ini: {user?.village || '-'})</span></label>
                  <select {...{"x-model": "villId", "@change": "setVillage()", ":disabled": "villages.length === 0"}} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500 text-sm cursor-pointer disabled:opacity-50">
                    <option value="">-- Pilih Desa/Kelurahan --</option>
                    <template {...{"x-for": "v in villages", ":key": "v.id"}}>
                      <option {...{":value": "v.id", "x-text": "v.name"}}></option>
                    </template>
                  </select>
                </div>
              </div>

              <div class="pt-2">
                <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-xl transition-colors text-xs uppercase tracking-widest shadow-lg shadow-yellow-600/20">
                  SIMPAN INFORMASI KONTAK & WILAYAH
                </button>
              </div>
            </div>
          </form>

          {/* Card 3: Ubah Password (Red Submit) */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <input type="hidden" name="phone" value={(user?.phone as string) || ''} />
            <input type="hidden" name="fullName" value={(user?.full_name as string) || ''} />
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="md:col-span-2">
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Password Saat Ini</label>
                  <input type="password" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="••••••••" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Password Baru</label>
                  <input type="password" name="newPassword" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Minimal 6 karakter" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                  <input type="password" class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none" placeholder="Ulangi password baru" />
                </div>
              </div>
              <button type="submit" class="w-full bg-[#E53935] hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors text-sm">Simpan Perubahan Password</button>
            </div>
          </form>

          {/* Card 4: Ubah Nama (Green Submit) */}
          <form method="POST" action="/api/member/settings/update" class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <input type="hidden" name="phone" value={(user?.phone as string) || ''} />
            <div class="px-6 py-5 flex items-center border-b border-[#222731]">
              <div class="p-2 bg-[#1B2A24] text-[#00E676] rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Ubah Nama Akun</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Perbarui nama lengkap resmi Anda yang tertera pada sistem.</p>
              </div>
            </div>
            <div class="p-6">
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Nama Lengkap Anda</label>
              <input type="text" name="fullName" defaultValue={(user?.full_name as string) || ''} class="w-full bg-[#0B0E14] border border-[#2D3342] text-white rounded-lg px-4 py-3 focus:outline-none mb-4" />
              <button type="submit" class="w-full bg-[#00E676] hover:bg-[#00C853] text-[#0B0E14] font-bold py-3 rounded-lg transition-colors text-sm">Simpan Perubahan Nama</button>
            </div>
          </form>

          {/* Card 5: Email (Blue Submit) */}
          <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
             <div class="px-6 py-5 flex items-center border-b border-[#222731]">
              <div class="p-2 bg-[#1C2333] text-blue-400 rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Perbarui Alamat Email</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Ganti alamat surat elektronik untuk korespondensi dan login sistem.</p>
              </div>
            </div>
            <div class="p-6">
              <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Alamat Email Baru</label>
              <input type="email" value={user?.email || ''} readOnly class="w-full bg-[#0B0E14] border border-[#2D3342] text-gray-500 rounded-lg px-4 py-3 focus:outline-none mb-4 cursor-not-allowed" />
              <button type="button" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors text-sm flex items-center justify-center">
                 Perbarui Alamat Email
              </button>
            </div>
          </div>

          {/* Card 6: FITUR LINK REFERRAL BARU (Hanya terbuka jika nomor HP sudah diisi) */}
          <div class="bg-[#151921] border border-[#222731] rounded-xl overflow-hidden shadow-sm">
            <div class="px-6 py-5 flex items-center border-b border-[#222731]">
              <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-full mr-4">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              </div>
              <div>
                <h4 class="font-bold text-white text-sm">Link Referral Perekrutan</h4>
                <p class="text-[11px] text-[#8B949E] mt-1">Sebarkan link ini agar prospek baru otomatis terhubung ke WhatsApp Anda.</p>
              </div>
            </div>
            <div class="p-6">
              {user?.phone ? (
                <div>
                  <label class="block text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-2">Tautan Khusus Anda</label>
                  <div class="flex items-center space-x-3">
                    <input type="text" id="refLink" readOnly value={`https://hmmbeauty.pages.dev/?ref=${profile.sub.toUpperCase()}`} class="flex-1 bg-[#0B0E14] border border-[#2D3342] text-emerald-400 font-bold rounded-lg px-4 py-3 focus:outline-none text-sm" />
                    <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('refLink').value); alert('Tautan berhasil disalin!')" class="bg-emerald-600 hover:bg-emerald-500 text-[#0B0E14] font-black px-6 py-3 rounded-lg transition-colors text-sm shadow-lg shadow-emerald-500/20 uppercase tracking-widest cursor-pointer">
                      Salin Link
                    </button>
                  </div>
                </div>
              ) : (
                <div class="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-4 rounded-lg text-sm font-bold text-center leading-relaxed">
                  Silakan isi dan simpan Nomor Whatsapp Anda pada menu Informasi Kontak (KYC) di atas terlebih dahulu untuk bisa membuat Link Referral.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </MemberLayout>
  )
})
