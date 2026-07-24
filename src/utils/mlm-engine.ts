// =========================================================================================
// MLM CORE ENGINE - HMM BEAUTY
// Menangani kalkulasi Bonus Pairing PV, Flush Out, Auto-RO, dan Global Cashback
// Berjalan otomatis setiap pukul 00:00 WIB
// =========================================================================================

export async function processDailyPairing(db: any) {
  try {
    console.log("[MLM ENGINE] Memulai kalkulasi Bonus Pairing PV harian...");

    // 1. Ambil semua user aktif yang memiliki PV di kaki kiri dan kanan (termasuk Sisa PV kemarin)
    const { results: users } = await db.prepare(`
      SELECT u.id, u.hu_id, u.balance, u.ro_balance, 
             u.pv_left_today, u.pv_right_today, u.sisa_pv_left, u.sisa_pv_right,
             p.max_pairing_per_day, p.ro_target_per_month
      FROM users u
      JOIN packages p ON u.package_id = p.id
      WHERE u.status = 'active'
      AND (u.pv_left_today + u.sisa_pv_left) > 0 
      AND (u.pv_right_today + u.sisa_pv_right) > 0
    `).all()

    const statements = []

    for (const user of users) {
      // Akumulasi Total PV yang tersedia untuk di-pairing hari ini
      const totalLeftPV = Number(user.pv_left_today) + Number(user.sisa_pv_left)
      const totalRightPV = Number(user.pv_right_today) + Number(user.sisa_pv_right)

      // Cari PV terkecil yang berhasil dipasangkan
      let matchedPV = Math.min(totalLeftPV, totalRightPV)

      // Konversi Pasang: Asumsi 1 Pasang = 100 PV (Paket terkecil Silver)
      const maxPVAllowed = Number(user.max_pairing_per_day) * 100

      // Jika PV yang match melebihi batas harian paket (Flush Out)
      let isFlushOut = false
      if (matchedPV > maxPVAllowed) {
        matchedPV = maxPVAllowed
        isFlushOut = true
      }

      // ---------------------------------------------------------
      // RUMUS BONUS PAIRING (TIER 1 & TIER 2)
      // Tier 1: 1 - 50 Pasang (1 - 5000 PV) = 5% x 5000 = Rp 250 / PV
      // Tier 2: > 50 Pasang (> 5000 PV) = 3% x 5000 = Rp 150 / PV
      // ---------------------------------------------------------
      let grossBonus = 0
      const tier1Limit = 5000 // 50 pasang * 100 PV

      if (matchedPV <= tier1Limit) {
        grossBonus = matchedPV * 250
      } else {
        const tier1Bonus = tier1Limit * 250
        const tier2Bonus = (matchedPV - tier1Limit) * 150
        grossBonus = tier1Bonus + tier2Bonus
      }

      if (grossBonus > 0) {
        // ---------------------------------------------------------
        // POTONGAN AUTO-RO (PLAN B)
        // 20% dari Bonus Pairing dimasukkan ke Saldo Lock RO
        // hingga mencapai Target RO Bulanan paket tersebut.
        // ---------------------------------------------------------
        let autoRoDeduction = grossBonus * 0.20 // 20% potongan
        const currentRoBalance = Number(user.ro_balance)
        const targetRo = Number(user.ro_target_per_month)

        // Jika potongan membuat RO melebihi target, ambil secukupnya saja
        if (currentRoBalance + autoRoDeduction > targetRo) {
          autoRoDeduction = targetRo - currentRoBalance
          if (autoRoDeduction < 0) autoRoDeduction = 0 // Jika sudah penuh, tidak ada potongan
        }

        const netBonus = grossBonus - autoRoDeduction

        // Catat ke Buku Besar Komisi
        const commId = 'com_pair_' + crypto.randomUUID()
        statements.push(
          db.prepare(`
            INSERT INTO commissions (id, user_id, type, amount, description, created_at) 
            VALUES (?, ?, 'pairing', ?, ?, DATETIME('now', '+7 hours'))
          `).bind(commId, user.id, grossBonus, `Bonus Pairing ${matchedPV} PV. Cair: Rp ${netBonus.toLocaleString('id-ID')}, Auto-RO: Rp ${autoRoDeduction.toLocaleString('id-ID')}`)
        )

        // Update Saldo User (Saldo Cair & Saldo Auto RO)
        statements.push(
          db.prepare(`
            UPDATE users 
            SET balance = balance + ?, ro_balance = ro_balance + ?, updated_at = DATETIME('now', '+7 hours') 
            WHERE id = ?
          `).bind(netBonus, autoRoDeduction, user.id)
        )
      }

      // ---------------------------------------------------------
      // KALKULASI SISA PV UNTUK BESOK (CARRY FORWARD)
      // ---------------------------------------------------------
      // PV yang dipotong dari total adalah PV sebelum kena Cap Flush Out (Matched Sebenarnya)
      // Hal ini agar jika terjadi Flush Out, kaki yang overlimit tetap hangus (tidak menimbun beban sistem)
      const actualMatched = Math.min(totalLeftPV, totalRightPV) 
      const newSisaLeft = totalLeftPV - actualMatched
      const newSisaRight = totalRightPV - actualMatched

      // Reset PV Hari ini ke 0, simpan sisanya ke kolom sisa_pv
      statements.push(
        db.prepare(`
          UPDATE users 
          SET pv_left_today = 0, pv_right_today = 0, sisa_pv_left = ?, sisa_pv_right = ?, updated_at = DATETIME('now', '+7 hours') 
          WHERE id = ?
        `).bind(newSisaLeft, newSisaRight, user.id)
      )
    }

    // Eksekusi Ratusan/Ribuan Kalkulasi secara Atomic Batch
    if (statements.length > 0) {
      await db.batch(statements)
    }
    
    console.log(`[MLM ENGINE] Sukses memproses Pairing untuk ${users.length} member aktif.`);
    return { success: true, processed: users.length }

  } catch (error: any) {
    console.error("[CRITICAL MLM ENGINE ERROR] Gagal memproses Pairing:", error.message)
    return { success: false, error: error.message }
  }
}


