---

kanban-plugin: board

---

## Backlog

- [ ] [[prd-gizi-mbg/M5-kalkulator-rekomendasi-alergi|M5 — Kalkulator, Rekomendasi & Alergi]]
- [ ] [[prd-gizi-mbg/M6-generator-pesan-wa|M6 — Generator Pesan WA]]
- [ ] [[prd-gizi-mbg/M7-pwa-offline-first|M7 — PWA Offline-First]]
- [ ] [[prd-gizi-mbg/M8-polish-testing-deploy|M8 — Polish, Testing & Deploy]]
- [ ] [[prd-gizi-mbg/M9-opsional-gamifikasi-laporan|M9 — Opsional: Gamifikasi & Laporan]]


## In Progress



## Review / Verifikasi

- [ ] [[prd-gizi-mbg/M1-database-seed-auth|M1 — Database, Seed & Auth]] (`c4dbece`, `1b66c6d`; `db:migrate`, `db:seed` 2x, `typecheck`, `lint`, `build`, & seluruh test DB/auth/seed lolos; tinggal uji login di browser)
- [ ] [[prd-gizi-mbg/M2-dasbor-admin-menu-gizi|M2 — Dasbor Admin & Menu Gizi]] (`4196382`, `6e3f393`; `typecheck`, `lint`, `build`, `admin.test.ts` 6/6, `fun-fact.test.ts` 3/3, & audit UI lolos; form buat menu diperbarui berbasis daftar TKPI + ringkasan total gizi)
- [ ] [[prd-gizi-mbg/M3-menu-harian-publik-qr|M3 — Menu Harian Publik & QR]] (`5930f60`; `typecheck`, `lint`, `build`, `public.test.ts` 3/3, `date-timezone.test.ts` 3/3, & audit UI lolos; tinggal uji browser/Fast 3G/Mode Kelas/Lighthouse)
- [ ] [[prd-gizi-mbg/M4-profil-lokal-dan-gap-engine|M4 — Profil Lokal & Gap Engine]] (`6e3f393`; TDD `engine.test.ts` 14/14, `profiles.test.ts` 5/5, aturan privasi ESLint, `typecheck`, & `lint` lolos; tinggal uji manual `/dev/engine` & DevTools Network di browser)



## Done

- [x] Penyempurnaan input menu harian berbasis daftar TKPI (pengelompokan otomatis per kategori, ringkasan total gizi, hapus foto & fakta manual) & dukungan login username (`suadmin`/`admin`) (commit `6e3f393`)
- [x] Redesign & polish UI/UX 3D Claymorphism, 4 pose maskot, wordmark Baloo 2, container card lebar, & latar awan 3D (commit `ea77334`, `sloplint` 0 FAIL/0 REFLEX/0 WARN)
- [x] [[prd-gizi-mbg/M0-setup-monorepo|M0 — Setup Monorepo & Tooling]] (CI hijau, commit `6a8dab8`)
- [x] Setup `OmprengQ_Vault` & aturan wajib baca PRD (`AGENTS.md`)
- [x] Pasang skill agent UI UX Pro Max & Hallmark di `.agents/skills/`
- [x] Inisialisasi Git (`main`) & push README awal ke `origin`




%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false,false]}
```
%%
