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

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#4F46E5` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#818CF8` | `--color-secondary` |
| On Secondary | `#0F172A` | `--color-on-secondary` |
| Accent/CTA | `#EA580C` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#EEF2FF` | `--color-background` |
| Foreground | `#1E1B4B` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#1E1B4B` | `--color-card-foreground` |
| Muted | `#EBEEF8` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#C7D2FE` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#4F46E5` | `--color-ring` |

*Notes: Playful indigo + energetic orange [Accent adjusted from #F97316].*

### Typography
- **Heading:** Baloo 2
- **Body:** Comic Neue
- **Mood:** kids, education, playful, friendly, colorful, learning
- **Best For:** Children's apps, educational games, kid-friendly content
- **Google Fonts:** `https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Comic+Neue:wght@300;400;700&display=swap`

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
