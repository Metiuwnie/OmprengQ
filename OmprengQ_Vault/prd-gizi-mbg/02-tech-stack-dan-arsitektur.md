# 02 — Tech Stack & Arsitektur

## 1. Keputusan Stack

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Package manager | **pnpm** (workspaces) | Monorepo |
| Frontend | Vite + React 18/19 + TypeScript | SPA + PWA |
| UI | Tailwind CSS + shadcn/ui | Komponen disalin ke repo |
| Skill desain (agent) | **UI UX Pro Max** + **Hallmark** | Wajib dipakai untuk semua pekerjaan frontend (bagian 9) |
| Routing | React Router (mode library) | Sederhana, banyak referensi |
| Data fetching | TanStack Query + Hono RPC client (`hc`) | Tipe end-to-end |
| Form | react-hook-form + Zod resolver | |
| State lokal | Zustand + middleware `persist` (localStorage) | Profil anak |
| PWA | `vite-plugin-pwa` (Workbox) | M7 |
| QR | `qrcode` (generate PNG/SVG) | |
| Backend | Node.js 20+ + **Hono** + `@hono/node-server` | TypeScript |
| Validasi | Zod + `@hono/zod-validator` | Skema di `packages/shared` |
| ORM | **Drizzle ORM** + `drizzle-kit` | |
| Database | **MySQL 8.x** (driver `mysql2`) | Hosting: Railway MySQL / Aiven / TiDB Cloud (kompatibel MySQL) |
| Auth admin | Cookie httpOnly + JWT (`hono/jwt`) + hash `argon2` | Tanpa library auth berat |
| Test | Vitest (unit), Playwright (E2E ringan di M8) | |
| Lint/format | ESLint + Prettier | |
| Deploy | 1 service Node (Hono menyajikan API + hasil build web) + MySQL | Lihat bagian 4 |

## 2. Jawaban: Apakah Hono dan Drizzle Tepat/Perlu?

### Hono — **Ya, direkomendasikan**
- Ringan, TypeScript-first, validator Zod bawaan ekosistemnya.
- **RPC client (`hc`)**: frontend memanggil API dengan tipe otomatis dari backend. Ini sangat membantu vibecoding karena AI mendapat umpan balik kompilator, bukan menebak bentuk JSON.
- Berbasis Web Standard; mudah dipindah ke Cloudflare Workers/Bun bila suatu hari dibutuhkan.
- Alternatif: **Express** (paling banyak contoh, tetapi tipe lemah) dan **Fastify** (lebih berat). Untuk proyek ini, Hono lebih sedikit kode dan lebih aman bertipe.

### Drizzle — **Ya, dipakai** (data ini relasional)
Data proyek ini jelas relasional: SPPG → sekolah → menu → bahan → nilai gizi, plus tabel referensi TKPI/AKG. ORM dibutuhkan untuk:
- Skema bertipe + **migrasi** yang bisa direproduksi (`drizzle-kit`), penting saat deploy.
- Query bertipe tanpa menulis SQL mentah berulang; tetap bisa SQL bila perlu.
- Drizzle sangat tipis dan dekat SQL, sehingga mudah dibaca AI maupun manusia. Alternatif **Prisma** lebih "ramah pemula" tetapi lebih berat dan butuh langkah generate tambahan.

> Keputusan final: **Hono + Drizzle + MySQL** (revisi dari rencana awal PostgreSQL). Drizzle mendukung MySQL penuh lewat `drizzle-orm/mysql-core` + `mysql2`. Perbedaan penting dibanding PostgreSQL (tanpa tipe array, tanpa `.returning()`, JSON tanpa default literal, `decimal` kembali sebagai string) sudah diakomodasi di skema `03` — AI agent wajib mengikuti catatan MySQL di sana.

## 3. Struktur Monorepo

