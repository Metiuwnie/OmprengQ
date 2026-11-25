# 03 — Data Model & API Spec

## 1. Entitas Utama (ringkas)

```text
sppg 1─* school
sppg 1─* menu (per tanggal)            menu 1─* menu_portion (per jenjang)
menu_portion 1─* menu_item ─▶ food (TKPI)
school 1─* school_menu_override (opsional)
user (admin) ─▶ sppg / school (sesuai peran)
akg_reference (referensi AKG per usia & jenis kelamin)
household_foods (pangan URT untuk rekomendasi)
```

## 2. Skema Drizzle untuk MySQL (acuan; AI boleh menyesuaikan nama selama relasi sama)

**Catatan khusus MySQL (WAJIB diikuti AI agent):**
- Impor dari `drizzle-orm/mysql-core` (bukan `pg-core`); driver `mysql2`; `drizzle.config.ts` memakai `dialect: "mysql"`.
- **Tidak ada tipe array** → kolom daftar (alergen, jenjang, slot makan) memakai `json(...).$type<...>()`. Penyaringan alergen dilakukan di kode aplikasi, bukan SQL.
- **JSON/TEXT tidak boleh punya default literal** di MySQL → gunakan `.$defaultFn(() => [])`.
- **Tidak ada `.returning()`** di Drizzle MySQL. Buat `id` di sisi aplikasi (`crypto.randomUUID()`), `insert`, lalu `select` berdasarkan id tersebut.
- Id berupa `varchar(36)` (UUID string). Kolom kunci asing harus bertipe sama (`varchar(36)`).
- Enum memakai `mysqlEnum` per kolom; daftar nilainya diambil dari konstanta di `packages/shared` agar satu sumber.
- `decimal` dari `mysql2` kembali sebagai string. Gunakan `{ mode: "number" }` bila didukung versi Drizzle yang terpasang; bila tidak, konversi dengan `Number()` di lapisan service.
- Tanggal menu: `date("date", { mode: "string" })` (format `YYYY-MM-DD`, bebas masalah zona waktu). Waktu audit: `timestamp` disimpan UTC; set koneksi `timezone: "Z"`.
- Charset `utf8mb4`. Kolom unik `email`/`slug` dinormalisasi huruf kecil di aplikasi (kolasi bawaan MySQL tidak membedakan huruf besar/kecil).
- Seed idempoten memakai `onDuplicateKeyUpdate`.

