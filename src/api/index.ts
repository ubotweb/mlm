import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const api = new Hono<{ Bindings: Env; Variables: { jwtPayload: any } }>()

// --- MIDDLEWARE AUTH (Membaca JWT dari Cookie & verifikasi HS256) ---
api.use('/member/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  
  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }

  try {
    // Verifikasi secara eksplisit menggunakan HS256 dan secret dari Env
    const decoded = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('jwtPayload', decoded)
    await next()
  } catch (err) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401)
  }
})

// --- ENDPOINT LOGIN ---
api.post('/login', async (c) => {
  // Simulasi body request
  const body = await c.req.json()
  
  // LOGIKA VERIFIKASI KE DATABASE D1 HARUSNYA DI SINI
  // if (userIsValid) { ... }
  
  if (body.username && body.password) {
    const payload = {
      sub: body.username,
      role: 'member',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // Expired 24 jam
    }
    
    // Sign JWT secara eksplisit menggunakan HS256
    const token = await sign(payload, c.env.JWT_SECRET, 'HS256')
    
    // Set Cookie yang aman
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,       // Harus true jika di production (HTTPS)
      sameSite: 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24
    })
    
    return c.json({ message: 'Login berhasil' })
  }
  
  return c.json({ error: 'Username atau password salah' }, 401)
})

// --- ENDPOINT LOGOUT ---
api.post('/logout', async (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ message: 'Logout berhasil' })
})

// --- ENDPOINT PUBLIK ---
api.get('/products', async (c) => {
  // Dalam real-case, fetch dari c.env.DB menggunakan query SQL
  return c.json([
    { id: '1', name: 'Facial Wash', price: 75000, category: 'Skincare' },
    { id: '2', name: 'Brightening Serum', price: 125000, category: 'Skincare' },
    { id: '3', name: 'Multivitamin', price: 150000, category: 'Health' }
  ])
})

// --- ENDPOINT PROTECTED (Hanya bisa diakses jika Cookie valid) ---
api.get('/member/profile', async (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ 
    message: 'Selamat datang di Member Area', 
    user_data: payload 
  })
})

export default api
