# KIPAN-RI-Core-frontend

Frontend React SPA untuk **SIM-KIPAN** (Sistem Informasi Kader Inti Pemuda Anti Narkoba) — mengelola pendaftaran kader, verifikasi berkas, keanggotaan, dan KTA digital.

## Teknologi

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Axios
- Oxlint

## Menjalankan

```bash
npm install
cp .env.example .env   # sesuaikan VITE_API_URL
npm run dev
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Type-check + build produksi |
| `npm run lint` | Jalankan Oxlint |
| `npm run preview` | Pratinjau hasil build |

## Struktur

```
src/
  components/     komponen UI bersama (layout, ui, guards)
  config/         konfigurasi environment
  context/        AuthContext
  features/       fitur berbasis slice (auth, pendaftaran, verification, anggota, kta, tracking, storage, notification, system)
  pages/public/   halaman publik (landing)
  services/       apiClient (axios + refresh token)
```
