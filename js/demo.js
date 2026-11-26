/* ===== demo.js — backend tiruan di browser (aktif bila GAS_URL kosong) =====
   Meniru perilaku Kode.gs / Penilaian.gs agar seluruh alur dapat dicoba
   tanpa Apps Script. AI-nya palsu: bacaan & nilai dibangkitkan acak-terarah. */
(function () {
  'use strict';
  const L = window.L, KEY = 'ljk_demo_v1';
  const gal = (code, msg) => { const e = new Error(msg); e.code = code; return e; };
  const iso = (d) => { d = d || new Date(); const p = n => ('0' + n).slice(-2); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); };
  const bulat = (n, d) => { const p = Math.pow(10, d == null ? 2 : d); return Math.round((Number(n) || 0) * p) / p; };
  const klon = o => JSON.parse(JSON.stringify(o));
  const gambarMem = {};   // fileId → dataUrl (hanya sesi ini)
  let db = null;

  /* ---------- Normalisasi & pencocokan (salinan Penilaian.gs) ---------- */
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length; let p = []; for (let j = 0; j <= b.length; j++) p[j] = j; for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
  const mirip = (a, b) => { const m = Math.max(a.length, b.length); return m ? 1 - lev(a, b) / m : 1; };
  const neg = s => /(^| )(bukan|tidak|tanpa|non)( |$)/.test(s) ? 1 : 0;
  function memuat(j, k) { if (!k) return false; if (j.split(' ').length > k.split(' ').length + 3) return false; return (' ' + j + ' ').indexOf(' ' + k + ' ') >= 0; }
  function cocokIsian(jw, b) {
    const n = norm(jw); if (!n) return { kode: 'kosong' };
    const kand = [b.kunci].concat(b.variasi || []).map(norm).filter(Boolean);
    if (kand.indexOf(n) >= 0) return { kode: 'persis' };
    if (kand.some(k => neg(n) === neg(k) && memuat(n, k))) return { kode: 'persis' };
    let t = 0; kand.forEach(k => { t = Math.max(t, mirip(n, k)); });
    return t >= 0.85 && n.length > 3 ? { kode: 'typo', kemiripan: t } : { kode: 'ai', kemiripan: t };
  }
  const persenRule = (set, kode) => { const r = (set.parsial || []).find(x => x.kode === kode); return !r ? (kode === 'persis' ? 100 : 0) : r.aktif === false ? 0 : r.persen; };

  /* ---------- RNG deterministik ---------- */
  function rng(seed) { let h = 1779033703 ^ String(seed).length; for (let i = 0; i < String(seed).length; i++) { h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

  /* ---------- Data awal ---------- */
  function seed() {
    const t = (n) => 'c' + n;
    const s = {
      pengguna: [
        { id: 'p1', email: 'admin@sekolah.sch.id', nama: 'Drs. Supriyanto, M.Pd.', peran: 'admin', kelasDiampu: [], mapel: 'Matematika', nip: '196812121994031004', aktif: true, dibuat: iso(), terakhirMasuk: iso() },
        { id: 'p2', email: 'sri.wahyuni@sekolah.sch.id', nama: 'Hj. Sri Wahyuni, S.Pd.', peran: 'guru', kelasDiampu: ['k1', 'k2'], mapel: 'Biologi', nip: '198902142015032001', aktif: true, dibuat: iso(), terakhirMasuk: '' },
        { id: 'p3', email: 'ahmad.s@sekolah.sch.id', nama: 'Ahmad Syaifullah, S.Kom.', peran: 'guru', kelasDiampu: ['k3'], mapel: 'Fisika', nip: '199108192019021008', aktif: false, dibuat: iso(), terakhirMasuk: '' }
      ],
      kelas: [{ id: 'k1', nama: 'X IPA 1', tingkat: 'X', jurusan: 'IPA', waliKelas: 'Hj. Sri Wahyuni, S.Pd.' }, { id: 'k2', nama: 'X IPA 2', tingkat: 'X', jurusan: 'IPA', waliKelas: '' }, { id: 'k3', nama: 'XI MIPA 2', tingkat: 'XI', jurusan: 'MIPA', waliKelas: '' }],
      mapel: [{ id: 'm1', kode: 'MTK', nama: 'Matematika' }, { id: 'm2', kode: 'BIO', nama: 'Biologi' }, { id: 'm3', kode: 'BIN', nama: 'Bahasa Indonesia' }, { id: 'm4', kode: 'FIS', nama: 'Fisika' }, { id: 'm5', kode: 'KIM', nama: 'Kimia' }],
      siswa: [], bankSoal: [], ujian: [], soalUjian: [], ljk: [], jawaban: [], hasil: [], riwayat: [],
      set: null, aiKey: '', kuota: { hari: '', n: 0 }
    };
    const nm1 = ['Ahmad Fauzi Prasetyo', 'Anisa Rahmawati', 'Budi Santoso', 'Citra Dewi Lestari', 'Dimas Bagus Saputra', 'Eka Nurhaliza', 'Farhan Maulana Yusuf', 'Gita Permatasari', 'Hadi Prayitno', 'Intan Maharani', 'Joko Widodo Putra', 'Kartika Sari'];
    nm1.forEach((n, i) => s.siswa.push({ id: 's' + (i + 1), nis: '2024' + ('000' + (1001 + i)).slice(-4), nisn: '00812345' + (61 + i), nama: n, kelasId: 'k1', aktif: 'Aktif' }));
    ['Lintang Ayu Ningrum', 'Muhammad Rizky', 'Nadia Putri Utami', 'Oka Pratama'].forEach((n, i) => s.siswa.push({ id: 's' + (13 + i), nis: '2024' + (2001 + i), nisn: '00812346' + (10 + i), nama: n, kelasId: 'k2', aktif: 'Aktif' }));
    ['Putri Anjani', 'Qori Ramadhan', 'Rani Oktaviani'].forEach((n, i) => s.siswa.push({ id: 's' + (17 + i), nis: '2023' + (3001 + i), nisn: '00791234' + (10 + i), nama: n, kelasId: 'k3', aktif: i === 2 ? 'Nonaktif' : 'Aktif' }));

    const pg = (id, kode, mapel, teks, ops, kunci, topik, kog) => ({ id, kode, mapelId: mapel, tingkat: 'X', jenis: 'PG', teks, kognitif: kog || 'C2', topik, bobot: 2, opsi: ops.map((o, i) => ({ key: 'ABCDE'[i], teks: o })), kunci, variasi: [], jawabanIdeal: '', rubrik: [], lampiranId: '', pemilik: 'admin@sekolah.sch.id', dibuat: iso() });
    const isi = (id, kode, mapel, teks, kunci, vari, topik) => ({ id, kode, mapelId: mapel, tingkat: 'X', jenis: 'ISIAN', teks, kognitif: 'C2', topik, bobot: 3, opsi: [], kunci, variasi: vari, jawabanIdeal: '', rubrik: [], lampiranId: '', pemilik: 'admin@sekolah.sch.id', dibuat: iso() });
    const ura = (id, kode, mapel, teks, ideal, rub, topik) => ({ id, kode, mapelId: mapel, tingkat: 'X', jenis: 'URAIAN', teks, kognitif: 'C4', topik, bobot: rub.reduce((t, a) => t + a.bobot, 0), opsi: [], kunci: '', variasi: [], jawabanIdeal: ideal, rubrik: rub, lampiranId: '', pemilik: 'admin@sekolah.sch.id', dibuat: iso() });
    s.bankSoal = [
      pg('q1', 'BQ-BIO-001', 'm2', 'Organel sel yang berperan dalam sintesis protein adalah ...', ['Mitokondria', 'Ribosom', 'Lisosom', 'Badan Golgi', 'Vakuola'], 'B', 'Sitologi & Organel'),
      pg('q2', 'BQ-BIO-002', 'm2', 'Organel penghasil energi (ATP) utama pada sel eukariotik adalah ...', ['Mitokondria', 'Ribosom', 'Nukleus', 'Retikulum Endoplasma', 'Plastida'], 'A', 'Metabolisme'),
      pg('q3', 'BQ-BIO-003', 'm2', 'Bagian sel yang mengatur seluruh aktivitas sel karena mengandung DNA adalah ...', ['Sitoplasma', 'Membran sel', 'Inti sel', 'Dinding sel', 'Lisosom'], 'C', 'Sitologi & Organel'),
      pg('q4', 'BQ-BIO-004', 'm2', 'Perbedaan utama sel hewan dan sel tumbuhan terletak pada keberadaan ...', ['Ribosom', 'Dinding sel dan kloroplas', 'Mitokondria', 'Membran plasma', 'Sitoplasma'], 'B', 'Struktur Sel Komparatif'),
      pg('q5', 'BQ-BIO-005', 'm2', 'Pengangkutan zat dari konsentrasi rendah ke tinggi dengan energi disebut ...', ['Difusi', 'Osmosis', 'Difusi terfasilitasi', 'Transpor aktif', 'Endositosis pasif'], 'D', 'Fisiologi Membran'),
      pg('q6', 'BQ-BIO-006', 'm2', 'Lisosom berfungsi untuk ...', ['Sintesis lipid', 'Mencerna zat sisa dan sel rusak', 'Menghasilkan ATP', 'Fotosintesis', 'Menyimpan DNA'], 'B', 'Sitologi & Organel'),
      isi('q7', 'BQ-BIO-007', 'm2', 'Sebutkan organel penghasil energi utama pada sel!', 'Mitokondria', ['Mitokondrion', 'Mitochondria'], 'Metabolisme'),
      isi('q8', 'BQ-BIO-008', 'm2', 'Sebutkan nama ibu kota baru Negara Indonesia!', 'Nusantara', ['IKN Nusantara', 'Kota Nusantara', 'Ibu Kota Nusantara'], 'Umum'),
      isi('q9', 'BQ-BIO-009', 'm2', 'Tuliskan fungsi utama membran plasma secara singkat!', 'Mengatur keluar masuk zat', ['Seleksi zat', 'Pengatur lalu lintas zat', 'Menyeleksi keluar masuknya zat'], 'Membran'),
      ura('q10', 'BQ-BIO-010', 'm2', 'Jelaskan mekanisme transpor aktif melalui membran sel secara ringkas!', 'Transpor aktif memindahkan zat melawan gradien konsentrasi dari konsentrasi rendah ke tinggi dengan bantuan protein pembawa dan energi ATP, contohnya pompa natrium-kalium.', [{ aspek: 'Arah melawan gradien konsentrasi', bobot: 3, deskripsi: 'konsentrasi rendah ke tinggi melawan gradien' }, { aspek: 'Peran protein pembawa', bobot: 3, deskripsi: 'protein pembawa pompa' }, { aspek: 'Kebutuhan energi ATP', bobot: 2, deskripsi: 'energi ATP' }, { aspek: 'Contoh pompa Na-K', bobot: 2, deskripsi: 'natrium kalium contoh' }], 'Fisiologi Membran'),
      pg('q11', 'BQ-MTK-001', 'm1', 'Nilai x yang memenuhi 2x + 6 = 14 adalah ...', ['2', '3', '4', '5', '6'], 'C', 'Persamaan Linier'),
      pg('q12', 'BQ-MTK-002', 'm1', 'Gradien garis y = 3x - 5 adalah ...', ['-5', '3', '5', '-3', '1/3'], 'B', 'Persamaan Linier'),
      pg('q13', 'BQ-MTK-003', 'm1', 'Himpunan penyelesaian x - 7 = 2 adalah ...', ['5', '9', '-9', '-5', '14'], 'B', 'Persamaan Linier'),
      isi('q14', 'BQ-MTK-004', 'm1', 'Tentukan nilai y dari 3y = 21!', '7', ['tujuh'], 'Persamaan Linier'),
      isi('q15', 'BQ-KIM-001', 'm5', 'Tuliskan lambang unsur natrium!', 'Na', ['NA'], 'Unsur'),
      pg('q16', 'BQ-KIM-002', 'm5', 'Unsur dengan nomor atom 8 adalah ...', ['Hidrogen', 'Oksigen', 'Karbon', 'Nitrogen', 'Helium'], 'B', 'Unsur')
    ];
    const uj = (id, kode, nama, jenis, kelas, mapel, tgl, bobot, dicetak) => ({ id, kode, nama, jenis, kelasId: kelas, mapelId: mapel, tanggal: tgl, durasi: 90, instruksi: 'Gunakan pensil 2B untuk menghitamkan bulatan. Jawab isian dan uraian dengan pena hitam secara ringkas.', bobotPG: bobot[0], bobotIsian: bobot[1], bobotUraian: bobot[2], dicetak, pemilik: 'admin@sekolah.sch.id', dibuat: iso() });
    s.ujian = [
      uj('u1', 'UJ-2026-X-MTK01', 'Penilaian Harian 1 - Aljabar Linier', 'PH', 'k1', 'm1', '2026-10-14', [80, 20, 0], true),
      uj('u2', 'UJ-2026-X-BIO01', 'Penilaian Tengah Semester (PTS) Biologi Sel', 'PTS', 'k1', 'm2', '2026-10-18', [40, 30, 30], true),
      uj('u3', 'UJ-2026-X-FIS01', 'Kuis Teori Kinetik Gas', 'Kuis', 'k2', 'm4', '2026-11-25', [100, 0, 0], true),
      uj('u4', 'UJ-2026-XI-KIM01', 'Penilaian Harian 2 - Stoikiometri', 'PH', 'k3', 'm5', '2026-11-28', [60, 40, 0], false),
      uj('u5', 'UJ-2026-X-KIM02', 'Remedial PH-1 Ikatan Kimia', 'Remedial', 'k2', 'm5', '2026-11-30', [60, 40, 0], false)
    ];
    const paket = (u, ids) => ids.forEach((q, i) => s.soalUjian.push({ id: 'su_' + u + '_' + i, ujianId: u, nomor: i + 1, soalId: q, bobot: s.bankSoal.find(b => b.id === q).bobot }));
    paket('u1', ['q11', 'q12', 'q13', 'q14']);
    paket('u2', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10']);
    paket('u3', ['q1', 'q3', 'q5']);
    paket('u4', ['q15', 'q16']);
    s.set = klon(L.demoDefaults);
    s.set.tahunAjaran = '2026/2027';
    return s;
  }
  L.demoDefaults = {
    namaSekolah: 'SMA Negeri 1 Merdeka', tahunAjaran: '', semester: 'Ganjil', kkm: 70, ambangVerifikasi: 70, autoTerimaAktif: true, autoTerima: 90, tandaiGanda: true,
    bobotPG: 40, bobotIsian: 30, bobotUraian: 30, kuotaHarian: 120, aiProvider: 'anthropic', aiModel: '', notifikasiEmail: false, formatNamaPdf: 'REKAP_{UJIAN}_{KELAS}_{TANGGAL}',
    parsial: [
      { kode: 'persis', kategori: 'Persis Sama / Variasi Resmi', kriteria: 'Teks identik setelah normalisasi atau cocok dengan variasi jawaban', persen: 100, aktif: true },
      { kode: 'typo', kategori: 'Typo Ringan (Koreksi Huruf)', kriteria: 'Kemiripan teks ≥ 85% (jarak Levenshtein kecil)', persen: 80, aktif: true },
      { kode: 'semantik', kategori: 'Kemiripan Semantik AI', kriteria: 'AI menilai maknanya sama dengan kunci', persen: 75, aktif: true },
      { kode: 'sebagian', kategori: 'Sebagian Benar', kriteria: 'AI menilai jawaban benar tetapi belum lengkap', persen: 50, aktif: true },
      { kode: 'salah', kategori: 'Salah / Tidak Terkait', kriteria: 'Tidak memenuhi kondisi di atas', persen: 0, aktif: true }]
  };

  /* ---------- AI palsu: pembacaan LJK ---------- */
  function bacaPalsu(ljk, soal) {
    const R = rng(ljk.id + ljk.siswaId), out = { quality: { score: Math.round(70 + R() * 28), issues: [] }, pg: {}, isian: {}, uraian: {} };
    if (R() < 0.12) { out.quality.score = Math.round(48 + R() * 14); out.quality.issues = ['foto miring']; }
    soal.forEach(({ su, bank: b }) => {
      const n = su.nomor;
      if (b.jenis === 'PG') {
        const x = R(); let a = b.kunci, conf = 80 + R() * 19;
        if (x > 0.72) a = 'ABCDE'.replace(b.kunci, '')[Math.floor(R() * 4)];
        if (x > 0.96) { a = ''; conf = 55 + R() * 10; } else if (x > 0.93) { a = b.kunci + ',' + 'ABCDE'.replace(b.kunci, '')[0]; conf = 50 + R() * 15; }
        out.pg[n] = { no: n, answer: a, confidence: Math.round(conf) };
      } else if (b.jenis === 'ISIAN') {
        const x = R(); let tx = b.kunci, conf = 78 + R() * 20;
        if (x > 0.45 && x <= 0.6 && (b.variasi || []).length) tx = b.variasi[Math.floor(R() * b.variasi.length)];
        else if (x > 0.6 && x <= 0.75) tx = b.kunci.slice(0, -1) + ' ';
        else if (x > 0.75 && x <= 0.88) { tx = 'ibu kota ' + b.kunci.toLowerCase(); conf = 58 + R() * 12; }
        else if (x > 0.88) { tx = ['Jakarta', 'tidak tahu', 'Kalimantan'][Math.floor(R() * 3)]; conf = 60 + R() * 20; }
        out.isian[n] = { no: n, text: tx, confidence: Math.round(conf), bbox: [80 + Math.round(R() * 20), 520 + n * 18, 900, 560 + n * 18] };
      } else {
        const kal = b.jawabanIdeal.split(/(?<=\.)\s|,\s/).filter(Boolean), pot = Math.max(1, Math.round(kal.length * (0.35 + R() * 0.65)));
        out.uraian[n] = { no: n, text: kal.slice(0, pot).join(', ').replace(/\.$/, '') + '.', confidence: Math.round(52 + R() * 40), bbox: [60, 700, 940, 940] };
      }
    });
    return out;
  }
  /* AI palsu: penilaian makna */
  function nilaiPalsu(it) {
    const R = rng(it.row.id), b = it.bank, tx = norm(it.row.jawabanTerbaca);
    if (b.jenis === 'ISIAN') {
      const kt = norm(b.kunci).split(' '), hit = kt.filter(w => tx.indexOf(w) >= 0).length / kt.length;
      const kat = (tx.indexOf('ibu kota') >= 0 && hit >= 1) ? 'sama_makna' : hit >= 0.99 ? 'sama_makna' : hit >= 0.5 ? 'sebagian' : 'salah';
      return { kategori: kat, alasan: kat === 'sama_makna' ? 'Maknanya sama dengan kunci jawaban.' : kat === 'sebagian' ? 'Jawaban benar sebagian, belum lengkap.' : 'Jawaban tidak sesuai dengan kunci walau mungkin ada kata mirip.', confidence: Math.round(60 + R() * 38) };
    }
    const aspek = b.rubrik.map(a => { const w = norm(a.deskripsi).split(' ').filter(x => x.length > 3), hit = w.length ? w.filter(x => tx.indexOf(x) >= 0).length / w.length : 0; return { aspek: a.aspek, skor: hit >= 0.6 ? a.bobot : hit >= 0.3 ? a.bobot / 2 : 0 }; });
    const full = aspek.filter((a, i) => a.skor === b.rubrik[i].bobot).length;
    return { aspek, alasan: full + ' dari ' + aspek.length + ' aspek rubrik terpenuhi lengkap.', confidence: Math.round(55 + R() * 40) };
  }

  /* ---------- Penilaian (salinan alur Penilaian.gs) ---------- */
  const soalLengkap = uid => db.soalUjian.filter(s => s.ujianId === uid).sort((a, b) => a.nomor - b.nomor).map(su => ({ su, bank: db.bankSoal.find(b => b.id === su.soalId) })).filter(x => x.bank);
  function nilaiSemua(ljk, uj, soal, bc, set) {
    const rows = [], perlu = [];
    soal.forEach(({ su, bank: b }) => {
      const row = { id: 'jw_' + Math.random().toString(36).slice(2, 10), ljkId: ljk.id, ujianId: uj.id, siswaId: ljk.siswaId, soalId: b.id, nomor: su.nomor, jenis: b.jenis, jawabanTerbaca: '', skor: 0, skorMaks: su.bobot, aspek: [], alasan: '', keyakinan: 0, status: 'Otomatis', bbox: null, catatanGuru: '' };
      let paksa = false;
      if (b.jenis === 'PG') {
        const r = bc.pg[su.nomor]; const a = String(r.answer || '').toUpperCase();
        row.jawabanTerbaca = a; row.keyakinan = r.confidence;
        if (!a) row.alasan = 'Tidak dijawab';
        else if (a.indexOf(',') >= 0) { row.alasan = 'Terdeteksi lebih dari satu bulatan'; if (set.tandaiGanda) paksa = true; }
        else if (a === b.kunci) { row.skor = su.bobot; row.alasan = 'Sesuai kunci (' + b.kunci + ')'; } else row.alasan = 'Jawaban ' + a + ', kunci ' + b.kunci;
      } else {
        const r = bc[b.jenis === 'ISIAN' ? 'isian' : 'uraian'][su.nomor];
        row.jawabanTerbaca = r.text.trim(); row.keyakinan = r.confidence; row.bbox = r.bbox;
        if (b.jenis === 'ISIAN') {
          const c = cocokIsian(row.jawabanTerbaca, b);
          if (c.kode === 'persis') { row.skor = su.bobot * persenRule(set, 'persis') / 100; row.alasan = 'Sama dengan kunci / variasi yang diterima'; row.aspek = [{ aspek: 'Kecocokan jawaban', bobot: su.bobot, skor: row.skor }]; }
          else if (c.kode === 'typo') { row.skor = su.bobot * persenRule(set, 'typo') / 100; row.alasan = 'Mirip kunci (' + Math.round(c.kemiripan * 100) + '%), kemungkinan salah tulis ringan'; row.aspek = [{ aspek: 'Kecocokan jawaban', bobot: su.bobot, skor: row.skor }]; }
          else perlu.push({ row, bank: b });
        } else perlu.push({ row, bank: b });
      }
      row._p = paksa; rows.push(row);
    });
    perlu.forEach(it => {
      const h = nilaiPalsu(it), row = it.row, b = it.bank; row.keyakinan = Math.min(row.keyakinan, h.confidence); row.alasan = h.alasan;
      if (b.jenis === 'ISIAN') { const kode = h.kategori === 'sama_makna' ? 'semantik' : h.kategori === 'sebagian' ? 'sebagian' : 'salah'; row.skor = row.skorMaks * persenRule(set, kode) / 100; row.aspek = [{ aspek: 'Kecocokan makna (' + kode + ')', bobot: row.skorMaks, skor: row.skor }]; }
      else { const tot = b.rubrik.reduce((t, a) => t + a.bobot, 0) || 1; row.aspek = b.rubrik.map((a, i) => ({ aspek: a.aspek, bobot: a.bobot, skor: Math.min(a.bobot, h.aspek[i].skor) })); row.skor = row.aspek.reduce((t, a) => t + a.skor, 0) * row.skorMaks / tot; }
    });
    rows.forEach(r => { r.skor = bulat(Math.min(r.skor, r.skorMaks), 2); r.status = (r._p || r.keyakinan < set.ambangVerifikasi) ? 'Perlu Verifikasi' : 'Otomatis'; delete r._p; });
    return rows;
  }
  function hitungNilai(uj, soalUjian, jawaban) {
    const per = { PG: { e: 0, m: 0 }, ISIAN: { e: 0, m: 0 }, URAIAN: { e: 0, m: 0 } }, by = {};
    jawaban.forEach(j => { by[j.soalId] = j; });
    soalUjian.forEach(su => { const b = db.bankSoal.find(x => x.id === su.soalId); if (!b) return; per[b.jenis].m += su.bobot; if (by[su.soalId]) per[b.jenis].e += Math.min(by[su.soalId].skor, su.bobot); });
    const w = { PG: uj.bobotPG, ISIAN: uj.bobotIsian, URAIAN: uj.bobotUraian }; let sw = 0; Object.keys(per).forEach(t => { if (per[t].m > 0) sw += w[t]; });
    const o = { PG: 0, ISIAN: 0, URAIAN: 0, akhir: 0 };
    if (sw > 0) Object.keys(per).forEach(t => { if (per[t].m > 0) o[t] = bulat(per[t].e / per[t].m * w[t] * (100 / sw), 2); });
    o.akhir = bulat(o.PG + o.ISIAN + o.URAIAN, 1); return o;
  }
  function simpanRingkasan(ljk, uj, soalUjian, rows, set, q) {
    const perlu = rows.filter(r => r.status === 'Perlu Verifikasi').length, n = hitungNilai(uj, soalUjian, rows);
    const i = db.ljk.findIndex(l => l.id === ljk.id), rec = Object.assign({}, db.ljk[i], { status: perlu ? 'Perlu Verifikasi' : 'Selesai', skorTotal: n.akhir, jumlahPerlu: perlu, waktuSelesai: iso() });
    if (q) { rec.kualitas = q.score; rec.kualitasLabel = q.score >= 85 ? 'Baik' : q.score >= 60 ? 'Cukup' : 'Buram'; rec.catatan = (q.issues || []).join(', '); }
    db.ljk[i] = rec;
    const st = perlu ? 'Perlu Verifikasi' : n.akhir < set.kkm ? 'Dibawah KKM' : rows.some(r => r.status === 'Diubah Guru') ? 'Diverifikasi Guru' : rows.some(r => r.status === 'Terverifikasi') ? 'Terverifikasi' : 'Otomatis Valid';
    const h = { id: uj.id + '_' + ljk.siswaId, ujianId: uj.id, siswaId: ljk.siswaId, nilaiPG: n.PG, nilaiIsian: n.ISIAN, nilaiUraian: n.URAIAN, nilaiAkhir: n.akhir, status: st, diperbarui: iso() };
    const hi = db.hasil.findIndex(x => x.id === h.id); if (hi >= 0) db.hasil[hi] = h; else db.hasil.push(h);
    return { ljk: pub(rec), hasil: h, jumlahPerlu: perlu };
  }
  const pub = l => { const o = Object.assign({}, l); o.adaFile = !!(l.fileId && gambarMem[l.fileId]); delete o.fileId; return o; };
  function prosesLJK(ljkId, tanpaKuota) {
    const ljk = db.ljk.find(l => l.id === ljkId); if (!ljk) throw gal('NOT_FOUND', 'LJK tidak ditemukan.');
    const uj = db.ujian.find(u => u.id === ljk.ujianId), set = db.set, soal = soalLengkap(uj.id);
    if (!soal.length) throw gal('DATA', 'Ujian belum memiliki soal.');
    if (!tanpaKuota) { const h = new Date().toISOString().slice(0, 10); if (db.kuota.hari !== h) db.kuota = { hari: h, n: 0 }; if (db.kuota.n >= set.kuotaHarian) throw gal('KUOTA', 'Kuota koreksi harian (' + set.kuotaHarian + ' LJK) sudah habis. Lanjutkan besok atau naikkan batas di Pengaturan Sistem.'); db.kuota.n++; }
    const bc = bacaPalsu(ljk, soal), rows = nilaiSemua(ljk, uj, soal, bc, set);
    db.jawaban = db.jawaban.filter(j => j.ljkId !== ljk.id); db.jawaban.push.apply(db.jawaban, rows);
    return simpanRingkasan(ljk, uj, soal.map(s => s.su), rows, set, bc.quality);
  }

  /* ---------- Akses ---------- */
  const boleh = (u, uj) => u.peran === 'admin' || uj.pemilik === u.email || (u.kelasDiampu || []).indexOf(uj.kelasId) >= 0;
  const ambilUjian = (id, u) => { const uj = db.ujian.find(x => x.id === id); if (!uj) throw gal('NOT_FOUND', 'Ujian tidak ditemukan.'); if (!boleh(u, uj)) throw gal('FORBIDDEN', 'Anda tidak memiliki akses ke ujian ini.'); return uj; };
  const simpanDb = () => { try { const c = klon(db); localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { } };
  function muat() {
    if (db) return;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db) {
      db = seed();
      db.ljk = []; db.jawaban = []; db.hasil = [];
      db.siswa.filter(s => s.kelasId === 'k1').forEach((s, i) => {
        ['u1', 'u2'].forEach(uid => {
          if (uid === 'u2' && i >= 10) return;
          const l = { id: 'l_' + uid + '_' + s.id, ujianId: uid, siswaId: s.id, nis: s.nis, fileId: '', status: 'Menunggu', kualitas: 0, kualitasLabel: '', catatan: '', skorTotal: 0, jumlahPerlu: 0, waktuUnggah: iso(new Date(Date.now() - 86400e3 * 30 + i * 9000)), waktuSelesai: '', pengunggah: 'admin@sekolah.sch.id' };
          db.ljk.push(l); prosesLJK(l.id, true);
        });
      });
      // beri satu contoh “Dibawah KKM” yang tegas & riwayat audit
      simpanDb();
    }
  }

  function stat(ujianList, ljk, hasil, kkm) {
    const st = {}; ujianList.forEach(u => { st[u.id] = { ljk: 0, selesai: 0, proses: 0, verif: 0, gagal: 0, n: 0, rata: 0, min: 0, max: 0, lulus: 0, hist: [0, 0, 0, 0, 0] }; });
    ljk.forEach(l => { const s = st[l.ujianId]; if (!s) return; s.ljk++; if (l.status === 'Menunggu' || l.status === 'Diproses') s.proses++; else if (l.status === 'Gagal') s.gagal++; else { s.selesai++; s.verif += l.jumlahPerlu || 0; } });
    const j = {}; hasil.forEach(h => { const s = st[h.ujianId]; if (!s) return; const n = h.nilaiAkhir; j[h.ujianId] = (j[h.ujianId] || 0) + n; s.n++; s.min = s.n === 1 ? n : Math.min(s.min, n); s.max = s.n === 1 ? n : Math.max(s.max, n); if (n >= kkm) s.lulus++; s.hist[n <= 50 ? 0 : n <= 65 ? 1 : n <= 75 ? 2 : n <= 85 ? 3 : 4]++; });
    Object.keys(st).forEach(id => { if (st[id].n) st[id].rata = bulat(j[id] / st[id].n, 1); }); return st;
  }
  const kuotaInfo = () => { const h = new Date().toISOString().slice(0, 10); return { terpakai: db.kuota.hari === h ? db.kuota.n : 0, batas: db.set.kuotaHarian }; };

  /* ---------- Router aksi ---------- */
  const H = {
    'auth.masuk'(d) { muat(); const admin = d.peran !== 'guru'; const u = db.pengguna.find(p => p.peran === (admin ? 'admin' : 'guru') && p.aktif); return { token: 'demo-' + Math.random().toString(36).slice(2), user: { id: u.id, email: u.email, nama: u.nama, peran: u.peran, kelasDiampu: u.kelasDiampu, mapel: u.mapel } }; },
    'auth.keluar'() { return true; },
    bootstrap(d, u) {
      const admin = u.peran === 'admin', set = db.set;
      let ujian = db.ujian.filter(x => admin || boleh(u, x)); const idu = {}; ujian.forEach(x => { idu[x.id] = 1; });
      const su = db.soalUjian.filter(x => idu[x.ujianId]); let bank = db.bankSoal; if (!admin) { const dp = {}; su.forEach(s => { dp[s.soalId] = 1; }); bank = bank.filter(b => b.pemilik === u.email || dp[b.id]); }
      const ljk = db.ljk.filter(l => idu[l.ujianId]), hasil = db.hasil.filter(h => idu[h.ujianId]);
      return klon({ user: u, set, kelas: db.kelas, mapel: db.mapel, siswa: db.siswa, bankSoal: bank, ujian, soalUjian: su, ljk: ljk.map(pub), stat: stat(ujian, ljk, hasil, set.kkm), pengguna: admin ? db.pengguna : [], kuota: kuotaInfo(), ai: { provider: set.aiProvider, model: set.aiModel || (set.aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'claude-sonnet-5-5'), keyTail: db.aiKey.slice(-4), terhubung: !!db.aiKey }, drive: admin ? { rootFolder: '1aB2cD3eFgHiJkLmNoPqRsTuVwXyZ', uploads: '(mode demo — tidak memakai Drive)' } : null, waktuServer: iso() });
    },
    'crud.simpan'(d, u) {
      const peta = { Kelas: 'kelas', Mapel: 'mapel', Siswa: 'siswa', Pengguna: 'pengguna', BankSoal: 'bankSoal' }, key = peta[d.sheet]; if (!key) throw gal('VALIDASI', 'Sheet tidak dapat diubah.');
      const adm = { Kelas: 1, Mapel: 1, Siswa: 1, Pengguna: 1 }; if (adm[d.sheet] && u.peran !== 'admin') throw gal('FORBIDDEN', 'Anda tidak memiliki izin mengubah data ini.');
      const wajib = { Kelas: ['nama'], Mapel: ['nama'], Siswa: ['nis', 'nama', 'kelasId'], Pengguna: ['email', 'nama', 'peran'], BankSoal: ['jenis', 'teks', 'mapelId'] }[d.sheet], unik = { Siswa: 'nis', Pengguna: 'email' }[d.sheet];
      const out = [], tolak = [];
      (d.records || []).forEach((raw, idx) => {
        try {
          let r = klon(raw); wajib.forEach(k => { if (r[k] == null || String(r[k]).trim() === '') throw gal('VALIDASI', 'Kolom "' + k + '" wajib diisi.'); });
          let lama = r.id ? db[key].find(x => x.id === r.id) : null;
          if (unik) { const dup = db[key].find(x => String(x[unik]).toLowerCase() === String(r[unik]).toLowerCase() && (!lama || x.id !== lama.id)); if (dup) { if (d.upsertUnik && !lama) { lama = dup; r.id = dup.id; } else throw gal('VALIDASI', unik.toUpperCase() + ' "' + r[unik] + '" sudah terdaftar.'); } }
          if (d.sheet === 'BankSoal' && lama && u.peran !== 'admin' && lama.pemilik !== u.email) throw gal('FORBIDDEN', 'Soal milik guru lain tidak dapat diubah.');
          if (d.sheet === 'Pengguna') { r.email = r.email.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) throw gal('VALIDASI', 'Format email tidak valid: ' + r.email); r.aktif = r.aktif !== false; r.kelasDiampu = r.kelasDiampu || []; r.dibuat = lama ? lama.dibuat : iso(); r.terakhirMasuk = lama ? lama.terakhirMasuk : ''; if (lama && lama.peran === 'admin' && (r.peran !== 'admin' || !r.aktif) && !db.pengguna.some(x => x.id !== lama.id && x.peran === 'admin' && x.aktif)) throw gal('VALIDASI', 'Harus ada minimal satu Administrator aktif.'); }
          if (d.sheet === 'Siswa') r.aktif = r.aktif === 'Nonaktif' ? 'Nonaktif' : 'Aktif';
          if (d.sheet === 'Mapel' && !r.kode) r.kode = r.nama.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
          if (d.sheet === 'BankSoal') {
            r.teks = L.sanitizeRich(r.teks); if (!L.polos(r.teks)) throw gal('VALIDASI', 'Teks soal wajib diisi.');
            if (r.jenis === 'PG') { r.opsi = (r.opsi || []).filter(o => String(o.teks).trim()); if (r.opsi.length < 2) throw gal('VALIDASI', 'Soal pilihan ganda minimal memiliki 2 opsi.'); if (!r.opsi.some(o => o.key === r.kunci)) throw gal('VALIDASI', 'Kunci jawaban harus salah satu opsi.'); }
            else if (r.jenis === 'ISIAN') { if (!String(r.kunci || '').trim()) throw gal('VALIDASI', 'Kunci jawaban utama wajib diisi.'); r.variasi = (r.variasi || []).filter(Boolean); }
            else { r.rubrik = (r.rubrik || []).filter(a => a.aspek && a.bobot > 0); if (!r.rubrik.length) throw gal('VALIDASI', 'Soal uraian minimal memiliki 1 aspek rubrik.'); r.bobot = r.rubrik.reduce((t, a) => t + Number(a.bobot), 0); }
            r.bobot = Number(r.bobot); if (!(r.bobot > 0)) throw gal('VALIDASI', 'Bobot soal harus lebih dari 0.');
            r.pemilik = lama ? lama.pemilik : u.email; r.dibuat = lama ? lama.dibuat : iso();
            if (!r.kode) { const mp = db.mapel.find(m => m.id === r.mapelId); r.kode = 'BQ-' + (mp ? mp.kode : 'UMM') + '-' + ('000' + (db.bankSoal.length + 1)).slice(-3); }
          }
          if (!r.id) r.id = d.sheet.charAt(0).toLowerCase() + '-' + Math.random().toString(36).slice(2, 9);
          const i = db[key].findIndex(x => x.id === r.id); if (i >= 0) db[key][i] = r; else db[key].push(r); out.push(r);
        } catch (e) { if (d.records.length === 1) throw e; tolak.push({ index: idx, alasan: e.message }); }
      });
      return { records: out, ditolak: tolak };
    },
    'crud.hapus'(d, u) {
      const peta = { Kelas: 'kelas', Mapel: 'mapel', Siswa: 'siswa', Pengguna: 'pengguna', BankSoal: 'bankSoal' }, key = peta[d.sheet], ids = {}; (d.ids || []).forEach(i => { ids[i] = 1; });
      if (d.sheet !== 'BankSoal' && u.peran !== 'admin') throw gal('FORBIDDEN', 'Anda tidak memiliki izin menghapus data ini.');
      if (d.sheet === 'Siswa' && db.ljk.some(l => ids[l.siswaId])) throw gal('VALIDASI', 'Siswa yang sudah memiliki data ujian tidak dapat dihapus. Nonaktifkan saja statusnya.');
      if (d.sheet === 'Kelas') { if (db.siswa.some(s => ids[s.kelasId])) throw gal('VALIDASI', 'Kelas masih memiliki siswa. Pindahkan atau hapus siswanya dulu.'); if (db.ujian.some(x => ids[x.kelasId])) throw gal('VALIDASI', 'Kelas masih dipakai oleh ujian.'); }
      if (d.sheet === 'Mapel' && (db.bankSoal.some(b => ids[b.mapelId]) || db.ujian.some(x => ids[x.mapelId]))) throw gal('VALIDASI', 'Mata pelajaran masih dipakai oleh soal atau ujian.');
      if (d.sheet === 'Pengguna' && ids[u.id]) throw gal('VALIDASI', 'Anda tidak dapat menghapus akun sendiri.');
      if (d.sheet === 'BankSoal') { if (db.soalUjian.some(s => ids[s.soalId])) throw gal('VALIDASI', 'Soal masih dipakai pada ujian. Keluarkan dari ujian terlebih dahulu.'); if (u.peran !== 'admin' && db.bankSoal.some(b => ids[b.id] && b.pemilik !== u.email)) throw gal('FORBIDDEN', 'Soal milik guru lain tidak dapat dihapus.'); }
      const n = db[key].length; db[key] = db[key].filter(x => !ids[x.id]); return { dihapus: n - db[key].length };
    },
    'ujian.simpan'(d, u) {
      const x = d.ujian || {}, ds = d.soal || [];
      if (!String(x.nama || '').trim()) throw gal('VALIDASI', 'Nama ujian wajib diisi.'); if (!x.kelasId || !x.mapelId) throw gal('VALIDASI', 'Kelas dan mata pelajaran wajib dipilih.');
      if (Math.round((+x.bobotPG || 0) + (+x.bobotIsian || 0) + (+x.bobotUraian || 0)) !== 100) throw gal('VALIDASI', 'Total pembobotan harus tepat 100%.');
      const lama = x.id ? db.ujian.find(e => e.id === x.id) : null; if (lama && !boleh(u, lama)) throw gal('FORBIDDEN', 'Anda tidak memiliki akses ke ujian ini.');
      const ada = lama ? db.ljk.some(l => l.ujianId === lama.id) : false;
      if (ada) { const ls = db.soalUjian.filter(s => s.ujianId === lama.id); if (!(ls.length === ds.length && ls.every((s, i) => s.soalId === ds[i].soalId))) throw gal('VALIDASI', 'Daftar soal tidak dapat diubah karena LJK sudah dipindai. Hapus data LJK ujian ini terlebih dahulu.'); }
      const kl = db.kelas.find(k => k.id === x.kelasId), mp = db.mapel.find(m => m.id === x.mapelId);
      const rec = { id: lama ? lama.id : 'UJ-' + Math.random().toString(36).slice(2, 9), kode: lama ? lama.kode : '', nama: x.nama.trim(), jenis: x.jenis || 'PH', kelasId: x.kelasId, mapelId: x.mapelId, tanggal: x.tanggal || '', durasi: +x.durasi || 90, instruksi: String(x.instruksi || '').trim(), bobotPG: +x.bobotPG, bobotIsian: +x.bobotIsian, bobotUraian: +x.bobotUraian, dicetak: lama ? lama.dicetak : false, pemilik: lama ? lama.pemilik : u.email, dibuat: lama ? lama.dibuat : iso() };
      if (!rec.kode) { const aw = 'UJ-' + (rec.tanggal || iso()).slice(0, 4) + '-' + (kl.tingkat || 'X') + '-' + mp.kode; rec.kode = aw + ('0' + (db.ujian.filter(e => e.kode.indexOf(aw) === 0).length + 1)).slice(-2); }
      const baris = ds.map((s, i) => { const b = db.bankSoal.find(q => q.id === s.soalId); if (!b) throw gal('VALIDASI', 'Soal nomor ' + (i + 1) + ' tidak ditemukan di bank soal.'); return { id: 'su_' + Math.random().toString(36).slice(2, 9), ujianId: rec.id, nomor: i + 1, soalId: s.soalId, bobot: +s.bobot > 0 ? +s.bobot : b.bobot }; });
      const i = db.ujian.findIndex(e => e.id === rec.id); if (i >= 0) db.ujian[i] = rec; else db.ujian.push(rec);
      if (!ada) { db.soalUjian = db.soalUjian.filter(s => s.ujianId !== rec.id).concat(baris); }
      return klon({ ujian: rec, soalUjian: ada ? db.soalUjian.filter(s => s.ujianId === rec.id) : baris });
    },
    'ujian.dicetak'(d, u) { const uj = ambilUjian(d.id, u); if (!db.soalUjian.some(s => s.ujianId === uj.id)) throw gal('VALIDASI', 'Ujian belum memiliki soal.'); uj.dicetak = true; return { id: uj.id, dicetak: true }; },
    'ujian.hapus'(d, u) {
      const uj = ambilUjian(d.id, u); if (u.peran !== 'admin' && uj.pemilik !== u.email) throw gal('FORBIDDEN', 'Hanya pemilik ujian atau Administrator yang dapat menghapus.');
      ['jawaban', 'hasil', 'riwayat', 'ljk', 'soalUjian'].forEach(k => { db[k] = db[k].filter(r => r.ujianId !== uj.id); }); db.ujian = db.ujian.filter(e => e.id !== uj.id); return { dihapus: uj.id };
    },
    'jawaban.ujian'(d, u) { const uj = ambilUjian(d.ujianId, u); return klon({ jawaban: db.jawaban.filter(j => j.ujianId === uj.id), hasil: db.hasil.filter(h => h.ujianId === uj.id), riwayat: db.riwayat.filter(r => r.ujianId === uj.id), ljk: db.ljk.filter(l => l.ujianId === uj.id).map(pub) }); },
    'ljk.unggah'(d, u) {
      const uj = ambilUjian(d.ujianId, u), s = db.siswa.find(x => x.id === d.siswaId); if (!s) throw gal('VALIDASI', 'Siswa tidak ditemukan.'); if (!uj.dicetak) throw gal('VALIDASI', 'LJK ujian ini belum dicetak. Tandai dicetak lebih dulu di menu Cetak LJK.'); if (!d.base64) throw gal('VALIDASI', 'Foto LJK tidak ditemukan.');
      const fid = 'img_' + Math.random().toString(36).slice(2, 9); gambarMem[fid] = 'data:' + (d.mime || 'image/jpeg') + ';base64,' + d.base64;
      const ada = db.ljk.find(l => l.ujianId === uj.id && l.siswaId === s.id);
      if (ada) { db.jawaban = db.jawaban.filter(j => j.ljkId !== ada.id); db.hasil = db.hasil.filter(h => !(h.ujianId === uj.id && h.siswaId === s.id)); }
      const rec = { id: ada ? ada.id : 'l_' + Math.random().toString(36).slice(2, 9), ujianId: uj.id, siswaId: s.id, nis: s.nis, fileId: fid, status: 'Menunggu', kualitas: Math.round(d.kualitas || 0), kualitasLabel: d.kualitasLabel || '', catatan: '', skorTotal: 0, jumlahPerlu: 0, waktuUnggah: iso(), waktuSelesai: '', pengunggah: u.email };
      const i = db.ljk.findIndex(l => l.id === rec.id); if (i >= 0) db.ljk[i] = rec; else db.ljk.push(rec); return pub(rec);
    },
    'ljk.proses'(d, u) {
      const l = db.ljk.find(x => x.id === d.ljkId); if (!l) throw gal('NOT_FOUND', 'LJK tidak ditemukan.'); ambilUjian(l.ujianId, u);
      const sebelum = l.status; try { if (sebelum === 'Selesai' || sebelum === 'Perlu Verifikasi') db.jawaban = db.jawaban.filter(j => j.ljkId !== l.id); const r = prosesLJK(l.id); return klon(r); } catch (e) { const i = db.ljk.findIndex(x => x.id === l.id); db.ljk[i].status = 'Gagal'; db.ljk[i].catatan = e.message; throw e; }
    },
    'ljk.hapus'(d, u) { const l = db.ljk.find(x => x.id === d.ljkId); if (!l) throw gal('NOT_FOUND', 'LJK tidak ditemukan.'); ambilUjian(l.ujianId, u); db.jawaban = db.jawaban.filter(j => j.ljkId !== l.id); db.hasil = db.hasil.filter(h => !(h.ujianId === l.ujianId && h.siswaId === l.siswaId)); db.ljk = db.ljk.filter(x => x.id !== l.id); return { dihapus: l.id }; },
    'verifikasi.putus'(d, u) {
      const jw = db.jawaban.find(j => j.id === d.jawabanId); if (!jw) throw gal('NOT_FOUND', 'Jawaban tidak ditemukan.'); const uj = ambilUjian(jw.ujianId, u);
      const kep = ['terima', 'ubah', 'tolak'].indexOf(d.keputusan) >= 0 ? d.keputusan : 'ubah'; let skor = kep === 'terima' ? jw.skor : kep === 'tolak' ? 0 : Math.min(jw.skorMaks, Math.max(0, +d.skor || 0)); skor = bulat(skor, 2);
      const baru = Object.assign({}, jw, { skor, status: kep === 'terima' ? 'Terverifikasi' : 'Diubah Guru', catatanGuru: String(d.catatan || '').slice(0, 300) });
      if (Array.isArray(d.aspek) && kep === 'ubah') baru.aspek = d.aspek; if (kep === 'tolak') baru.aspek = (jw.aspek || []).map(a => Object.assign({}, a, { skor: 0 })); if (typeof d.jawabanTerbaca === 'string' && kep !== 'terima') baru.jawabanTerbaca = d.jawabanTerbaca;
      db.jawaban[db.jawaban.findIndex(j => j.id === jw.id)] = baru; db.riwayat.push({ id: 'rw_' + Math.random().toString(36).slice(2, 8), waktu: iso(), ujianId: jw.ujianId, siswaId: jw.siswaId, jawabanId: jw.id, nomor: jw.nomor, oleh: u.nama, skorLama: jw.skor, skorBaru: skor, keputusan: kep, alasan: baru.catatanGuru });
      const rows = db.jawaban.filter(j => j.ljkId === jw.ljkId), ljk = db.ljk.find(l => l.id === jw.ljkId), r = simpanRingkasan(ljk, uj, db.soalUjian.filter(s => s.ujianId === uj.id), rows, db.set, null);
      return klon({ jawaban: baru, ljk: r.ljk, hasil: r.hasil });
    },
    'gambar.unggah'(d) { const id = 'lamp_' + Math.random().toString(36).slice(2, 9); gambarMem[id] = 'data:' + (d.mime || 'image/jpeg') + ';base64,' + d.base64; return { fileId: id }; },
    'gambar.ambil'(d, u) {
      let id = d.fileId; if (d.ljkId) { const l = db.ljk.find(x => x.id === d.ljkId); if (!l) throw gal('NOT_FOUND', 'LJK tidak ditemukan.'); ambilUjian(l.ujianId, u); id = l.fileId; }
      if (!id || !gambarMem[id]) throw gal('NOT_FOUND', 'Berkas gambar tidak ada (pada mode demo, gambar hanya tersimpan selama tab ini terbuka).'); return { dataUrl: gambarMem[id] };
    },
    'pengaturan.simpan'(d) {
      const v = Object.assign({}, d.values || {}); if ('bobotPG' in v || 'bobotIsian' in v || 'bobotUraian' in v) { if (Math.round(+v.bobotPG + +v.bobotIsian + +v.bobotUraian) !== 100) throw gal('VALIDASI', 'Total bobot default harus 100%.'); }
      db.set = Object.assign({}, db.set, v); return klon(db.set);
    },
    'pengaturan.rahasia'(d) { if (d.aiApiKey) db.aiKey = String(d.aiApiKey).trim(); return { keyTail: db.aiKey.slice(-4), terhubung: !!db.aiKey }; },
    'ai.uji'() { if (!db.aiKey) throw gal('AI', 'API key AI belum diisi. Isi di menu Pengaturan Sistem.'); return { ok: true, ms: 420, provider: db.set.aiProvider, model: db.set.aiModel || 'claude-sonnet-5-5' }; }
  };
  L.demo = {
    call(action, d, u) {
      muat(); const h = H[action]; if (!h) throw gal('NOT_FOUND', 'Aksi tidak dikenal: ' + action);
      if (action !== 'auth.masuk' && action !== 'auth.keluar') { if (!u) throw gal('AUTH', 'Sesi berakhir. Silakan masuk kembali.'); const p = db.pengguna.find(x => x.id === u.id); if (!p || !p.aktif) throw gal('AUTH', 'Sesi berakhir.'); u = { id: p.id, email: p.email, nama: p.nama, peran: p.peran, kelasDiampu: p.kelasDiampu || [], mapel: p.mapel }; }
      const hasil = h(klon(d || {}), u); if (action !== 'bootstrap' && action !== 'jawaban.ujian' && action !== 'gambar.ambil') simpanDb(); return hasil;
    },
    reset() { try { localStorage.removeItem(KEY); } catch (e) { } db = null; }
  };
})();
