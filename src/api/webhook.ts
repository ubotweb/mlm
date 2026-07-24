import { Hono } from 'hono'

const webhookApi = new Hono<{ Bindings: Env }>()

webhookApi.post('/payment-callback', async (c) => {
  const db = c.env.DB
  
  try {
    // 1. Tangkap payload JSON dari Midtrans
    const body = await c.req.json()
    
    // order_id dari Midtrans adalah payment_reference di database kita
    const orderId = body.order_id 
    const transactionStatus = body.transaction_status
    const fraudStatus = body.fraud_status
    const grossAmount = body.gross_amount
    const signatureKey = body.signature_key
    const statusCode = body.status_code

    // 2. Ambil Server Key dari tabel site_settings untuk validasi keamanan
    const serverKeyObj = await db.prepare("SELECT value FROM site_settings WHERE key = 'midtrans_server_key'").first()
    const serverKey = serverKeyObj ? String(serverKeyObj.value) : ''

    if (!serverKey) {
      console.error("[WEBHOOK ERROR] Server key tidak ditemukan di database.")
      return c.json({ error: "Server key tidak ditemukan" }, 500)
    }

    // 3. Validasi Signature Key (Keamanan Mutlak Anti-Fraud)
    const encoder = new TextEncoder()
    const dataToHash = orderId + statusCode + grossAmount + serverKey
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(dataToHash))
    const expectedSignature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    if (signatureKey !== expectedSignature) {
      console.error(`[WEBHOOK ERROR] Signature tidak valid untuk Order: ${orderId}`)
      return c.json({ error: "Akses Ditolak: Invalid signature" }, 403)
    }

    // 4. Cari Order berdasarkan payment_reference (Sesuai Skema newmlmku.sql)
    const order = await db.prepare("SELECT * FROM orders WHERE payment_reference = ?").bind(orderId).first()
    if (!order) {
      console.error(`[WEBHOOK ERROR] Data Order tidak ditemukan: ${orderId}`)
      return c.json({ error: "Data Order tidak ditemukan" }, 404)
    }

    // Idempotency: Jika order sudah berstatus completed, abaikan agar tidak double-insert PIN
    if (order.status === 'completed' || order.status === 'paid') {
      return c.json({ status: "OK", message: "Order sudah diproses sebelumnya" })
    }

    // 5. Proses Eksekusi Berdasarkan Status Transaksi Midtrans
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      
      // Kasus khusus kartu kredit
      if (transactionStatus === 'capture' && fraudStatus === 'challenge') {
        await db.prepare("UPDATE orders SET status = 'challenge', updated_at = DATETIME('now', '+7 hours') WHERE id = ?").bind(order.id).run()
        return c.json({ status: "OK", message: "Transaksi Challenge" })
      }

      // =======================================================================
      // PEMBAYARAN SUKSES (SETTLEMENT) - CETAK PIN
      // =======================================================================
      const statements = []

      // 5a. Update status order menjadi completed
      statements.push(
        db.prepare("UPDATE orders SET status = 'completed', updated_at = DATETIME('now', '+7 hours') WHERE id = ?").bind(order.id)
      )

      // 5b. Jika ini adalah pembelian PIN (buy_pin), cetak PIN ke Brankas Member
      if (order.order_type === 'buy_pin') {
        
        // Ambil data item yang dibeli (Join dengan tabel packages)
        const { results: orderItems } = await db.prepare(`
          SELECT oi.quantity, pk.id as package_id, pk.name as package_name 
          FROM order_items oi
          JOIN packages pk ON oi.package_id = pk.id
          WHERE oi.order_id = ?
        `).bind(order.id).all()

        for (const item of orderItems) {
          const qty = Number(item.quantity)
          const pkgName = String(item.package_name)
          const pkgId = String(item.package_id)

          // Looping untuk Generate PIN unik sesuai jumlah (quantity) yang dibeli
          for (let i = 0; i < qty; i++) {
            const pinId = 'pin_' + crypto.randomUUID()
            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
            const pinCode = `HMM-${pkgName.substring(0, 3).toUpperCase()}-${randomString}`

            // PERBAIKAN FATAL: Memasukkan data ke tabel activation_pins SESUAI SKEMA newmlmku
            // Menggunakan kolom: owner_id, status = 'active'
            statements.push(
              db.prepare(`
                INSERT INTO activation_pins (id, pin_code, package_id, owner_id, status, created_at) 
                VALUES (?, ?, ?, ?, 'active', DATETIME('now', '+7 hours'))
              `).bind(pinId, pinCode, pkgId, order.user_id)
            )
          }
        }
      }

      // Eksekusi semua perintah insert dan update sekaligus (Atomic Batch)
      await db.batch(statements)
      console.log(`[WEBHOOK SUCCESS] Order ${orderId} berhasil diselesaikan dan PIN dicetak.`)

    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      await db.prepare("UPDATE orders SET status = 'failed', updated_at = DATETIME('now', '+7 hours') WHERE id = ?").bind(order.id).run()
    } else if (transactionStatus === 'pending') {
      await db.prepare("UPDATE orders SET status = 'pending', updated_at = DATETIME('now', '+7 hours') WHERE id = ?").bind(order.id).run()
    }

    return c.json({ status: "OK", message: "Webhook berhasil diproses" })

  } catch (err: any) {
    console.error("[CRITICAL] Webhook Error:", err.message)
    return c.json({ error: "Internal Server Error" }, 500)
  }
})

export default webhookApi
