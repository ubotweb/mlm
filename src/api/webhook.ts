import { Hono } from 'hono'

const webhookApi = new Hono<{ Bindings: Env }>()

webhookApi.post('/payment-callback', async (c) => {
  const db = c.env.DB
  
  try {
    const payload = await c.req.json()
    // Contoh untuk Midtrans, parameter biasanya berupa order_id dan transaction_status
    const { order_id, transaction_status, signature_key } = payload

    // TODO: Verifikasi signature_key di sini untuk keamanan menggunakan payment_server_key dari DB/Env

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      
      // Kita pastikan mencari order berdasarkan ID internal atau invoice_number dari Midtrans
      const order = await db.prepare("SELECT * FROM orders WHERE id = ? OR invoice_number = ?").bind(order_id, order_id).first()
      
      if (!order) {
         return c.json({ message: 'Order tidak ditemukan di database' }, 404)
      }

      // 1. Update status order menjadi 'paid'
      await db.prepare(
        "UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(order.id).run()

      // ====================================================================
      // 2. MESIN CETAK PIN OTOMATIS & PENCAIRAN BONUS SPONSOR
      // ====================================================================
      const item = await db.prepare("SELECT * FROM order_items WHERE order_id = ? AND package_id IS NOT NULL").bind(order.id).first()
      
      if (item) {
        const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").bind(item.package_id).first()
        const user = await db.prepare("SELECT id, hu_id FROM users WHERE id = ?").bind(order.user_id).first()

        if (pkg && user) {
          const huCount = Number(pkg.hu_count) || 1
          const sponsorBonus = Number(pkg.sponsor_bonus_amount) || 0
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

          // A. Generate PIN massal sesuai jumlah HU di Paket
          for (let i = 0; i < huCount; i++) {
            let pinCode = `HMM-${pkg.name.toString().substring(0,3).toUpperCase()}-`
            for(let j=0; j<8; j++) pinCode += chars.charAt(Math.floor(Math.random() * chars.length))
            
            const pinId = crypto.randomUUID()
            await db.prepare(`
              INSERT INTO activation_pins (id, pin_code, package_id, purchaser_hu_id, is_used) 
              VALUES (?, ?, ?, ?, 0)
            `).bind(pinId, pinCode, pkg.id, user.hu_id).run()
          }

          // B. Distribusikan Bonus Sponsor seketika ke pembeli
          if (sponsorBonus > 0) {
            const commId = crypto.randomUUID()
            await db.prepare(`
              INSERT INTO commissions (id, user_id, type, amount, description, status, order_id)
              VALUES (?, ?, 'sponsor', ?, ?, 'released', ?)
            `).bind(commId, user.id, sponsorBonus, `Bonus Sponsor Pembelian PIN Paket ${pkg.name}`, order.id).run()

            await db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(sponsorBonus, user.id).run()
          }
        }
      }
      // ====================================================================

      // 3. Kirim tugas ke Cloudflare Queues untuk menghitung Bonus MLM (Pasangan, Titik RO, dll)
      // Ini mencegah timeout jika perhitungan pohon jaringan sangat dalam
      await c.env.BONUS_QUEUE.send({
        orderId: order.id,
        userId: order.user_id,
        type: 'calculate_bonus'
      })

      return c.json({ message: 'Callback received, PIN generated, and processing bonus queue' }, 200)
    }

    return c.json({ message: 'Ignored status' }, 200)
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Failed processing webhook' }, 500)
  }
})

export default webhookApi
