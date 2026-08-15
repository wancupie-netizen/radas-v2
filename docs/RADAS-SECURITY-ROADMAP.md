# RADAS Security Review & Roadmap

> Dokumen rujukan keselamatan untuk `radas.my` dan ekosistem RADAS.
>
> Status dokumen: Perancangan sahaja — belum dilaksanakan  
> Semakan awal: 15 Ogos 2026  
> Kaedah semakan: Pemerhatian luaran pasif tanpa eksploitasi, brute force atau perubahan produksi

## 1. Tujuan

Dokumen ini menjadi satu sumber utama untuk:

- merekodkan dapatan keselamatan;
- menentukan keutamaan pembaikan;
- mengelakkan perubahan dibuat tanpa semakan;
- menyimpan bukti verifikasi selepas setiap pembaikan; dan
- membezakan keselamatan landing page, aplikasi, pangkalan data dan operasi dalaman.

## 2. Skop Sistem

| Komponen | Peranan | Status semakan |
| --- | --- | --- |
| `https://radas.my` | Landing page awam | Semakan pasif awal selesai |
| `https://www.radas.my` | Variasi domain landing page | Semakan pasif awal selesai |
| `https://app.radas.my` | Aplikasi pengguna RADAS | Header halaman utama sahaja disemak |
| Supabase Auth | Pendaftaran dan sesi pengguna | Belum disemak |
| Supabase Database dan RLS | Data pengguna dan data produk | Belum disemak |
| Storage | Fail atau imej pengguna | Belum disemak |
| Edge Functions/API | Logik backend | Belum disemak |
| GitHub dan CI/CD | Kod, secrets dan deployment | Belum disemak |
| Dependency npm | Risiko pakej pihak ketiga | Belum disemak |

## 3. Rumusan Semakan Awal

Tiada kelemahan kritikal yang jelas ditemui pada landing page melalui semakan pasif. Permukaan serangan landing page adalah kecil kerana ia bersifat statik dan tidak mempunyai borang. Walau bagaimanapun, beberapa header keselamatan pelayar masih belum dipasang.

Risiko lebih besar dijangka berada pada `app.radas.my`, proses autentikasi, polisi Row Level Security (RLS), API dan pengurusan data pengguna. Komponen tersebut memerlukan audit berasingan sebelum tahap keselamatan keseluruhan RADAS boleh disahkan.

## 4. Perlindungan Yang Sudah Baik

- [x] Permintaan HTTP dialihkan ke HTTPS menggunakan status `308`.
- [x] HSTS aktif dengan `max-age=63072000`.
- [x] HTTP/2 tersedia.
- [x] Kaedah HTTP `TRACE` ditolak dengan status `405`.
- [x] `/.env` tidak tersedia secara awam.
- [x] `/.env.local` tidak tersedia secara awam.
- [x] `/.git/config` tidak tersedia secara awam.
- [x] `/vercel.json` tidak tersedia secara awam.
- [x] Source map bundle produksi yang diuji tidak tersedia secara awam.
- [x] Tiada API key, token, kata laluan, URL Supabase atau rahsia yang jelas ditemui dalam bundle awam yang diuji.

Nota: Tanda selesai di atas hanya merujuk kepada pemerhatian pada tarikh semakan. Ia bukan jaminan bahawa kelemahan tidak wujud.

## 5. Daftar Dapatan

### SEC-001 — Content Security Policy belum tersedia

- **Keutamaan:** Sederhana
- **Komponen:** `radas.my`, `app.radas.my`
- **Status:** Belum dibaiki
- **Pemerhatian:** Response tidak mengandungi header `Content-Security-Policy`.
- **Risiko:** Perlindungan pelayar terhadap XSS, suntikan skrip dan pemuatan sumber tidak dibenarkan menjadi lebih lemah.
- **Cadangan:** Mulakan dengan `Content-Security-Policy-Report-Only`, periksa pelanggaran, kemudian aktifkan polisi penuh.
- **Perhatian:** Polisi perlu membenarkan Google Fonts yang sedang digunakan tanpa melonggarkan `script-src`.

