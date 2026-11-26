/* ===== pages-a.js — Login, Dashboard, Data Master, Bank Soal, Form Soal ===== */
(function () {
  'use strict';
  const L = window.L, $ = L.$, esc = L.esc, ic = L.ic, P = (L.page = L.page || {});

  /* ---------- helper bersama ---------- */
  L.opt = (arr, val, lab, sel, ph) => (ph != null ? '<option value="">' + esc(ph) + '</option>' : '') + arr.map(x => { const v = typeof val === 'function' ? val(x) : x[val]; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(typeof lab === 'function' ? lab(x) : x[lab]) + '</option>'; }).join('');
  L.pager = (total, page, per, label) => {
    const pages = Math.max(1, Math.ceil(total / per)), a = (page - 1) * per + 1, b = Math.min(total, page * per);
    let btn = ''; const set = new Set([1, pages, page, page - 1, page + 1, 2]); let last = 0;
    Array.from(set).filter(n => n >= 1 && n <= pages).sort((x, y) => x - y).forEach(n => { if (n - last > 1) btn += '<span class="faint">…</span>'; btn += '<button data-pg="' + n + '" class="' + (n === page ? 'on' : '') + '" aria-label="Halaman ' + n + '">' + n + '</button>'; last = n; });
    return '<div class="pager"><span>' + (total ? 'Menampilkan <b>' + a + '–' + b + '</b> dari <b>' + total + '</b> ' + (label || 'data') : 'Tidak ada data') + '</span><div class="pg"><button data-pg="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="Sebelumnya">‹</button>' + btn + '<button data-pg="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="Berikutnya">›</button></div></div>';
  };
  L.pageHead = (crumb, judul, desk, aksi) => '<div class="ph"><div>' + (crumb ? '<div class="crumb">' + crumb + '</div>' : '') + '<h1>' + judul + '</h1>' + (desk ? '<p>' + desk + '</p>' : '') + '</div>' + (aksi ? '<div class="row wrap">' + aksi + '</div>' : '') + '</div>';
  L.kosong = (ikon, judul, teks, aksi) => '<div class="empty">' + ic(ikon) + '<b>' + judul + '</b><div>' + (teks || '') + '</div>' + (aksi ? '<div class="mt">' + aksi + '</div>' : '') + '</div>';
  L.badgeUjian = uj => { const s = L.statusUjian(uj); return '<span class="badge ' + s.tone + '">' + ({ selesai: ic('checkc', 13), verif: ic('warn', 13), proses: '<span class="spin" style="width:12px;height:12px;border-width:2px"></span>', cetak: ic('print', 13) }[s.kode] || '') + esc(s.label) + '</span>'; };
  L.aksiUjian = uj => {
    const s = L.statusUjian(uj).kode, id = encodeURIComponent(uj.id);
    return ({ selesai: '<a class="btn sm pri" href="#/hasil/' + id + '">Lihat Hasil</a>', verif: '<a class="btn sm pri" href="#/verifikasi/' + id + '">Verifikasi</a>', proses: '<a class="btn sm" href="#/unggah/' + id + '">Pantau</a>', jalan: '<a class="btn sm pri" href="#/unggah/' + id + '">Unggah LJK</a>', cetak: '<a class="btn sm pri" href="#/unggah/' + id + '">' + ic('upload', 14) + ' Unggah LJK</a>', draftsoal: '<a class="btn sm" href="#/cetak/' + id + '">Cetak LJK</a>', draft: '<a class="btn sm" href="#/ujian/form/' + id + '">Edit Soal</a>' })[s];
  };
  const JENIS = { PG: ['PG', 'Pilihan Ganda', 'pri'], ISIAN: ['ISIAN', 'Isian Singkat', 'vio'], URAIAN: ['URAIAN', 'Uraian / Esai', 'warn'] };
  L.JENIS = JENIS;
  L.sapa = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam'; };
  L.err = e => { L.toast(e && e.message ? e.message : 'Terjadi kesalahan.', 'err'); };
  L.btnBusy = (b, on, txt) => { if (!b) return; if (on) { b._h = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spin"></span> ' + (txt || 'Menyimpan…'); } else { b.disabled = false; if (b._h) b.innerHTML = b._h; } };

  /* ============================================================
     LOGIN (W-01)
     ============================================================ */
  P.login = {
    full: true,
    view() {
      const cfg = window.APP_CONFIG || {}, msg = L.loginMsg || '';
      return '<div class="login"><div class="box card" style="padding:26px"><div class="center"><div class="logo">LJK·AI</div><div class="badge pri" style="margin-bottom:10px">' + ic('shield', 13) + ' PORTAL ADMINISTRASI &amp; GURU</div><h1>Masuk ke Sistem Koreksi LJK</h1><p class="muted" style="margin-top:6px">Aplikasi penilaian LJK otomatis berbasis web &amp; AI</p></div>' +
        '<div class="row mt-l" style="gap:12px"><hr style="flex:1;border:0;border-top:1px solid var(--line)"><span class="tiny faint b" style="letter-spacing:.1em">AUTENTIKASI TUNGGAL</span><hr style="flex:1;border:0;border-top:1px solid var(--line)"></div>' +
        '<div class="col mt">' + (L.DEMO
          ? '<div class="note warn">' + ic('info') + '<div><b>Mode demo.</b> Data contoh tersimpan di peramban Anda; AI-nya simulasi. Isi <span class="mono">js/config.js</span> untuk memakai backend sungguhan.</div></div><button class="gbtn" data-a="demo" data-p="admin"><span class="g">A</span><span class="grow" style="text-align:left">Coba sebagai Administrator</span>' + ic('arr') + '</button><button class="btn blk lg" data-a="demo" data-p="guru">' + ic('user') + ' Coba sebagai Guru Pengampu</button>'
          : (!cfg.GOOGLE_CLIENT_ID ? '<div class="note err">' + ic('warn') + '<div>GOOGLE_CLIENT_ID belum diisi pada <span class="mono">js/config.js</span>. Lihat panduan instalasi.</div></div>' : '') + '<button class="gbtn" data-a="google"><span class="g">G</span><span class="grow" style="text-align:left">Masuk dengan Akun Google</span>' + ic('arr') + '</button><div class="note">' + ic('info') + '<div>Gunakan akun Google Workspace sekolah yang sudah didaftarkan oleh Administrator.</div></div>') +
        '<div id="lerr">' + (msg ? '<div class="note err" role="alert">' + ic('warn') + '<div>' + esc(msg) + '</div></div>' : '') + '</div></div>' +
        '<div class="center tiny faint mt-l" style="letter-spacing:.06em">SECURE SSO GATEWAY • RESTRICTED ACCESS<br><span style="letter-spacing:0">v1.0.0 • Terintegrasi Google Sheets, Drive &amp; AI Vision</span></div>' +
        '<div class="center mt"><button class="btn sm ghost" data-a="tema">' + ic(L.tema() === 'dark' ? 'sun' : 'moon') + ' Ganti tema</button></div></div></div>';
    },
    mount(root) {
      root.onclick = async e => {
        const b = e.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 'tema') { L.setTema(L.tema() === 'dark' ? 'light' : 'dark'); L.route(); return; }
        L.btnBusy(b, true, 'Memproses…'); $('#lerr').innerHTML = '';
        try { await L.masuk(b.dataset.p); L.loginMsg = ''; await L.bootstrap(true); location.hash = '#/dashboard'; L.route(); }
        catch (err) { L.btnBusy(b, false); $('#lerr').innerHTML = '<div class="note err" role="alert">' + ic('warn') + '<div><b>AKSES DITOLAK</b><br>' + esc(err.message) + '</div></div>'; }
      };
    }
  };

  /* ============================================================
     DASHBOARD (W-02)
     ============================================================ */
  const BIN = ['0–50', '51–65', '66–75', '76–85', '86–100'], EDGE = [0, 50, 65, 75, 85, 100];
  const kkmPos = k => { for (let i = 0; i < 5; i++) if (k <= EDGE[i + 1]) return i + (k - EDGE[i]) / (EDGE[i + 1] - EDGE[i]); return 5; };
  P.dashboard = {
    hal: 1,
    view() {
      const d = L.S.d, set = L.d.set(), u = L.S.user, ujian = d.ujian.slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
      const aktif = ujian.filter(x => L.statusUjian(x).kode !== 'selesai'), stats = d.ujian.map(x => L.d.stat(x.id));
      const sumLJK = stats.reduce((t, s) => t + s.ljk, 0), verif = L.totalVerif();
      const kelasSaya = u.peran === 'admin' ? null : new Set(d.ujian.map(x => x.kelasId).concat(u.kelasDiampu || []));
      const nSiswa = d.siswa.filter(s => s.aktif === 'Aktif' && (!kelasSaya || kelasSaya.has(s.kelasId))).length;
      const ujHist = ujian.filter(x => L.d.stat(x.id).n > 0)[0], sh = ujHist ? L.d.stat(ujHist.id) : null;
      const ljkAll = d.ljk, otom = ljkAll.filter(l => l.status === 'Selesai').length, perlu = ljkAll.filter(l => l.status === 'Perlu Verifikasi').length, antre = ljkAll.filter(l => ['Menunggu', 'Diproses', 'Gagal'].indexOf(l.status) >= 0).length;
      const pct = ljkAll.length ? Math.round((otom + perlu) / ljkAll.length * 100) : 0;
      const durs = ljkAll.filter(l => l.waktuSelesai && l.waktuUnggah).map(l => (new Date(l.waktuSelesai) - new Date(l.waktuUnggah)) / 1000).filter(x => x > 0 && x < 900);
      const kec = durs.length ? L.num(durs.reduce((a, b) => a + b, 0) / durs.length, 1) + ' detik / LJK' : '—';
      return '<div class="hero"><div><h1>' + L.sapa() + ', ' + esc(L.potong(u.nama.replace(/^(Drs?\.|Hj?\.)\s*/i, '').split(',')[0], 28)) + '! 👋</h1><p>Siap mengoreksi? Foto LJK, biarkan AI membaca dan menilai, lalu Anda tinggal memeriksa yang meragukan.</p><a class="btn lg" href="#/unggah">' + ic('upload') + ' Mulai Koreksi LJK ' + ic('arr') + '</a></div><div class="art"><div class="gl"><small>Perlu verifikasi</small><b>' + verif + ' jawaban</b></div><div class="gl"><small>Ujian aktif</small><b>' + aktif.length + ' ujian</b></div><div class="gl"><small>Kuota hari ini</small><b>' + d.kuota.terpakai + ' / ' + d.kuota.batas + '</b></div></div></div>' +
        '<div class="grid g4 mt">' +
        kpi('k-b', 'users', 'Total siswa terdaftar', L.num(nSiswa, 0), d.kelas.length + ' kelas', '#/master/siswa') + kpi('k-g', 'clip', 'Total ujian aktif', aktif.length, d.ujian.length + ' ujian tercatat', '#/ujian') + kpi('k-v', 'scan', 'LJK dipindai', L.num(sumLJK, 0), L.num(otom + perlu, 0) + ' selesai dikoreksi AI', '#/unggah') + kpi('k-o', 'warn', 'Perlu verifikasi', verif, 'keyakinan &lt; ' + set.ambangVerifikasi + '% / bacaan ragu', '#/verifikasi') + '</div>' +
        '<h2 class="mt-l mb">Aksi cepat</h2><div class="qa"><a class="a1" href="#/ujian/form">' + ic('plus', 26) + '<span class="t">Buat Ujian</span><span class="d">Susun paket soal &amp; bobot nilai.</span><span class="go">Mulai ' + ic('arr', 16) + '</span></a><a class="a2" href="#/cetak">' + ic('print', 26) + '<span class="t">Cetak LJK</span><span class="d">LJK ber-QR untuk tiap siswa.</span><span class="go">Cetak ' + ic('arr', 16) + '</span></a><a class="a3" href="#/verifikasi">' + ic('checkc', 26) + '<span class="t">Verifikasi</span><span class="d">Periksa jawaban yang meragukan.</span><span class="go">Periksa ' + ic('arr', 16) + '</span></a><a class="a4" href="#/analisis">' + ic('chart', 26) + '<span class="t">Analisis Nilai</span><span class="d">Kesukaran &amp; daya pembeda butir.</span><span class="go">Lihat ' + ic('arr', 16) + '</span></a></div>' +
        '<div class="grid mt-l" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))"><div class="card"><div class="card-h"><div><h2>Sebaran nilai ujian terakhir</h2><div class="small muted">' + (ujHist ? esc(ujHist.nama) + ' · ' + esc(L.d.namaKelas(ujHist.kelasId)) + ' (' + sh.n + ' siswa)' : 'Belum ada ujian yang selesai dikoreksi') + '</div></div>' + (sh ? '<div class="badge pri">Rata-rata ' + sh.rata + ' / 100</div>' : '') + '</div>' + (sh ? L.chart.hist(sh.hist.map((v, i) => ({ label: BIN[i], v, hi: v === Math.max.apply(null, sh.hist) })), { kkmIdx: kkmPos(set.kkm), kkm: set.kkm }) : L.kosong('chart', 'Belum ada data nilai', 'Grafik muncul setelah LJK pertama dikoreksi.')) + '</div>' +
        '<div class="card"><div class="card-h"><div><h2>Progres koreksi LJK</h2><div class="small muted">Komposisi status seluruh LJK</div></div><span class="badge">Total ' + ljkAll.length + '</span></div>' + (ljkAll.length ? '<div class="donutwrap">' + L.chart.donut([{ l: 'Otomatis AI', v: otom, c: L.chart.C.pri }, { l: 'Verifikasi guru', v: perlu, c: L.chart.C.warn }, { l: 'Antrean', v: antre, c: L.chart.C.mute }], pct + '%', 'TOTAL SELESAI') + '<div class="legend grow" style="min-width:180px"><div class="lg"><i style="background:var(--pri)"></i>Otomatis AI<b>' + otom + '</b></div><div class="lg"><i style="background:var(--warn)"></i>Perlu verifikasi<b>' + perlu + '</b></div><div class="lg"><i style="background:var(--line2)"></i>Antrean / gagal<b>' + antre + '</b></div></div></div>' : L.kosong('scan', 'Belum ada LJK', 'Unggah LJK untuk melihat progres.')) + '<div class="row between mt small" style="background:var(--card2);border-radius:10px;padding:10px 12px"><span class="muted">' + ic('bolt', 15) + ' Rata-rata waktu koreksi</span><b>' + kec + '</b></div></div></div>' +
        '<div class="insight mt">' + '<div class="row">' + ic('spark', 20) + '<h2>Wawasan AI</h2><span class="badge pri">otomatis dari data Anda</span></div><ul>' + insight(d, set, aktif).map(t => '<li>' + ic('chevr', 15) + '<span>' + t + '</span></li>').join('') + '</ul></div>' +
        '<div class="card pad0 mt-l"><div class="card-h" style="padding:16px 16px 0"><div><h2>Daftar ujian aktif</h2><div class="small muted">Monitoring pengumpulan dan koreksi lembar jawaban</div></div><a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian Baru</a></div><div id="dtab"></div></div>';
    },
    mount(root) {
      const self = this, per = 5;
      const draw = () => {
        const d = L.S.d, aktif = d.ujian.slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).filter(x => L.statusUjian(x).kode !== 'selesai' || true).slice(0, 60);
        const tot = aktif.length, hal = Math.min(self.hal, Math.max(1, Math.ceil(tot / per))), rows = aktif.slice((hal - 1) * per, hal * per);
        $('#dtab').innerHTML = rows.length ? '<div class="tw"><table class="t"><thead><tr><th>Nama ujian</th><th>Kelas</th><th>Mata pelajaran</th><th>LJK terkumpul</th><th>Status koreksi</th><th class="right">Aksi</th></tr></thead><tbody>' + rows.map(x => { const st = L.d.stat(x.id), n = L.d.siswaKelas(x.kelasId).length, p = n ? Math.min(100, Math.round(st.ljk / n * 100)) : 0; return '<tr><td><b>' + esc(x.nama) + '</b><div class="tiny faint mono">' + esc(x.kode) + '</div></td><td><span class="badge mono">' + esc(L.d.namaKelas(x.kelasId)) + '</span></td><td>' + esc(L.d.namaMapel(x.mapelId)) + '</td><td style="min-width:120px"><span class="mono small">' + st.ljk + ' / ' + n + '</span><div class="progress mt" style="margin-top:5px"><i style="width:' + p + '%"></i></div></td><td>' + L.badgeUjian(x) + '</td><td class="right">' + L.aksiUjian(x) + '</td></tr>'; }).join('') + '</tbody></table></div>' + L.pager(tot, hal, per, 'ujian') : L.kosong('clip', 'Belum ada ujian', 'Buat ujian pertama Anda untuk mulai.', '<a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian</a>');
      };
      draw(); root.onclick = e => { const b = e.target.closest('[data-pg]'); if (b && !b.disabled) { self.hal = +b.dataset.pg; draw(); } };
      this._off = L.onChange(draw);
    },
    unmount() { if (this._off) this._off(); }
  };
  function kpi(c, ikon, lb, v, s, href) { return '<a class="kpi ' + c + '" href="' + href + '"><div><div class="lb">' + lb + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div></div><div class="ico">' + ic(ikon, 22) + '</div></a>'; }
  function insight(d, set, aktif) {
    const out = [], verif = L.totalVerif();
    if (verif > 0) out.push('<b>' + verif + ' jawaban</b> menunggu keputusan Anda (keyakinan AI di bawah ' + set.ambangVerifikasi + '% atau bacaan ragu). <a href="#/verifikasi">Buka antrean verifikasi</a>.');
    const dgn = d.ujian.filter(x => L.d.stat(x.id).n > 0).sort((a, b) => L.d.stat(a.id).rata - L.d.stat(b.id).rata)[0];
    if (dgn) { const s = L.d.stat(dgn.id); out.push('Rata-rata terendah ada di <b>' + esc(dgn.nama) + '</b> (' + esc(L.d.namaKelas(dgn.kelasId)) + '): <b>' + s.rata + '</b>; ' + s.lulus + ' dari ' + s.n + ' siswa mencapai KKM ' + set.kkm + '. <a href="#/analisis/' + encodeURIComponent(dgn.id) + '">Lihat analisis butir</a>.'); }
    const siap = d.ujian.filter(x => L.statusUjian(x).kode === 'cetak'); if (siap.length) out.push('<b>' + esc(siap[0].nama) + '</b>' + (siap.length > 1 ? ' dan ' + (siap.length - 1) + ' ujian lain' : '') + ' sudah dicetak tetapi belum ada LJK yang diunggah.');
    const dr = d.ujian.filter(x => !x.dicetak).length; if (dr) out.push(dr + ' ujian masih berstatus draf — selesaikan paket soal lalu cetak LJK-nya.');
    out.push('Kuota koreksi AI hari ini: <b>' + d.kuota.terpakai + ' dari ' + d.kuota.batas + '</b> LJK' + (d.kuota.terpakai / d.kuota.batas > 0.8 ? ' — hampir habis.' : '.'));
    return out;
  }

  /* ============================================================
     DATA MASTER (W-03)
     ============================================================ */
  P.master = {
    tab: 'siswa', hal: 1, q: '', fk: '', fs: 'Aktif', sel: new Set(),
    view(a) {
      this.tab = ['siswa', 'kelas', 'mapel'].indexOf(a[0]) >= 0 ? a[0] : 'siswa'; this.hal = 1; this.sel = new Set();
      const d = L.S.d;
      return L.pageHead('Sistem LJK / Master Data', 'Data Master', 'Kelola data induk peserta didik, rombel, dan mata pelajaran untuk pemindaian LJK.') +
        '<div class="tabs" role="tablist"><button data-tab="siswa" class="' + (this.tab === 'siswa' ? 'on' : '') + '">' + ic('user') + ' Siswa <span class="n">' + d.siswa.length + '</span></button><button data-tab="kelas" class="' + (this.tab === 'kelas' ? 'on' : '') + '">' + ic('users') + ' Kelas <span class="n">' + d.kelas.length + '</span></button><button data-tab="mapel" class="' + (this.tab === 'mapel' ? 'on' : '') + '">' + ic('book') + ' Mata Pelajaran <span class="n">' + d.mapel.length + '</span></button></div><div id="mbody"></div>';
    },
    mount(root) {
      const self = this, admin = L.isAdmin();
      const draw = () => { if (self.tab === 'siswa') drawSiswa(); else drawSimple(self.tab); };
      const siswaFiltered = () => { const q = self.q.toLowerCase(); return L.S.d.siswa.filter(s => (!self.fk || s.kelasId === self.fk) && (!self.fs || s.aktif === self.fs) && (!q || (s.nama + ' ' + s.nis + ' ' + s.nisn).toLowerCase().indexOf(q) >= 0)); };
      function drawSiswa() {
        const d = L.S.d, ro = !admin;
        $('#mbody').innerHTML = '<div class="card flat mb"><div class="row between wrap"><div><h2>Data Siswa <span class="badge mono">T.A. ' + esc(L.d.set().tahunAjaran || '—') + '</span></h2><div class="small muted">Penempatan rombel untuk pemindaian LJK.' + (ro ? ' (Hanya lihat — perubahan oleh Administrator)' : '') + '</div></div>' + (ro ? '' : '<div class="row wrap"><button class="btn" data-a="impor">' + ic('upload') + ' Impor Excel/CSV</button><button class="btn pri" data-a="tambah">' + ic('plus') + ' Tambah Siswa</button></div>') + '</div></div>' +
          '<div class="card flat mb"><div class="fbar"><div class="search grow" style="max-width:none"><input class="in" id="q" placeholder="Cari nama atau NIS/NISN…" value="' + esc(self.q) + '" aria-label="Cari siswa" style="padding-left:40px">' + ic('search') + '</div><select class="in" id="fk" aria-label="Filter kelas">' + L.opt(d.kelas, 'id', 'nama', self.fk, 'Kelas: Semua') + '</select><select class="in" id="fs" aria-label="Filter status"><option value="">Status: Semua</option><option value="Aktif"' + (self.fs === 'Aktif' ? ' selected' : '') + '>Status: Aktif</option><option value="Nonaktif"' + (self.fs === 'Nonaktif' ? ' selected' : '') + '>Status: Nonaktif</option></select>' + (ro ? '' : '<select class="in" id="bulk" aria-label="Tindakan massal"><option value="">Tindakan massal…</option><option value="hapus">Hapus terpilih</option><option value="pindah">Pindah kelas…</option><option value="Nonaktif">Nonaktifkan</option><option value="Aktif">Aktifkan</option></select>') + '</div></div><div class="card pad0"><div id="slist"></div></div>';
        drawList();
      }
      function drawList() {
        const ro = !admin, arr = siswaFiltered(), per = 10, hal = Math.min(self.hal, Math.max(1, Math.ceil(arr.length / per))); self.hal = hal;
        const rows = arr.slice((hal - 1) * per, hal * per), ljkN = {}; L.S.d.ljk.forEach(l => { ljkN[l.siswaId] = (ljkN[l.siswaId] || 0) + 1; });
        $('#slist').innerHTML = rows.length ? '<div class="tw"><table class="t"><thead><tr>' + (ro ? '' : '<th style="width:40px"><input type="checkbox" class="ck" id="all" aria-label="Pilih semua"></th>') + '<th>NIS</th><th>NISN</th><th>Nama lengkap</th><th>Kelas</th><th>LJK diikuti</th><th>Status</th>' + (ro ? '' : '<th class="right">Aksi</th>') + '</tr></thead><tbody>' + rows.map(s => '<tr class="' + (self.sel.has(s.id) ? 'sel' : '') + '">' + (ro ? '' : '<td><input type="checkbox" class="ck" data-sel="' + s.id + '"' + (self.sel.has(s.id) ? ' checked' : '') + ' aria-label="Pilih ' + esc(s.nama) + '"></td>') + '<td class="mono">' + esc(s.nis) + '</td><td class="mono muted">' + esc(s.nisn || '—') + '</td><td><div class="row"><span class="avatar" style="width:30px;height:30px;font-size:.68rem">' + L.initials(s.nama) + '</span><b>' + esc(s.nama) + '</b></div></td><td>' + esc(L.d.namaKelas(s.kelasId)) + '</td><td><span class="badge">' + (ljkN[s.id] || 0) + ' ujian</span></td><td><span class="badge ' + (s.aktif === 'Aktif' ? 'ok' : '') + '">' + s.aktif + '</span></td>' + (ro ? '' : '<td class="right nowrap"><button class="ibtn" data-edit="' + s.id + '" aria-label="Ubah">' + ic('edit', 16) + '</button> <button class="ibtn dng" data-del="' + s.id + '" aria-label="Hapus">' + ic('trash', 16) + '</button></td>') + '</tr>').join('') + '</tbody></table></div>' : L.kosong('users', 'Tidak ada siswa yang cocok', 'Ubah filter pencarian' + (ro ? '.' : ' atau tambahkan siswa baru.'));
        $('#slist').innerHTML += L.pager(arr.length, hal, per, 'siswa');
      }
      function drawSimple(t) {
        const d = L.S.d, ro = !admin, isK = t === 'kelas', arr = d[t];
        const cnt = id => isK ? d.siswa.filter(s => s.kelasId === id).length : d.bankSoal.filter(b => b.mapelId === id).length;
        $('#mbody').innerHTML = '<div class="card flat mb"><div class="row between wrap"><div><h2>' + (isK ? 'Data Kelas / Rombel' : 'Mata Pelajaran') + '</h2><div class="small muted">' + (isK ? 'Rombel dipakai untuk mengelompokkan siswa dan ujian.' : 'Kode mapel dipakai pada kode ujian dan kode soal.') + '</div></div>' + (ro ? '' : '<button class="btn pri" data-a="tambah">' + ic('plus') + ' Tambah ' + (isK ? 'Kelas' : 'Mapel') + '</button>') + '</div></div><div class="card pad0">' + (arr.length ? '<div class="tw"><table class="t"><thead><tr>' + (isK ? '<th>Nama kelas</th><th>Tingkat</th><th>Jurusan</th><th>Wali kelas</th><th>Jumlah siswa</th>' : '<th>Kode</th><th>Nama mata pelajaran</th><th>Jumlah soal</th>') + (ro ? '' : '<th class="right">Aksi</th>') + '</tr></thead><tbody>' + arr.map(x => '<tr>' + (isK ? '<td><b>' + esc(x.nama) + '</b></td><td>' + esc(x.tingkat || '—') + '</td><td>' + esc(x.jurusan || '—') + '</td><td>' + esc(x.waliKelas || '—') + '</td><td><span class="badge">' + cnt(x.id) + ' siswa</span></td>' : '<td class="mono">' + esc(x.kode) + '</td><td><b>' + esc(x.nama) + '</b></td><td><span class="badge">' + cnt(x.id) + ' soal</span></td>') + (ro ? '' : '<td class="right nowrap"><button class="ibtn" data-edit="' + x.id + '" aria-label="Ubah">' + ic('edit', 16) + '</button> <button class="ibtn dng" data-del="' + x.id + '" aria-label="Hapus">' + ic('trash', 16) + '</button></td>') + '</tr>').join('') + '</tbody></table></div>' : L.kosong(isK ? 'users' : 'book', 'Belum ada data', 'Tambahkan data pertama.')) + '</div>';
      }
      draw();
      const refresh = L.debounce(() => { drawList(); }, 160);
      root.oninput = e => { if (e.target.id === 'q') { self.q = e.target.value; self.hal = 1; refresh(); } };
      root.onchange = async e => {
        const t = e.target;
        if (t.id === 'fk') { self.fk = t.value; self.hal = 1; drawList(); }
        else if (t.id === 'fs') { self.fs = t.value; self.hal = 1; drawList(); }
        else if (t.id === 'all') { siswaFiltered().slice((self.hal - 1) * 10, self.hal * 10).forEach(s => t.checked ? self.sel.add(s.id) : self.sel.delete(s.id)); drawList(); }
        else if (t.dataset.sel) { t.checked ? self.sel.add(t.dataset.sel) : self.sel.delete(t.dataset.sel); t.closest('tr').classList.toggle('sel', t.checked); }
        else if (t.id === 'bulk' && t.value) { const v = t.value; t.value = ''; await bulk(v); }
      };
      root.onclick = async e => {
        const t = e.target.closest('button,a'); if (!t) return;
        if (t.dataset.tab) { location.hash = '#/master/' + t.dataset.tab; return; }
        if (t.dataset.pg) { if (!t.disabled) { self.hal = +t.dataset.pg; drawList(); } return; }
        if (t.dataset.a === 'tambah') return formMaster(self.tab, null);
        if (t.dataset.a === 'impor') return imporSiswa();
        if (t.dataset.edit) return formMaster(self.tab, L.S.d[self.tab].find(x => x.id === t.dataset.edit));
        if (t.dataset.del) {
          const k = self.tab, x = L.S.d[k].find(r => r.id === t.dataset.del); if (!x) return;
          if (await L.confirm('Hapus ' + (k === 'siswa' ? 'siswa' : k) + '?', 'Data <b>' + esc(x.nama) + '</b> akan dihapus permanen.', 'Hapus', true)) { try { await L.remove({ siswa: 'Siswa', kelas: 'Kelas', mapel: 'Mapel' }[k], [x.id]); L.toast('Data dihapus.'); self.sel.delete(x.id); } catch (err) { L.err(err); } }
        }
      };
      async function bulk(v) {
        const ids = Array.from(self.sel); if (!ids.length) return L.toast('Pilih siswa terlebih dahulu (centang kotak di tabel).', 'warn');
        const rs = L.S.d.siswa.filter(s => ids.indexOf(s.id) >= 0);
        try {
          if (v === 'hapus') { if (!await L.confirm('Hapus ' + ids.length + ' siswa?', 'Siswa yang sudah memiliki data ujian tidak dapat dihapus (nonaktifkan saja).', 'Hapus', true)) return; await L.remove('Siswa', ids); L.toast(ids.length + ' siswa dihapus.'); }
          else if (v === 'pindah') {
            const m = L.modal({ title: 'Pindah kelas (' + ids.length + ' siswa)', size: 'w-s', body: '<label class="f">Kelas tujuan</label><select class="in" id="kt">' + L.opt(L.S.d.kelas, 'id', 'nama') + '</select>', footer: '<button class="btn" data-close>Batal</button><button class="btn pri" id="ok">Pindahkan</button>' });
            m.$('#ok').onclick = async () => { const kid = m.$('#kt').value; m.close(); try { await L.save('Siswa', rs.map(s => Object.assign({}, s, { kelasId: kid }))); L.toast('Siswa dipindahkan.'); } catch (err) { L.err(err); } }; return;
          } else { await L.save('Siswa', rs.map(s => Object.assign({}, s, { aktif: v }))); L.toast('Status ' + ids.length + ' siswa diperbarui.'); }
          self.sel.clear();
        } catch (err) { L.err(err); }
      }
      this._off = L.onChange(() => { if (!$('#mbody')) return; if (self.tab === 'siswa') drawList(); else drawSimple(self.tab); });

      /* -- form tambah/ubah -- */
      function formMaster(k, rec) {
        const d = L.S.d, baru = !rec, sheet = { siswa: 'Siswa', kelas: 'Kelas', mapel: 'Mapel' }[k];
        const body = k === 'siswa' ? '<div class="grid g2"><div><label class="f">NIS <span class="req">*</span></label><input class="in mono" id="f_nis" value="' + esc(rec ? rec.nis : '') + '" inputmode="numeric"></div><div><label class="f">NISN</label><input class="in mono" id="f_nisn" value="' + esc(rec ? rec.nisn : '') + '" inputmode="numeric"></div></div><div class="mt"><label class="f">Nama lengkap <span class="req">*</span></label><input class="in" id="f_nama" value="' + esc(rec ? rec.nama : '') + '"></div><div class="grid g2 mt"><div><label class="f">Kelas <span class="req">*</span></label><select class="in" id="f_kelasId">' + L.opt(d.kelas, 'id', 'nama', rec ? rec.kelasId : self.fk, 'Pilih kelas…') + '</select></div><div><label class="f">Status</label><select class="in" id="f_aktif"><option>Aktif</option><option' + (rec && rec.aktif === 'Nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></div></div>'
          : k === 'kelas' ? '<label class="f">Nama kelas <span class="req">*</span></label><input class="in" id="f_nama" value="' + esc(rec ? rec.nama : '') + '" placeholder="mis. 4 A, VIII B, X IPA 1"><div class="grid g2 mt"><div><label class="f">Tingkat</label><select class="in" id="f_tingkat">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'X', 'XI', 'XII'].map(t => '<option value="' + t + '"' + (rec && String(rec.tingkat) === t ? ' selected' : '') + '>' + (/\d/.test(t) ? 'Kelas ' + t + ' · ' + L.jenjang(t).nama : 'Kelas ' + t + ' · SMA') + '</option>').join('') + '</select></div><div><label class="f">Jurusan / peminatan <span class="faint">(SMA saja)</span></label><input class="in" id="f_jurusan" value="' + esc(rec ? rec.jurusan : '') + '" placeholder="IPA / IPS / MIPA (kosongkan untuk SD/SMP)"></div></div><div class="mt"><label class="f">Wali kelas</label><input class="in" id="f_waliKelas" value="' + esc(rec ? rec.waliKelas : '') + '"></div>'
            : '<div class="grid g2"><div><label class="f">Kode</label><input class="in mono" id="f_kode" value="' + esc(rec ? rec.kode : '') + '" maxlength="6" placeholder="otomatis"></div><div style="grid-column:span 1"><label class="f">Nama mata pelajaran <span class="req">*</span></label><input class="in" id="f_nama" value="' + esc(rec ? rec.nama : '') + '"></div></div>';
        const m = L.modal({ title: (baru ? 'Tambah ' : 'Ubah ') + { siswa: 'Siswa', kelas: 'Kelas', mapel: 'Mata Pelajaran' }[k], body: body + '<div id="ferr"></div>', footer: '<button class="btn" data-close>Batal</button><button class="btn pri" id="ok">Simpan</button>' });
        const go = async () => {
          const r = Object.assign({}, rec || {}); m.$$('[id^=f_]').forEach(el => { r[el.id.slice(2)] = el.value.trim(); });
          if (k === 'kelas') { r.tingkat = r.tingkat || 'X'; if (L.tingkatAngka(r.tingkat) < 10) r.jurusan = ''; }
          L.btnBusy(m.$('#ok'), true); m.$('#ferr').innerHTML = '';
          try { await L.save(sheet, [r]); m.close(); L.toast('Data disimpan.'); } catch (err) { L.btnBusy(m.$('#ok'), false); m.$('#ferr').innerHTML = '<div class="errtx" role="alert">' + esc(err.message) + '</div>'; }
        };
        m.$('#ok').onclick = go; m.el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') go(); });
      }

      /* -- impor Excel / CSV -- */
      function imporSiswa() {
        let baris = [], nama = '';
        const m = L.modal({ title: ic('upload') + ' Impor data siswa via spreadsheet / Excel', size: 'w-l', body:
          '<div class="grid g2"><div class="card flat"><h3>1 · Unduh template format</h3><p class="small muted mt">Kolom: <span class="mono">NIS, NISN, Nama Lengkap, Kelas</span>. Nama kelas harus sama dengan data kelas yang sudah ada. NIS yang sudah terdaftar akan diperbarui.</p><div class="row wrap mt"><button class="btn sm" id="tpl">' + ic('dl', 15) + ' Template .xlsx</button><button class="btn sm" id="tplc">' + ic('dl', 15) + ' Template .csv</button></div></div>' +
          '<label class="drop" id="dz" style="cursor:pointer;display:block">' + ic('file', 40) + '<div><b>Seret berkas ke sini atau klik untuk telusuri</b></div><div class="small mt">Format .csv / .xlsx · maks. 1.000 baris</div><div class="small mt" id="fn"></div><input type="file" id="fi" accept=".csv,.xlsx,.xls" class="hide"></label></div><div id="pv" class="mt"></div>',
          footer: '<button class="btn" data-close>Batal</button><button class="btn pri" id="ok" disabled>Konfirmasi &amp; proses impor</button>' });
        const kls = {}; L.S.d.kelas.forEach(k => { kls[k.nama.toLowerCase().replace(/\s+/g, '')] = k; });
        const exist = {}; L.S.d.siswa.forEach(s => { exist[s.nis] = s; });
        m.$('#tplc').onclick = () => L.download(new Blob([L.csv([['NIS', 'NISN', 'Nama Lengkap', 'Kelas'], ['20241040', '0081234570', 'Farhan Maulana Yusuf', (L.S.d.kelas[0] || {}).nama || 'X IPA 1']])], { type: 'text/csv;charset=utf-8' }), 'template-siswa.csv');
        m.$('#tpl').onclick = () => L.exportTabel('template-siswa', 'Siswa', [['NIS', 'NISN', 'Nama Lengkap', 'Kelas'], ['20241040', '0081234570', 'Farhan Maulana Yusuf', (L.S.d.kelas[0] || {}).nama || 'X IPA 1']]);
        const parseCSV = txt => { const sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ','; const rows = []; let r = [], c = '', q = false; txt = txt.replace(/^﻿/, ''); for (let i = 0; i < txt.length; i++) { const ch = txt[i]; if (q) { if (ch === '"') { if (txt[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === sep) { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x !== '')) rows.push(r); r = []; } else c += ch; } r.push(c); if (r.some(x => x !== '')) rows.push(r); return rows; };
        async function baca(f) {
          nama = f.name; m.$('#fn').innerHTML = '● Berkas terdeteksi: <b>' + esc(f.name) + '</b> (' + Math.round(f.size / 1024) + ' KB)';
          let rows; try { if (/\.csv$/i.test(f.name)) rows = parseCSV(await f.text()); else { await L.libs.xlsx(); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); } } catch (err) { return m.$('#pv').innerHTML = '<div class="note err">' + ic('warn') + '<div>' + esc(err.message || 'Berkas tidak dapat dibaca.') + '</div></div>'; }
          const h = (rows[0] || []).map(x => String(x).toLowerCase().replace(/[^a-z]/g, '')), ix = n => h.findIndex(x => n.indexOf(x) >= 0 && x);
          const iN = ix(['nis']), iNN = ix(['nisn']), iNa = ix(['nama', 'namalengkap', 'namasiswa']), iK = ix(['kelas', 'rombel']);
          if (iN < 0 || iNa < 0 || iK < 0) return m.$('#pv').innerHTML = '<div class="note err">' + ic('warn') + '<div>Header tidak sesuai. Pastikan ada kolom <b>NIS</b>, <b>Nama Lengkap</b>, dan <b>Kelas</b> pada baris pertama.</div></div>';
          const seen = {}; baris = rows.slice(1, 1001).filter(r => r.some(x => String(x).trim())).map((r, i) => {
            let nisn = iNN >= 0 ? String(r[iNN] || '').trim() : ''; if (/^\d{6,9}$/.test(nisn)) nisn = ('0000000000' + nisn).slice(-10);
            const o = { baris: i + 1, nis: String(r[iN] || '').trim(), nisn, nama: String(r[iNa] || '').trim(), kelasNama: String(r[iK] || '').trim(), status: 'VALID' }, k = kls[o.kelasNama.toLowerCase().replace(/\s+/g, '')];
            if (!o.nis) o.status = 'NIS kosong'; else if (!o.nama) o.status = 'Nama kosong'; else if (!k) o.status = 'Kelas tidak ditemukan'; else if (seen[o.nis]) o.status = 'NIS ganda di berkas'; else if (exist[o.nis]) o.status = 'PERBARUI';
            if (k) o.kelasId = k.id; seen[o.nis] = 1; return o;
          });
          const ok = baris.filter(b => b.status === 'VALID' || b.status === 'PERBARUI'), bad = baris.length - ok.length;
          m.$('#pv').innerHTML = '<div class="card flat pad0"><div class="row between wrap" style="padding:12px 14px"><h3>2 · Pratinjau data unggahan</h3><span class="small ' + (bad ? 'errtx' : 'muted') + '" style="margin:0">' + ok.length + ' baris siap diproses · ' + bad + ' anomali</span></div><div class="tw"><table class="t"><thead><tr><th>Baris</th><th>NIS</th><th>Nama siswa</th><th>Kelas target</th><th>Status cek</th></tr></thead><tbody>' + baris.slice(0, 6).map(b => '<tr><td class="faint mono">#' + b.baris + '</td><td class="mono b">' + esc(b.nis) + '</td><td>' + esc(b.nama) + '</td><td>' + esc(b.kelasNama) + '</td><td><span class="badge ' + (b.status === 'VALID' ? 'ok' : b.status === 'PERBARUI' ? 'pri' : 'err') + '">' + esc(b.status) + '</span></td></tr>').join('') + '</tbody></table></div>' + (baris.length > 6 ? '<div class="pager small">… dan ' + (baris.length - 6) + ' baris lainnya.</div>' : '') + '</div>';
          const bt = m.$('#ok'); bt.disabled = !ok.length; bt.innerHTML = ic('check') + ' Konfirmasi &amp; proses impor (' + ok.length + ' data)';
        }
        m.$('#fi').onchange = e => { if (e.target.files[0]) baca(e.target.files[0]); };
        const dz = m.$('#dz'); ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
        dz.addEventListener('drop', e => { if (e.dataTransfer.files[0]) baca(e.dataTransfer.files[0]); });
        m.$('#ok').onclick = async () => {
          const ok = baris.filter(b => b.status === 'VALID' || b.status === 'PERBARUI'); if (!ok.length) return;
          L.btnBusy(m.$('#ok'), true, 'Mengimpor…');
          try { const r = await L.save('Siswa', ok.map(b => ({ nis: b.nis, nisn: b.nisn, nama: b.nama, kelasId: b.kelasId, aktif: 'Aktif' })), { upsertUnik: true }); m.close(); L.toast(r.records.length + ' siswa berhasil diimpor' + (r.ditolak.length ? ', ' + r.ditolak.length + ' ditolak.' : '.'), r.ditolak.length ? 'warn' : 'ok'); } catch (err) { L.btnBusy(m.$('#ok'), false); L.err(err); }
        };
      }
    },
    unmount() { if (this._off) this._off(); }
  };

  /* ============================================================
     BANK SOAL (W-04)
     ============================================================ */
  P.bank = {
    hal: 1, f: { q: '', mapel: '', jenis: '', tingkat: '', kog: '' }, sel: new Set(),
    view(a) {
      if (a[0] === 'form') return P.soalform.view(a.slice(1));
      const d = L.S.d, b = d.bankSoal, c = j => b.filter(x => x.jenis === j).length, f = this.f;
      return L.pageHead('Bank-soal / Repositori', 'Bank Soal Ujian', 'Kumpulan butir soal terstandar: Pilihan Ganda (PG), Isian Singkat, dan Uraian.', '<button class="btn" data-a="impor">' + ic('upload') + ' Impor Soal</button><a class="btn pri" href="#/bank/form">' + ic('plus') + ' Tambah Soal Baru</a>') +
        '<div class="grid g4 mb">' + kpi('w', 'list', 'Total soal', b.length, 'butir di bank', '#/bank') + kpi('w', 'target', 'Pilihan ganda', c('PG'), 'dinilai dari bulatan', '#/bank') + kpi('w', 'edit', 'Isian singkat', c('ISIAN'), 'kunci + variasi', '#/bank') + kpi('w', 'file', 'Uraian / esai', c('URAIAN'), 'berdasar rubrik', '#/bank') + '</div>' +
        '<div class="card flat mb"><div class="fbar"><div class="search grow" style="max-width:none"><input class="in" id="q" placeholder="Cari teks soal, topik, atau kata kunci…" value="' + esc(f.q) + '" style="padding-left:40px" aria-label="Cari soal">' + ic('search') + '</div><select class="in" id="fm" aria-label="Mapel">' + L.opt(d.mapel, 'id', 'nama', f.mapel, 'Mapel: Semua') + '</select><select class="in" id="fj" aria-label="Jenis"><option value="">Jenis: Semua tipe</option><option value="PG">Pilihan Ganda</option><option value="ISIAN">Isian Singkat</option><option value="URAIAN">Uraian</option></select><select class="in" id="ft" aria-label="Tingkat"><option value="">Tingkat: Semua</option><option>X</option><option>XI</option><option>XII</option></select><select class="in" id="fg" aria-label="Kognitif"><option value="">Kognitif: Semua</option>' + ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(x => '<option>' + x + '</option>').join('') + '</select></div><div class="row between small muted mt"><span>Urutan: <b>Terbaru</b></span><button class="btn sm ghost" data-a="reset">Reset filter</button></div></div>' +
        '<div class="card pad0"><div id="blist"></div></div><div class="note mt">' + ic('info') + '<div id="bval"></div></div>';
    },
    mount(root) {
      const self = this, f = this.f; ['fm:mapel', 'fj:jenis', 'ft:tingkat', 'fg:kog'].forEach(p => { const [id, k] = p.split(':'); const el = $('#' + id); if (el) el.value = f[k]; });
      const arr = () => { const q = f.q.toLowerCase(); return L.S.d.bankSoal.filter(x => (!f.mapel || x.mapelId === f.mapel) && (!f.jenis || x.jenis === f.jenis) && (!f.tingkat || x.tingkat === f.tingkat) && (!f.kog || x.kognitif === f.kog) && (!q || (L.polos(x.teks) + ' ' + x.topik + ' ' + x.kode).toLowerCase().indexOf(q) >= 0)).sort((a, b) => String(b.dibuat).localeCompare(String(a.dibuat))); };
      const ket = x => x.jenis === 'PG' ? '<span class="badge ok">' + ic('checkc', 13) + ' Kunci (' + esc(x.kunci) + ') lengkap</span>' : x.jenis === 'ISIAN' ? '<span class="badge sky">' + ((x.variasi || []).length) + ' variasi diterima</span>' : '<span class="badge warn">' + ((x.rubrik || []).length) + ' kriteria rubrik</span>';
      function draw() {
        const a = arr(), per = 8, hal = Math.min(self.hal, Math.max(1, Math.ceil(a.length / per))); self.hal = hal; const rows = a.slice((hal - 1) * per, hal * per);
        $('#blist').innerHTML = rows.length ? '<div class="tw"><table class="t"><thead><tr><th style="width:40px"><input type="checkbox" class="ck" id="all" aria-label="Pilih semua"></th><th>Cuplikan butir soal</th><th>Jenis</th><th>Mata pelajaran</th><th>Bobot</th><th>Status kunci / rubrik</th><th class="right">Aksi</th></tr></thead><tbody>' + rows.map(x => { const j = L.JENIS[x.jenis]; return '<tr class="' + (self.sel.has(x.id) ? 'sel' : '') + '"><td><input type="checkbox" class="ck" data-sel="' + x.id + '"' + (self.sel.has(x.id) ? ' checked' : '') + ' aria-label="Pilih soal"></td><td style="min-width:260px;max-width:420px"><div class="b">' + esc(L.potong(L.polos(x.teks), 90)) + '</div><div class="row wrap gap-s mt tiny"><span class="badge mono">' + esc(x.kode) + '</span>' + (x.kognitif ? '<span class="badge">' + esc(x.kognitif) + '</span>' : '') + (x.topik ? '<span class="faint">' + esc(x.topik) + '</span>' : '') + (x.lampiranId ? '<span class="badge sky">' + ic('img', 12) + ' Gambar</span>' : '') + '</div></td><td><span class="badge ' + j[2] + '">' + j[0] + '</span></td><td>' + esc(L.d.namaMapel(x.mapelId)) + ' <span class="faint">(Kelas ' + esc(x.tingkat) + ')</span></td><td class="mono b">' + L.num(x.bobot, 1) + '</td><td>' + ket(x) + '</td><td class="right nowrap"><button class="ibtn" data-edit="' + x.id + '" aria-label="Ubah">' + ic('edit', 16) + '</button> <button class="ibtn" data-dup="' + x.id + '" aria-label="Duplikat">' + ic('copy', 16) + '</button> <button class="ibtn dng" data-del="' + x.id + '" aria-label="Hapus">' + ic('trash', 16) + '</button></td></tr>'; }).join('') + '</tbody></table></div>' + L.pager(a.length, hal, per, 'butir soal') : L.kosong('box', 'Belum ada soal yang cocok', 'Ubah filter atau tambahkan soal baru.', '<a class="btn pri" href="#/bank/form">' + ic('plus') + ' Tambah Soal</a>');
        const all = L.S.d.bankSoal, ok = all.filter(x => (x.jenis === 'PG' && x.kunci && (x.opsi || []).length >= 2) || (x.jenis === 'ISIAN' && x.kunci) || (x.jenis === 'URAIAN' && (x.rubrik || []).length)).length;
        $('#bval').innerHTML = '<b>Validasi otomatis format soal:</b> ' + ok + ' dari ' + all.length + ' soal memiliki kunci/rubrik lengkap (PG memiliki opsi &amp; kunci, isian memiliki kata kunci, uraian memiliki rubrik).';
      }
      draw(); const deb = L.debounce(() => { self.hal = 1; draw(); }, 180);
      root.oninput = e => { if (e.target.id === 'q') { f.q = e.target.value; deb(); } };
      root.onchange = e => { const t = e.target, m = { fm: 'mapel', fj: 'jenis', ft: 'tingkat', fg: 'kog' }[t.id]; if (m) { f[m] = t.value; self.hal = 1; draw(); } else if (t.id === 'all') { arr().slice((self.hal - 1) * 8, self.hal * 8).forEach(x => t.checked ? self.sel.add(x.id) : self.sel.delete(x.id)); draw(); } else if (t.dataset.sel) { t.checked ? self.sel.add(t.dataset.sel) : self.sel.delete(t.dataset.sel); t.closest('tr').classList.toggle('sel', t.checked); } };
      root.onclick = async e => {
        const t = e.target.closest('button,a'); if (!t) return;
        if (t.dataset.pg) { if (!t.disabled) { self.hal = +t.dataset.pg; draw(); } return; }
        if (t.dataset.a === 'reset') { Object.keys(f).forEach(k => f[k] = ''); L.route(); return; }
        if (t.dataset.a === 'impor') return imporSoal();
        if (t.dataset.edit) { location.hash = '#/bank/form/' + encodeURIComponent(t.dataset.edit); return; }
        if (t.dataset.dup) { const x = L.S.d.bankSoal.find(r => r.id === t.dataset.dup); if (!x) return; const c = JSON.parse(JSON.stringify(x)); delete c.id; c.kode = ''; try { await L.save('BankSoal', [c]); L.toast('Soal diduplikasi.'); } catch (err) { L.err(err); } return; }
        if (t.dataset.del) { const x = L.S.d.bankSoal.find(r => r.id === t.dataset.del); if (await L.confirm('Hapus soal?', 'Soal <b>' + esc(x.kode) + '</b> akan dihapus. Soal yang masih dipakai ujian tidak dapat dihapus.', 'Hapus', true)) { try { await L.remove('BankSoal', [x.id]); L.toast('Soal dihapus.'); } catch (err) { L.err(err); } } }
      };
      this._off = L.onChange(() => { if ($('#blist')) draw(); });

      function imporSoal() {
        let valid = [], tolak = [];
        const kolom = ['jenis', 'mapel', 'tingkat', 'teks', 'opsiA', 'opsiB', 'opsiC', 'opsiD', 'opsiE', 'kunci', 'variasi', 'bobot', 'topik', 'kognitif'];
        const m = L.modal({ title: ic('upload') + ' Impor soal (PG &amp; Isian)', size: 'w-l', body: '<div class="note">' + ic('info') + '<div>Kolom: <span class="mono">' + kolom.join(', ') + '</span>. <b>jenis</b> = PG atau ISIAN; <b>variasi</b> dipisah titik koma (;). Soal uraian dibuat lewat formulir karena memiliki rubrik.</div></div><div class="row wrap mt"><button class="btn sm" id="tpl">' + ic('dl', 15) + ' Unduh template .csv</button></div><label class="drop mt" style="display:block;cursor:pointer">' + ic('file', 40) + '<div><b>Pilih berkas .csv / .xlsx</b></div><input type="file" id="fi" accept=".csv,.xlsx,.xls" class="hide"></label><div id="pv" class="mt"></div>', footer: '<button class="btn" data-close>Batal</button><button class="btn pri" id="ok" disabled>Impor</button>' });
        const mp = {}; L.S.d.mapel.forEach(x => { mp[x.nama.toLowerCase()] = x; mp[x.kode.toLowerCase()] = x; });
        m.$('#tpl').onclick = () => L.download(new Blob([L.csv([kolom, ['PG', 'Biologi', 'X', 'Organel sintesis protein adalah ...', 'Mitokondria', 'Ribosom', 'Lisosom', 'Golgi', 'Vakuola', 'B', '', '2', 'Sitologi', 'C2'], ['ISIAN', 'Biologi', 'X', 'Sebutkan organel penghasil energi!', '', '', '', '', '', 'Mitokondria', 'Mitokondrion;Mitochondria', '3', 'Metabolisme', 'C2']])], { type: 'text/csv;charset=utf-8' }), 'template-soal.csv');
        m.$('#fi').onchange = async e => {
          const f = e.target.files[0]; if (!f) return; let rows;
          try { if (/\.csv$/i.test(f.name)) { const txt = (await f.text()).replace(/^﻿/, ''); rows = csvParse(txt); } else { await L.libs.xlsx(); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); } } catch (err) { return L.err(err); }
          const h = rows[0].map(x => String(x).trim().toLowerCase()); valid = []; tolak = [];
          rows.slice(1).filter(r => r.some(x => String(x).trim())).forEach((r, i) => {
            const g = k => String(r[h.indexOf(k.toLowerCase())] || '').trim(), jenis = g('jenis').toUpperCase(), map = mp[g('mapel').toLowerCase()];
            try {
              if (['PG', 'ISIAN'].indexOf(jenis) < 0) throw new Error('jenis harus PG / ISIAN'); if (!map) throw new Error('mapel "' + g('mapel') + '" tidak ada'); if (!g('teks')) throw new Error('teks kosong');
              const o = { jenis, mapelId: map.id, tingkat: g('tingkat') || 'X', teks: esc(g('teks')), topik: g('topik'), kognitif: g('kognitif') || 'C2', bobot: Number(g('bobot').replace(',', '.')) || (jenis === 'PG' ? 2 : 3), opsi: [], kunci: '', variasi: [], rubrik: [], jawabanIdeal: '' };
              if (jenis === 'PG') { o.opsi = ['A', 'B', 'C', 'D', 'E'].map(k => ({ key: k, teks: g('opsi' + k) })).filter(x => x.teks); o.kunci = g('kunci').toUpperCase(); if (o.opsi.length < 2) throw new Error('opsi kurang'); if (!o.opsi.some(x => x.key === o.kunci)) throw new Error('kunci tidak sesuai opsi'); } else { o.kunci = g('kunci'); if (!o.kunci) throw new Error('kunci kosong'); o.variasi = g('variasi').split(';').map(x => x.trim()).filter(Boolean); }
              valid.push(o);
            } catch (err) { tolak.push('Baris ' + (i + 2) + ': ' + err.message); }
          });
          m.$('#pv').innerHTML = '<div class="note ' + (tolak.length ? 'warn' : 'ok') + '">' + ic('info') + '<div><b>' + valid.length + '</b> soal siap diimpor' + (tolak.length ? ', <b>' + tolak.length + '</b> dilewati:<br>' + tolak.slice(0, 6).map(esc).join('<br>') : '.') + '</div></div>'; m.$('#ok').disabled = !valid.length;
        };
        m.$('#ok').onclick = async () => { L.btnBusy(m.$('#ok'), true, 'Mengimpor…'); try { const r = await L.save('BankSoal', valid); m.close(); L.toast(r.records.length + ' soal diimpor.'); } catch (err) { L.btnBusy(m.$('#ok'), false); L.err(err); } };
      }
      function csvParse(txt) { const sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ','; const rows = []; let r = [], c = '', q = false; for (let i = 0; i < txt.length; i++) { const ch = txt[i]; if (q) { if (ch === '"') { if (txt[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === sep) { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x !== '')) rows.push(r); r = []; } else c += ch; } r.push(c); if (r.some(x => x !== '')) rows.push(r); return rows; }
    },
    unmount() { if (this._off) this._off(); }
  };

  /* ============================================================
     FORM SOAL (W-05)
     ============================================================ */
  P.soalform = {
    view(a) {
      const id = a[0] ? decodeURIComponent(a[0]) : '', lama = id ? L.d.bank(id) : null; this.id = id;
      if (id && !lama) return L.kosong('box', 'Soal tidak ditemukan', 'Soal mungkin sudah dihapus.', '<a class="btn" href="#/bank">Kembali ke Bank Soal</a>');
      const draft = !id ? L.ls.get('ljk_draft_soal') : null, set = L.d.set();
      this.F = JSON.parse(JSON.stringify(lama || draft || { jenis: 'PG', mapelId: (L.S.d.mapel[0] || {}).id || '', tingkat: 'X', kognitif: 'C3', bobot: 2, teks: '', lampiranId: '', topik: '', opsi: ['A', 'B', 'C', 'D', 'E'].map(k => ({ key: k, teks: '' })), kunci: 'A', variasi: [], kunciIsian: '', jawabanIdeal: '', rubrik: [{ aspek: '', bobot: 3, deskripsi: '' }] }));
      const F = this.F; if (F.jenis === 'ISIAN' && !F.kunciIsian) F.kunciIsian = F.kunci || '';
      if (F.jenis === 'PG') { const o = {}; (F.opsi || []).forEach(x => { o[x.key] = x.teks; }); F.opsi = ['A', 'B', 'C', 'D', 'E'].map(k => ({ key: k, teks: o[k] || '' })); }
      if (F.jenis === 'URAIAN' && !(F.rubrik || []).length) F.rubrik = [{ aspek: '', bobot: 3, deskripsi: '' }];
      if (F.jenis !== 'PG' && !(F.opsi || []).length) F.opsi = ['A', 'B', 'C', 'D', 'E'].map(k => ({ key: k, teks: '' }));
      if (!F.rubrik || !F.rubrik.length) F.rubrik = [{ aspek: '', bobot: 3, deskripsi: '' }];
      return '<a class="btn sm ghost mb" href="#/bank">' + ic('arl', 15) + ' Kembali ke Bank Soal</a>' + L.pageHead('Bank Soal', (id ? 'Ubah' : 'Tambah') + ' Butir Soal &amp; Kunci Jawaban', null, '<span class="badge mono">' + (lama ? esc(lama.kode) : 'ID otomatis') + '</span>' + '<span class="small faint" id="draftinfo">' + (id ? '' : ic('info', 14) + ' Draf tersimpan otomatis di peramban ini') + '</span>') +
        '<div class="col" id="sf"></div><div class="stickybar"><span class="small muted" id="sfmsg"></span><div class="row"><a class="btn" href="#/bank">Batal</a><button class="btn pri lg" data-a="simpan">' + ic('check') + ' Simpan soal ke bank</button></div></div>';
    },
    mount(root) {
      const self = this, F = this.F, set = L.d.set();
      const kog = [['C1', 'C1 – Mengingat'], ['C2', 'C2 – Memahami'], ['C3', 'C3 – Menerapkan'], ['C4', 'C4 – Menganalisis'], ['C5', 'C5 – Mengevaluasi'], ['C6', 'C6 – Mencipta']];
      const saveDraft = L.debounce(() => { if (!self.id) L.ls.set('ljk_draft_soal', F); }, 700);
      function draw() {
        const j = F.jenis, tot = F.rubrik.reduce((t, a) => t + (Number(a.bobot) || 0), 0);
        $('#sf').innerHTML = '<div class="card"><h2>01 · Informasi dasar &amp; klasifikasi <span class="faint small">(* wajib)</span></h2><div class="typecards mt">' + [['PG', 'Pilihan Ganda (PG)', 'Lembar LJK OMR A-B-C-D-E'], ['ISIAN', 'Isian Singkat', 'Koreksi teks semantik / exact'], ['URAIAN', 'Uraian / Esai', 'Koreksi rubrik multi-kriteria']].map(x => '<label class="typecard ' + (j === x[0] ? 'on' : '') + '"><input type="radio" name="jenis" value="' + x[0] + '"' + (j === x[0] ? ' checked' : '') + '><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></label>').join('') + '</div>' +
          '<div class="grid g3 mt"><div><label class="f">Mata pelajaran <span class="req">*</span></label><select class="in" data-f="mapelId">' + L.opt(L.S.d.mapel, 'id', 'nama', F.mapelId) + '</select></div><div><label class="f">Tingkat kelas</label><select class="in" data-f="tingkat">' + ['X', 'XI', 'XII'].map(t => '<option' + (F.tingkat === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div><div><label class="f">Tingkat kognitif</label><select class="in" data-f="kognitif">' + kog.map(k => '<option value="' + k[0] + '"' + (F.kognitif === k[0] ? ' selected' : '') + '>' + k[1] + '</option>').join('') + '</select></div></div>' +
          '<div class="grid g2 mt"><div><label class="f">Topik / indikator</label><input class="in" data-f="topik" value="' + esc(F.topik) + '" placeholder="mis. Sitologi &amp; Organel"></div><div><label class="f">Bobot nilai default (poin)' + (j === 'URAIAN' ? ' <span class="faint">— otomatis dari rubrik</span>' : '') + '</label><input class="in mono" type="number" min="0.5" step="0.5" data-f="bobot" value="' + (j === 'URAIAN' ? tot : esc(F.bobot)) + '"' + (j === 'URAIAN' ? ' disabled' : '') + '></div></div>' +
          '<div class="mt"><label class="f">Teks soal / narasi pertanyaan <span class="req">*</span></label><div class="rte"><div class="tb" role="toolbar" aria-label="Format teks"><button type="button" data-cmd="bold" title="Tebal"><b>B</b></button><button type="button" data-cmd="italic" title="Miring"><i>I</i></button><button type="button" data-cmd="underline" title="Garis bawah"><u>U</u></button><button type="button" data-cmd="subscript" title="Subskrip">X₂</button><button type="button" data-cmd="superscript" title="Superskrip">X²</button><button type="button" data-cmd="removeFormat" title="Bersihkan format">' + ic('x', 14) + '</button></div><div class="ed" id="ed" contenteditable="true" role="textbox" aria-multiline="true" data-ph="Tuliskan butir pertanyaan secara jelas…">' + L.sanitizeRich(F.teks) + '</div></div><div class="hint">Format yang didukung: tebal, miring, garis bawah, subskrip, superskrip (mis. H₂O, x²).</div></div>' +
          '<div class="mt"><label class="f">Lampiran gambar / diagram (opsional)</label><div id="lamp"></div></div></div>' +
          '<div class="card"><h2>02 · Kunci jawaban: ' + ({ PG: 'Pilihan Ganda', ISIAN: 'Isian Singkat (fuzzy &amp; semantic)', URAIAN: 'Uraian &amp; Esai (rubrik)' })[j] + '</h2><div class="mt">' + kunciHtml(j, tot) + '</div></div>';
        drawLamp();
        const ed = $('#ed'); ed.oninput = () => { F.teks = ed.innerHTML; saveDraft(); };
      }
      function kunciHtml(j, tot) {
        if (j === 'PG') return '<div class="col">' + F.opsi.map(o => '<div class="opt ' + (F.kunci === o.key ? 'key' : '') + '"><span class="lt">' + o.key + '</span><input class="in grow" data-opt="' + o.key + '" value="' + esc(o.teks) + '" placeholder="Teks opsi ' + o.key + '" aria-label="Opsi ' + o.key + '"><label class="row small nowrap" style="cursor:pointer"><input type="radio" name="kunci" value="' + o.key + '"' + (F.kunci === o.key ? ' checked' : '') + ' style="accent-color:var(--ok)"> ' + (F.kunci === o.key ? '<b style="color:var(--ok)">KUNCI</b>' : 'Kunci') + '</label></div>').join('') + '</div><div class="hint">Opsi yang dibiarkan kosong tidak dipakai (minimal 2 opsi). LJK memuat bulatan A–E.</div>';
        if (j === 'ISIAN') {
          const b = Number(F.bobot) || 0;
          return '<label class="f">Kunci jawaban utama <span class="req">*</span></label><input class="in" data-f="kunciIsian" value="' + esc(F.kunciIsian) + '" placeholder="mis. Nusantara"><div class="hint">Pola utama untuk pencocokan karakter (tidak peka huruf besar-kecil &amp; tanda baca).</div><label class="f mt">Variasi jawaban yang diterima (sinonim &amp; alias)</label><div class="row wrap" id="vari">' + F.variasi.map((v, i) => '<span class="chip">' + esc(v) + '<button type="button" data-delv="' + i + '" aria-label="Hapus variasi">' + ic('x', 13) + '</button></span>').join('') + '<input class="in" id="newv" placeholder="Ketik variasi lalu Enter" style="width:220px;min-height:36px"></div>' +
            '<label class="f mt">Aturan poin parsial (diatur di Pengaturan Sistem)</label><div class="tw card flat pad0"><table class="t"><thead><tr><th>Kategori kecocokan</th><th>Kriteria</th><th>Persentase</th><th>Nilai riil</th></tr></thead><tbody>' + set.parsial.map(r => '<tr><td><b>' + esc(r.kategori) + '</b></td><td class="small muted">' + esc(r.kriteria) + '</td><td>' + (r.aktif ? r.persen + '%' : '<span class="faint">nonaktif</span>') + '</td><td class="mono b">' + L.num(b * (r.aktif ? r.persen : 0) / 100, 2) + ' poin</td></tr>').join('') + '</tbody></table></div>';
        }
        return '<label class="f">Jawaban acuan / model ideal (benchmark untuk AI)</label><textarea class="in" data-f="jawabanIdeal" rows="4" placeholder="Tuliskan jawaban ideal secara lengkap…">' + esc(F.jawabanIdeal) + '</textarea><label class="f mt">Rubrik penilaian per aspek</label><div class="tw card flat pad0"><table class="t"><thead><tr><th style="width:36px">No</th><th>Aspek / kriteria</th><th>Kata kunci / deskripsi</th><th style="width:110px">Bobot</th><th></th></tr></thead><tbody>' + F.rubrik.map((a, i) => '<tr><td class="b">' + (i + 1) + '</td><td><input class="in" data-rub="aspek" data-i="' + i + '" value="' + esc(a.aspek) + '" placeholder="mis. Peran protein pembawa" aria-label="Aspek ' + (i + 1) + '"></td><td><input class="in" data-rub="deskripsi" data-i="' + i + '" value="' + esc(a.deskripsi) + '" placeholder="apa yang harus ada pada jawaban" aria-label="Deskripsi ' + (i + 1) + '"></td><td><input class="in mono" type="number" min="0.5" step="0.5" data-rub="bobot" data-i="' + i + '" value="' + esc(a.bobot) + '" aria-label="Bobot ' + (i + 1) + '"></td><td><button class="ibtn dng" data-delr="' + i + '" aria-label="Hapus aspek">' + ic('trash', 15) + '</button></td></tr>').join('') + '</tbody></table></div><div class="row between wrap mt"><button class="btn sm" data-a="addr">' + ic('plus', 15) + ' Tambah kriteria aspek</button><span class="badge ok">Total bobot rubrik: <b>' + L.num(tot, 1) + ' poin</b></span></div>';
      }
      function drawLamp() {
        const box = $('#lamp'); if (!box) return;
        box.innerHTML = F.lampiranId ? '<div class="row"><div class="thumb" id="lp" style="width:120px;height:80px"><span class="spin"></span></div><div class="col" style="gap:6px"><span class="small muted">Gambar terlampir</span><button class="btn sm dng" data-a="rmlamp">' + ic('trash', 14) + ' Hapus gambar</button></div></div>' : '<label class="drop" style="display:block;cursor:pointer">' + ic('img', 36) + '<div><b>Unggah gambar / diagram pendukung soal</b></div><div class="small mt">PNG, JPG, WebP · dikecilkan otomatis ke ≤ 1200 px</div><input type="file" id="lampf" accept="image/*" class="hide"></label>';
        if (F.lampiranId) L.api('gambar.ambil', { fileId: F.lampiranId }).then(r => { const t = $('#lp'); if (t) t.innerHTML = '<img alt="Lampiran soal" src="' + r.dataUrl + '">'; }).catch(() => { const t = $('#lp'); if (t) t.innerHTML = ic('img'); });
      }
      draw();
      const upd = () => { saveDraft(); };
      root.oninput = e => {
        const t = e.target;
        if (t.dataset.f) { F[t.dataset.f] = t.type === 'number' ? t.value : t.value; if (t.dataset.f === 'bobot' && F.jenis === 'ISIAN') { upd(); } upd(); }
        else if (t.dataset.opt) { F.opsi.find(o => o.key === t.dataset.opt).teks = t.value; upd(); }
        else if (t.dataset.rub) { F.rubrik[+t.dataset.i][t.dataset.rub] = t.value; upd(); if (t.dataset.rub === 'bobot') { const tot = F.rubrik.reduce((s, a) => s + (Number(a.bobot) || 0), 0); const b = root.querySelector('.badge.ok b'); if (b) b.textContent = L.num(tot, 1) + ' poin'; const bi = root.querySelector('[data-f=bobot]'); if (bi) bi.value = tot; } }
      };
      root.onchange = async e => {
        const t = e.target;
        if (t.name === 'jenis') { F.jenis = t.value; if (t.value === 'ISIAN' && F.bobot < 1) F.bobot = 3; draw(); upd(); }
        else if (t.name === 'kunci') { F.kunci = t.value; draw(); upd(); }
        else if (t.dataset.f === 'bobot' || t.dataset.f === 'mapelId' || t.dataset.f === 'tingkat' || t.dataset.f === 'kognitif') { F[t.dataset.f] = t.value; if (F.jenis === 'ISIAN') draw(); upd(); }
        else if (t.id === 'lampf' && t.files[0]) { try { const c = await L.img.compress(t.files[0], 1200, 0.8); const r = await L.api('gambar.unggah', { base64: c.base64, mime: 'image/jpeg' }); F.lampiranId = r.fileId; drawLamp(); upd(); } catch (err) { L.err(err); } }
      };
      root.onkeydown = e => { if (e.target.id === 'newv' && e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v && F.variasi.indexOf(v) < 0) { F.variasi.push(v); draw(); $('#newv').focus(); upd(); } } };
      root.onmousedown = e => { if (e.target.closest('[data-cmd]')) e.preventDefault(); };
      root.onclick = async e => {
        const t = e.target.closest('button'); if (!t) return;
        if (t.dataset.cmd) { document.execCommand(t.dataset.cmd, false, null); $('#ed').focus(); F.teks = $('#ed').innerHTML; upd(); return; }
        if (t.dataset.delv != null) { F.variasi.splice(+t.dataset.delv, 1); draw(); upd(); return; }
        if (t.dataset.delr != null) { if (F.rubrik.length > 1) { F.rubrik.splice(+t.dataset.delr, 1); draw(); upd(); } else L.toast('Minimal satu aspek rubrik.', 'warn'); return; }
        if (t.dataset.a === 'addr') { F.rubrik.push({ aspek: '', bobot: 2, deskripsi: '' }); draw(); return; }
        if (t.dataset.a === 'rmlamp') { F.lampiranId = ''; drawLamp(); upd(); return; }
        if (t.dataset.a === 'simpan') {
          const r = { id: self.id || undefined, jenis: F.jenis, mapelId: F.mapelId, tingkat: F.tingkat, kognitif: F.kognitif, topik: F.topik, teks: L.sanitizeRich($('#ed').innerHTML), lampiranId: F.lampiranId || '', bobot: Number(F.bobot) || 0 };
          if (F.jenis === 'PG') { r.opsi = F.opsi.filter(o => o.teks.trim()); r.kunci = F.kunci; } else if (F.jenis === 'ISIAN') { r.kunci = F.kunciIsian; r.variasi = F.variasi; } else { r.rubrik = F.rubrik.map(a => ({ aspek: a.aspek, bobot: Number(a.bobot), deskripsi: a.deskripsi })); r.jawabanIdeal = F.jawabanIdeal; }
          if (!L.polos(r.teks)) return L.toast('Teks soal wajib diisi.', 'warn');
          L.btnBusy(t, true);
          try { await L.save('BankSoal', [r]); L.ls.del('ljk_draft_soal'); L.toast('Soal disimpan ke bank.'); location.hash = '#/bank'; } catch (err) { L.btnBusy(t, false); L.err(err); }
        }
      };
    }
  };
})();
