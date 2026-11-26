/* ===== pages-b.js — Manajemen Ujian, Form Ujian, Cetak LJK, Unggah LJK, Pindai ===== */
(function () {
  'use strict';
  const L = window.L, $ = L.$, $$ = L.$$, esc = L.esc, ic = L.ic, P = (L.page = L.page || {}), Q = L.queue;
  const JENIS_UJIAN = [['PH', 'PH (Penilaian Harian)'], ['PTS', 'PTS (Penilaian Tengah Semester)'], ['PAS', 'PAS (Penilaian Akhir Semester)'], ['Kuis', 'Kuis'], ['Remedial', 'Remedial'], ['US', 'Ujian Sekolah']];
  const hariIni = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  const klon = o => JSON.parse(JSON.stringify(o));
  const ujianId = a => (a && a[0] ? decodeURIComponent(a[0]) : '');
  const hasLJK = id => (L.S.d.ljk || []).some(l => l.ujianId === id);

  /** Gabungkan hasil ujian.simpan ke state lokal. */
  function gabung(r) {
    const d = L.S.d, i = d.ujian.findIndex(x => x.id === r.ujian.id);
    if (i >= 0) d.ujian[i] = r.ujian; else d.ujian.unshift(r.ujian);
    d.soalUjian = d.soalUjian.filter(s => s.ujianId !== r.ujian.id).concat(r.soalUjian);
    L.cacheBoot(); L.emit();
  }
  const bandingTanggal = (a, b) => String(b.tanggal).localeCompare(String(a.tanggal));
  const ketKunci = x => !x ? '' : x.jenis === 'PG' ? '<span class="badge ok">Kunci [' + esc(x.kunci) + ']</span>' : x.jenis === 'ISIAN' ? '<span class="badge sky">' + ((x.variasi || []).length + 1) + ' variasi kunci</span>' : '<span class="badge warn">' + ((x.rubrik || []).length) + ' aspek rubrik</span>';

  /* ============================================================
     MANAJEMEN UJIAN (W-06)
     ============================================================ */
  P.ujian = {
    hal: 1, f: { q: '', jenis: '', kelas: '', tab: 'semua' },
    view() {
      const d = L.S.d, f = this.f;
      return L.pageHead('Modul W-06', 'Manajemen Ujian', 'Kelola jadwal, konfigurasi paket soal, dan status penilaian lembar jawaban.', '<button class="btn" data-a="ekspor">' + ic('dl') + ' Ekspor Data</button><a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian Baru</a>') +
        '<div class="card flat mb"><div class="fbar"><div class="search grow" style="max-width:none"><input class="in" id="q" placeholder="Cari nama ujian, kelas, mapel…" value="' + esc(f.q) + '" style="padding-left:40px" aria-label="Cari ujian">' + ic('search') + '</div><select class="in" id="fj" aria-label="Jenis"><option value="">Jenis: Semua</option>' + JENIS_UJIAN.map(j => '<option value="' + j[0] + '"' + (f.jenis === j[0] ? ' selected' : '') + '>' + j[0] + '</option>').join('') + '</select><select class="in" id="fk" aria-label="Kelas">' + L.opt(d.kelas, 'id', 'nama', f.kelas, 'Kelas: Semua') + '</select></div><div class="tabs mt" id="utabs" style="margin-bottom:0;border:0"></div></div><div class="card pad0"><div id="ulist"></div></div>';
    },
    mount(root) {
      const self = this, f = this.f, per = 6;
      const cocok = x => { const q = f.q.toLowerCase(); return (!f.jenis || x.jenis === f.jenis) && (!f.kelas || x.kelasId === f.kelas) && (!q || (x.nama + ' ' + x.kode + ' ' + L.d.namaKelas(x.kelasId) + ' ' + L.d.namaMapel(x.mapelId)).toLowerCase().indexOf(q) >= 0); };
      function draw() {
        const all = L.S.d.ujian.filter(cocok).sort(bandingTanggal), cnt = { semua: all.length, draft: 0, cetak: 0, berjalan: 0, selesai: 0 };
        all.forEach(x => { cnt[L.statusUjian(x).filter]++; });
        $('#utabs').innerHTML = [['semua', 'Semua'], ['draft', 'Draft'], ['cetak', 'LJK Dicetak'], ['berjalan', 'Koreksi Berjalan'], ['selesai', 'Selesai']].map(t => '<button data-tab="' + t[0] + '" class="' + (f.tab === t[0] ? 'on' : '') + '">' + t[1] + ' <span class="n">' + cnt[t[0]] + '</span></button>').join('');
        const arr = f.tab === 'semua' ? all : all.filter(x => L.statusUjian(x).filter === f.tab), hal = Math.min(self.hal, Math.max(1, Math.ceil(arr.length / per))); self.hal = hal;
        const rows = arr.slice((hal - 1) * per, hal * per);
        $('#ulist').innerHTML = rows.length ? '<div class="tw"><table class="t"><thead><tr><th>Nama ujian</th><th>Jenis</th><th>Kelas</th><th>Mapel</th><th>Tgl pelaksanaan</th><th>Jml soal (PG/IS/UR)</th><th>Status</th><th class="right">Aksi</th></tr></thead><tbody>' + rows.map(x => { const j = L.jumlahSoal(x.id), id = encodeURIComponent(x.id); return '<tr><td style="min-width:200px"><b>' + esc(x.nama) + '</b><div class="tiny faint mono">KODE: ' + esc(x.kode) + '</div></td><td><span class="badge">' + esc(x.jenis) + '</span></td><td><span class="badge mono">' + esc(L.d.namaKelas(x.kelasId)) + '</span></td><td>' + esc(L.d.namaMapel(x.mapelId)) + '</td><td class="mono small nowrap">' + L.tgl(x.tanggal, true) + '</td><td><b>' + j.total + ' soal</b><div class="tiny muted">' + j.PG + ' PG / ' + j.ISIAN + ' Isian / ' + j.URAIAN + ' Ur</div></td><td>' + L.badgeUjian(x) + '</td><td class="right nowrap">' + L.aksiUjian(x) + ' <a class="ibtn" href="#/ujian/form/' + id + '" aria-label="Ubah ujian" title="Ubah">' + ic('edit', 16) + '</a> <button class="ibtn dng" data-del="' + esc(x.id) + '" aria-label="Hapus ujian" title="Hapus">' + ic('trash', 16) + '</button></td></tr>'; }).join('') + '</tbody></table></div>' + L.pager(arr.length, hal, per, 'ujian') : L.kosong('clip', 'Tidak ada ujian', 'Ubah filter atau buat ujian baru.', '<a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian</a>');
      }
      draw(); const deb = L.debounce(() => { self.hal = 1; draw(); }, 160);
      root.oninput = e => { if (e.target.id === 'q') { f.q = e.target.value; deb(); } };
      root.onchange = e => { if (e.target.id === 'fj') f.jenis = e.target.value; else if (e.target.id === 'fk') f.kelas = e.target.value; else return; self.hal = 1; draw(); };
      root.onclick = async e => {
        const t = e.target.closest('button,a'); if (!t) return;
        if (t.dataset.tab) { f.tab = t.dataset.tab; self.hal = 1; draw(); return; }
        if (t.dataset.pg) { if (!t.disabled) { self.hal = +t.dataset.pg; draw(); } return; }
        if (t.dataset.a === 'ekspor') { const rows = [['Kode', 'Nama ujian', 'Jenis', 'Kelas', 'Mapel', 'Tanggal', 'PG', 'Isian', 'Uraian', 'Status', 'LJK', 'Rata-rata']].concat(L.S.d.ujian.filter(cocok).map(x => { const j = L.jumlahSoal(x.id), s = L.d.stat(x.id); return [x.kode, x.nama, x.jenis, L.d.namaKelas(x.kelasId), L.d.namaMapel(x.mapelId), x.tanggal, j.PG, j.ISIAN, j.URAIAN, L.statusUjian(x).label, s.ljk, s.n ? s.rata : '']; })); L.exportTabel('daftar-ujian', 'Ujian', rows); return; }
        if (t.dataset.del) {
          const x = L.d.ujian(t.dataset.del); if (!x) return;
          const n = L.d.stat(x.id).ljk;
          if (await L.confirm('Hapus ujian?', 'Ujian <b>' + esc(x.nama) + '</b> beserta ' + n + ' LJK, jawaban, dan nilainya akan dihapus permanen.', 'Hapus', true)) {
            try { await L.api('ujian.hapus', { id: x.id }); await L.bootstrap(); L.toast('Ujian dihapus.'); } catch (err) { L.err(err); }
          }
        }
      };
      this._off = L.onChange(() => { if ($('#ulist')) draw(); });
    },
    unmount() { if (this._off) this._off(); }
  };

  /* ============================================================
     FORM UJIAN (W-07)
     ============================================================ */
  P.ujianform = {
    view(a) {
      const id = ujianId(a), lama = id ? L.d.ujian(id) : null, d = L.S.d, set = L.d.set(); this.id = id;
      if (id && !lama) return L.kosong('clip', 'Ujian tidak ditemukan', 'Ujian mungkin sudah dihapus.', '<a class="btn" href="#/ujian">Kembali</a>');
      this.kunci = id ? hasLJK(id) : false;
      const draft = !id ? L.ls.get('ljk_draft_ujian') : null;
      this.F = klon(lama ? Object.assign({}, lama, { soal: L.d.soalUjian(id).map(s => ({ soalId: s.soalId, bobot: s.bobot })) }) : (draft || { nama: '', jenis: 'PH', kelasId: (d.kelas[0] || {}).id || '', mapelId: (d.mapel[0] || {}).id || '', tanggal: hariIni(), durasi: 90, instruksi: 'Gunakan pensil 2B untuk menghitamkan bulatan. Jawab isian dan uraian dengan pena hitam secara ringkas.', bobotPG: set.bobotPG != null ? set.bobotPG : 40, bobotIsian: set.bobotIsian != null ? set.bobotIsian : 30, bobotUraian: set.bobotUraian != null ? set.bobotUraian : 30, soal: [] }));
      return '<a class="btn sm ghost mb" href="#/ujian">' + ic('arl', 15) + ' Kembali ke Manajemen Ujian</a>' + L.pageHead('Modul W-07', (id ? 'Ubah' : 'Buat') + ' Konfigurasi Ujian', 'Langkah 1 dari 2: Identitas ujian, bobot penilaian, dan pemilihan butir soal.', '<span class="badge mono">' + (lama ? esc(lama.kode) : 'KODE OTOMATIS') + '</span><span class="small faint" id="autosave"></span>') +
        '<div class="stepper mb"><a class="on"><span class="n">1</span>Informasi &amp; Paket Soal</a><a><span class="n">2</span>Pratinjau &amp; Cetak LJK</a></div><div class="col" id="uf"></div><div class="stickybar"><span class="small muted" id="ufmsg"></span><div class="row wrap"><a class="btn" href="#/ujian">Batal</a><button class="btn" data-a="draf">' + ic('save') + ' Simpan Draf</button><button class="btn pri lg" data-a="lanjut">Simpan &amp; Lanjut ke Cetak ' + ic('arr') + '</button></div></div>';
    },
    mount(root) {
      const self = this, F = this.F, d = L.S.d, kunci = this.kunci, set = L.d.set();
      let tf = '', tq = '', dragI = -1;
      const simpanDraf = L.debounce(() => { if (!self.id) { L.ls.set('ljk_draft_ujian', F); const e = $('#autosave'); if (e) e.textContent = 'Draf tersimpan otomatis ' + L.jam(new Date()); } }, 600);
      const total = () => (+F.bobotPG || 0) + (+F.bobotIsian || 0) + (+F.bobotUraian || 0);
      function draw() {
        $('#uf').innerHTML = '<div class="card"><h2>' + ic('book', 18) + ' Bagian 1 · Informasi umum ujian</h2><div class="grid g2 mt"><div><label class="f">Nama / judul resmi ujian <span class="req">*</span></label><input class="in" data-f="nama" value="' + esc(F.nama) + '" placeholder="mis. Penilaian Tengah Semester Biologi Sel X-A"></div><div><label class="f">Alokasi waktu (menit)</label><input class="in mono" type="number" min="5" step="5" data-f="durasi" value="' + esc(F.durasi) + '"></div></div><div class="grid g3 mt"><div><label class="f">Jenis evaluasi</label><select class="in" data-f="jenis">' + JENIS_UJIAN.map(j => '<option value="' + j[0] + '"' + (F.jenis === j[0] ? ' selected' : '') + '>' + j[1] + '</option>').join('') + '</select></div><div><label class="f">Target rombel / kelas <span class="req">*</span></label><select class="in" data-f="kelasId">' + d.kelas.map(k => '<option value="' + esc(k.id) + '"' + (F.kelasId === k.id ? ' selected' : '') + '>' + esc(k.nama) + ' (' + L.d.siswaKelas(k.id).length + ' siswa)</option>').join('') + '</select></div><div><label class="f">Mata pelajaran <span class="req">*</span></label><select class="in" data-f="mapelId">' + d.mapel.map(m => '<option value="' + esc(m.id) + '"' + (F.mapelId === m.id ? ' selected' : '') + '>' + esc(m.nama) + ' (' + esc(m.kode) + ')</option>').join('') + '</select></div></div><div class="grid g2 mt"><div><label class="f">Tanggal pelaksanaan</label><input class="in" type="date" data-f="tanggal" value="' + esc(F.tanggal) + '"></div><div><label class="f">Catatan instruksi (muncul di header LJK)</label><textarea class="in" data-f="instruksi" rows="2">' + esc(F.instruksi) + '</textarea></div></div></div>' +
          '<div class="card"><div class="row between wrap"><h2>' + ic('target', 18) + ' Bagian 2 · Pembobotan nilai (agregasi 100%)</h2><span id="btot"></span></div><p class="small muted mt">Kontribusi tiap jenis soal terhadap nilai akhir skala 0–100. Jenis yang tidak memiliki soal tidak ikut dihitung dan bobotnya dibagi ulang otomatis.</p><div class="grid g3 mt" id="bgrid"></div><div class="mt"><div class="row between tiny muted mb" style="margin-bottom:6px"><span>Distribusi rasio penilaian</span><span id="brasio"></span></div><div class="wbar" id="bbar"></div></div><div class="mt"><button class="btn sm" data-a="bdef">' + ic('refresh', 14) + ' Pakai bobot default sekolah</button></div></div>' +
          '<div class="card pad0"><div class="card-h" style="padding:16px 16px 0"><div><h2>' + ic('list', 18) + ' Bagian 3 · Daftar soal ujian terpilih</h2><div class="small muted" id="ssum"></div></div><div class="row wrap"><a class="btn sm" href="#/bank/form">' + ic('plus', 15) + ' Tulis soal baru</a><button class="btn sm pri" data-a="ambil"' + (kunci ? ' disabled' : '') + '>' + ic('box', 15) + ' Ambil dari Bank Soal</button></div></div>' + (kunci ? '<div class="note warn" style="margin:0 16px 12px">' + ic('warn') + '<div>Daftar soal dikunci karena LJK ujian ini sudah dipindai. Hapus data LJK terlebih dahulu bila ingin mengubah paket soal. Bobot per soal tetap dapat diubah.</div></div>' : '') + '<div class="fbar" style="padding:0 16px 12px"><div class="seg" id="stf"></div><div class="search grow" style="max-width:none"><input class="in" id="stq" placeholder="Cari dalam soal terpilih…" style="padding-left:40px" aria-label="Cari soal terpilih">' + ic('search') + '</div></div><div id="slist"></div></div>';
        drawBobot(); drawSoal();
      }
      function drawBobot() {
        const j = { PG: 0, ISIAN: 0, URAIAN: 0 }; F.soal.forEach(s => { const b = L.d.bank(s.soalId); if (b) j[b.jenis]++; });
        const tot = total(), ok = Math.round(tot) === 100;
        const defs = [['bobotPG', 'PG', 'Pilihan Ganda', 'Dibaca dari arsiran bulatan A–E; dinilai lokal tanpa AI.', 'pri'], ['bobotIsian', 'ISIAN', 'Isian Singkat', 'Pencocokan teks, variasi jawaban, kemiripan, lalu AI bila ragu.', 'vio'], ['bobotUraian', 'URAIAN', 'Uraian / Esai', 'Dinilai AI per aspek rubrik, lengkap dengan alasan.', 'warn']];
        $('#bgrid').innerHTML = defs.map(x => '<div class="card flat" style="background:var(--card2)"><div class="row between"><span class="badge ' + x[4] + '">' + x[1] + '</span><b>' + x[2] + '</b></div><div class="row mt"><input class="in mono" type="number" min="0" max="100" step="1" data-b="' + x[0] + '" value="' + esc(F[x[0]]) + '" style="max-width:110px" aria-label="Bobot ' + x[2] + '"><b>%</b></div><div class="tiny muted mt">' + x[3] + '</div><div class="tiny mt ' + (j[x[1]] ? 'muted' : 'errtx') + '" style="margin-top:6px">' + j[x[1]] + ' butir soal dipilih' + (!j[x[1]] && +F[x[0]] > 0 ? ' — bobot tidak terpakai' : '') + '</div></div>').join('');
        $('#btot').innerHTML = '<span class="badge ' + (ok ? 'ok' : 'err') + '">' + (ok ? ic('check', 13) + ' TOTAL: 100% (VALID)' : ic('warn', 13) + ' TOTAL: ' + L.num(tot, 1) + '% — harus 100%') + '</span>';
        $('#brasio').textContent = F.bobotPG + '% PG : ' + F.bobotIsian + '% IS : ' + F.bobotUraian + '% UR';
        $('#bbar').innerHTML = '<i style="width:' + Math.min(100, +F.bobotPG || 0) + '%;background:var(--pri)"></i><i style="width:' + Math.min(100, +F.bobotIsian || 0) + '%;background:var(--vio)"></i><i style="width:' + Math.min(100, +F.bobotUraian || 0) + '%;background:var(--warn)"></i>';
      }
      function drawSoal() {
        let poin = 0, n = 0; F.soal.forEach(s => { poin += +s.bobot || 0; n++; });
        const c = { PG: 0, ISIAN: 0, URAIAN: 0 }; F.soal.forEach(s => { const b = L.d.bank(s.soalId); if (b) c[b.jenis]++; });
        $('#ssum').textContent = n + ' soal terdaftar • Durasi ' + (F.durasi || 0) + ' menit • Skor kasar ' + L.num(poin, 1) + ' poin';
        $('#stf').innerHTML = [['', 'Semua (' + n + ')'], ['PG', 'PG (' + c.PG + ')'], ['ISIAN', 'Isian (' + c.ISIAN + ')'], ['URAIAN', 'Uraian (' + c.URAIAN + ')']].map(x => '<button data-tf="' + x[0] + '" class="' + (tf === x[0] ? 'on' : '') + '">' + x[1] + '</button>').join('');
        const q = tq.toLowerCase(), rows = F.soal.map((s, i) => ({ s, i, b: L.d.bank(s.soalId) })).filter(r => r.b && (!tf || r.b.jenis === tf) && (!q || (L.polos(r.b.teks) + ' ' + r.b.kode + ' ' + r.b.topik).toLowerCase().indexOf(q) >= 0));
        $('#slist').innerHTML = F.soal.length ? '<div class="tw"><table class="t"><thead><tr><th style="width:36px"></th><th style="width:44px">No</th><th>Cuplikan butir soal</th><th>Tipe</th><th style="width:110px">Bobot butir</th><th>Kunci / rubrik</th><th class="right">Aksi</th></tr></thead><tbody>' + rows.map(r => '<tr data-i="' + r.i + '" draggable="' + (kunci ? 'false' : 'true') + '"><td class="faint" style="cursor:' + (kunci ? 'default' : 'grab') + '" title="Seret untuk mengurutkan">' + ic('grip', 16) + '</td><td class="b mono">' + (r.i + 1) + '</td><td style="min-width:220px;max-width:420px"><div class="b">' + esc(L.potong(L.polos(r.b.teks), 80)) + '</div><div class="tiny faint mono">ID: ' + esc(r.b.kode) + (r.b.topik ? ' • Topik: ' + esc(r.b.topik) : '') + (r.b.lampiranId ? ' • [Ada gambar]' : '') + '</div></td><td><span class="badge ' + L.JENIS[r.b.jenis][2] + '">' + L.JENIS[r.b.jenis][1] + '</span></td><td><input class="in mono" type="number" min="0.5" step="0.5" data-sb="' + r.i + '" value="' + esc(r.s.bobot) + '" style="min-height:36px;padding:4px 8px" aria-label="Bobot soal ' + (r.i + 1) + '"></td><td>' + ketKunci(r.b) + '</td><td class="right nowrap">' + (kunci ? '' : '<button class="ibtn" data-up="' + r.i + '" aria-label="Naikkan" ' + (r.i === 0 ? 'disabled' : '') + '>' + ic('chevu', 15) + '</button> <button class="ibtn" data-dn="' + r.i + '" aria-label="Turunkan" ' + (r.i === F.soal.length - 1 ? 'disabled' : '') + '>' + ic('chevd', 15) + '</button> <button class="ibtn dng" data-rm="' + r.i + '" aria-label="Keluarkan dari ujian">' + ic('trash', 15) + '</button>') + '</td></tr>').join('') + '</tbody></table></div>' + (rows.length ? '' : '<div class="empty">Tidak ada soal yang cocok dengan filter.</div>') : L.kosong('box', 'Belum ada soal di ujian ini', 'Ambil soal dari bank soal atau tulis soal baru.', kunci ? '' : '<button class="btn pri" data-a="ambil">' + ic('box', 15) + ' Pilih soal dari Bank Soal</button>');
      }
      draw();
      root.oninput = e => {
        const t = e.target;
        if (t.dataset.f) { F[t.dataset.f] = t.value; if (t.dataset.f === 'durasi') drawSoal(); simpanDraf(); }
        else if (t.dataset.b) { F[t.dataset.b] = t.value === '' ? 0 : Number(t.value); drawBobotKeepFocus(t); simpanDraf(); }
        else if (t.dataset.sb != null && t.dataset.sb !== '') { F.soal[+t.dataset.sb].bobot = Number(t.value) || 0; simpanDraf(); }
        else if (t.id === 'stq') { tq = t.value; drawSoal(); const e2 = $('#stq'); if (e2) { e2.focus(); } }
      };
      function drawBobotKeepFocus() { const j = { PG: 0, ISIAN: 0, URAIAN: 0 }; F.soal.forEach(s => { const b = L.d.bank(s.soalId); if (b) j[b.jenis]++; }); const tot = total(), ok = Math.round(tot) === 100; $('#btot').innerHTML = '<span class="badge ' + (ok ? 'ok' : 'err') + '">' + (ok ? ic('check', 13) + ' TOTAL: 100% (VALID)' : ic('warn', 13) + ' TOTAL: ' + L.num(tot, 1) + '% — harus 100%') + '</span>'; $('#brasio').textContent = F.bobotPG + '% PG : ' + F.bobotIsian + '% IS : ' + F.bobotUraian + '% UR'; $('#bbar').innerHTML = '<i style="width:' + Math.min(100, +F.bobotPG || 0) + '%;background:var(--pri)"></i><i style="width:' + Math.min(100, +F.bobotIsian || 0) + '%;background:var(--vio)"></i><i style="width:' + Math.min(100, +F.bobotUraian || 0) + '%;background:var(--warn)"></i>'; }
      root.onchange = e => { const t = e.target; if (t.dataset.f && t.tagName === 'SELECT') { F[t.dataset.f] = t.value; simpanDraf(); } };
      /* seret & lepas */
      root.addEventListener('dragstart', e => { const tr = e.target.closest && e.target.closest('tr[data-i]'); if (!tr || kunci) return; dragI = +tr.dataset.i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragI)); } catch (x) { } tr.style.opacity = .5; });
      root.addEventListener('dragend', e => { const tr = e.target.closest && e.target.closest('tr[data-i]'); if (tr) tr.style.opacity = ''; dragI = -1; });
      root.addEventListener('dragover', e => { if (dragI >= 0 && e.target.closest('tr[data-i]')) e.preventDefault(); });
      root.addEventListener('drop', e => { const tr = e.target.closest('tr[data-i]'); if (!tr || dragI < 0) return; e.preventDefault(); const to = +tr.dataset.i; if (to !== dragI) { const [x] = F.soal.splice(dragI, 1); F.soal.splice(to, 0, x); drawSoal(); simpanDraf(); } dragI = -1; });
      root.onclick = async e => {
        const t = e.target.closest('button'); if (!t) return;
        if (t.dataset.tf != null && t.closest('#stf')) { tf = t.dataset.tf; drawSoal(); return; }
        if (t.dataset.up != null) { const i = +t.dataset.up; if (i > 0) { const x = F.soal[i]; F.soal[i] = F.soal[i - 1]; F.soal[i - 1] = x; drawSoal(); simpanDraf(); } return; }
        if (t.dataset.dn != null) { const i = +t.dataset.dn; if (i < F.soal.length - 1) { const x = F.soal[i]; F.soal[i] = F.soal[i + 1]; F.soal[i + 1] = x; drawSoal(); simpanDraf(); } return; }
        if (t.dataset.rm != null) { F.soal.splice(+t.dataset.rm, 1); drawSoal(); drawBobot(); simpanDraf(); return; }
        if (t.dataset.a === 'bdef') { F.bobotPG = set.bobotPG != null ? set.bobotPG : 40; F.bobotIsian = set.bobotIsian != null ? set.bobotIsian : 30; F.bobotUraian = set.bobotUraian != null ? set.bobotUraian : 30; drawBobot(); simpanDraf(); return; }
        if (t.dataset.a === 'ambil') return pilihBank();
        if (t.dataset.a === 'draf' || t.dataset.a === 'lanjut') return simpan(t, t.dataset.a === 'lanjut');
      };
      async function simpan(btn, lanjut) {
        if (!String(F.nama).trim()) return L.toast('Nama ujian wajib diisi.', 'warn');
        if (!F.kelasId || !F.mapelId) return L.toast('Pilih kelas dan mata pelajaran.', 'warn');
        if (Math.round(total()) !== 100) return L.toast('Total pembobotan harus tepat 100% (sekarang ' + L.num(total(), 1) + '%).', 'warn');
        if (lanjut && !F.soal.length) return L.toast('Tambahkan minimal satu soal sebelum lanjut ke cetak.', 'warn');
        const uj = Object.assign({}, F); delete uj.soal; if (self.id) uj.id = self.id;
        L.btnBusy(btn, true);
        try {
          const r = await L.api('ujian.simpan', { ujian: uj, soal: F.soal.map(s => ({ soalId: s.soalId, bobot: Number(s.bobot) || 0 })) });
          gabung(r); L.ls.del('ljk_draft_ujian'); self.id = r.ujian.id; L.toast(lanjut ? 'Ujian disimpan. Lanjut ke cetak LJK.' : 'Draf ujian disimpan.');
          location.hash = lanjut ? '#/cetak/' + encodeURIComponent(r.ujian.id) : '#/ujian';
        } catch (err) { L.btnBusy(btn, false); L.err(err); }
      }
      function pilihBank() {
        const dipilih = new Set(F.soal.map(s => s.soalId)), pilih = new Set(); const fl = { mapel: F.mapelId, jenis: '', q: '' };
        const m = L.modal({ title: ic('box') + ' Ambil soal dari Bank Soal', size: 'w-l', body: '<div class="fbar mb"><div class="search grow" style="max-width:none"><input class="in" id="bq" placeholder="Cari teks soal / topik…" style="padding-left:40px">' + ic('search') + '</div><select class="in" id="bm">' + L.opt(L.S.d.mapel, 'id', 'nama', fl.mapel, 'Semua mapel') + '</select><select class="in" id="bj"><option value="">Semua jenis</option><option value="PG">Pilihan Ganda</option><option value="ISIAN">Isian Singkat</option><option value="URAIAN">Uraian</option></select></div><div id="bl" style="max-height:52vh;overflow:auto"></div>', footer: '<span class="small muted grow" id="bc"></span><button class="btn" data-close>Batal</button><button class="btn pri" id="ok" disabled>Tambahkan</button>' });
        const arr = () => { const q = fl.q.toLowerCase(); return L.S.d.bankSoal.filter(b => (!fl.mapel || b.mapelId === fl.mapel) && (!fl.jenis || b.jenis === fl.jenis) && (!q || (L.polos(b.teks) + ' ' + b.topik + ' ' + b.kode).toLowerCase().indexOf(q) >= 0)); };
        const dr = () => {
          const a = arr(); m.$('#bl').innerHTML = a.length ? '<table class="t"><tbody>' + a.map(b => { const sdh = dipilih.has(b.id); return '<tr class="' + (pilih.has(b.id) ? 'sel' : '') + '"><td style="width:40px"><input type="checkbox" class="ck" data-id="' + esc(b.id) + '"' + (sdh ? ' disabled checked' : '') + (pilih.has(b.id) ? ' checked' : '') + ' aria-label="Pilih soal"></td><td><div class="b">' + esc(L.potong(L.polos(b.teks), 100)) + '</div><div class="tiny faint mono">' + esc(b.kode) + ' • ' + esc(L.d.namaMapel(b.mapelId)) + (b.topik ? ' • ' + esc(b.topik) : '') + '</div></td><td><span class="badge ' + L.JENIS[b.jenis][2] + '">' + b.jenis + '</span></td><td class="mono b">' + L.num(b.bobot, 1) + '</td><td>' + (sdh ? '<span class="badge">sudah dipilih</span>' : ketKunci(b)) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">Tidak ada soal yang cocok.</div>';
          m.$('#bc').textContent = pilih.size + ' soal dipilih'; m.$('#ok').disabled = !pilih.size;
        };
        dr(); const deb = L.debounce(dr, 160);
        m.$('#bq').oninput = e => { fl.q = e.target.value; deb(); }; m.$('#bm').onchange = e => { fl.mapel = e.target.value; dr(); }; m.$('#bj').onchange = e => { fl.jenis = e.target.value; dr(); };
        m.$('#bl').onchange = e => { const id = e.target.dataset.id; if (!id) return; e.target.checked ? pilih.add(id) : pilih.delete(id); e.target.closest('tr').classList.toggle('sel', e.target.checked); m.$('#bc').textContent = pilih.size + ' soal dipilih'; m.$('#ok').disabled = !pilih.size; };
        m.$('#ok').onclick = () => { L.S.d.bankSoal.filter(b => pilih.has(b.id)).forEach(b => F.soal.push({ soalId: b.id, bobot: b.bobot })); m.close(); drawSoal(); drawBobot(); simpanDraf(); L.toast(pilih.size + ' soal ditambahkan.'); };
      }
    }
  };

  /* ============================================================
     CETAK LJK (W-08)
     ============================================================ */
  L.qrSvg = text => {
    try {
      const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); let p = '';
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) p += 'M' + c + ',' + r + 'h1v1h-1z';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + p + '" fill="#000"/></svg>';
    } catch (e) { return ''; }
  };
  /** HTML satu lembar LJK untuk satu siswa. */
  function lembar(uj, s, soal, opt) {
    const set = L.d.set(), kode = 'LJK|' + uj.id + '|' + s.id + '|' + s.nis, qr = opt.qr ? L.qrSvg(kode) : '';
    const pg = soal.filter(x => x.b.jenis === 'PG'), isi = soal.filter(x => x.b.jenis === 'ISIAN'), ur = soal.filter(x => x.b.jenis === 'URAIAN');
    const hr = n => ('0' + n).slice(-2);
    const bub = b => (b.opsi || []).map(o => '<span class="bub">' + esc(o.key) + '</span>').join('') || ['A', 'B', 'C', 'D', 'E'].map(k => '<span class="bub">' + k + '</span>').join('');
    const half = Math.ceil(pg.length / 2), col = arr => arr.map(x => '<div class="pgr"><b>' + hr(x.nomor) + '.</b><span>' + bub(x.b) + '</span></div>').join('');
    return '<div class="sheet"><i class="fid tl"></i><i class="fid tr"></i><i class="fid bl"></i><i class="fid br"></i>' +
      '<div class="hd"><div><b>' + esc((set.namaSekolah || 'SEKOLAH').toUpperCase()) + '</b><small>LEMBAR JAWABAN KOMPUTER &amp; VERIFIKASI DIGITAL</small><small>' + esc(uj.nama) + ' · TA ' + esc(set.tahunAjaran || '') + '</small></div><div style="text-align:right;font-size:8pt">' + esc(uj.kode) + '</div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:8.5pt;margin-bottom:3mm"><span><b>Mapel:</b> ' + esc(L.d.namaMapel(uj.mapelId)) + '</span><span><b>Kelas:</b> ' + esc(L.d.namaKelas(uj.kelasId)) + '</span><span><b>Waktu:</b> ' + esc(uj.durasi) + ' menit</span><span><b>Tgl:</b> ' + esc(L.tgl(uj.tanggal, true)) + '</span></div>' +
      '<div class="idbox"><div class="qr">' + (qr || '<div style="border:1px dashed #000;height:100%;font-size:6pt;padding:1mm">QR tidak tersedia</div>') + '</div><table><tr><td>NAMA SISWA:</td><td>' + esc(s.nama.toUpperCase()) + '</td></tr><tr><td>NOMOR INDUK (NIS):</td><td>' + esc(s.nis) + '</td></tr><tr><td>KELAS:</td><td>' + esc(L.d.namaKelas(s.kelasId)) + '</td></tr><tr><td>PARAF SISWA:</td><td></td></tr></table></div>' +
      (pg.length ? '<h4>BAGIAN I: PILIHAN GANDA (HITAMKAN BULATAN PENUH)<span>Contoh benar: ● &nbsp; Salah: ⊗ ✓</span></h4><div class="pgcols"><div>' + col(pg.slice(0, half)) + '</div><div>' + col(pg.slice(half)) + '</div></div>' : '') +
      (isi.length ? '<h4>BAGIAN ' + (pg.length ? 'II' : 'I') + ': ISIAN SINGKAT (TULIS DENGAN HURUF KAPITAL)<span>' + isi.length + ' butir (' + hr(isi[0].nomor) + '–' + hr(isi[isi.length - 1].nomor) + ')</span></h4>' + isi.map(x => '<div class="isr"><b>' + hr(x.nomor) + '.</b><div class="ln">[ RUANG JAWABAN ISIAN ' + hr(x.nomor) + ' ]</div></div>').join('') : '') +
      (ur.length ? '<h4>BAGIAN ' + (pg.length && isi.length ? 'III' : pg.length || isi.length ? 'II' : 'I') + ': URAIAN / ESAI TERSTRUKTUR<span>Tulis dengan pena hitam</span></h4>' + ur.map(x => '<div class="ur"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i><div class="q">' + hr(x.nomor) + '. ' + esc(L.potong(L.polos(x.b.teks), 150)) + '</div>' + [1, 2, 3, 4].map(() => '<div class="ln"></div>').join('') + '</div>').join('') : '') +
      '<div class="ft"><div><b>PETUNJUK PENTING:</b><br>' + esc(uj.instruksi || 'Gunakan pensil 2B atau pulpen hitam tebal. Jangan melipat, merobek, atau mengotori lembar ini.') + '</div><div style="text-align:right;font-family:monospace;font-size:7pt;align-self:flex-end">' + esc(s.nis + '-' + uj.kode) + '</div></div></div>';
  }
  L.lembarLJK = lembar;

  P.cetak = {
    view(a) {
      const d = L.S.d, pilihan = d.ujian.filter(x => L.jumlahSoal(x.id).total > 0);
      let id = ujianId(a); if (!id || !L.d.ujian(id)) id = (pilihan[0] || {}).id || ''; this.id = id;
      if (!id) return L.pageHead('Modul distribusi fisik', 'Cetak Lembar Jawaban Komputer (LJK)', 'Pilih paket ujian, kelas target, dan konfigurasi cetak LJK ber-QR otomatis.') + L.kosong('print', 'Belum ada ujian dengan soal', 'Buat ujian dan pilih soalnya terlebih dahulu.', '<a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian</a>');
      return L.pageHead('Modul distribusi fisik', 'Cetak Lembar Jawaban Komputer (LJK)', 'Pilih paket ujian, kelas target, dan konfigurasi cetak LJK ber-QR otomatis.') +
        '<div class="split"><div class="col"><div class="card"><div class="row between"><h2>' + ic('sliders', 18) + ' Konfigurasi cetak</h2><span class="badge mono">CFG-LJK-A4</span></div><label class="f mt">Paket ujian aktif <span class="faint" id="cn"></span></label><select class="in" id="uj">' + L.opt(pilihan, 'id', x => x.nama + ' (' + L.jumlahSoal(x.id).total + ' soal)', id) + '</select><label class="f mt">Kelas target roster <span class="faint" id="cs"></span></label><input class="in" id="kls" disabled><label class="f mt">Metode pemilihan siswa</label><div class="seg" id="mode"><button data-m="semua" class="on">Semua siswa</button><button data-m="manual">Pilih manual</button></div><div class="row between mt"><label class="f" style="margin:0">Daftar roster</label><button class="btn sm ghost" data-a="all">Pilih semua</button></div><div id="roster" class="mt" style="max-height:300px;overflow:auto"></div><div class="row between mt card flat" style="background:var(--card2);padding:12px"><div><b>Sertakan QR code identitas siswa</b><div class="tiny muted">Mempercepat pengenalan otomatis saat pemindaian.</div></div><label class="switch"><input type="checkbox" id="qrOn" checked aria-label="Sertakan QR"><i></i></label></div><div class="grid g2 mt"><div><label class="f">Format lembar</label><select class="in" disabled><option>A4 (210 × 297 mm)</option></select></div><div><label class="f">Orientasi</label><input class="in" disabled value="Portrait • 1 hal/siswa"></div></div></div><div class="note">' + ic('info') + '<div>Setiap lembar memuat QR unik dan empat penanda sudut (fiducial). Cetak dengan skala <b>100%</b> (tanpa "Fit to page") agar proporsi tetap akurat.</div></div></div>' +
        '<div class="col" style="min-width:0"><div class="card"><div class="row between wrap"><h2>' + ic('eye', 18) + ' Pratinjau lembar LJK <span class="badge" id="pgl">—</span></h2><div class="row wrap"><button class="btn sm" data-z="-" aria-label="Perkecil">' + ic('minus', 14) + '</button><b class="mono small" id="zl">100%</b><button class="btn sm" data-z="+" aria-label="Perbesar">' + ic('plus', 14) + '</button><button class="btn sm" data-p="-" aria-label="Siswa sebelumnya">' + ic('arl', 14) + '</button><button class="btn sm" data-p="+" aria-label="Siswa berikutnya">' + ic('arr', 14) + '</button></div></div></div><div class="sheetwrap" id="sw"></div></div></div><div class="stickybar"><div class="row"><span class="badge pri">' + ic('file', 14) + '</span><div><b id="sel">0 siswa dipilih</b><div class="tiny muted" id="sel2"></div></div></div><div class="row wrap"><button class="btn" data-a="pdf">' + ic('dl') + ' Simpan sebagai PDF</button><button class="btn pri lg" data-a="cetak">' + ic('print') + ' Cetak sekarang</button></div></div>';
    },
    mount(root) {
      if (!this.id) return;
      const self = this; let uj = L.d.ujian(this.id), sel = new Set(), mode = 'semua', idx = 0, zoom = 1, soal = [], qrOk = true;
      const muat = () => {
        uj = L.d.ujian(self.id); soal = L.d.soalUjian(uj.id).map(su => ({ nomor: su.nomor, b: L.d.bank(su.soalId) })).filter(x => x.b);
        const sw = L.d.siswaKelas(uj.kelasId); sel = new Set(sw.map(s => s.id)); idx = 0;
        $('#kls').value = L.d.namaKelas(uj.kelasId) + ' (' + sw.length + ' siswa terdaftar)'; $('#cn').textContent = soal.length + ' item soal'; $('#cs').textContent = sw.length + ' siswa';
      };
      const roster = () => L.d.siswaKelas(uj.kelasId);
      const dRoster = () => {
        const r = roster(); $('#roster').innerHTML = r.length ? r.map((s, i) => '<label class="qitem' + (r[idx] && r[idx].id === s.id ? ' on' : '') + '" data-i="' + i + '" style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="checkbox" class="ck" data-s="' + esc(s.id) + '"' + (sel.has(s.id) ? ' checked' : '') + (mode === 'semua' ? ' disabled' : '') + ' aria-label="Pilih ' + esc(s.nama) + '"><span class="grow"><b>' + esc(s.nama) + '</b><div class="tiny muted mono">NIS: ' + esc(s.nis) + ' • No: ' + ('0' + (i + 1)).slice(-2) + '</div></span><span class="badge ok">SIAP</span></label>').join('') : '<div class="empty">Kelas ini belum memiliki siswa aktif.</div>';
        $('#sel').textContent = sel.size + ' siswa dipilih'; $('#sel2').textContent = 'Estimasi ' + sel.size + ' lembar • A4 • 1 halaman/siswa';
      };
      const fit = () => { const w = $('#sw').clientWidth - 24; return Math.max(.35, Math.min(1, w / 800)); };
      const dPrev = () => {
        const r = roster(), s = r[idx] || r[0]; if (!s) { $('#sw').innerHTML = '<div class="empty">Tidak ada siswa.</div>'; $('#pgl').textContent = '—'; return; }
        $('#pgl').textContent = 'Siswa ' + (r.indexOf(s) + 1) + ' dari ' + r.length + ' (' + s.nama + ')';
        $('#sw').innerHTML = '<div style="zoom:' + zoom + '">' + lembar(uj, s, soal, { qr: $('#qrOn').checked }) + '</div>'; $('#zl').textContent = Math.round(zoom * 100) + '%';
      };
      const semua = () => { dRoster(); dPrev(); };
      L.libs.qr().catch(() => { qrOk = false; L.toast('Pustaka QR tidak dapat dimuat (periksa internet). Lembar dicetak tanpa gambar QR.', 'warn', 7000); }).then(() => { dPrev(); });
      muat(); zoom = fit(); semua();
      const ujEl = $('#uj'); ujEl.onchange = () => { location.hash = '#/cetak/' + encodeURIComponent(ujEl.value); };
      $('#qrOn').onchange = dPrev;
      root.onclick = async e => {
        const t = e.target.closest('button,label.qitem'); if (!t) return;
        if (t.dataset.m) { mode = t.dataset.m; $$('#mode button').forEach(b => b.classList.toggle('on', b === t)); if (mode === 'semua') sel = new Set(roster().map(s => s.id)); dRoster(); return; }
        if (t.dataset.a === 'all') { sel = new Set(roster().map(s => s.id)); dRoster(); return; }
        if (t.dataset.z) { zoom = Math.max(.3, Math.min(1.4, zoom + (t.dataset.z === '+' ? .1 : -.1))); dPrev(); return; }
        if (t.dataset.p) { const n = roster().length; idx = (idx + (t.dataset.p === '+' ? 1 : -1) + n) % n; semua(); return; }
        if (t.classList && t.classList.contains('qitem') && !e.target.closest('input')) { idx = +t.dataset.i; semua(); return; }
        if (t.dataset.a === 'cetak' || t.dataset.a === 'pdf') {
          const lst = roster().filter(s => sel.has(s.id)); if (!lst.length) return L.toast('Pilih minimal satu siswa.', 'warn');
          if (t.dataset.a === 'pdf') L.toast('Pada dialog cetak, pilih "Simpan sebagai PDF" sebagai printer.', 'info', 6000);
          const qr = $('#qrOn').checked; if (qr) { try { await L.libs.qr(); } catch (x) { } }
          L.cetak(lst.map(s => lembar(uj, s, soal, { qr })).join(''), 'cetak-ljk');
          setTimeout(async () => {
            if (uj.dicetak) return;
            if (await L.confirm('Tandai ujian sudah dicetak?', 'Status <b>' + esc(uj.nama) + '</b> akan berubah menjadi "LJK Dicetak" sehingga siap menerima unggahan LJK.', 'Ya, tandai')) {
              try { await L.api('ujian.dicetak', { id: uj.id }); uj.dicetak = true; const x = L.d.ujian(uj.id); if (x) x.dicetak = true; L.cacheBoot(); L.emit(); L.toast('Status ujian diperbarui.'); } catch (err) { L.err(err); }
            }
          }, 600);
        }
      };
      root.onchange = e => { const s = e.target.dataset && e.target.dataset.s; if (s) { e.target.checked ? sel.add(s) : sel.delete(s); $('#sel').textContent = sel.size + ' siswa dipilih'; $('#sel2').textContent = 'Estimasi ' + sel.size + ' lembar • A4 • 1 halaman/siswa'; } };
    }
  };

  /* ============================================================
     UNGGAH LJK (W-09)
     ============================================================ */
  const stQ = {
    baca: ['', 'Membaca foto…'], 'tanpa-id': ['warn', 'Pilih siswa'], antri: ['', 'Menunggu antrean'], unggah: ['sky', 'Mengunggah…'], proses: ['vio', 'Diproses AI…'], selesai: ['ok', 'Selesai'], perlu: ['warn', 'Perlu verifikasi'], gagal: ['err', 'Gagal']
  };
  const stRec = { 'Menunggu': 'antri', 'Diproses': 'proses', 'Perlu Verifikasi': 'perlu', 'Selesai': 'selesai', 'Gagal': 'gagal' };
  const lbKual = (label, skor) => !label ? '<span class="faint">—</span>' : '<span class="badge ' + (label === 'Baik' ? 'ok' : label === 'Cukup' ? 'warn' : 'err') + '">' + esc(label) + (skor ? ' (' + skor + '%)' : '') + '</span>';

  P.unggah = {
    hal: 1, filter: '',
    view(a) {
      const d = L.S.d, uList = d.ujian.filter(x => L.jumlahSoal(x.id).total > 0 && x.dicetak).concat(d.ujian.filter(x => L.jumlahSoal(x.id).total > 0 && !x.dicetak)).sort((a1, b1) => (b1.dicetak ? 1 : 0) - (a1.dicetak ? 1 : 0));
      let id = ujianId(a); if (!id || !L.d.ujian(id)) id = (uList.find(x => L.statusUjian(x).kode !== 'selesai') || uList[0] || {}).id || ''; this.id = id; this.hal = 1;
      const head = L.pageHead('Modul akuisisi &amp; scoring citra', 'Unggah LJK &amp; Pemantauan Koreksi AI', 'Unggah foto atau hasil pindai LJK untuk dibaca dan dinilai otomatis. Pastikan keempat penanda sudut terlihat utuh.', '<button class="btn" data-a="refresh">' + ic('refresh') + ' Segarkan</button>');
      if (!id) return head + L.kosong('upload', 'Belum ada ujian yang siap', 'Buat ujian, pilih soal, lalu cetak LJK terlebih dahulu.', '<a class="btn pri" href="#/ujian/form">' + ic('plus') + ' Buat Ujian</a>');
      const uj = L.d.ujian(id), kq = d.kuota || { terpakai: 0, batas: 0 };
      const diag = '<svg viewBox="0 0 220 150" style="width:100%;max-width:260px;display:block;margin:auto"><rect x="30" y="8" width="160" height="134" rx="6" fill="#fff" stroke="var(--line2)"/>' + [[34, 12], [178, 12], [34, 130], [178, 130]].map(p => '<rect x="' + p[0] + '" y="' + p[1] + '" width="8" height="8" fill="#000"/>').join('') + '<rect x="50" y="22" width="40" height="40" fill="#e5e7eb" stroke="#000"/><rect x="56" y="28" width="10" height="10"/><rect x="74" y="28" width="10" height="10"/><rect x="56" y="46" width="10" height="10"/>' + [0, 1, 2, 3, 4, 5].map(i => '<rect x="104" y="' + (26 + i * 8) + '" width="70" height="4" fill="#cbd5e1"/>').join('') + [0, 1, 2].map(i => '<rect x="50" y="' + (80 + i * 14) + '" width="124" height="8" fill="none" stroke="#94a3b8" stroke-dasharray="3 2"/>').join('') + '</svg>';
      return head + '<div class="card flat mb"><div class="grid g3"><div><label class="f">Ujian aktif terpilih</label><select class="in" id="uj">' + L.opt(uList, 'id', x => x.nama + (x.dicetak ? '' : ' (belum dicetak)'), id) + '</select></div><div><label class="f">Target kelas / rombel</label><input class="in" disabled value="' + esc(L.d.namaKelas(uj.kelasId)) + ' (' + L.d.siswaKelas(uj.kelasId).length + ' siswa)"></div><div><label class="f">Kuota koreksi AI hari ini</label><div class="row between"><b class="mono">' + kq.terpakai + ' / ' + kq.batas + ' lembar</b><span class="badge ' + (kq.batas && kq.terpakai / kq.batas > .85 ? 'err' : 'ok') + '">Sisa ' + Math.max(0, kq.batas - kq.terpakai) + '</span></div><div class="progress mt ' + (kq.batas && kq.terpakai / kq.batas > .85 ? 'err' : '') + '" style="margin-top:8px"><i style="width:' + Math.min(100, kq.batas ? kq.terpakai / kq.batas * 100 : 0) + '%"></i></div></div></div></div>' +
        '<div class="split r"><div class="card"><label class="drop" id="dz" style="display:block;cursor:pointer;padding:40px 16px">' + ic('cloud', 52) + '<div class="mt"><b style="font-size:1.1rem">Seret berkas foto / scan LJK ke area ini</b></div><div class="small mt">JPG, PNG, atau WebP · hingga 12 MB per berkas · bisa banyak berkas sekaligus<br><span class="faint">PDF belum didukung — gunakan foto atau scan per lembar (gambar).</span></div><div class="row wrap mt" style="justify-content:center"><span class="btn pri">' + ic('folder') + ' Pilih berkas komputer</span><a class="btn" href="#/pindai/' + encodeURIComponent(id) + '">' + ic('camera') + ' Ambil foto langsung (kamera)</a></div><input type="file" id="fi" accept="image/*" multiple class="hide"></label></div>' +
        '<div class="card"><div class="row between"><h3>' + ic('scan', 18) + ' Panduan kualitas foto LJK</h3><span class="badge mono">QC-STD</span></div><div class="mt" style="background:var(--card2);border-radius:12px;padding:10px">' + diag + '</div><div class="col mt" style="gap:8px">' + [['4 sudut hitam (fiducial)', 'Pastikan semua kotak hitam di sudut terlihat jelas dan tidak terpotong.'], ['Pencahayaan rata', 'Hindari pantulan lampu atau bayangan tangan/ponsel yang menutupi bulatan.'], ['Sudut tegak lurus', 'Ambil foto sejajar bidang kertas (kemiringan perspektif < 15°).'], ['Resolusi memadai', 'Minimal 1280 × 720 px agar tulisan tangan dan QR terbaca.']].map(g => '<div class="row" style="align-items:flex-start;gap:10px;background:var(--card2);border-radius:10px;padding:9px 11px"><span style="color:var(--ok)">' + ic('checkc', 18) + '</span><div><b class="small">' + g[0] + '</b><div class="tiny muted">' + g[1] + '</div></div></div>').join('') + '</div></div></div>' +
        '<div class="card mt-l" id="qp"></div><div class="card pad0 mt"><div id="qt"></div></div>';
    },
    mount(root) {
      if (!this.id) return;
      const self = this, per = 5, id = this.id; let uj = L.d.ujian(id);
      const baris = () => {
        const out = [], inq = new Set(); Q.untuk(id).forEach(it => { if (it.ljkId) inq.add(it.ljkId); const s = L.d.siswa(it.siswaId); out.push({ q: it, key: it.id, thumb: it.thumb, nama: s ? s.nama : '(belum teridentifikasi)', nis: it.nis || '', waktu: new Date(it.waktu), kual: [it.label, it.kualitas], st: it.status, pesan: it.pesan, skor: it.skor, perlu: it.perlu, ljkId: it.ljkId }); });
        (L.S.d.ljk || []).filter(l => l.ujianId === id && !inq.has(l.id)).sort((a, b) => String(b.waktuUnggah).localeCompare(String(a.waktuUnggah))).forEach(l => { const s = L.d.siswa(l.siswaId); out.push({ l, key: l.id, thumb: '', nama: s ? s.nama : '—', nis: l.nis || (s ? s.nis : ''), waktu: new Date(l.waktuUnggah), kual: [l.kualitasLabel, l.kualitas], st: stRec[l.status] || 'antri', pesan: l.catatan, skor: l.skorTotal, perlu: l.jumlahPerlu, ljkId: l.id }); });
        return out;
      };
      function drawPanel() {
        const n = L.d.siswaKelas(uj.kelasId).length, rows = baris(), c = { selesai: 0, perlu: 0, antri: 0, gagal: 0 };
        rows.forEach(r => { if (r.st === 'selesai') c.selesai++; else if (r.st === 'perlu') c.perlu++; else if (r.st === 'gagal') c.gagal++; else c.antri++; });
        const tot = Math.max(rows.length, 1), proses = c.selesai + c.perlu, pct = n ? Math.round(proses / n * 100) : 0;
        const dur = (L.S.d.ljk || []).filter(l => l.ujianId === id && l.waktuSelesai && l.waktuUnggah).map(l => (new Date(l.waktuSelesai) - new Date(l.waktuUnggah)) / 1000).filter(x => x > 0 && x < 900), avg = dur.length ? dur.reduce((a, b) => a + b, 0) / dur.length : 0;
        const sisa = Q.aktif() * (avg || 3);
        $('#qp').innerHTML = '<div class="row between wrap"><div><span class="badge pri mono">BATCH</span> <b style="font-size:1.05rem">Antrean pemrosesan · ' + esc(uj.nama) + '</b><div class="small muted">' + esc(L.d.namaKelas(uj.kelasId)) + ' • ' + n + ' siswa terdaftar</div></div><div class="badge ' + (Q.stopped ? 'warn' : Q.aktif() ? 'vio' : 'ok') + '">' + (Q.stopped ? 'DIJEDA' : Q.aktif() ? '<span class="spin" style="width:12px;height:12px;border-width:2px"></span> MEMPROSES' : ic('checkc', 13) + ' SIAGA') + ' · ' + pct + '% siswa terkoreksi</div></div><div class="wbar mt"><i style="width:' + c.selesai / tot * 100 + '%;background:var(--ok)"></i><i style="width:' + c.perlu / tot * 100 + '%;background:var(--warn)"></i><i style="width:' + c.antri / tot * 100 + '%;background:var(--line2)"></i><i style="width:' + c.gagal / tot * 100 + '%;background:var(--err)"></i></div><div class="row wrap small mt" style="gap:16px"><span><i class="dot" style="background:var(--ok)"></i> ' + c.selesai + ' selesai dinilai</span><span><i class="dot" style="background:var(--warn)"></i> ' + c.perlu + ' perlu verifikasi</span><span><i class="dot" style="background:var(--line2)"></i> ' + c.antri + ' dalam antrean</span><span><i class="dot" style="background:var(--err)"></i> ' + c.gagal + ' gagal</span><span class="grow right faint mono">Diproses ' + proses + ' dari ' + rows.length + ' berkas</span></div><div class="grid g3 mt"><div class="card flat" style="background:var(--card2);padding:10px 14px"><div class="tiny muted">Estimasi waktu tersisa</div><b class="mono">' + (Q.aktif() ? '~' + Math.ceil(sisa) + ' detik' : '—') + '</b></div><div class="card flat" style="background:var(--card2);padding:10px 14px"><div class="tiny muted">Rata-rata waktu per lembar</div><b class="mono">' + (avg ? L.num(avg, 1) + ' detik' : '—') + '</b></div><div class="card flat" style="background:var(--card2);padding:10px 14px"><div class="tiny muted">Mesin penilaian</div><b class="mono">' + esc((L.S.d.ai && L.S.d.ai.provider) || 'demo') + (L.S.d.ai && L.S.d.ai.model ? ' · ' + esc(L.S.d.ai.model) : '') + '</b></div></div>';
      }
      function drawTabel() {
        let rows = baris(); if (self.filter) rows = rows.filter(r => r.st === self.filter);
        const all = baris(), hal = Math.min(self.hal, Math.max(1, Math.ceil(rows.length / per))); self.hal = hal;
        const lihat = rows.slice((hal - 1) * per, hal * per), sw = L.d.siswaKelas(uj.kelasId);
        const stBadge = r => { const s = stQ[r.st] || ['', r.st]; let tx = s[1]; if (r.st === 'selesai') tx = 'Selesai · Skor ' + L.num(r.skor, 1); if (r.st === 'perlu') tx = 'Perlu verifikasi (' + (r.perlu || '!') + ')'; return '<span class="badge ' + s[0] + '">' + (['baca', 'unggah', 'proses'].indexOf(r.st) >= 0 ? '<span class="spin" style="width:12px;height:12px;border-width:2px"></span>' : '') + esc(tx) + '</span>' + (r.pesan && ['gagal', 'tanpa-id', 'perlu', 'selesai'].indexOf(r.st) >= 0 ? '<div class="tiny muted mt" style="margin-top:4px;max-width:260px">' + esc(L.potong(r.pesan, 110)) + '</div>' : ''); };
        const aksi = r => { const x = encodeURIComponent(id); let h = ''; if (r.st === 'selesai') h = '<a class="btn sm" href="#/hasil/' + x + '">Lihat hasil</a>'; else if (r.st === 'perlu') h = '<a class="btn sm pri" href="#/verifikasi/' + x + '">Verifikasi</a>'; else if (r.st === 'tanpa-id') h = '<select class="in" data-asg="' + r.key + '" style="min-height:34px;padding:4px 8px;min-width:150px" aria-label="Pilih siswa"><option value="">Pilih siswa…</option>' + sw.map(s => '<option value="' + esc(s.id) + '">' + esc(s.nama) + '</option>').join('') + '</select>'; else if (r.st === 'gagal') h = (r.q ? '<button class="btn sm" data-retry="' + r.key + '">' + ic('refresh', 14) + ' Ulangi</button>' : '<button class="btn sm" data-reproc="' + esc(r.ljkId) + '">' + ic('refresh', 14) + ' Proses ulang</button>'); else if (r.q && ['antri', 'baca'].indexOf(r.st) >= 0) h = '<button class="btn sm" data-rmq="' + r.key + '">Batal</button>'; return h + (r.ljkId && ['unggah', 'proses', 'baca'].indexOf(r.st) < 0 ? ' <button class="ibtn dng" data-delj="' + esc(r.ljkId) + '" aria-label="Hapus LJK">' + ic('trash', 15) + '</button>' : ''); };
        $('#qt').innerHTML = '<div class="card-h" style="padding:16px 16px 0"><div><h2>Tabel lembar kerja siswa dalam pemrosesan</h2><div class="small muted">' + all.length + ' berkas untuk ujian ini</div></div><select class="in" id="sf" style="width:auto" aria-label="Filter status"><option value="">Semua kondisi (' + all.length + ')</option>' + [['selesai', 'Selesai'], ['perlu', 'Perlu verifikasi'], ['antri', 'Menunggu'], ['tanpa-id', 'Belum teridentifikasi'], ['gagal', 'Gagal']].map(o => '<option value="' + o[0] + '"' + (self.filter === o[0] ? ' selected' : '') + '>' + o[1] + ' (' + all.filter(r => r.st === o[0]).length + ')</option>').join('') + '</select></div>' +
          (lihat.length ? '<div class="tw"><table class="t"><thead><tr><th>Thumbnail</th><th>Siswa (hasil QR)</th><th>NIS</th><th>Waktu unggah</th><th>Kualitas citra</th><th>Status AI</th><th class="right">Aksi tindakan</th></tr></thead><tbody>' + lihat.map(r => '<tr><td><div class="thumb">' + (r.thumb ? '<img alt="Pratinjau LJK" src="' + r.thumb + '">' : ic('file', 18)) + '</div></td><td><b>' + esc(r.nama) + '</b></td><td class="mono">' + esc(r.nis) + '</td><td class="mono small">' + (isNaN(r.waktu) ? '—' : L.jam(r.waktu)) + '</td><td>' + lbKual(r.kual[0], r.kual[1]) + '</td><td>' + stBadge(r) + '</td><td class="right nowrap">' + aksi(r) + '</td></tr>').join('') + '</tbody></table></div>' : L.kosong('upload', 'Belum ada berkas', 'Seret foto LJK ke area unggah di atas atau gunakan kamera.')) +
          '<div class="pager"><div class="row wrap"><button class="btn sm" data-a="stop">' + (Q.stopped ? ic('play', 14) + ' Lanjutkan antrean' : ic('pause', 14) + ' Hentikan antrean') + '</button><button class="btn sm" data-a="log">' + ic('dl', 14) + ' Ekspor log (.csv)</button></div><span class="small muted">Menampilkan ' + (lihat.length ? (hal - 1) * per + 1 : 0) + '–' + ((hal - 1) * per + lihat.length) + ' dari ' + rows.length + ' berkas</span><div class="pg"><button data-pg="' + (hal - 1) + '"' + (hal <= 1 ? ' disabled' : '') + '>‹</button><button class="on">' + hal + '</button><button data-pg="' + (hal + 1) + '"' + (hal * per >= rows.length ? ' disabled' : '') + '>›</button></div></div>';
      }
      const gambar = () => { drawPanel(); drawTabel(); };
      gambar();
      const off1 = Q.on(L.debounce(gambar, 60)), off2 = L.onChange(() => { uj = L.d.ujian(id) || uj; gambar(); });
      this._off = () => { off1(); off2(); };
      $('#uj').onchange = e => { location.hash = '#/unggah/' + encodeURIComponent(e.target.value); };
      const dz = $('#dz'), fi = $('#fi');
      const kirim = files => { if (!uj.dicetak) L.toast('Ujian ini belum ditandai sudah dicetak — tetap diproses.', 'info'); Q.addMany(files, id); };
      fi.onchange = () => { kirim(fi.files); fi.value = ''; };
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); })); ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
      dz.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) kirim(e.dataTransfer.files); });
      dz.addEventListener('click', e => { if (e.target.closest('a')) return; if (e.target !== fi) { e.preventDefault(); fi.click(); } });
      root.onchange = e => { const t = e.target; if (t.id === 'sf') { self.filter = t.value; self.hal = 1; drawTabel(); } else if (t.dataset.asg && t.value) Q.assign(t.dataset.asg, t.value); };
      root.onclick = async e => {
        const t = e.target.closest('button'); if (!t) return;
        if (t.dataset.pg) { if (!t.disabled) { self.hal = +t.dataset.pg; drawTabel(); } return; }
        if (t.dataset.a === 'refresh') { try { await L.bootstrap(); L.toast('Data disegarkan.'); } catch (err) { L.err(err); } return; }
        if (t.dataset.a === 'stop') { Q.stopped ? Q.resume() : Q.stop(); return; }
        if (t.dataset.a === 'log') { L.download(new Blob([L.csv([['Siswa', 'NIS', 'Waktu', 'Kualitas', 'Status', 'Skor', 'Catatan']].concat(baris().map(r => [r.nama, r.nis, isNaN(r.waktu) ? '' : r.waktu.toISOString(), r.kual[0] || '', r.st, r.skor == null ? '' : r.skor, r.pesan || ''])))], { type: 'text/csv;charset=utf-8' }), 'log-pemrosesan-' + uj.kode + '.csv'); return; }
        if (t.dataset.retry) return Q.retry(t.dataset.retry);
        if (t.dataset.rmq) return Q.remove(t.dataset.rmq);
        if (t.dataset.reproc) { L.btnBusy(t, true, 'Memproses…'); try { await L.api('ljk.proses', { ljkId: t.dataset.reproc }); delete L.S.jw[id]; await L.bootstrap(); L.toast('LJK diproses ulang.'); } catch (err) { L.btnBusy(t, false); L.err(err); await L.bootstrap().catch(() => { }); } return; }
        if (t.dataset.delj) { if (await L.confirm('Hapus LJK ini?', 'Foto, jawaban terbaca, dan nilainya akan dihapus. Siswa dapat diunggah ulang.', 'Hapus', true)) { try { await L.api('ljk.hapus', { ljkId: t.dataset.delj }); Q.items = Q.items.filter(i => i.ljkId !== t.dataset.delj); delete L.S.jw[id]; await L.bootstrap(); L.toast('LJK dihapus.'); } catch (err) { L.err(err); } } }
      };
    },
    unmount() { if (this._off) this._off(); }
  };

  /* ============================================================
     PINDAI MOBILE (W-10)
     ============================================================ */
  P.pindai = {
    view(a) {
      const d = L.S.d; let id = ujianId(a); if (!id || !L.d.ujian(id)) id = (d.ujian.find(x => x.dicetak && L.statusUjian(x).kode !== 'selesai') || d.ujian.find(x => L.jumlahSoal(x.id).total > 0) || {}).id || ''; this.id = id;
      if (!id) return L.kosong('camera', 'Belum ada ujian', 'Buat dan cetak ujian terlebih dahulu.', '<a class="btn pri" href="#/ujian/form">Buat ujian</a>');
      const uj = L.d.ujian(id), kq = d.kuota || { terpakai: 0, batas: 0 };
      return '<div style="max-width:520px;margin:0 auto"><div class="row between mb"><a class="ibtn" href="#/unggah/' + encodeURIComponent(id) + '" aria-label="Kembali">' + ic('arl', 18) + '</a><div class="grow"><b>Pindai lembar LJK</b><div class="small muted">' + esc(uj.nama) + ' (' + esc(L.d.namaKelas(uj.kelasId)) + ')</div></div><span class="badge mono" id="kq">Kuota ' + kq.terpakai + '/' + kq.batas + '</span></div>' +
        '<div class="row between small mb"><span><i class="dot" style="background:var(--ok)"></i> Mode batch: <b id="cb">0</b> / ' + L.d.siswaKelas(uj.kelasId).length + ' siswa</span><span class="faint">Ujian: <select id="uj" class="in" style="display:inline-block;width:auto;min-height:30px;padding:2px 8px;font-size:.8rem">' + L.opt(d.ujian.filter(x => L.jumlahSoal(x.id).total > 0), 'id', 'nama', id) + '</select></span></div>' +
        '<div class="cam" id="cam"><video id="vid" playsinline muted autoplay></video><div class="frame"></div><div class="hint-top">Posisikan 4 sudut LJK di dalam bingkai</div><div id="noc" class="hide" style="position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:20px;background:#0b0f1c"></div></div>' +
        '<div class="qbar"><div class="row between small"><span>' + ic('checkc', 15) + ' Kualitas citra: <b id="ql">menunggu kamera…</b></span><b class="mono" id="qs">—</b></div><div class="progress mt" style="margin-top:8px"><i id="qi" style="width:0"></i></div><div class="tiny" style="margin-top:6px;opacity:.7" id="qh">Pencahayaan • Ketajaman • Posisi QR</div></div>' +
        '<div class="card mt" style="padding:12px"><div class="row between"><b class="small">LEMBAR TERPOTRET (<span id="cs">0</span>)</b><a class="small b" href="#/unggah/' + encodeURIComponent(id) + '">Lihat semua →</a></div><div class="strip mt" id="strip"></div></div>' +
        '<div class="row between mt-l" style="align-items:flex-start"><label class="col" style="align-items:center;gap:4px;cursor:pointer;width:80px"><span class="ibtn" style="width:50px;height:50px;border-radius:14px">' + ic('img', 22) + '</span><span class="tiny muted">Galeri</span><input type="file" id="gal" accept="image/*" multiple class="hide"></label><div class="col" style="align-items:center;gap:6px"><button class="shutter" id="shot" aria-label="Potret lembar"><i></i></button><span class="tiny b mono">POTRET</span></div><a class="col" style="align-items:center;gap:4px;width:80px" href="#/unggah/' + encodeURIComponent(id) + '"><span class="btn pri" style="width:50px;min-height:50px;border-radius:14px;padding:0">' + ic('arr', 22) + '</span><span class="tiny muted">Koreksi</span></a></div></div>';
    },
    mount(root) {
      if (!this.id) return;
      const id = this.id, vid = $('#vid'); let stream = null, timer = null;
      const noCam = pesan => { const n = $('#noc'); n.style.display = 'grid'; n.classList.remove('hide'); n.innerHTML = '<div>' + ic('camera', 40) + '<div class="mt"><b>' + pesan + '</b></div><div class="small mt" style="opacity:.8">Anda tetap dapat memakai tombol <b>Galeri</b> untuk memilih foto atau mengambil foto dengan aplikasi kamera ponsel.</div><label class="btn pri mt" style="cursor:pointer">' + ic('camera', 16) + ' Buka kamera ponsel<input type="file" accept="image/*" capture="environment" id="nat" class="hide"></label></div>'; $('#nat').onchange = e => { Q.addMany(e.target.files, id); e.target.value = ''; }; $('#shot').disabled = true; $('#ql').textContent = 'kamera tidak aktif'; };
      (async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return noCam('Kamera tidak tersedia di perambah ini (butuh HTTPS).');
        try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); vid.srcObject = stream; await vid.play().catch(() => { }); }
        catch (e) { return noCam(e && e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Aktifkan izin kamera pada pengaturan situs.' : 'Kamera tidak dapat dibuka.'); }
        timer = setInterval(() => {
          if (vid.readyState < 2 || !vid.videoWidth) return; let k; try { k = L.img.kualitas(vid); } catch (e) { return; }
          $('#ql').textContent = k.label.toUpperCase(); $('#qs').textContent = k.skor + '%'; const bar = $('#qi'); bar.style.width = k.skor + '%'; bar.style.background = k.skor >= 80 ? 'var(--ok)' : k.skor >= 55 ? 'var(--warn)' : 'var(--err)'; $('#qh').textContent = k.isu.length ? '⚠ ' + k.isu.join(' • ') : 'Pencahayaan cukup • Fokus tajam • Siap dipotret';
        }, 800);
      })();
      const strip = () => {
        if (!L.S.d || !$('#strip')) return;
        const its = Q.untuk(id); $('#cs').textContent = its.length;
        const sis = new Set(its.map(i => i.siswaId).filter(Boolean)); ((L.S.d || {}).ljk || []).filter(l => l.ujianId === id).forEach(l => sis.add(l.siswaId)); if ($('#cb')) $('#cb').textContent = sis.size;
        $('#strip').innerHTML = its.length ? its.map((it, i) => { const s = L.d.siswa(it.siswaId), bad = it.status === 'gagal' || it.status === 'tanpa-id'; const ik = { baca: '…', antri: '⏳', unggah: '⬆', proses: '⚙', selesai: '✓', perlu: '!', gagal: '✕', 'tanpa-id': '?' }[it.status]; return '<div class="th ' + (bad ? 'bad' : '') + '">' + (it.thumb ? '<img alt="Foto ' + (its.length - i) + '" src="' + it.thumb + '">' : '<div style="height:76px"></div>') + '<div class="mono b">#' + (its.length - i) + ' ' + ik + '</div><div class="faint">' + esc(s ? s.nis : (it.status === 'tanpa-id' ? 'tanpa QR' : '…')) + '</div></div>'; }).join('') : '<div class="small faint" style="padding:8px">Belum ada lembar. Arahkan kamera ke LJK lalu tekan tombol bulat.</div>';
        const kq = L.S.d.kuota; if (kq) $('#kq').textContent = 'Kuota ' + kq.terpakai + '/' + kq.batas;
      };
      strip(); const off1 = Q.on(strip), off2 = L.onChange(strip); this._off = () => { off1(); off2(); };
      $('#uj').onchange = e => { location.hash = '#/pindai/' + encodeURIComponent(e.target.value); };
      $('#shot').onclick = () => {
        if (!vid.videoWidth) return L.toast('Kamera belum siap.', 'warn'); const c = document.createElement('canvas'); c.width = vid.videoWidth; c.height = vid.videoHeight; c.getContext('2d').drawImage(vid, 0, 0);
        try { navigator.vibrate && navigator.vibrate(30); } catch (e) { } const cam = $('#cam'); cam.style.outline = '4px solid #fff'; setTimeout(() => { cam.style.outline = ''; }, 120); Q.add(c, id);
      };
      $('#gal').onchange = e => { Q.addMany(e.target.files, id); e.target.value = ''; };
      this._stop = () => { if (timer) clearInterval(timer); if (stream) stream.getTracks().forEach(t => t.stop()); };
    },
    unmount() { if (this._off) this._off(); if (this._stop) this._stop(); }
  };
})();