```ts
// apps/api/src/db/schema/*.ts  (disederhanakan)
import {
  mysqlTable, mysqlEnum, varchar, text, int, decimal, date, timestamp,
  boolean, json, uniqueIndex,
} from "drizzle-orm/mysql-core";
import { LEVELS, ROLES, type Level, type Allergen, type NutrientTotals } from "@mbg/shared";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID());
const num = (name: string, scale = 2) =>
  decimal(name, { precision: 9, scale, mode: "number" }); // lihat catatan decimal di atas

export const sppg = mysqlTable("sppg", {
  id: id(),
  name: varchar("name", { length: 200 }).notNull(),
  region: varchar("region", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schools = mysqlTable("schools", {
  id: id(),
  sppgId: varchar("sppg_id", { length: 36 }).references(() => sppg.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),        // contoh: sdn-01-semarang
  levels: json("levels").$type<Level[]>().notNull(),                 // jenjang yang ada di sekolah
  timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Jakarta"),
  active: boolean("active").default(true).notNull(),
});

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: mysqlEnum("role", ROLES).notNull(),                          // super_admin | sppg_admin | school_admin
  sppgId: varchar("sppg_id", { length: 36 }).references(() => sppg.id),
  schoolId: varchar("school_id", { length: 36 }).references(() => schools.id),
});

// Referensi TKPI (nilai per 100 g bagian dapat dimakan)
export const foods = mysqlTable("foods", {
  id: id(),
  code: varchar("code", { length: 50 }).unique(),                    // kode TKPI bila ada
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),           // karbohidrat | lauk_hewani | lauk_nabati | sayur | buah | susu | lainnya
  energyKcal: num("energy_kcal").notNull(),
  proteinG: num("protein_g").notNull(),
  fatG: num("fat_g").notNull(),
  carbG: num("carb_g").notNull(),
  fiberG: num("fiber_g").notNull(),
  ironMg: num("iron_mg").notNull(),
  ediblePct: num("edible_pct").default(100).notNull(),
  allergens: json("allergens").$type<Allergen[]>().notNull().$defaultFn(() => []), // telur, ikan, kacang, susu, udang, gluten, kedelai
  isCustom: boolean("is_custom").default(false).notNull(),           // bahan tambahan admin
});

export const menus = mysqlTable("menus", {
  id: id(),
  sppgId: varchar("sppg_id", { length: 36 }).references(() => sppg.id).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  name: varchar("name", { length: 300 }).notNull(),                  // "Nasi, Ayam Goreng, Perkedel, Tumis Kangkung"
  description: text("description"),
  photoUrl: varchar("photo_url", { length: 500 }),
  funFact: text("fun_fact"),                                         // edukasi mikro
  status: mysqlEnum("status", ["draft", "published"]).notNull().default("draft"),
}, (t) => ({ uniq: uniqueIndex("menu_sppg_date").on(t.sppgId, t.date) }));

export const menuPortions = mysqlTable("menu_portions", {
  id: id(),
  menuId: varchar("menu_id", { length: 36 }).references(() => menus.id, { onDelete: "cascade" }).notNull(),
  level: mysqlEnum("level", LEVELS).notNull(),
  totals: json("totals").$type<NutrientTotals>().notNull(),          // total gizi satu porsi (di-cache saat simpan)
  allergens: json("allergens").$type<Allergen[]>().notNull().$defaultFn(() => []),
}, (t) => ({ uniq: uniqueIndex("portion_menu_level").on(t.menuId, t.level) }));

export const menuItems = mysqlTable("menu_items", {
  id: id(),
  portionId: varchar("portion_id", { length: 36 }).references(() => menuPortions.id, { onDelete: "cascade" }).notNull(),
  foodId: varchar("food_id", { length: 36 }).references(() => foods.id).notNull(),
  grams: num("grams").notNull(),                                     // berat matang/siap makan per porsi
  label: varchar("label", { length: 200 }),                          // nama tampil (mis. "Ayam goreng")
  visualUnit: varchar("visual_unit", { length: 100 }),               // "1 potong sedang"
  benefit: varchar("benefit", { length: 300 }),                      // "Biar kuat berlari dan fokus belajar"
});

// AKG Permenkes 28/2019 (disederhanakan per kelompok usia & jenis kelamin)
export const akgReference = mysqlTable("akg_reference", {
  id: int("id").autoincrement().primaryKey(),
  sex: mysqlEnum("sex", ["male", "female"]).notNull(),
  ageMin: int("age_min").notNull(),
  ageMax: int("age_max").notNull(),
  energyKcal: int("energy_kcal").notNull(),
  proteinG: int("protein_g").notNull(),
  fatG: int("fat_g").notNull(),
  carbG: int("carb_g").notNull(),
  fiberG: int("fiber_g").notNull(),
  ironMg: int("iron_mg").notNull(),
}, (t) => ({ uniq: uniqueIndex("akg_sex_age").on(t.sex, t.ageMin, t.ageMax) }));

// Pangan lokal + URT untuk rekomendasi (nilai per 1 URT)
export const householdFoods = mysqlTable("household_foods", {
  id: id(),
  name: varchar("name", { length: 200 }).notNull().unique(),         // "Tempe bacem"
  category: varchar("category", { length: 50 }).notNull(),           // sayur | lauk_nabati | lauk_hewani | buah | karbohidrat | susu
  urtLabel: varchar("urt_label", { length: 100 }).notNull(),         // "2 potong sedang"
  grams: num("grams").notNull(),
  energyKcal: num("energy_kcal").notNull(),
  proteinG: num("protein_g").notNull(),
  fatG: num("fat_g").notNull(),
  carbG: num("carb_g").notNull(),
  fiberG: num("fiber_g").notNull(),
  ironMg: num("iron_mg").notNull(),
  allergens: json("allergens").$type<Allergen[]>().notNull().$defaultFn(() => []),
  mealSlots: json("meal_slots").$type<("sarapan" | "makan_malam" | "selingan")[]>().notNull(),
  priceTier: int("price_tier").default(1).notNull(),                 // 1 murah .. 3 mahal
  emoji: varchar("emoji", { length: 16 }),
});
```

`packages/shared/src/constants` wajib mengekspor `LEVELS = ["sd_low","sd_high","smp","sma"] as const` dan `ROLES = ["super_admin","sppg_admin","school_admin"] as const`.

