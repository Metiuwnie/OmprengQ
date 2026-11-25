# 00 — Panduan Penggunaan Paket PRD (Vibecoding)

**Proyek:** Web/PWA Edukasi Gizi Harian & Kalkulator Porsi Personal MBG
**Sumber:** `Rancangan_Sistem_PWA_Edukasi_Gizi_MBG.docx`

Paket ini dibuat agar bisa disuapkan ke AI coding agent (Claude Code, Cursor, Copilot, dsb.) **satu file per sesi**, supaya konteks kecil dan hasil bisa diverifikasi per langkah.

## Daftar File & Urutan Pengerjaan

| # | File | Isi | Wajib dibaca AI di setiap sesi? |
|---|------|-----|-----|
| 01 | `01-PRD-overview-dan-analisis.md` | Visi, persona, ruang lingkup, analisis rancangan, keputusan desain | Ya (ringkas) |
| 02 | `02-tech-stack-dan-arsitektur.md` | Stack final (Hono + Drizzle + **MySQL**), struktur monorepo, konvensi, **§9 skill desain frontend** | **Ya** |
| 03 | `03-data-model-dan-api-spec.md` | Skema DB Drizzle, endpoint API, kontrak data | **Ya** |
| 04 | `04-spesifikasi-rumus-gizi.md` | Rumus AKG, BMR, selisih gizi, algoritma rekomendasi | Saat M4–M5 |
| M0 | `M0-setup-monorepo.md` | Inisialisasi repo, tooling, CI dasar | |
| M1 | `M1-database-seed-auth.md` | Drizzle, migrasi, seed TKPI/AKG, auth admin | |
| M2 | `M2-dasbor-admin-menu-gizi.md` | CRUD sekolah, bahan, menu, kalkulasi gizi otomatis | |
| M3 | `M3-menu-harian-publik-qr.md` | Halaman publik, QR dinamis, mode presentasi guru | |
| M4 | `M4-profil-lokal-dan-gap-engine.md` | Paket `shared` mesin gizi + profil localStorage multi-profil | |
| M5 | `M5-kalkulator-rekomendasi-alergi.md` | UI kalkulator, bar pemenuhan, rekomendasi TRT, alergi | |
| M6 | `M6-generator-pesan-wa.md` | Tombol share WA, OG preview | |
| M7 | `M7-pwa-offline-first.md` | Service worker, cache, install prompt | |
| M8 | `M8-polish-testing-deploy.md` | UX anak/remaja, a11y, uji, deploy | |
| M9 | `M9-opsional-gamifikasi-laporan.md` | Gamifikasi & modul laporan (opsional, nilai tambah lomba) | |

> Urutan M0 → M8 adalah jalur utama (MVP lengkap). M3 dan M4 bisa dikerjakan paralel setelah M2 selesai. M9 hanya jika waktu cukup.

## Cara Memakai di Setiap Sesi Vibecoding

1. Mulai sesi baru. Lampirkan **02, 03**, ditambah file milestone yang sedang dikerjakan (dan 04 bila perlu).
2. Gunakan prompt pembuka ini:

```text
Kamu adalah senior fullstack engineer. Baca dokumen terlampir.
Kerjakan HANYA milestone <Mx>. Jangan mengerjakan milestone lain.
Ikuti struktur folder & konvensi di 02, skema di 03.
Sebelum menulis kode, tuliskan rencana singkat (file yang akan dibuat/diubah).
Setelah selesai, jalankan typecheck, lint, dan test, lalu cocokkan dengan
bagian "Kriteria Penerimaan" dan laporkan mana yang sudah/belum terpenuhi.
Jika ada ambiguitas, ajukan pertanyaan maksimal 3 sebelum mulai.
Untuk milestone berUI: panggil skill ui-ux-pro-max dan hallmark (lihat 02 §9),
laporkan skill yang dipanggil dan hasil hallmark audit.
```

3. **Prasyarat sekali:** pasang skill desain sesuai `02` §9 sebelum memulai M0 (Python 3 diperlukan UI UX Pro Max).
4. Setelah AI selesai: jalankan sendiri aplikasi, centang **Kriteria Penerimaan** satu per satu, lalu `git commit` dengan pesan `feat(Mx): ...`.
5. Jangan lanjut ke milestone berikutnya sebelum semua kriteria wajib lolos.

## Aturan Emas untuk AI Agent (tempel di file `CLAUDE.md` / `.cursorrules`)

- TypeScript `strict: true`. Dilarang `any` tanpa komentar alasan.
- Semua validasi input memakai **Zod**; skema dibagi lewat `packages/shared`.
- Logika perhitungan gizi hanya boleh ada di `packages/shared` (satu sumber kebenaran, dipakai server **dan** klien offline).
- Data biologis anak **tidak boleh** dikirim ke server (hanya localStorage). Jangan tambahkan analytics/telemetri yang membawa data profil.
- Dilarang menampilkan label status gizi ("obesitas", "kurus", "stunting", dll.) di UI siswa.
- Teks UI dalam Bahasa Indonesia; kode, nama variabel, dan komentar teknis dalam Bahasa Inggris.
- **Database MySQL:** impor dari `drizzle-orm/mysql-core`; ikuti catatan MySQL di `03` §2 (tanpa array/`.returning()`, JSON tanpa default literal).
- **Frontend wajib memakai skill UI UX Pro Max + Hallmark** (alur di `02` §9): design system di `design-system/MASTER.md`, token dari Hallmark, `hallmark audit` sebelum milestone dinyatakan selesai. Jangan membuat gaya visual di luar design system.
- Setiap fitur baru diberi test minimal untuk logika inti (Vitest).
- Jangan menambah dependensi baru tanpa menyebut alasannya.

## Definisi Selesai (Definition of Done) Umum

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` lolos
- [ ] Semua Kriteria Penerimaan milestone terpenuhi
- [ ] Tidak ada secret di repo (`.env` di-ignore, `.env.example` diperbarui)
- [ ] Tampilan dicek di lebar 360px (ponsel) dan 1280px (desktop)
- [ ] Untuk milestone berUI: skill UI UX Pro Max & Hallmark terbukti dipakai (`docs/ui-audit/Mx.md`)
- [ ] Commit rapi dengan pesan konvensional
