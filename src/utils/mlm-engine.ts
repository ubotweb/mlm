export async function generateHUId(db: any): Promise<string> {
  // Masukkan ke sequence untuk mendapatkan nomor urut unik
  const res = await db.prepare("INSERT INTO hu_sequence DEFAULT VALUES RETURNING id").first()
  const seqId = res.id
  // Format menjadi HMM dengan padding 10 digit angka
  const paddedNum = String(seqId).padStart(10, '0')
  return `HMM${paddedNum}`
}

// Algoritma Pencarian Posisi Auto Spillover Binary
export async function findSpilloverPosition(db: any, sponsorHuId: string): Promise<{ upline_id: string, position: 'left' | 'right' }> {
  // Cari ID user berdasarkan sponsor_hu
  const sponsor = await db.prepare("SELECT id FROM users WHERE hu_id = ?").bind(sponsorHuId).first()
  if (!sponsor) {
    // Jika sponsor tidak valid, letakkan di root admin
    const rootAdmin = await db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first()
    return { upline_id: rootAdmin.id, position: 'left' }
  }

  // Antrian Queue untuk BFS (Breadth-First Search) mencari titik kosong dari atas ke bawah, kiri ke kanan
  let queue: string[] = [sponsor.id]
  
  while (queue.length > 0) {
    const currentUserId = queue.shift()!

    // Cek anak kiri
    const leftChild = await db.prepare("SELECT id FROM users WHERE upline_id = ? AND network_position = 'left'").bind(currentUserId).first()
    if (!leftChild) {
      return { upline_id: currentUserId, position: 'left' }
    } else {
      queue.push(leftChild.id)
    }

    // Cek anak kanan
    const rightChild = await db.prepare("SELECT id FROM users WHERE upline_id = ? AND network_position = 'right'").bind(currentUserId).first()
    if (!rightChild) {
      return { upline_id: currentUserId, position: 'right' }
    } else {
      queue.push(rightChild.id)
    }
  }

  return { upline_id: sponsor.id, position: 'left' }
}
