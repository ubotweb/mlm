// Fungsi ini dipanggil dari export default aplikasi utama Anda (src/server.ts)
// Contoh integrasi di server.ts: 
// export default { fetch: app.fetch, queue: queueHandler }

export const queueHandler = async (batch: MessageBatch<any>, env: Env) => {
  const db = env.DB

  for (const message of batch.messages) {
    try {
      const { orderId, userId, type } = message.body

      if (type === 'calculate_bonus') {
        // 1. Ambil data transaksi & data user yang belanja
        const order = await db.prepare("SELECT total_amount FROM orders WHERE id = ?").bind(orderId).first()
        const user = await db.prepare("SELECT sponsor_id, package_id FROM users WHERE id = ?").bind(userId).first()

        if (order && user && user.sponsor_id) {
          
          // 2. Tentukan nominal Bonus Sponsor berdasarkan Paket
          const sponsorPackageQuery = `
            SELECT p.sponsor_bonus_amount 
            FROM users u JOIN packages p ON u.package_id = p.id 
            WHERE u.id = ?
          `
          const sponsorData = await db.prepare(sponsorPackageQuery).bind(user.sponsor_id).first()
          
          if (sponsorData) {
            const bonusAmount = sponsorData.sponsor_bonus_amount as number
            const commissionId = crypto.randomUUID()

            // 3. Masukkan record ke tabel commissions
            await db.prepare(
              `INSERT INTO commissions (id, user_id, source_user_id, order_id, type, amount, status)
               VALUES (?, ?, ?, ?, 'sponsor', ?, 'released')`
            ).bind(commissionId, user.sponsor_id, userId, orderId, bonusAmount).run()

            // 4. Tambahkan saldo (balance) sponsor
            await db.prepare(
              `UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            ).bind(bonusAmount, user.sponsor_id).run()
          }
        }
      }
      
      // Jika berhasil diproses, tandai pesan selesai agar tidak diulang
      message.ack()
    } catch (error) {
      console.error('Queue processing failed for message:', message.id, error)
      message.retry() // Ulangi pesan nanti jika terjadi error sistem
    }
  }
}
