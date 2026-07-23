import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// --- MENGIMPOR SEMUA SUB-ROUTES API ---
import registerApi from './register'
import networkApi from './network'
import checkoutApi from './checkout'
import webhookApi from './webhook'
import withdrawApi from './withdraw'
import bonusApi from './bonus'
import orderApi from './order'
import profileApi from './profile'
import downlineApi from './downline'

import adminApi from './admin'
import adminActionApi from './admin-action'
import adminProductApi from './admin-product'
import adminMemberApi from './admin-member'
import adminOrderApi from './admin-order'
import adminBroadcastApi from './admin-broadcast'
import adminSettingsApi from './admin-settings'
import adminBonusApi from './admin-bonus'
import adminPaketApi from './admin-paket'

const api = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// --- MOUNTING ROUTER (Mendaftarkan Endpoint) ---
api.route('/register', registerApi)
api.route('/checkout', checkoutApi)
api.route('/webhook', webhookApi)

// Routing Area Member
api.route('/member/network', networkApi)
api.route('/member/withdraw', withdrawApi)
api.route('/member/bonus', bonusApi)
api.route('/member/orders', orderApi)
api.route('/member/settings', profileApi)
api.route('/member/downlines', downlineApi)

// --- PERBAIKAN FATAL: Routing Area Admin ---
// Menyelaraskan endpoint dengan action form di UI (Singular & Bahasa Indonesia)
api.route('/admin/stats', adminApi) 
api.route('/admin/action', adminActionApi)
api.route('/admin/produk', adminProductApi)      // SEBELUMNYA: /admin/products
api.route('/admin/member', adminMemberApi)       // SEBELUMNYA: /admin/members
api.route('/admin/order', adminOrderApi)         // SEBELUMNYA: /admin/orders
api.route('/admin/broadcast', adminBroadcastApi) // SEBELUMNYA: /admin/broadcasts
api.route('/admin/pengaturan', adminSettingsApi) // SEBELUMNYA: /admin/settings
api.route('/admin/bonus', adminBonusApi)         // SEBELUMNYA: /admin/bonuses
api.route('/admin/paket', adminPaketApi)

// --- MIDDLEWARE AUTH UNTUK ENDPOINT DASAR DI INDEX ---
api.use('/profile-basic/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  
  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }

  try {
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401)
  }
})

// --- ENDPOINT LOGIN ---
api.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const username = body.username as string
  const password = body.password as string
  
  if (!username || !password) {
    return c.redirect('/login?error=Username dan password wajib diisi')
  }

  try {
    const db = c.env.DB

    // 1. Cari user di database berdasarkan username
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first()
    
    if (!user) {
      return c.redirect('/login?error=Username atau password salah')
    }

    // 2. Hash password yang diinput untuk dicocokkan dengan database
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 3. Verifikasi kecocokan password
    if (user.password_hash !== hashedPassword) {
      return c.redirect('/login?error=Username atau password salah')
    }
    
    // 4. Buat Token JWT dengan ROLE ASLI dari database
    const payload = {
      sub: user.username,
      role: user.role, 
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 
    }
    
    const token = await sign(payload, c.env.JWT_SECRET, 'HS256')
    
    // 5. Tanamkan Cookie
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,       
      sameSite: 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24
    })
    
    // 6. Redirect cerdas berdasarkan Role
    if (user.role === 'admin') {
      return c.redirect('/admin')
    } else {
      return c.redirect('/member')
    }

  } catch (error) {
    return c.redirect('/login?error=Terjadi kesalahan pada server')
  }
})

// --- ENDPOINT LOGOUT ---
api.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.redirect('/login') // Saya ubah redirect agar user langsung terlempar ke halaman login
})

// --- ENDPOINT PUBLIK ---
api.get('/products', async (c) => {
  return c.json([
    { id: '1', name: 'Facial Wash', price: 75000, category: 'Skincare' },
    { id: '2', name: 'Brightening Serum', price: 125000, category: 'Skincare' },
    { id: '3', name: 'Multivitamin', price: 150000, category: 'Health' }
  ])
})

// --- ENDPOINT PROTECTED (Contoh fallback dasar) ---
api.get('/profile-basic', async (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ 
    message: 'Selamat datang di Member Area', 
    user_data: payload 
  })
})

export default api