```text
omprengq/
├─ apps/
│  ├─ api/                    # Hono server
│  │  ├─ src/
│  │  │  ├─ index.ts          # entry: serve API + static web (produksi)
│  │  │  ├─ app.ts            # inisialisasi Hono, export type AppType
│  │  │  ├─ db/
│  │  │  │  ├─ client.ts
│  │  │  │  ├─ schema/        # satu file per domain (users.ts, foods.ts, menus.ts, ...)
│  │  │  │  └─ seed/          # data TKPI, AKG, household_foods (JSON/CSV)
│  │  │  ├─ routes/           # auth.ts, schools.ts, foods.ts, menus.ts, public.ts, og.ts
│  │  │  ├─ middleware/       # auth.ts, rbac.ts, error.ts
│  │  │  └─ services/         # menu-nutrition.ts, qr.ts
│  │  ├─ drizzle.config.ts
│  │  └─ package.json
│  └─ web/                    # Vite + React
│     ├─ src/
│     │  ├─ main.tsx
│     │  ├─ routes/           # halaman (admin/*, public/*, calculator/*)
│     │  ├─ components/ui/    # shadcn
│     │  ├─ components/       # komponen domain
│     │  ├─ features/         # admin, menu, profile, calculator, share
│     │  ├─ lib/              # api client (hc), utils
│     │  └─ stores/           # zustand (profiles)
│     ├─ public/              # ikon PWA, ilustrasi
│     └─ vite.config.ts
├─ packages/
│  └─ shared/                 # dipakai api & web
│     └─ src/
│        ├─ schemas/          # Zod (menu, profile, ...)
│        ├─ nutrition/        # engine: BMR, AKG, gap, rekomendasi (murni, tanpa I/O)
│        ├─ constants/        # jenjang, nutrien, alergen, PAL
│        └─ index.ts
├─ docs/prd/                  # semua file PRD ini
├─ .env.example
├─ pnpm-workspace.yaml
├─ package.json
├─ tsconfig.base.json
└─ CLAUDE.md                  # aturan emas AI (lihat 00)
```

## 4. Arsitektur Runtime

```text
Browser (PWA, React)
  ├─ Rute publik (tanpa login): /s/:slug/hari-ini, /kalkulator
  │     ├─ GET /api/public/... (data menu + gizi)    ← di-cache Service Worker
  │     └─ Mesin gizi (packages/shared) jalan DI BROWSER; profil di localStorage
  └─ Rute admin (login): /admin/*  ──▶ /api/admin/* (cookie httpOnly)

Hono (Node) ── Drizzle (mysql2) ──▶ MySQL
  └─ Produksi: juga menyajikan apps/web/dist (satu origin, tanpa CORS) + HTML Open Graph
```

**Prinsip arsitektur penting:**
1. Server **tidak pernah menerima** data profil anak. Endpoint publik hanya mengembalikan data menu & gizi per porsi.
2. Mesin gizi berada di `packages/shared` dan dipanggil dari klien; server memakainya hanya untuk menghitung total gizi menu (M2).
3. Satu origin di produksi (Hono menyajikan file statis) → cookie aman, tanpa konfigurasi CORS rumit. Saat dev: Vite proxy `/api` ke Hono.
4. Zona waktu: "hari ini" ditentukan **server** berdasarkan `school.timezone`, bukan jam perangkat.

## 5. Konvensi Kode

- ESM murni; path alias `@mbg/shared`, `@mbg/api` (hanya impor **type** `AppType`).
- Satuan gizi selalu: energi **kkal**, makro **gram**, zat besi **mg**; nilai per 100 g di database; hitung dengan `desimal secukupnya`, bulatkan hanya saat tampil.
- Respons error API seragam: `{ error: { code: string, message: string } }`.
- Id memakai UUID string `varchar(36)` yang dibuat di aplikasi (`crypto.randomUUID()`), atau `int autoincrement` untuk tabel referensi kecil (`akg_reference`).
- Waktu audit disimpan UTC (`timestamp`, koneksi `timezone: "Z"`); tanggal menu bertipe `date` mode string (`YYYY-MM-DD`).
- Drizzle MySQL tidak punya `.returning()`: insert dengan id buatan aplikasi lalu `select` ulang.
- Nama komit: `feat(M2): ...`, `fix(M3): ...`.
- Tidak ada logika bisnis di komponen React; letakkan di `features/*/lib` atau `shared`.

## 6. Variabel Lingkungan (`.env.example`)

```bash
DATABASE_URL=mysql://omprengq:omprengq@localhost:3306/omprengq
JWT_SECRET=ganti-dengan-string-acak-panjang
COOKIE_SECURE=false            # true di produksi
APP_BASE_URL=http://localhost:5173
PORT=3000
# Opsional (foto menu, M2)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

## 7. Skrip Root `package.json`

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint .",
    "test": "pnpm -r test",
    "db:generate": "pnpm --filter api drizzle-kit generate",
    "db:migrate": "pnpm --filter api drizzle-kit migrate",
    "db:seed": "pnpm --filter api tsx src/db/seed/index.ts"
  }
}
```

## 8. Rencana Deploy (dikerjakan di M8)

