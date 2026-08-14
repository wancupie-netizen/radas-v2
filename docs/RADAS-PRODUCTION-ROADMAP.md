# RADAS V2 — Production Stabilization Roadmap

> **Dokumen sumber tunggal rasmi** untuk kerja penstabilan RADAS V2 selepas sistem mula menerima pendaftaran pengguna.

## 1. Status Dokumen

- Projek: RADAS V2
- Repositori: https://github.com/wancupie-netizen/radas-v2
- Status sistem: Sedang dipromosikan dan menerima pendaftaran pengguna
- Kaedah pelaksanaan: Satu hari, satu skop kecil
- Status semasa: Perancangan sahaja — belum ada perubahan dilaksanakan
- Prinsip produk: Research → Analysis → Content → Action → Result → Learning
- Metrik utama: Research-to-Action Rate (RAR)

## 2. Objektif

1. Melindungi pengguna, research dan kandungan PRO.
2. Memastikan kerja menambah dan mengemas kini research tidak terganggu.
3. Mengurangkan risiko perubahan pada production.
4. Mewujudkan proses release yang boleh diuji dan dipulihkan.
5. Menyediakan asas stabil sebelum menambah modul atau automasi baharu.

## 3. Prinsip Pelaksanaan

Urutan rasmi:

> **Stabilkan → Lindungi → Pantau → Baiki pengalaman → Kembangkan**

Peraturan:

- Satu hari hanya satu skop utama.
- Satu fasa besar boleh dipecahkan kepada beberapa hari jika berisiko.
- Tiada perubahan terus pada production tanpa semakan dan kelulusan.
- Tiada perubahan terus pada branch `main`.
- Setiap perubahan menggunakan feature branch dan pull request.
- Commit, push, pull request, migration dan deployment memerlukan kebenaran khusus.
- Elakkan redesign besar dan penambahan modul baharu semasa fasa penstabilan.
- Operasi research harian mesti kekal berjalan.
- Jika verification gagal, perubahan tidak dilepaskan ke production.

## 4. Keutamaan

| Prioriti | Kerja | Tahap |
|---|---|---|
| P0 | Baseline production, backup dan rollback | Kritikal |
| P0 | Tutup kelemahan authorization `generate-research` | Kritikal |
| P0 | Audit RLS dan perlindungan kandungan PRO | Kritikal |
| P1 | Error monitoring dan audit trail | Tinggi |
| P1 | Error handling dan data integrity | Tinggi |
| P1 | Automated testing dan CI | Tinggi |
| P2 | Filter, sorting, onboarding dan accessibility | Sederhana |
| P2 | Operasi pengguna dan pengurusan langganan | Sederhana |
| P3 | Billing automation dan modul baharu | Kemudian |

## 5. Roadmap Harian

### Hari 1 — Production Baseline

**Tujuan:** Mewujudkan titik rujukan dan pemulihan sebelum perubahan.

Skop:

- Kenal pasti deployment production aktif.
- Rekod branch dan commit yang sedang live.
- Semak Supabase project production.
- Semak migration yang telah dijalankan.
- Semak Edge Function yang sedang deployed.
- Rekod environment variables dan secrets yang diperlukan tanpa menyalin nilai rahsia.
- Rekod role matrix semasa.
- Sediakan prosedur rollback.

Perubahan production: **Tiada**.

Kriteria siap:

- Production commit dikenal pasti.
- Database dan deployment rollback plan tersedia.
- Fail serta komponen yang terlibat untuk Hari 2 dikenal pasti.

### Hari 2 — Security Hotfix untuk AI Generation

**Tujuan:** Menghalang editor atau permintaan tidak sah daripada memintas RLS.

Skop:

- Admin boleh menjana AI mengikut hak admin.
- Editor hanya boleh menjana research yang belum diterbitkan atau diarkibkan.
- Tolak `researchId` yang tidak dibenarkan.
- Gunakan conditional update berdasarkan status terkini.
- Elakkan service-role menjadi jalan pintas authorization.
- Gunakan respons `403` atau `409` yang jelas.
- Uji admin, editor dan subscriber.

Kriteria siap:

- Editor tidak boleh mengubah research `published` atau `archived` melalui Edge Function.
- Subscriber tidak boleh menjalankan generation.
- Workflow research draft masih berfungsi.

### Hari 3 — Audit RLS dan PRO Entitlement

**Tujuan:** Memastikan akses sama pada UI, API, RPC dan database.

Skop audit:

- `profiles`
- `researches`
- `research_generation_runs`
- `watchlists`
- `announcements`
- `storage.objects`
- RPC teaser PRO