Tipe bersama (di `packages/shared`):

```ts
export type NutrientKey = "energyKcal" | "proteinG" | "fatG" | "carbG" | "fiberG" | "ironMg";
export type NutrientTotals = Record<NutrientKey, number>;
export type Level = "sd_low" | "sd_high" | "smp" | "sma";
export type Allergen = "telur" | "ikan" | "kacang" | "susu" | "udang" | "gluten" | "kedelai";
```

## 3. Endpoint API

Semua di bawah prefiks `/api`. Respons sukses: JSON. Error: `{ error: { code, message } }`.

### Publik (tanpa login, cache-friendly)

| Method | Path | Fungsi |
|---|---|---|
| GET | `/public/schools/:slug` | Info sekolah (nama, jenjang, timezone) |
| GET | `/public/schools/:slug/today` | Menu hari ini (menurut timezone sekolah) semua jenjang; bila kosong → `{ menu: null, next: {...} }` |
| GET | `/public/schools/:slug/week?start=YYYY-MM-DD` | Menu satu minggu (untuk cache offline) |
| GET | `/public/reference/household-foods` | Basis pangan rekomendasi |
| GET | `/public/reference/akg` | Tabel AKG |
| GET | `/og/s/:slug/hari-ini` | HTML ringan berisi tag Open Graph (M6) lalu redirect/mount SPA |

### Auth

| Method | Path | Fungsi |
|---|---|---|
| POST | `/auth/login` | Email + sandi → set cookie httpOnly |
| POST | `/auth/logout` | Hapus cookie |
| GET | `/auth/me` | Info pengguna & peran |

### Admin (login + RBAC)

| Method | Path | Peran | Fungsi |
|---|---|---|---|
| CRUD | `/admin/sppg` | super_admin | Kelola SPPG |
| CRUD | `/admin/schools` | super_admin, sppg_admin | Kelola sekolah + slug |
| GET | `/admin/schools/:id/qr?format=png\|svg` | sppg_admin, school_admin | Unduh QR statis ke `APP_BASE_URL/s/:slug/hari-ini` |
| CRUD | `/admin/foods` | semua admin (bahan custom) | Cari/tambah bahan; `?q=` untuk pencarian |
| CRUD | `/admin/menus` | sppg_admin | Menu per tanggal (`?from=&to=`) |
| PUT | `/admin/menus/:id/portions/:level` | sppg_admin | Simpan item bahan + hitung total gizi |
| POST | `/admin/menus/:id/publish` | sppg_admin | Ubah status ke published |
| POST | `/admin/menus/copy` | sppg_admin | Salin menu ke tanggal lain |
| POST | `/admin/uploads/presign` | sppg_admin | URL unggah foto (opsional) |

### Bentuk respons `GET /public/schools/:slug/today`

```json
{
  "school": { "name": "SDN 01 Semarang", "slug": "sdn-01-semarang", "timezone": "Asia/Jakarta" },
  "date": "2026-11-24",
  "menu": {
    "id": "…", "name": "Nasi, Ayam Goreng, Perkedel, Tumis Kangkung",
    "photoUrl": null, "funFact": "…",
    "portions": {
      "sd_high": {
        "totals": { "energyKcal": 520, "proteinG": 22, "fatG": 16, "carbG": 70, "fiberG": 4.1, "ironMg": 2.4 },
        "allergens": ["telur"],
        "items": [
          { "label": "Nasi putih", "grams": 150, "visualUnit": "1 centong", "category": "karbohidrat", "benefit": "Tenaga untuk berlari" }
        ]
      }
    }
  },
  "next": null
}
```

## 4. Aturan Akses (RBAC)

- `super_admin`: semua.
- `sppg_admin`: hanya data SPPG-nya (sekolah, menu).
- `school_admin`: baca menu SPPG induk, kelola QR sekolahnya, override opsional.
- Semua query admin wajib memfilter berdasarkan `sppgId`/`schoolId` dari token, **bukan** dari parameter klien.

## 5. Keamanan & Privasi

- Sandi di-hash dengan argon2; cookie `httpOnly`, `SameSite=Lax`, `Secure` di produksi.
- Rate limit sederhana untuk `/auth/login`.
- Endpoint publik **read-only**, tidak menerima data profil.
- Sanitasi semua teks bebas (nama menu, fun fact) saat dirender; jangan gunakan `dangerouslySetInnerHTML`.
