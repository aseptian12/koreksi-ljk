# PANDUAN INSTALASI — Koreksi LJK AI

Paket Anda terdiri dari:

| Berkas | Fungsi |
|---|---|
| `Kode.gs`, `Penilaian.gs`, `appsscript.json` | Backend → disalin ke Apps Script (BUKAN ke GitHub) |
| `koreksi-ljk.zip` | Frontend → diekstrak lalu di-push ke GitHub Pages |

> Anda bisa mencoba **mode demo** dulu tanpa backend: ekstrak ZIP, jalankan di GitHub Pages dengan `js/config.js` apa adanya.

---

## BAGIAN A — Backend (Google Apps Script)

1. Buka https://script.google.com → **Proyek baru**. Beri nama "Koreksi LJK".
2. Ganti isi `Code.gs` dengan isi `Kode.gs`; ubah nama file menjadi **Kode**.
3. Tombol **+** → **Script** → nama **Penilaian** → tempel isi `Penilaian.gs`.
4. **Project Settings** → centang **Show "appsscript.json" manifest file** → buka `appsscript.json` di editor → ganti isinya dengan `appsscript.json` dari paket.
5. Pilih fungsi **setupAppEnvironment** → ▶ **Run** → setujui izin. Ini membuat folder Drive, Spreadsheet database, seluruh sheet beserta data contoh, dan menyimpan ID-nya di Script Properties. Cek *Execution log* untuk URL Spreadsheet.
6. **Akun admin pertama**: buka Spreadsheet → sheet **Pengguna** → pastikan baris admin berisi **email Google Anda** (peran `admin`, aktif `TRUE`). Hapus/ubah baris contoh.

### Script Properties (Project Settings → Script Properties)
| Properti | Isi |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID OAuth (lihat Bagian B) |
| `AI_API_KEY` | API key Anthropic (atau Gemini). Bisa juga diisi lewat menu Pengaturan aplikasi |
| `DOMAIN_DIIZINKAN` | (opsional) mis. `sekolah.sch.id` untuk membatasi domain email |

Jangan menaruh kunci apa pun di frontend/GitHub.

## BAGIAN B — OAuth Client ID (login Google)

1. https://console.cloud.google.com → pilih/buat project.
2. **APIs & Services → OAuth consent screen** → External → isi nama aplikasi & email → Publish (atau tambahkan akun Anda sebagai test user).
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. **Authorized JavaScript origins**: `https://USERNAME.github.io` (dan `http://localhost:8000` bila ingin uji lokal). Tanpa path.
5. Salin **Client ID** → isi ke Script Properties `GOOGLE_CLIENT_ID` **dan** ke `js/config.js`.

## BAGIAN C — Deploy Web App

1. **Deploy → New deployment → Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. **Deploy** → izinkan → salin **URL Web App** (berakhiran `/exec`).
4. Setiap mengubah kode backend: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (URL tetap sama).

## BAGIAN D — Isi `js/config.js`

```js
window.APP_CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/XXXX/exec',
  GOOGLE_CLIENT_ID: '1234567890-xxxx.apps.googleusercontent.com'
};
```
Keduanya aman di repo publik. **Isi ini SEBELUM push pertama.**

## BAGIAN E — Deploy frontend ke GitHub Pages (lewat terminal)

> Jangan memakai "Upload files" di web GitHub — struktur folder `css/` dan `js/` akan rusak.

**E1. Siapkan folder.** Ekstrak `koreksi-ljk.zip`. Anda mendapat folder **`koreksi-ljk`**. *Folder inilah* yang akan di-`git init` (bukan folder di atasnya, bukan folder di dalamnya).

