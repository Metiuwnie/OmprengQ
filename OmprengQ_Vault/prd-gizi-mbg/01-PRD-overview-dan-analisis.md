# 01 — PRD Overview & Analisis Rancangan

## 1. Ringkasan Produk

**Nama kerja:** OmprengQ
**Satu kalimat:** PWA yang mengubah data gizi menu harian Makan Bergizi Gratis (MBG) menjadi edukasi kontekstual untuk guru, siswa, dan orang tua, plus kalkulator yang menunjukkan **sisa kebutuhan gizi anak** yang perlu dilengkapi di rumah.

**Keterkaitan SDGs:** SDG 2 (tanpa kelaparan/gizi baik), SDG 3 (kesehatan), SDG 4 (pendidikan berkualitas, literasi gizi).

## 2. Persona

| Persona | Kebutuhan | Perangkat | Catatan UX |
|---|---|---|---|
| **Ahli Gizi SPPG / Admin Sekolah** | Input menu & bahan cepat, gizi terhitung otomatis | Laptop/HP | Butuh login |
| **Guru Kelas** | Tampilkan menu ke kelas, bagikan ke grup WA | HP guru / proyektor | **Tanpa login**, 1x scan QR |
| **Siswa SD** | Lihat menu dengan ikon & bahasa sederhana | Tidak punya HP (lewat guru/ortu) | Mode Anak |
| **Siswa SMP/SMA** | Lihat selisih gizi sendiri | HP sendiri | Mode Remaja, privat |
| **Orang Tua** | Tahu harus menambah apa di rumah | HP, sinyal tidak stabil | Offline-first, tanpa akun |

## 3. Tujuan & Metrik Keberhasilan

| Tujuan | Metrik |
|---|---|
| Menu hari ini bisa dibuka < 3 detik setelah scan QR (4G) | LCP < 2,5 dtk; halaman menu < 150 KB gzip |
| Admin input 1 menu lengkap < 5 menit | Uji dengan 3 orang uji |
| Kalkulator berfungsi tanpa internet setelah kunjungan pertama | Lolos uji mode pesawat |
| Data profil anak tidak keluar perangkat | Tidak ada request jaringan membawa data profil |
| Pengguna paham saran | Uji kegunaan sederhana dengan 5 orang tua/siswa |

## 4. Ruang Lingkup

**Dalam MVP (M0–M8):**
- Dasbor admin (auth, sekolah, bahan, menu harian, kalkulasi gizi TKPI)
- Halaman menu harian publik via QR dinamis `/s/:slug/hari-ini` + mode presentasi
- Pembuat QR di dalam web (unduh PNG/SVG, siap cetak)
- Profil lokal multi-anak + mesin selisih gizi + rekomendasi TRT + peringatan alergi
- Generator pesan WA (satu klik)
- PWA offline-first

**Di luar MVP (tidak dikerjakan kecuali M9):** akun siswa/orang tua, sinkronisasi cloud profil, integrasi API resmi BGN, pemindai barcode, diagnosis status gizi, chat/forum.

## 5. Analisis Rancangan (Temuan & Keputusan)

Rancangan awal sudah kuat: alur jelas, privasi dipikirkan, dan UX aman secara psikologis. Berikut celah/risiko yang **diputuskan** di PRD ini agar tidak membingungkan saat vibecoding.

