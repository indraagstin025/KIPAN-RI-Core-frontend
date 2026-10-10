# Analisis Kehilangan Data Form Pendaftaran (`/daftar`) saat Refresh

> Tanggal: 11 Okt 2026 · Pelapor: penguji staging · Analis: OpenCode
> Status: **terdokumentasi, belum diperbaiki** (menunggu perintah implementasi)
> Cakupan: `frontend/src/features/pendaftaran/` (DaftarPage, useDaftarForm,
> useDaftarSubmit, lib/draft, useWilayah, LangkahRingkasan, validasi)

## Ringkasan eksekutif

Laporan "refresh → sebagian data kosong → tahap akhir ada data tidak muncul"
terdiri dari **7 temuan**: 2 by-design (kebijakan privasi FE-01), 1 hambatan
nyata (kodepos), 1 race tampilan (dropdown wilayah), 1 bahaya nyata
**kehilangan kunci dokumen (B5, HIGH)**, dan 2 minor. Tidak ada bug backend;
seluruhnya state management frontend + `localStorage`.

## Alur data (fakta)

```
ketik → useState ─┬─→ saveDraft (useEffect, tiap render) → localStorage
                  │     allowlist PERSIST_KEYS: step, nama, jk, agama,
                  │     pendidikan, pekerjaan, prov, kab, kec, desa,
                  │     motivasi, persyaratan, docs{key,name}
                  └─→ TIDAK PERNAH disimpan: nik, tempat, tanggal, alamat,
                      email, wa, kode, kodepos, otp.verifiedToken, File objek
refresh → loadDraft (TTL 24 jam, purge v2) → useState(initial dari draf)
```

## Temuan

### B1 — Field sensitif kosong pasca-refresh (BY DESIGN, FE-01)
`useDaftarForm.ts:104-122`: nik, tempat, tanggal, alamat, email, wa, kode,
kodepos selalu `useState('')`. Alert biru di `DaftarPage.tsx:79-98`
mengungkapkannya ("perlu diketik ulang"). `LangkahRingkasan.tsx:13-18`
membaca state langsung → NIK/TTL/Email/WA blank. Submit memantul ke
langkah 0/1 (`useDaftarSubmit.ts:66-95`). Bukan bug — tapi inilah
"sebagian data kosong" yang terlihat pertama.

### B2 — Kodepos tidak dipulihkan PADAHAL WAJIB (BUG, medium)
`kodepos` tidak ada di `PERSIST_KEYS` (`draft.ts:66-69`) dan init årselalu
`''` (`useDaftarForm.ts:119`). Validasi mewajibkan 5 digit
(`validasi.ts:53`). Skenario: refresh → desa ter-restore → daftar saran
kodepos termuat → nilai tetap kosong → Ringkasan "Wilayah" timpang
(`LangkahRingkasan.tsx:18`) dan submit TERBLOKIR sampai pengguna memilih
ulang saran yang sama. Kontras: `kec`/`desa` dipulihkan, `kodepos` tidak.

### B3 — Dropdown wilayah blank padahal state ada (RACE tampilan, medium-low)
Nilai `prov/kab/kec/desa` ter-restore sebagai string, tetapi opsi dropdown
dimuat lewat rantai async 4 tingkat (`useDaftarForm.ts:242-280` →
`useWilayah.ts:24-83`): provinsi → kabupaten → kecamatan → desa. Selama
rantai berjalan (atau bila 1 link gagal/timeout — persis seperti outage S3
staging kemarin), `<select>` berisi value yang tak ada di options →
tampil kosong. Data submit tetap benar (validasi membaca value), tetapi
pengguna melihat "terhapus". Fallback "ketik manual" hanya untuk
kecamatan/desa, tidak untuk prov/kab.

### B4 — Seluruh draf hangus >24 jam (by design, disclosure kurang, low)
`loadDraft` (`draft.ts:53-56`) membuang draf tanpa `savedAt` segar. Alert UI
menyebut "tersimpan otomatis" tanpa menyebut batas 1 hari. Penguji lintas
hari melihat form kosong total.

### B5 — Re-upload MENGHAPUS kunci lama seketika (BUG, HIGH) ⚠️
`useDaftarSubmit.ts:24`: memilih berkas baru me-reset slot
(`key:''`) **sebelum** upload berjalan; effect save-draft
(`useDaftarForm.ts:283-294`, deps `docs`) langsung menulis `key:''` ke
localStorage, menimpa kunci baik sebelumnya. Bila upload baru GAGAL
(timeouts S3 staging, file ditolak, PDF terkunci) → slot kosong di state
DAN draf — kunci lama tak bisa dipulihkan kecuali unggah ulang berhasil.
Inilah satu-satunya mekanisme "data benar-benar terhapus" yang ditemukan.
Dipicu mudah saat storage lambat/gagal (staging 10 Okt: DNS `s3` belum ada).

### B6 — Token OTP hilang (BY DESIGN, messaged)
`useOtp` tidak dipersist (komentar `useDaftarForm.ts:98-100`); submit tanpa
token memantul ke langkah 1 dengan pesan jelas (`useDaftarSubmit.ts:90-95`).
Benar secara keamanan (token sekali pakai).

### B7 — Minor tampilan
- Ringkasan tidak menampilkan `prov`/`kab` sama sekali (hanya kec/desa/
  kodepos) — bahkan tanpa refresh.
- Pasca-submit sukses, refresh menghilangkan layar `HasilTerkirim`
  (state `hasil` tak persist; nomor terselamatkan di riwayat pelacakan).

## Rekomendasi perbaikan (belum dikerjakan)

| ID | Perbaikan | Beban |
|---|---|---|
| B5 | Jangan reset `key` saat pilih berkas baru; simpan sebagai `pendingKey`, ganti hanya bila upload sukses. Tambah tombol "batalkan" yang mengembalikan key lama | kecil |
| B2 | Persist `kodepos` (bukan data sensitif §27.1) ATAU turunkan ke opsional-bila-desa-ada | kecil |
| B3 | Render nilai ter-restore sebagai `<option>` sementara sampai daftar async tiba; tandai "memuat…" | sedang |
| B1/B6 | Tambah penghitung "X field perlu diketik ulang" di alert +deep-link tombol "Lengkapi" ke langkah 0/1 | kecil |
| B4 | Sebutkan "berlaku 1 hari" di alert draf | trivial |
| B7 | Tampilkan prov/kab di Ringkasan; persist `hasil` (nomor saja) agar layar sukses tahan refresh | kecil |

## Catatan staging 10–11 Okt

Outage upload (DNS `s3` belum ada + IAM weed) memperparah B5: setiap
percobaan unggah yang gagal menghapus kunci slot di draf. Penguji yang
"datanya hilang" kemungkinan menabrak kombinasi B1 (field sensitif) + B5
(slot dokumen) + B2 (kodepos) sekaligus — ketiganya terlihat sebagai
"form kosong" di Ringkasan.
