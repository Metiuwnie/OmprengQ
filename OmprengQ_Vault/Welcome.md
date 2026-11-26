# OmprengQ Vault

> [!IMPORTANT]
> Semua pengembangan sistem **OmprengQ** (Web/PWA Edukasi Gizi Harian & Kalkulator Porsi Personal MBG) **wajib** mengacu pada dokumen PRD di bawah ini.

## Pelacakan Progres

- [[Kanban-OmprengQ|Papan Kanban Progres OmprengQ]]
- **Status saat ini:**
  - **Done:** `M0 — Setup Monorepo & Tooling` (CI hijau `6a8dab8`) + Redesign & polish UI/UX 3D Claymorphism (`ea77334`) + Penyempurnaan input menu harian TKPI & login username (`6e3f393`)
  - **Review / Verifikasi:** `M1`, `M2`, `M3`, `M4` (seluruh unit test `@mbg/shared` 23/23, `@mbg/web` 14/14, `typecheck`, & `lint` lolos; tinggal cek manual browser/DevTools/Lighthouse)
  - **Backlog:** `M5` – `M9` (berikutnya: `M5 — Kalkulator, Rekomendasi & Alergi`)

## Panduan & Dokumen Inti

- [[prd-gizi-mbg/00-README-panduan-vibecoding|00 — Panduan Penggunaan Paket PRD (Vibecoding)]]
- [[prd-gizi-mbg/01-PRD-overview-dan-analisis|01 — PRD Overview dan Analisis]]
- [[prd-gizi-mbg/02-tech-stack-dan-arsitektur|02 — Tech Stack dan Arsitektur]] *(wajib dibaca di setiap sesi)*
- [[prd-gizi-mbg/03-data-model-dan-api-spec|03 — Data Model dan API Spec]] *(wajib dibaca di setiap sesi)*
- [[prd-gizi-mbg/04-spesifikasi-rumus-gizi|04 — Spesifikasi Rumus Gizi]] *(wajib saat M4–M5)*

## Milestone Pengembangan

Urutan jalur utama MVP: `M0` → `M8` (`M3` dan `M4` dapat dikerjakan paralel setelah `M2` selesai; `M9` bersifat opsional).

- [[prd-gizi-mbg/M0-setup-monorepo|M0 — Setup Monorepo]]
- [[prd-gizi-mbg/M1-database-seed-auth|M1 — Database, Seed & Auth]]
- [[prd-gizi-mbg/M2-dasbor-admin-menu-gizi|M2 — Dasbor Admin & Menu Gizi]]
- [[prd-gizi-mbg/M3-menu-harian-publik-qr|M3 — Menu Harian Publik & QR]]
- [[prd-gizi-mbg/M4-profil-lokal-dan-gap-engine|M4 — Profil Lokal & Gap Engine]]
- [[prd-gizi-mbg/M5-kalkulator-rekomendasi-alergi|M5 — Kalkulator, Rekomendasi & Alergi]]
- [[prd-gizi-mbg/M6-generator-pesan-wa|M6 — Generator Pesan WA]]
- [[prd-gizi-mbg/M7-pwa-offline-first|M7 — PWA Offline-First]]
- [[prd-gizi-mbg/M8-polish-testing-deploy|M8 — Polish, Testing & Deploy]]
- [[prd-gizi-mbg/M9-opsional-gamifikasi-laporan|M9 — Opsional: Gamifikasi & Laporan]]