// =========================================================================================
// MESIN GLOBAL POOL (CASHBACK 3% OMSET HARIAN)
// =========================================================================================
export async function processGlobalCashback(db: any) {
  try {
    console.log("[MLM ENGINE] Memulai kalkulasi Bonus Cashback Global 3%...");

    // 1. Hitung Total Omset Perusahaan Hari Ini (WIB)
    const omsetData = await db.prepare(`
      SELECT SUM(total_amount) as today_omset 
      FROM orders 
      WHERE status = 'completed' 
      AND DATE(created_at) = DATE(DATETIME('now', '+7 hours'))
    `).first()

    const todayOmset = Number(omsetData?.today_omset) || 0
    if (todayOmset === 0) {
      console.log("[MLM ENGINE] Omset hari ini 0. Tidak ada Cashback yang dibagikan.");
      return { success: true, processed: 0 }
    }

    // 2. Hitung 3% dari Omset
    const globalPoolAmount = todayOmset * 0.03

    // 3. Ambil semua member aktif (Kecuali paket Starter jika masih ada) yang limit cashback-nya belum penuh
    // Asumsi: Kita cek total cashback yang sudah mereka terima bulan ini atau selama ini.
    // Sesuai Plan, kita bagikan rata ke semua member berhak.
    const { results: eligibleUsers } = await db.prepare(`
      SELECT u.id, p.max_cashback 
      FROM users u
      JOIN packages p ON u.package_id = p.id
      WHERE u.status = 'active' AND p.max_cashback > 0
    `).all()

    if (eligibleUsers.length === 0) return { success: true, processed: 0 }

    // 4. Bagi rata Pool tersebut
    const cashbackPerUser = Math.floor(globalPoolAmount / eligibleUsers.length)
    if (cashbackPerUser < 1) return { success: true, processed: 0 } // Terlalu kecil untuk dibagikan

    const statements = []

    for (const user of eligibleUsers) {
      // Cek apakah User sudah menyentuh max_cashback limit paketnya
      const history = await db.prepare(`
        SELECT SUM(amount) as total_cb 
        FROM commissions 
        WHERE user_id = ? AND type = 'cashback'
      `).bind(user.id).first()

      const currentTotalCb = Number(history?.total_cb) || 0
      const maxCbAllowed = Number(user.max_cashback)

      if (currentTotalCb >= maxCbAllowed) continue // Limit tercapai, lewati user ini

      // Hitung real cashback yang bisa diterima (jangan sampai menembus limit maksimal)
      let finalCashback = cashbackPerUser
      if (currentTotalCb + cashbackPerUser > maxCbAllowed) {
        finalCashback = maxCbAllowed - currentTotalCb
      }

      if (finalCashback > 0) {
        const commId = 'com_cb_' + crypto.randomUUID()
        statements.push(
          db.prepare(`
            INSERT INTO commissions (id, user_id, type, amount, description, created_at) 
            VALUES (?, ?, 'cashback', ?, ?, DATETIME('now', '+7 hours'))
          `).bind(commId, user.id, finalCashback, `Bonus Cashback Global 3% (Porsi Omset: Rp ${todayOmset.toLocaleString('id-ID')})`)
        )

        statements.push(
          db.prepare(`
            UPDATE users 
            SET balance = balance + ?, updated_at = DATETIME('now', '+7 hours') 
            WHERE id = ?
          `).bind(finalCashback, user.id)
        )
      }
    }

    if (statements.length > 0) {
      await db.batch(statements)
    }

    console.log(`[MLM ENGINE] Sukses membagikan Cashback Rp ${cashbackPerUser.toLocaleString('id-ID')} ke ${eligibleUsers.length} member.`);
    return { success: true, processed: eligibleUsers.length }

  } catch (error: any) {
    console.error("[CRITICAL MLM ENGINE ERROR] Gagal memproses Cashback:", error.message)
    return { success: false, error: error.message }
  }
}
