# M0 — Setup Monorepo & Tooling

**Estimasi:** 0,5 hari · **Prasyarat:** Node 20+, pnpm, MySQL 8 lokal (Docker), Python 3 (untuk UI UX Pro Max) · **Baca:** 02 (terutama §9)

## Tujuan
Repo siap dipakai: web & API berjalan berdampingan, tipe dibagi lewat `packages/shared`, lint/test/typecheck berfungsi.

## Tugas
1. Inisialisasi monorepo pnpm sesuai struktur di `02` (`apps/web`, `apps/api`, `packages/shared`).
2. `tsconfig.base.json` dengan `strict: true`; tiap paket meng-extend.
3. **apps/web:** Vite + React + TS, Tailwind CSS, init **shadcn/ui** (tema netral, siapkan variabel warna yang nanti diganti), React Router, TanStack Query. Halaman placeholder `/` dan `/admin`.
4. **apps/api:** Hono + `@hono/node-server` + `tsx` untuk dev. Endpoint `GET /api/health` → `{ ok: true }`. Export `type AppType`.
5. **Proxy dev:** Vite meneruskan `/api` ke `localhost:3000`.
6. **RPC client:** `apps/web/src/lib/api.ts` memakai `hc<AppType>`; halaman `/` memanggil `/api/health` dan menampilkannya (bukti tipe end-to-end bekerja).
7. **packages/shared:** ekspor satu fungsi contoh + test Vitest.
8. ESLint, Prettier, Vitest; skrip root seperti di `02` bagian 7.
9. `docker-compose.yml` untuk **MySQL 8.4** lokal (database `omprengq`, user `omprengq`, charset `utf8mb4`, port 3306, volume data); `.env.example` dengan `DATABASE_URL=mysql://omprengq:omprengq@localhost:3306/omprengq`; `.gitignore`.
10. `AGENTS.md` berisi "Aturan Emas" dari `00`.
11. GitHub Actions sederhana: install → typecheck → lint → test.
12. **Pasang & verifikasi skill desain** (lihat `02` §9): UI UX Pro Max dan Hallmark terdaftar di agent. Jika agent tidak bisa memasangnya sendiri, minta saya (manusia) menjalankan perintah pemasangan lalu lanjutkan.
13. **Kunci design system:** panggil UI UX Pro Max untuk produk ini (edukasi gizi sekolah, ramah anak & remaja, PWA, hangat-segar, mudah dibaca) dan simpan ke `design-system/MASTER.md`; tambahkan override halaman untuk `admin`, `mode-kelas`, `kalkulator-anak`, `kalkulator-remaja` bila relevan.
14. **Panggil Hallmark** untuk menghasilkan `tokens.css` + entri `.hallmark/log.json`, lalu petakan token ke variabel tema shadcn di `apps/web/src/index.css` (warna, radius, font, spasi) dan Tailwind. Buat satu halaman `/dev/design` yang memperlihatkan token, tipografi, tombol, kartu, bar progres dalam 2 varian (Anak/Remaja).

## Kriteria Penerimaan
- [x] `pnpm install && pnpm dev` menjalankan web (5173) dan API (3000) sekaligus
- [x] Halaman `/` menampilkan hasil `/api/health` lewat `hc` (tanpa `fetch` manual)
- [x] Mengubah tipe respons di API langsung memunculkan error TypeScript di web
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test` lolos
- [x] `docker compose up -d` menyalakan MySQL 8.4; koneksi `mysql2` berhasil dengan `DATABASE_URL` di `.env.example`
- [x] `design-system/MASTER.md`, `apps/web/src/styles/tokens.css`, dan `.hallmark/log.json` ada di repo
- [x] Token terpetakan ke tema shadcn; `/dev/design` menampilkan varian Anak & Remaja
- [x] Laporan akhir agent menyebut skill apa yang dipanggil dan keluarannya (`docs/ui-audit/M0.md`)
- [x] CI hijau di GitHub (`6a8dab8`)

## Di Luar Cakupan
Skema DB, auth, fitur apa pun.

## Prompt Siap Pakai
```text
Kerjakan milestone M0 sesuai dokumen. Bangun monorepo pnpm dengan struktur di 02.
Pastikan impor `AppType` dari apps/api ke apps/web hanya bertipe (import type).
Tampilkan di akhir: struktur folder, perintah menjalankan, dan hasil typecheck/lint/test.
```
