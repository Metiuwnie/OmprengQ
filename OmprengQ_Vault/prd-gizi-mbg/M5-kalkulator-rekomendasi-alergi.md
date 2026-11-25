# M5 — UI Kalkulator Selisih Gizi, Rekomendasi TRT & Peringatan Alergi

**Estimasi:** 3 hari · **Prasyarat:** M3, M4 · **Baca:** 02, 03, 04

## Tujuan
Siswa/orang tua membuka tautan, mengisi profil sekali, lalu melihat pemenuhan gizi hari ini dari menu MBG dan saran konkret untuk makan malam/sarapan — aman psikologis dan mudah dipahami.

## Rute
- `/kalkulator?school=:slug` — kalkulator (membaca menu hari ini sekolah tsb.)
- `/kalkulator/profil` — kelola profil (tambah/ubah/hapus/ekspor/impor)
- Deep link dari WA (M6) membuka rute yang sama.

## Alur Pengguna
1. **Onboarding profil (sekali):** wizard 3 langkah — (a) panggilan & usia & jenis kelamin, (b) BB, TB, aktivitas, (c) alergi & tidak suka (opsional). Tulis penjelasan singkat: "Data ini hanya tersimpan di HP ini."
2. **Pilih profil aktif** (chip/avatar di atas) — mendukung multi-anak.
3. **Layar hasil:**
   - Bar progres: Energi, Protein, Serat, Zat Besi (+ Karbo/Lemak di Mode Remaja). Warna hijau/kuning lembut, teks positif.
   - Selector **"Porsi yang dimakan"** (Habis / ¾ / ½ / ¼) memperbarui hasil langsung.
   - Kartu **Rekomendasi di rumah** per slot (makan malam default; tab sarapan/selingan) berisi daftar URT dengan emoji + kalimat ringkas dari templat `04` §4.3.
   - **Peringatan alergi** pada menu bila relevan, plus toggle "Aku tidak makan bagian ini".
   - Disclaimer kecil: "Perkiraan untuk edukasi, bukan pengganti saran ahli gizi/dokter."
4. **Mode Anak (SD)**: satuan visual (centong, potong, mangkuk), ikon karakter makanan, kalimat 1–2 baris; orang tua mengisi profil (halaman profil dikunci oleh tombol "Untuk orang tua").
5. **Mode Remaja (SMP/SMA)**: rincian makronutrien, sorotan zat besi (khususnya perempuan ≥ 10 th, "mencegah anemia"), estimasi kalori aktivitas fisik (opsional, `04` §6).
6. **State khusus:** tidak ada menu hari ini → tampilkan menu hari kerja berikutnya; belum ada profil → arahkan ke onboarding; menu belum ada data jenjang → pesan ramah.

## Aturan UX Wajib
- Dilarang ada kata/label: "obesitas", "kurus", "gemuk", "stunting", "gizi buruk", "IMT".
- Hasil negatif tidak memakai merah; gunakan bahasa ajakan ("Yuk tambah…").
- Angka detail (gram/mg) disembunyikan di balik "Lihat rincian" pada Mode Anak.
- Semua teks bisa dibaca screen reader; progress bar punya `aria-valuenow`/label.
- Tombol & target sentuh ≥ 44px.

## Tugas Teknis
1. Hook `useTodayMenu(slug, level)` (TanStack Query) → tipe dari `hc`.
2. Hook `useGapResult(profile, menu, eaten)` memanggil fungsi `shared` dalam `useMemo`.
3. Ambil `household_foods` & `akg` dari endpoint referensi; simpan di cache Query untuk offline (disempurnakan di M7).
4. Komponen: `ProfileWizard`, `ProfileSwitcher`, `NutrientBar`, `EatenSelector`, `RecommendationCard`, `AllergyBanner`, `ChildModeView`, `TeenModeView`.
5. Uji komponen untuk skenario contoh di dokumen rancangan (defisit serat; alergi ayam/telur).

## Skill Desain (Wajib)
Untuk wizard profil, bar pemenuhan gizi, kartu rekomendasi, banner alergi, Mode Anak & Remaja, **panggil UI UX Pro Max dan Hallmark** sesuai alur di `02` §9: rujuk `design-system/MASTER.md`, bangun dengan Hallmark, terjemahkan ke React + Tailwind + shadcn/ui memakai token yang ada, lalu `hallmark audit`.
- Khusus milestone ini: override `kalkulator-anak` dan `kalkulator-remaja`; bar progres tanpa warna merah/peringatan keras; target sentuh ≥ 44px.
- Aturan produk di PRD (tanpa label status gizi, bahasa positif, kontras AA) menang bila bertentangan dengan saran skill.
- Simpan ringkasan audit di `docs/ui-audit/M5.md`. Jangan menghapus `.hallmark/log.json`.

## Kriteria Penerimaan
- [ ] UI UX Pro Max & Hallmark benar-benar dipanggil (bukti: laporan agent + `docs/ui-audit/M5.md`); `hallmark audit` tanpa temuan berat
- [ ] Profil terisi → hasil tampil < 1 dtk setelah menu dimuat
- [ ] Skenario "defisit serat" menghasilkan saran sayur + lauk nabati di makan malam
- [ ] Profil alergi telur → peringatan pada menu bertelur, dan **tidak ada** rekomendasi bertelur
- [ ] Mengubah "porsi dimakan" mengubah persen & rekomendasi sesuai
- [ ] Multi-profil: berganti anak mengubah target dan hasil
- [ ] Pencarian string UI (grep) tidak menemukan kata terlarang
- [ ] Bekerja di 360px; skor Accessibility Lighthouse ≥ 90
- [ ] Network: tidak ada pengiriman data profil

## Di Luar Cakupan
Tombol share WA (M6), service worker (M7).

## Prompt Siap Pakai
```text
Kerjakan M5. Gunakan HANYA fungsi dari packages/shared untuk perhitungan.
Terapkan aturan UX wajib (tanpa label status gizi). Mulai dari wizard profil,
lalu layar hasil, lalu mode Anak/Remaja. Berhenti dan tunjukkan ringkasan setelah tiap bagian.
WAJIB: panggil skill ui-ux-pro-max dan hallmark untuk semua UI (rujuk design-system/MASTER.md),
lalu jalankan hallmark audit dan tulis ringkasannya ke docs/ui-audit/M5.md.
```