**E2. Install Git** (https://git-scm.com/download/win; Mac: `git --version`). Lalu sekali saja:
```
git config --global user.name "Nama Anda"
git config --global user.email "email-github@anda.com"
```

**E3. Buat repository** di github.com → **+ → New repository** → nama `koreksi-ljk` → **Public** → *jangan* centang README/.gitignore/license → Create.

**E4. Masuk ke folder dan VERIFIKASI.** Di Windows buka folder `koreksi-ljk` di File Explorer → klik address bar → ketik `powershell` → Enter. Lalu:
```
dir
```
Yang HARUS terlihat: **`index.html`**, folder `css`, folder `js`. Jika yang terlihat hanya folder `koreksi-ljk` lagi, berarti Anda satu level terlalu tinggi — `cd koreksi-ljk` dulu. Jangan lanjut sebelum `index.html` terlihat.

**E5. Push pertama** (satu per satu):
```
git init
git add .
git commit -m "Upload pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/koreksi-ljk.git
git push -u origin main
```
Saat diminta *Password*, tempel **Personal Access Token** (bukan password akun). Layar tampak kosong saat paste — itu normal; tekan Enter.

**E6. Personal Access Token:** https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo** → Generate → salin `ghp_…` (hanya tampil sekali).

**E7. Aktifkan Pages:** repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: **main** · **/ (root)** → Save. Centang **Enforce HTTPS**. Tunggu 1–2 menit; situs di `https://USERNAME.github.io/koreksi-ljk/`.

**E8. Tambahkan origin** `https://USERNAME.github.io` ke OAuth Client ID (Bagian B langkah 4) bila belum.

**Update setelah ini:**
```
git add .
git commit -m "Perubahan"
git push
```
Jika tampilan lama masih muncul: Ctrl+Shift+R.

## BAGIAN F — Versi 2.0: yang baru & cara memperbarui

**Yang baru**
1. **Semua jenjang SD–SMA.** Jenjang otomatis dari kolom *Tingkat* pada kelas (1–6 = SD, 7–9 = SMP, X–XII = SMA). Pilihan jawaban PG disarankan: kelas 1–3 → A–C, kelas 4–9 → A–D, kelas 10–12 → A–E (bisa diganti guru). Prompt pembaca AI menyesuaikan tulisan tangan anak SD/SMP.
2. **Tanpa membuat soal.** Di *Ujian & Kunci Jawaban* guru cukup mengisi jumlah soal dan kunci: ketuk huruf, atau tempel cepat `ABCDABCD…` / `1.A 2.B`. Isian singkat: kunci + variasi. Uraian: jawaban acuan + skor (rubrik opsional `aspek|skor`). Sistem membuat butir soal "Soal nomor N" sendiri (topik *Kunci langsung*), sehingga cetak LJK, verifikasi, hasil, dan analisis tetap berjalan.
3. **Salah kunci? Koreksi saja.** Setelah LJK dipindai, kunci dan skor tetap boleh diubah; nilai pilihan ganda dihitung ulang otomatis (jawaban yang sudah diverifikasi guru tidak ditimpa). Jumlah/jenis soal terkunci setelah ada LJK.
4. **Lebih cepat.** Backend: cache berversi (satu penulisan = satu penanda versi, bukan hapus cache satu-satu), bootstrap per pengguna di-cache, klien yang datanya masih sama hanya menerima kuota+jam server, endpoint `batch` (beberapa panggilan, satu eksekusi), telemetri `ms`/`v`. Frontend: permintaan kembar digabung, pembacaan serentak dikirim sekali jalan, tampilan kerangka (skeleton) alih-alih spinner, skrip `defer`.

**Cara memperbarui dari versi 1** (data tidak berubah, skema Sheets sama)
1. Di Apps Script ganti isi `Kode` dan `Penilaian` dengan berkas baru (`appsscript.json` tidak berubah).
2. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy.** URL `/exec` tetap sama; sesi login lama tetap berlaku.
3. Frontend: ekstrak ZIP baru, salin isinya menimpa folder repo lama, **pertahankan `js/config.js` lama Anda**, lalu dari folder itu: `git add .` → `git commit -m "Versi 2.0"` → `git push`. Tekan Ctrl+Shift+R di peramban.
4. Contoh kelas SD/SMP hanya ada di mode demo; di backend sungguhan tambahkan kelas sendiri lewat Master Data (pilih Tingkat 1–12).

**Pembaruan cetak LJK (v2.1):** setiap siswa dijamin satu lembar A4. Bila soal banyak, tata letak dirapatkan otomatis lalu skala diperkecil; pratinjau menampilkan "1 lembar A4 (skala …%)" atau peringatan bila terlalu padat (sekitar >100 PG + banyak uraian). Hanya frontend yang berubah — cukup `git push` ulang, backend tidak perlu di-deploy ulang.

## Troubleshooting
| Gejala | Solusi |
|---|---|
| 404 di situs | `git init` dijalankan di folder yang salah. Masuk ke folder berisi `index.html`, ulangi `git init/add/commit`, lalu `git push -u origin main --force` |
| Tanpa gaya/CSS | `css/` dan `js/` tidak ikut → push ulang dari terminal |
| "Akses ditolak" saat login | Email belum ada di sheet **Pengguna** atau `aktif` = FALSE |
| Login Google gagal / `origin_mismatch` | Origin `https://USERNAME.github.io` belum ditambahkan di OAuth Client |
| "Balasan server tidak valid" | URL `/exec` salah atau akses deployment bukan *Anyone* |
| AI gagal | Isi API key di Pengaturan → **Uji koneksi API** |

## Catatan penggunaan
- Foto LJK dikompres otomatis di peramban (maks. 1800 px). Unggah **gambar** (JPG/PNG/WebP); PDF belum didukung.
- QR pada lembar cetak berisi `LJK|ujianId|siswaId|NIS`; bila QR tak terbaca, pilih siswa manual.
- Jawaban dengan keyakinan < ambang (default 70%) masuk antrean **Verifikasi**; semua perubahan nilai tercatat di *RiwayatNilai*.
