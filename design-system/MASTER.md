## Design System: OmprengQ

> Dihasilkan oleh **UI UX Pro Max** (`search.py --design-system`) untuk produk edukasi gizi sekolah ramah anak & remaja, PWA, hangat-segar, dan mudah dibaca.

### Pattern
- **Name:** Feature-Rich Showcase
- **Conversion Focus:** Clear feature hierarchy. One key message per card. Strong CTA repetition.
- **CTA Placement:** Hero (sticky) + After features + Bottom
- **Color Strategy:** Brand primary + card bg `#FAFAFA`. Feature icons accent. CTA contrasting.
- **Sections:** Hero (value prop) > Feature grid/cards (4-6) > Use cases or benefits > Social proof or logos > CTA

### Style
- **Name:** Claymorphism
- **Mode Support:** Light supported | Dark conditional, avoid for this product
- **Keywords:** Soft 3D, chunky, playful, toy-like, bubbly, thick borders (3-4px), double shadows, rounded (16-24px)
- **Best For:** Educational apps, children's apps, SaaS platforms, creative tools, fun-focused, onboarding, casual games
- **Performance:** cost:low | drivers:none
- **Accessibility:** requires contrast-text-4.5, keyboard, visible-focus, reduced-motion

### Colors & Claymorphism Palette (diselaraskan dengan maskot 3D & referensi)
Seluruh warna didefinisikan lewat token OKLCH di `apps/web/src/styles/tokens.css` dan dipetakan di `apps/web/src/index.css`:
- **Kanvas Langit Pastel (`--color-paper`):** `oklch(95% 0.026 238)` — lembut, terang, kontras tinggi untuk kartu putih clay.
- **Permukaan Kartu Clay (`--color-card` + `--clay-rim`):** `oklch(99.6% 0.004 240)` dengan pinggiran cahaya `2px` dan `--shadow-clay-card` (bayangan luar lembut + bevel dalam atas/bawah).
- **Primary Leaf Green (`--color-accent-2`):** `oklch(50% 0.16 148)` (teks putih, kontras >= 4.5:1) untuk aksi utama dan item navigasi aktif.
- **Accent Sunny Gold (`--color-accent`):** `oklch(86% 0.175 88)` untuk badge, ikon utama, dan sorotan hangat.
- **Secondary Coral Berry (`--color-coral`):** `oklch(60% 0.195 22)` & **Mint (`--color-mint`):** `oklch(88% 0.105 148)` untuk pembeda kartu gizi dan status positif.
- **Maskot Resmi 3D Clay:** `/mascots/mascot-sayur.png` dan `/mascots/mascot-ayam.png` (`apps/web/public/mascots/`).

### Typography
- **Heading (Mode Anak & Publik):** `Baloo 2` (500, 600, 700)
- **Body & Surface Admin (`[data-surface="admin"]` / `[data-theme="remaja"]`):** `Plus Jakarta Sans` (400, 500, 600, 700)
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`

### Key Effects & Dual-Theme Adaptation (PRD `02` §9)
- Inner+outer shadows (subtle, no hard lines), soft press (200ms ease-out), fluffy elements, smooth transitions.
- **Mode Anak (`data-theme="anak"`):** Lebih hangat dan bulat (`--radius-card: 24px`, `--radius-stock: 16px`), tipografi ramah anak, target sentuh minimal `44px × 44px`.
- **Mode Remaja (`data-theme="remaja"`):** Lebih tenang dan ringkas (`--radius-card: 16px`, `--radius-stock: 12px`), tetap memakai kumpulan token CSS yang sama.

### Avoid (Anti-patterns)
- Dark modes (hindari untuk produk edukasi anak/kelas)
- Complex jargon & label status gizi ("obesitas", "kurus", "stunting") — aturan PRD `01` §6
- Emoji sebagai ikon (gunakan SVG dari Lucide)
- Warna hex literal di komponen (wajib lewat token CSS / variabel shadcn)

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms), tanpa `transition: all`
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible (`:focus-visible`) for keyboard nav
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: `360px` (ponsel) dan `1280px` (desktop)
