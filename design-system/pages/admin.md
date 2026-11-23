# Page Override: Admin (`/admin/*`)

Merujuk ke [MASTER.md](../MASTER.md) dengan penyesuaian khusus dasbor operasional SPPG & sekolah:
- **Kepadatan:** Lebih padat dan mudah dipindai (`--density: 8`), tetap menggunakan token warna dari `tokens.css`.
- **Tipografi & Tabel:** Angka gizi (`kkal`, `g`, `mg`) menggunakan `font-variant-numeric: tabular-nums`.
- **Kontrol:** Form input menu dan bahan tetap mempertahankan label eksplisit (`htmlFor`), validasi Zod di dekat field, dan target sentuh >= 44px untuk penggunaan di tablet/HP admin.
