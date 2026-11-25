# Audit UI — Claymorphism Redesign & Polish UI/UX

## 1. Ringkasan Redesign (`mode: redesign`, `depth: full`, `scope: app`)

- **Gaya Visual:** **3D Claymorphism** penuh di atas kanvas langit pastel (`.clay-sky-canvas`, `--color-paper`) dengan pinggiran cahaya kartu (`--clay-rim`) dan sistem bayangan berlapis (`--shadow-clay-card`, `--shadow-clay-elevated`, `--shadow-clay-inset`, `--shadow-clay-pill`, `--shadow-clay-primary`, `--shadow-clay-accent`).
- **Wordmark & Tipografi Brand:**
  - Logo teks **OmprengQ** (`Ompreng` + `Q` hijau daun) memakai font `Baloo 2` (`--font-logo`) di [brand-logo.tsx](../../apps/web/src/components/brand-logo.tsx).
- **Empat Pose Maskot 3D Clay (`apps/web/public/mascots/`):**
  - `mascot-sayur.png` (`538×560`, `417 KB`) — pose menyapa
  - `mascot-sayur-tanya.png` (`538×560`, `413 KB`) — pose berpikir dengan tanda tanya (background hitam dihapus bersih via flood-fill + anti-fringe alpha)
  - `mascot-ayam.png` (`511×560`, `271 KB`) — pose menyapa
  - `mascot-ayam-ompreng.png` (`511×560`, `297 KB`) — pose membawa ompreng makan bergizi (background hitam dihapus bersih via flood-fill + anti-fringe alpha)
- **Tata Letak, Container Card & Latar Awan 3D:**
  - **Latar Awan & Bukit Clay ([clay-sky-decor.tsx](../../apps/web/src/components/clay-sky-decor.tsx), [index.css](../../apps/web/src/index.css)):** Gugusan awan putih 3D claymorphism, matahari hangat (`.clay-sun`), dan siluet bukit pastel (`.clay-hill-mint`, `.clay-hill-sky`) dengan animasi halus `.clay-drift` / `.clay-drift-slow` yang tunduk pada `prefers-reduced-motion`.
  - **Login ([admin-login.tsx](../../apps/web/src/routes/admin-login.tsx)):** Bar navigasi `.clay-card` di atas (`BrandLogo` + `← Beranda`), stage login terangkat rapi (`items-start pt-6 sm:pt-10 lg:pt-12`), kartu login clay tunggal di tengah dengan dua maskot (`mascot-sayur.png` & `mascot-ayam-ompreng.png`) di tepi atas, di atas latar `<ClaySkyDecor />`.
  - **Beranda ([home.tsx](../../apps/web/src/routes/home.tsx)):** Container lebar `max-w-7xl`, kolom hero kiri dibungkus `.clay-card` sejajar tinggi dengan kartu Sekolah Demo (`mascot-ayam-ompreng.png`), `mascot-sayur.png` di footer, dan latar `<ClaySkyDecor />`.
  - **Dashboard & Admin ([admin.tsx](../../apps/web/src/routes/admin.tsx), [admin-menus.tsx](../../apps/web/src/routes/admin-menus.tsx), [admin-menu-editor.tsx](../../apps/web/src/routes/admin-menu-editor.tsx), [admin-schools.tsx](../../apps/web/src/routes/admin-schools.tsx), [admin-foods.tsx](../../apps/web/src/routes/admin-foods.tsx), [admin-sppg.tsx](../../apps/web/src/routes/admin-sppg.tsx), [portion-editor.tsx](../../apps/web/src/features/admin/components/portion-editor.tsx)):** Layout full-width (`w-full`) sejajar dengan topbar `AdminLayout`, header/filter/tabel/kalender/kartu status dibungkus `.clay-card`, serta select memakai `shadow-[var(--shadow-clay-inset)]`.
  - **Menu Publik & Mode Kelas ([public-today.tsx](../../apps/web/src/routes/public-today.tsx), [public-week.tsx](../../apps/web/src/routes/public-week.tsx), [presentation-view.tsx](../../apps/web/src/features/public/components/presentation-view.tsx)):** Container lebar `max-w-7xl`, bagian *Isi Piringku Hari Ini* (Mode Anak) dibungkus `.clay-card` dengan `.clay-well` 3 kolom (`lg:grid-cols-3`), komposisi & ringkasan gizi Mode Remaja berdampingan di desktop, jadwal mingguan 2 kolom (`md:grid-cols-2`), serta distribusi `mascot-ayam-ompreng.png`, `mascot-sayur-tanya.png`, dan `mascot-ayam.png`.
  - **Kalkulator Placeholder ([calculator-placeholder.tsx](../../apps/web/src/routes/calculator-placeholder.tsx)) & Showcase ([dev-design.tsx](../../apps/web/src/routes/dev-design.tsx)):** Diperlebar ke `max-w-3xl` dan `max-w-7xl`, dengan galeri 4 pose maskot di `/dev/design`.

## 2. Hasil Verifikasi & Audit Hallmark

- **Hallmark `sloplint`:** `0 FAIL, 0 REFLEX, 0 WARN` pada seluruh file yang disentuh (`--scope app --genre playful`).
- **Build & Test:** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm --filter @mbg/shared test` (9/9 lolos), dan `pnpm --filter @mbg/web test` (6/6 lolos). *(Pemeriksaan visual browser interaktif dilakukan manual pada preview lokal.)*

## 3. Kepatuhan Prinsip PRD

- **Terminologi & Konten:** `0` kemunculan `Dasbor`/`dasbor`; `0` label status gizi terlarang (`obesitas`, `kurus`, `gemuk`, `stunting`, `gizi buruk`, `IMT`).
- **Aksesibilitas & Wiring:** Target sentuh >= 44px, `:focus-visible`, `prefers-reduced-motion`, dan seluruh rute/form/API tetap berfungsi penuh.
