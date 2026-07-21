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
      // 1. Update status order menjadi 'paid'
      await db.prepare(
        "UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(order_id).run()

      // Ambil user_id dari pesanan tersebut
      const order = await db.prepare("SELECT user_id FROM orders WHERE id = ?").bind(order_id).first()

      if (order) {
        // 2. Kirim tugas ke Cloudflare Queues untuk menghitung Bonus MLM
        // Ini mencegah timeout jika perhitungan pohon jaringan sangat dalam
        await c.env.BONUS_QUEUE.send({
          orderId: order_id,
          userId: order.user_id,
          type: 'calculate_bonus'
        })
      }

      return c.json({ message: 'Callback received and processing bonus' }, 200)
    }

    return c.json({ message: 'Ignored status' }, 200)
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ error: 'Failed processing webhook' }, 500)
  }
})

export default webhookApi