- **Opsi A (disarankan):** 1 service di Railway/Render/Fly + MySQL terkelola (Railway MySQL/Aiven/TiDB Cloud; aktifkan SSL bila diwajibkan penyedia). Build web, lalu Hono menyajikan `dist`.
- **Opsi B:** web di Vercel/Netlify + API terpisah → perlu CORS dan cookie `SameSite=None; Secure`. Lebih rumit; hindari kecuali perlu.
- Wajib HTTPS (syarat PWA & service worker).

## 9. Skill Agent Desain Frontend (WAJIB untuk semua UI)

Dua skill dipakai bersama dan **harus benar-benar dipanggil** oleh AI agent pada setiap pekerjaan frontend (bukan sekadar disebut). Keduanya bekerja di Claude Code, Cursor, dan Codex.

| Skill | Peran di proyek ini | Sumber |
|---|---|---|
| **UI UX Pro Max** | *Strategi*: menentukan & menyimpan **design system** (gaya, palet, pasangan font, aturan UX, panduan per stack React). Dijalankan **sekali di awal (M0)**, lalu dirujuk di tiap milestone. | `nextlevelbuilder/ui-ux-pro-max-skill` (butuh Python 3) |
| **Hallmark** | *Eksekusi & kontrol mutu*: membangun UI baru dengan aturan anti-tampilan-generik, mengeluarkan `tokens.css`, mencatat keputusan di `.hallmark/log.json`, dan **mengaudit** hasil (`audit`). | `nutlope/hallmark` |

### Pemasangan (sekali, di mesin Anda)

```bash
# UI UX Pro Max — Claude Code
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
# alternatif CLI: npm i -g ui-ux-pro-max-cli  →  uipro init --ai claude   (di folder proyek)

# Hallmark — salah satu cara
npx skills add nutlope/hallmark -g --agent claude-code
# atau sebagai plugin Claude Code:
/plugin marketplace add nutlope/hallmark
/plugin install hallmark@hallmark
```
Cek: mulai sesi baru → kedua skill muncul di daftar skill. Hallmark dipanggil dengan `/hallmark ...` (atau `/hallmark:hallmark` bila dipasang sebagai plugin). *Perintah dapat berubah mengikuti versi; jika gagal, ikuti README repo masing-masing.*

### Alur Kerja Wajib untuk Frontend

1. **Kunci design system (M0, sekali):** jalankan UI UX Pro Max untuk produk "edukasi gizi sekolah ramah anak & remaja, PWA, nuansa hangat-segar", simpan hasilnya (`--design-system --persist`) menjadi **`design-system/MASTER.md`**. Untuk halaman bermuatan khusus (mode kelas, kalkulator, admin) buat override per halaman (`--page`).
2. **Bangun UI dengan Hallmark:** setiap layar/komponen baru dibuat lewat Hallmark dengan merujuk `design-system/MASTER.md`. Hallmark menulis `tokens.css` dan log keputusan (`.hallmark/log.json`) — **jangan dihapus**.
3. **Terjemahkan ke stack kita:** keluaran Hallmark berorientasi HTML/CSS; agent wajib menerjemahkannya menjadi komponen **React + Tailwind + shadcn/ui**, dengan token (warna, radius, font, spasi) dipetakan ke variabel CSS tema shadcn (`apps/web/src/index.css`). Jangan menduplikasi nilai warna secara manual di komponen.
4. **Audit sebelum selesai:** jalankan `hallmark audit` pada kode UI yang baru dan perbaiki temuan; cocokkan juga dengan checklist UX/aksesibilitas dari UI UX Pro Max (`--stack react`).
5. **Laporkan bukti** di akhir sesi: skill apa yang dipanggil, file yang dihasilkan, ringkasan hasil audit.

### Aturan Prioritas bila Ada Konflik

1. **Aturan produk di PRD ini menang** (terutama: tanpa label status gizi, bahasa positif, target sentuh ≥ 44px, kontras WCAG AA, ringan di HP kelas bawah).
2. Lalu `design-system/MASTER.md` (UI UX Pro Max).
3. Lalu saran gaya Hallmark. Tema yang mencolok/animasi berat **tidak boleh** mengorbankan performa atau keterbacaan (mode kelas).
4. Mode Anak dan Mode Remaja boleh memakai varian tema berbeda **di dalam satu design system yang sama** (token yang sama, nilai berbeda).

### Berkas Bukti yang Harus Ada di Repo

```text
design-system/MASTER.md          # dari UI UX Pro Max
design-system/pages/*.md         # override per halaman (jika ada)
apps/web/src/styles/tokens.css   # dari Hallmark (disalin/dipetakan ke tema shadcn)
.hallmark/log.json               # catatan keputusan Hallmark
docs/ui-audit/Mx.md              # ringkasan audit tiap milestone berUI
```