| # | Temuan | Dampak | Keputusan di PRD |
|---|--------|--------|------------------|
| 1 | **Data TKPI** perlu sumber & format. Tidak ada API resmi; harus di-seed sendiri. Nilai TKPI per 100 g **bagian dapat dimakan (BDD)** dan bahan mentah. | Hasil gizi bisa meleset bila lupa BDD/proses masak | Tabel `foods` menyimpan nilai per 100 g + `edible_portion_pct`; seed dimulai dari ±80–150 bahan yang dipakai di menu MBG, bukan seluruh TKPI (M1). Tampilkan catatan "perkiraan berdasarkan TKPI". |
| 2 | **Hubungan SPPG ↔ Sekolah.** Satu SPPG melayani banyak sekolah; menu dibuat SPPG, bukan per sekolah. | Input berulang bila menu dibuat per sekolah | Model `sppg` → banyak `school`. Menu milik SPPG per tanggal & jenjang; sekolah mewarisi, boleh override opsional. |
| 3 | **Porsi berbeda per jenjang** (SD kelas rendah/tinggi vs SMP/SMA). | Angka gizi tidak adil bila satu porsi dipakai semua | `menu_portion` per jenjang (`sd_low`, `sd_high`, `smp`, `sma`) berisi gram per bahan. |
| 4 | **Rumus "AKG − MBG" mengasumsikan semua porsi habis.** Anak sering tidak menghabiskan. | Rekomendasi jadi tidak akurat | Tambah input **"Porsi yang dimakan"** (Habis / ¾ / ½ / ¼) di kalkulator. |
| 5 | **Pembagian sisa kebutuhan** ke sarapan/makan malam/selingan tidak didefinisikan. | Saran tidak realistis | Sisa kebutuhan dibagi tetap: sarapan 25%, makan malam 30%, selingan 10% dari AKG harian; MBG diasumsikan makan siang (konfigurasi di `shared`). Lihat `04`. |
| 6 | **Rekomendasi "menu lokal" butuh basis data pangan + URT** (sendok, potong, mangkuk). | Tanpa ini tahap 3 mustahil | Tabel `household_foods` (kurasi ±40–60 pangan murah, lokal) berisi gizi per 1 URT + tag alergen + kategori. Algoritma **rule-based**, bukan AI (deterministik, offline, bisa diuji). |
| 7 | **Alergi hanya tercatat di profil** — butuh tag alergen di bahan menu. | Peringatan tidak jalan | Setiap `food` punya `allergens[]` (telur, ikan, kacang, susu, udang, gluten, kedelai). Menu mengagregasi alergen dari bahan. |
| 8 | **Pratinjau tautan WhatsApp** (judul/gambar) tidak muncul untuk SPA karena crawler tidak menjalankan JS. | Tautan terlihat polos | Hono menyajikan HTML ringan dengan tag Open Graph untuk `/s/:slug/hari-ini` (M6). |
| 9 | **Hari tanpa menu** (Sabtu/Minggu/libur/belum diinput). | `hari-ini` kosong/error | Halaman fallback: tampilkan menu hari kerja berikutnya + status "Belum ada menu". Zona waktu per sekolah (WIB/WITA/WIT). |
| 10 | **Admin butuh autentikasi** meski pengguna akhir tanpa akun. | Keamanan data menu | Peran: `super_admin`, `sppg_admin`, `school_admin`. Guru/siswa/ortu **tanpa login**. |
| 11 | **Klaim kesehatan.** Aplikasi berisiko dianggap memberi diagnosis. | Risiko etis/hukum | Disclaimer tetap di kalkulator: bersifat edukasi, bukan pengganti ahli gizi/dokter. Tanpa kategori status gizi. Rujukan AKG (Permenkes 28/2019). |
| 12 | **Pengguna menghapus data browser** atau ganti HP → profil hilang. | Frustrasi | Fitur **Ekspor/Impor profil** (file JSON / kode salin) — tetap tanpa server. |
| 13 | **Foto menu** butuh penyimpanan file. | Hosting disk sementara hilang | Foto opsional; unggah ke storage kompatibel S3 (mis. Cloudflare R2). Fallback: ikon/emoji per bahan. |
| 14 | **Belum ada unsur gamifikasi/laporan** (relevan bila dipakai untuk lomba/penilaian dampak). | Nilai jual kurang | Disiapkan sebagai **M9 opsional**. |

## 6. Prinsip Produk (Tidak Boleh Dilanggar)

1. **Privasi dulu:** data biologis anak hanya di perangkat.
2. **Aman psikologis:** progress bar pemenuhan, bahasa positif, tanpa label status gizi.
3. **Ringan & offline:** targetkan HP Android entry-level dan sinyal buruk.
4. **Satu sumber kebenaran perhitungan:** `packages/shared`.
5. **Tanpa akun** untuk guru, siswa, orang tua.
6. **Desain konsisten:** semua UI berasal dari satu design system (UI UX Pro Max) dan dibangun/diaudit dengan Hallmark.

## 7. Peta Jalan Milestone

```text
M0 Setup ─▶ M1 DB+Auth ─▶ M2 Admin Menu ─┬▶ M3 Menu Publik+QR ─┐
                                          └▶ M4 Gap Engine ─▶ M5 Kalkulator ─┤
                                                                M6 Share WA ◀──┤
                                                                M7 PWA ◀───────┘
                                                                M8 Polish+Deploy ─▶ M9 (opsional)
```

Estimasi per milestone (1 orang + AI agent): M0 0,5 hari · M1 1–2 hari · M2 3–4 hari · M3 2 hari · M4 2 hari · M5 3 hari · M6 1 hari · M7 1–2 hari · M8 2–3 hari · M9 3+ hari.

## 8. Glosarium

- **MBG:** Makan Bergizi Gratis. **SPPG:** Satuan Pelayanan Pemenuhan Gizi (dapur penyedia).
- **TKPI:** Tabel Komposisi Pangan Indonesia. **BDD:** bagian dapat dimakan.
- **AKG:** Angka Kecukupan Gizi. **URT/TRT:** Ukuran/Takaran Rumah Tangga (sendok, potong, mangkuk).
- **BMR:** laju metabolisme basal. **PAL:** faktor aktivitas fisik.