### SEC-002 — Perlindungan clickjacking belum tersedia

- **Keutamaan:** Sederhana
- **Komponen:** `radas.my`, `app.radas.my`
- **Status:** Belum dibaiki
- **Pemerhatian:** Tiada CSP `frame-ancestors` dan tiada `X-Frame-Options`.
- **Risiko:** Laman berpotensi dimuatkan dalam `iframe` di domain lain untuk mengelirukan pengguna.
- **Cadangan:** Gunakan `frame-ancestors 'none'` dan `X-Frame-Options: DENY`, kecuali RADAS mempunyai keperluan sah untuk di-embed.

### SEC-003 — Header keselamatan asas belum lengkap

- **Keutamaan:** Sederhana
- **Komponen:** `radas.my`, `app.radas.my`
- **Status:** Belum dibaiki
- **Header yang belum ditemui:**
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Cadangan awal:**
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`

### SEC-004 — Domain `www` tidak dialihkan ke domain kanonik

- **Keutamaan:** Rendah
- **Komponen:** `www.radas.my`
- **Status:** Belum dibaiki
- **Pemerhatian:** `www.radas.my` memberi response `200` dan memaparkan kandungan yang sama.
- **Risiko:** Bukan kerentanan langsung, tetapi mewujudkan dua origin, ketidakselarasan cache dan isu SEO.
- **Cadangan:** Tetapkan redirect kekal `308` daripada `www.radas.my` ke `radas.my` dan gunakan canonical URL.

### SEC-005 — Polisi HSTS belum meliputi semua subdomain

- **Keutamaan:** Rendah / Bersyarat
- **Komponen:** Semua subdomain RADAS
- **Status:** Perlu penilaian
- **Pemerhatian:** HSTS aktif tetapi belum menggunakan `includeSubDomains` atau `preload`.
- **Cadangan:** Jangan tambah `includeSubDomains` sehingga semua subdomain, termasuk subdomain lama atau dalaman, disahkan menyokong HTTPS secara kekal.

### SEC-006 — CORS terlalu luas pada kandungan statik

- **Keutamaan:** Informasi
- **Komponen:** `radas.my`, `app.radas.my`
- **Status:** Perlu penilaian
- **Pemerhatian:** HTML dihantar dengan `Access-Control-Allow-Origin: *`.
- **Risiko:** Rendah untuk halaman statik awam, tetapi polisi ini tidak diperlukan pada semua response.
- **Cadangan:** Kenal pasti sumber header tersebut. Hadkan atau buang jika aplikasi tidak memerlukan akses cross-origin.

### SEC-007 — Nombor WhatsApp terdedah dalam bundle awam

- **Keutamaan:** Informasi
- **Komponen:** Landing page
- **Status:** Diterima jika nombor perniagaan
- **Risiko:** Nombor boleh dikutip oleh bot atau menerima spam.
- **Cadangan:** Kekalkan hanya jika ia memang saluran awam rasmi RADAS.

## 6. Cadangan Polisi CSP Awal

Polisi berikut ialah titik permulaan untuk ujian, bukan konfigurasi yang terus dianggap selamat untuk produksi:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

Sebelum penguatkuasaan:

1. pasang sebagai `Content-Security-Policy-Report-Only`;
2. uji landing page, halaman `/pro` dan semua CTA;
3. semak font, imej, animasi dan console pelayar;
4. semak semua fungsi di `app.radas.my` secara berasingan;
5. buang `'unsafe-inline'` kemudian jika inline style telah dikeluarkan atau diganti dengan kaedah lebih ketat; dan
6. aktifkan `Content-Security-Policy` hanya selepas tiada fungsi sah disekat.

## 7. Roadmap Pelaksanaan

### Fasa 1 — Baseline landing page

- [ ] Cipta branch keselamatan khusus.
- [ ] Tambah header asas dalam `vercel.json`.
- [ ] Pasang CSP dalam mod Report-Only.
- [ ] Tambah perlindungan clickjacking.
- [ ] Redirect `www` ke domain utama.
- [ ] Jalankan build produksi.
- [ ] Semak desktop dan mobile.
- [ ] Semak console pelayar.
- [ ] Buka Draft PR untuk semakan.

### Fasa 2 — Penguatkuasaan CSP

- [ ] Rekod semua pelanggaran CSP yang sah.
- [ ] Betulkan sumber atau inline style yang tidak diperlukan.
- [ ] Kurangkan domain yang dibenarkan kepada minimum.
- [ ] Tukar Report-Only kepada polisi aktif.
- [ ] Uji semula semua laluan dan CTA.

### Fasa 3 — Audit aplikasi dan autentikasi

- [ ] Semak aliran daftar masuk, daftar akaun dan log keluar.
- [ ] Semak pengurusan token dan sesi.
- [ ] Semak redirect selepas autentikasi.
- [ ] Semak perlindungan halaman yang memerlukan akaun.
- [ ] Semak kebocoran maklumat melalui mesej ralat.
- [ ] Semak rate limiting bagi login, daftar akaun dan reset kata laluan.
- [ ] Pastikan pengesahan e-mel dan reset kata laluan tidak boleh disalah guna.

### Fasa 4 — Audit Supabase dan data

- [ ] Senaraikan semua jadual dan tahap sensitiviti data.
- [ ] Pastikan RLS aktif pada semua jadual yang boleh dicapai klien.
- [ ] Uji polisi sebagai pengguna tanpa login.
- [ ] Uji pengguna A tidak boleh membaca atau mengubah data pengguna B.
- [ ] Pastikan service-role key tidak pernah dihantar ke browser.
- [ ] Semak polisi Storage dan URL fail.
- [ ] Semak fungsi `SECURITY DEFINER` dan `search_path`.
- [ ] Semak fungsi RPC dan Edge Functions.
- [ ] Pastikan log tidak menyimpan token, kata laluan atau data sensitif.

### Fasa 5 — Kod, dependency dan operasi

- [ ] Jalankan audit dependency npm.
- [ ] Semak GitHub secret scanning dan Dependabot.
- [ ] Semak akses ahli dan perlindungan branch utama.
- [ ] Semak Vercel environment variables mengikut persekitaran.
- [ ] Pastikan preview deployment tidak menggunakan data produksi tanpa kawalan.
- [ ] Sediakan proses rotation secrets.
- [ ] Sediakan pelan backup dan pemulihan data.
- [ ] Sediakan prosedur respons insiden.

## 8. Kriteria Selesai

Sesuatu item hanya boleh ditandakan selesai apabila:

1. perubahan telah melalui Draft PR;
2. build produksi berjaya;
3. fungsi berkaitan telah diuji;
4. response produksi telah disemak semula;
5. tiada regression visual atau fungsi;
6. bukti semakan direkodkan dalam dokumen ini; dan
7. perubahan telah diluluskan oleh pemilik RADAS.

## 9. Rekod Pelaksanaan

| Tarikh | ID | Perubahan | Branch/PR | Bukti verifikasi | Status |
| --- | --- | --- | --- | --- | --- |
| — | — | Belum ada perubahan dilaksanakan | — | — | Belum bermula |

## 10. Perkara Di Luar Skop Semakan Awal

Semakan pasif ini tidak membuktikan keselamatan perkara berikut:

- kebenaran akses bagi setiap jenis pengguna;
- polisi RLS sebenar dalam pangkalan data;
- keselamatan API atau Edge Functions;
- manipulasi permintaan selepas login;
- rate limiting dan perlindungan bot;
- integriti pembayaran;
- dependency yang mempunyai CVE;
- secrets dalam GitHub, Vercel atau komputer pembangun;
- backup, pemulihan dan respons insiden; dan
- serangan yang memerlukan ujian aktif.

## 11. Rujukan

- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [MDN — CSP `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [MDN — `X-Content-Type-Options`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)
- [MDN — `Referrer-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy)
- [MDN — `Permissions-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)
- [Vercel — Project configuration with `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json)

---

Dokumen ini ialah checklist hidup. Setiap perubahan keselamatan perlu dibuat secara berperingkat, diuji dan diluluskan sebelum digabungkan ke branch utama.