Kriteria siap:

- Subscriber Free tidak boleh membaca kandungan penuh PRO.
- Pengguna tidak boleh mengubah role atau plan sendiri.
- Editor tidak boleh publish atau mengubah published research.
- Watchlist hanya boleh diurus pemilik.
- Hanya admin boleh menjalankan tindakan admin-only.

### Hari 4 — Frontend Error Handling

**Tujuan:** Membezakan masalah akses, data tidak ditemui dan kegagalan sistem.

Skop:

- Tangkap semua kegagalan query penting.
- Tambah paparan `Cuba semula` jika sesuai.
- Bezakan status `tidak ditemui`, `tiada akses` dan `server bermasalah`.
- Elakkan unhandled promise rejection.
- Pastikan loading state tamat dengan betul.

Kriteria siap:

- Kegagalan Supabase tidak dipaparkan sebagai “research tidak ditemui”.
- Pengguna menerima mesej yang boleh difahami.

### Hari 5 — Product Image Integrity

**Tujuan:** Mengelakkan imej orphan atau kehilangan imej ketika kemas kini gagal.

Aliran sasaran:

1. Validasi jenis dan saiz imej.
2. Upload imej baharu.
3. Simpan database.
4. Jika database gagal, padam upload baharu.
5. Jika kemas kini berjaya, bersihkan imej lama.
6. Rekod kegagalan cleanup untuk tindakan admin.

Kriteria siap:

- Kegagalan simpan tidak meninggalkan fail baharu tanpa rekod.
- Imej lama hanya dipadam selepas rekod baharu selamat.

### Hari 6 — Duplicate Generation dan Konflik Edit

**Tujuan:** Mengelakkan permintaan berganda dan perubahan editor saling menindih.

Skop:

- Hadkan satu generation aktif bagi research yang sama.
- Cegah double-submit.
- Tambah semakan status sebelum update.
- Pertimbangkan optimistic concurrency menggunakan `updated_at` atau versi rekod.
- Sediakan retry terkawal untuk generation gagal.

Kriteria siap:

- Dua permintaan tidak menghasilkan dua generation aktif serentak.
- Published atau archived state tidak boleh ditimpa oleh respons AI lama.

### Hari 7 — Monitoring dan Audit Trail

**Tujuan:** Mengetahui apa yang rosak dan siapa melakukan tindakan penting.

Skop:

- Pantau ralat frontend dan Edge Function.
- Log kegagalan authentication dan AI generation secara selamat.
- Rekod tindakan create, generate, review, publish dan archive.
- Pantau kegagalan generation dan penggunaan AI.
- Jangan log password, token, authorization header atau secret.

Kriteria siap:

- Ralat production boleh dikenal pasti tanpa meminta pengguna menerangkan semuanya.
- Tindakan editorial penting mempunyai jejak audit.

### Hari 8 — Automated Testing

**Tujuan:** Melindungi aliran kritikal daripada regression.

Liputan minimum:

- Pendaftaran, login, logout dan session tamat.
- Akses admin, editor, subscriber Free dan subscriber PRO.
- Draft → AI Generated → In Review → Published.
- Editor tidak boleh publish.
- Free tidak boleh membaca kandungan PRO melalui API langsung.
- Watchlist hanya milik pengguna.
- Announcement hanya diurus admin.

Kriteria siap:

- Ujian kritikal boleh dijalankan secara konsisten.
- Kegagalan authorization menyebabkan test gagal.

### Hari 9 — CI dan Release Gate

**Tujuan:** Menghalang kod bermasalah daripada masuk ke production.

Release gate:

- TypeScript build lulus.
- Lint lulus.
- Automated tests lulus.
- Migration validation lulus.
- Browser smoke test lulus.

Kriteria siap:

- Pull request memaparkan status pemeriksaan.
- Merge tidak dilakukan apabila pemeriksaan kritikal gagal.

### Hari 10 — Dokumentasi dan Production Checklist

**Tujuan:** Menjadikan operasi RADAS boleh diulang dan disemak.

Skop:

- Gantikan README template dengan README rasmi.
- Dokumentasikan setup, architecture dan role matrix.
- Dokumentasikan migration dan deployment flow.
- Sediakan incident dan rollback checklist.
- Semak semula semua hasil Hari 1–9.

Kriteria siap:

- Developer atau operator boleh memahami dan mengendalikan projek berdasarkan dokumentasi.

## 6. Role Matrix Sasaran

