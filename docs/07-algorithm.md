# 07 — Algoritma Distribusi Order

## Weighted Random Technician Assignment

---

## 1. Nama Algoritma

**Weighted Random Technician Assignment (WRTA)**

---

## 2. Tujuan

Mendistribusikan order perbaikan ke teknisi secara otomatis dengan **sistem prioritas berbobot**, di mana teknisi **premium** dan teknisi dengan **rating tinggi** memiliki peluang lebih besar untuk mendapatkan order. Konsep ini meniru sistem pembagian order pada Gojek/Grab, di mana driver premium/langganan mendapat prioritas.

---

## 3. Konteks Bisnis

Dalam platform handyman, tidak semua teknisi sama:
- **Teknisi Premium**: Teknisi yang membayar langganan/terverifikasi — perlu insentif lebih
- **Teknisi Rating Tinggi**: Teknisi dengan performa baik — perlu diapresiasi
- **Teknisi Baru**: Tetap mendapat peluang, meskipun lebih kecil

Algoritma ini memastikan distribusi yang **adil tapi tidak sama rata** — semakin baik kualitas teknisi, semakin besar peluang mendapat order.

---

## 4. Input

| Input | Sumber | Deskripsi |
|-------|--------|-----------|
| `order` | Database | Order yang perlu di-assign (layanan, customer_id) |
| `technicians[]` | Database | Daftar teknisi yang: **online** + **spesialisasi cocok** |

---

## 5. Proses (Pseudocode)

```
function assignTechnician(order):
    // Step 1: Filter teknisi tersedia
    availableTechs = query(
        SELECT * FROM technicians
        WHERE status = 'online'
        AND spesialisasi LIKE '%' + order.layanan + '%'
    )

    if availableTechs.length == 0:
        return null  // Tidak ada teknisi tersedia

    // Step 2: Hitung bobot setiap teknisi
    weights = []
    totalWeight = 0

    for each tech in availableTechs:
        // Base weight
        weight = 1.0

        // Premium multiplier: teknisi premium 3x lebih besar
        if tech.is_premium:
            weight = weight * 3.0

        // Rating factor: rating / 5.0 (normalisasi ke 0-1)
        ratingFactor = tech.rating / 5.0
        weight = weight * ratingFactor

        // Simpan
        weights.push({ tech: tech, weight: weight })
        totalWeight = totalWeight + weight

    // Step 3: Random selection berdasarkan bobot
    random = Math.random() * totalWeight
    cumulative = 0

    for each w in weights:
        cumulative = cumulative + w.weight
        if random <= cumulative:
            return w.tech  // Teknisi terpilih!

    // Fallback (seharusnya tidak pernah tercapai)
    return weights[weights.length - 1].tech
```

---

## 6. Contoh Perhitungan

### Skenario: Order Perbaikan AC, 3 teknisi tersedia

| Teknisi | Premium | Rating | Perhitungan Bobot | Bobot Akhir |
|---------|:-------:|:------:|-------------------|:-----------:|
| Andi | ✅ Ya | 5.0 | 1.0 × 3.0 × (5.0/5.0) | **3.00** |
| Budi | ❌ Tidak | 4.5 | 1.0 × 1.0 × (4.5/5.0) | **0.90** |
| Cici | ❌ Tidak | 3.0 | 1.0 × 1.0 × (3.0/5.0) | **0.60** |
| **Total** | | | | **4.50** |

### Probabilitas Terpilih

```
Andi:  3.00 / 4.50 = 66.7%  ████████████████████████
Budi:  0.90 / 4.50 = 20.0%  ███████
Cici:  0.60 / 4.50 = 13.3%  ████
```

Jika dijalankan 100 kali, distribusi order yang diharapkan:
- Andi mendapat ~67 order (premium, rating sempurna)
- Budi mendapat ~20 order (non-premium, rating bagus)
- Cici mendapat ~13 order (non-premium, rating cukup)

---

## 7. Kompleksitas

| Aspek | Nilai |
|-------|-------|
| **Time Complexity** | O(n) — satu pass filter + satu pass cumulative |
| **Space Complexity** | O(n) — menyimpan array weights |
| **n** | Jumlah teknisi online dengan spesialisasi cocok |

Algoritma ini efisien untuk skala kecil hingga menengah. Untuk skala sangat besar (ribuan teknisi), bisa dioptimasi dengan pre-sorting atau segmentasi.

---

## 8. Edge Cases & Handling

| Kondisi | Handling |
|---------|----------|
| **0 teknisi tersedia** | Order tetap `pending`, admin mendapat notifikasi |
| **1 teknisi tersedia** | Otomatis terpilih (bobot tidak relevan) |
| **Semua teknisi punya rating 0** | Gunakan minimum bobot = 0.1 agar tetap ada peluang |
| **Teknisi reject order** | Panggil ulang algoritma (teknisi tersebut dikeluarkan dari pool) |
| **Teknisi busy setelah di-assign** | Algoritma hanya mempertimbangkan `status = 'online'` |

---

## 9. Justifikasi Pemilihan Algoritma

Mengapa tidak pakai algoritma lain?

| Alternatif | Kelemahan |
|------------|-----------|
| **Round-robin** | Tidak mempertimbangkan kualitas teknisi |
| **First-come-first-serve** | Teknisi tercepat yang selalu dapat, tidak adil |
| **Pure random (uniform)** | Tidak ada insentif untuk jadi premium |
| **Greedy (selalu pilih terbaik)** | Teknisi terbaik overload, yang lain tidak dapat order |

**Weighted Random** adalah keseimbangan terbaik:
- ✅ Memberi insentif pada teknisi premium + rating tinggi
- ✅ Tetap memberi peluang pada teknisi baru/rendah
- ✅ Tidak ada teknisi yang overload (karena random)
- ✅ Simpel, mudah dijelaskan, mudah di-test

---

## 10. Implementasi di Kode

File: `services/algorithm.js`

```javascript
// services/algorithm.js
const { Technician } = require('../models');

async function assignTechnician(order) {
  // 1. Get available technicians
  const technicians = await Technician.findAll({
    where: {
      status: 'online',
      spesialisasi: { [Op.like]: `%${order.layanan}%` }
    }
  });

  if (technicians.length === 0) return null;

  // 2. Calculate weights
  const weighted = technicians.map(tech => {
    let weight = 1.0;
    if (tech.is_premium) weight *= 3.0;
    weight *= (tech.rating / 5.0);
    return { tech, weight };
  });

  // 3. Total weight
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  // 4. Random selection
  let random = Math.random() * totalWeight;
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) return w.tech;
  }

  // Fallback
  return weighted[weighted.length - 1].tech;
}

module.exports = { assignTechnician };
```

---

## 11. Pengujian Algoritma

Lihat `docs/10-testing.md` untuk test case spesifik:

- **Unit test**: 1000 iterasi, verifikasi distribusi sesuai bobot
- **Edge case**: 0 teknisi, 1 teknisi, semua premium, semua rating 0
- **Integration test**: Algoritma dipanggil saat POST /api/orders