| Tindakan | Admin | Editor | Subscriber |
|---|---:|---:|---:|
| Cipta research | Ya | Ya | Tidak |
| Edit draft | Ya | Ya | Tidak |
| Generate AI | Ya | Ya, unpublished sahaja | Tidak |
| Hantar untuk semakan | Ya | Ya | Tidak |
| Publish | Ya | Tidak | Tidak |
| Archive | Ya | Tidak | Tidak |
| Tukar akses Free/PRO | Ya | Tidak | Tidak |
| Padam research | Ya | Tidak | Tidak |
| Urus pelan pengguna | Ya | Tidak | Tidak |

## 7. SOP Kerja Harian

1. Semak keadaan production dan pendaftaran pengguna.
2. Tentukan satu skop kerja untuk hari tersebut.
3. Senaraikan fail, migration atau function yang mungkin terlibat.
4. Nilai risiko kepada operasi research.
5. Cipta feature branch selepas mendapat kebenaran.
6. Laksanakan perubahan kecil.
7. Jalankan build, lint dan ujian berkaitan.
8. Jalankan browser smoke test jika berkaitan.
9. Sediakan ringkasan perubahan, risiko dan rollback.
10. Buka draft pull request hanya selepas mendapat kebenaran.
11. Deploy hanya selepas kelulusan.
12. Pantau sistem selepas release.
13. Kemas kini status dan log keputusan dalam dokumen ini.

## 8. Perlindungan Operasi Research

- Research boleh terus ditambah dan dikemas kini sepanjang roadmap.
- Elakkan migration ketika admin sedang mengedit atau menerbitkan research.
- Release dibuat pada waktu penggunaan rendah.
- Research yang tidak berkaitan tidak disentuh.
- Tiada perubahan UI besar sepanjang Hari 1–9.
- Setiap perubahan database memerlukan baseline dan rollback plan.
- Jika verification gagal, release dibatalkan atau ditangguhkan.
- Hari audit dan testing tidak semestinya menghasilkan deployment.

## 9. Cadangan Maintenance Window

- Pagi: tambah dan kemas kini research.
- Petang: pembangunan dan ujian perubahan harian.
- Malam: release kecil selepas kelulusan.
- Selepas release: smoke test admin, editor, subscriber Free dan subscriber PRO.

Waktu sebenar akan ditentukan sebelum setiap perubahan production.

## 10. Perkara Ditangguhkan

Perkara berikut tidak menjadi keutamaan sepanjang penstabilan:

- Redesign besar UI.
- Campaign Factory baharu.
- Marketplace.
- Billing kompleks.
- Modul tambahan yang tidak melindungi operasi semasa.
- Analitik lanjutan sebelum audit dan monitoring asas stabil.

## 11. Roadmap Selepas Penstabilan

Selepas Hari 1–10 selesai dan sistem stabil:

1. Filter dan sorting Research Library.
2. Onboarding pengguna baharu.
3. Accessibility dan mobile audit.
4. Admin user management.
5. Metadata langganan PRO dan tarikh tamat.
6. Activation analytics dan Research-to-Action Rate.
7. Expiry notification dan subscription workflow.
8. Payment gateway hanya selepas model PRO disahkan.

## 12. Status Tracker

| Hari | Fokus | Status | Tarikh | Keputusan / Catatan |
|---|---|---|---|---|
| 1 | Production Baseline | Belum mula | — | — |
| 2 | AI Generation Security | Belum mula | — | — |
| 3 | RLS dan PRO Entitlement | Belum mula | — | — |
| 4 | Frontend Error Handling | Belum mula | — | — |
| 5 | Product Image Integrity | Belum mula | — | — |
| 6 | Duplicate Generation dan Konflik Edit | Belum mula | — | — |
| 7 | Monitoring dan Audit Trail | Belum mula | — | — |
| 8 | Automated Testing | Belum mula | — | — |
| 9 | CI dan Release Gate | Belum mula | — | — |
| 10 | Dokumentasi dan Final Checklist | Belum mula | — | — |

Status yang digunakan:

- Belum mula
- Sedang diaudit
- Sedang dibangunkan
- Menunggu kelulusan
- Sedia untuk release
- Selesai
- Ditangguhkan
- Rollback

## 13. Log Keputusan

Gunakan format berikut selepas setiap keputusan penting:

```md
### YYYY-MM-DD — Tajuk keputusan

- Keputusan:
- Sebab:
- Kesan:
- Risiko:
- Diluluskan oleh:
- Tindakan seterusnya:
```

## 14. Rekod Perubahan Dokumen

| Versi | Tarikh | Perubahan |
|---|---|---|
| 1.0 | 2026-08-15 | Dokumen sumber tunggal dan roadmap harian diwujudkan. |

