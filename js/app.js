/* ===== app.js — shell, router hash, RBAC, inisialisasi ===== */
(function () {
  'use strict';
  const L = window.L, $ = L.$, $$ = L.$$, esc = L.esc, ic = L.ic, P = (L.page = L.page || {});

  const MENU = [
    { k: 'dashboard', t: 'Dashboard', i: 'chart' },
    { k: 'master', t: 'Master Data', i: 'users', h: '#/master/siswa' },
    { k: 'ujian', t: 'Ujian & Kunci Jawaban', i: 'file' },
    { k: 'cetak', t: 'Cetak LJK', i: 'print' },
    { k: 'unggah', t: 'Unggah LJK', i: 'upload' },
    { k: 'verifikasi', t: 'Verifikasi Jawaban', i: 'checkc', cnt: true },
    { k: 'hasil', t: 'Hasil Ujian', i: 'trend' },
    { k: 'analisis', t: 'Analisis & Laporan', i: 'target' },
    { sep: 'Konfigurasi sistem' },
    { k: 'pengguna', t: 'Manajemen Pengguna', i: 'user', admin: true },
    { k: 'pengaturan', t: 'Pengaturan Sistem', i: 'cog', admin: true }
  ];
  const BNAV = [['dashboard', 'Beranda', 'chart'], ['unggah', 'Unggah', 'camera'], ['verifikasi', 'Verifikasi', 'checkc'], ['hasil', 'Hasil', 'trend']];
  const ADMIN_ONLY = ['pengguna', 'pengaturan'];
  /* nama rute -> halaman */
  const HALAMAN = { dashboard: 'dashboard', master: 'master', bank: 'bank', ujian: 'ujian', cetak: 'cetak', unggah: 'unggah', pindai: 'pindai', verifikasi: 'verifikasi', hasil: 'hasil', analisis: 'analisis', pengguna: 'pengguna', pengaturan: 'pengaturan', login: 'login' };
  const JUDUL = { dashboard: 'Dashboard', master: 'Master Data', bank: 'Bank Soal', ujian: 'Manajemen Ujian', cetak: 'Cetak LJK', unggah: 'Unggah LJK', pindai: 'Pindai LJK', verifikasi: 'Verifikasi', hasil: 'Hasil Ujian', analisis: 'Analisis', pengguna: 'Pengguna', pengaturan: 'Pengaturan', login: 'Masuk' };

  let aktif = null, tok = 0, drawerOpen = false;

  function parse() {
    const h = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    const seg = h.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    return { nama: seg[0] || '', args: seg.slice(1) };
  }
  function pilihHalaman(r) {
    const a = r.args;
    if (r.nama === 'bank' && a[0] === 'form') return { p: P.soalform, args: a.slice(1), menu: 'bank' };
    if (r.nama === 'ujian' && a[0] === 'form') return { p: P.ujianform, args: a.slice(1), menu: 'ujian' };
    const key = HALAMAN[r.nama]; if (!key) return null;
    return { p: P[key], args: a, menu: r.nama === 'pindai' ? 'unggah' : r.nama };
  }

  /* ---------- Shell ---------- */
  function menuHtml(menuAktif, drawer) {
    const u = L.S.user || {}, adm = L.isAdmin(), cnt = L.totalVerif();
    return MENU.filter(m => !m.admin || adm).map(m => m.sep ? '<div class="sep">' + m.sep + '</div>' :
      '<a href="' + (m.h || '#/' + m.k) + '" class="' + (m.k === menuAktif ? 'on' : '') + '"' + (m.k === menuAktif ? ' aria-current="page"' : '') + (drawer ? ' data-close-drawer' : '') + '>' + ic(m.i, 19) + '<span>' + m.t + '</span>' + (m.cnt && cnt ? '<span class="cnt">' + cnt + '</span>' : '') + (m.admin ? '<span class="tiny faint" style="margin-left:auto;font-weight:700">ADM</span>' : '') + '</a>').join('');
  }
  function brand() { return '<div class="brand"><div class="logo">LJK</div><div><b>Koreksi LJK</b><span>AI Engine</span></div></div>'; }
  function foot() {
    return '<div class="foot"><div class="promo"><b>Koreksi lebih cepat</b><span>Guru tetap memegang keputusan akhir.</span></div><button class="btn blk" data-a="keluar">' + ic('out', 16) + ' Keluar akun</button></div>';
  }
  function shell(menuAktif) {
    const u = L.S.user || {}, d = L.S.d || {}, cnt = L.totalVerif();
    const bn = BNAV.map(b => '<a href="#/' + b[0] + '" class="' + (b[0] === menuAktif ? 'on' : '') + '">' + ic(b[2], 22) + '<span>' + b[1] + '</span>' + (b[0] === 'verifikasi' && cnt ? '<span class="cnt">' + cnt + '</span>' : '') + '</a>').join('');
    return (L.DEMO ? '<div class="demo-bar">MODE DEMO — data contoh disimpan di peramban ini, AI disimulasikan. Isi js/config.js untuk backend sungguhan.</div>' : '') +
      '<div class="offline-bar hide" id="offbar">Anda sedang offline. Perubahan akan gagal disimpan sampai koneksi kembali.</div>' +
      '<div class="shell"><aside class="side" id="side" aria-label="Menu utama">' + brand() + '<nav class="nav" id="nav">' + menuHtml(menuAktif) + '</nav>' + foot() + '</aside>' +
      '<div class="main"><header class="top"><button class="iconbtn menu-btn" data-a="menu" aria-label="Buka menu">' + ic('menu', 20) + '</button>' +
      '<div class="search"><input id="gs" type="search" placeholder="Cari siswa, ujian, atau LJK…" autocomplete="off" aria-label="Pencarian global">' + ic('search', 18) + '<div class="sres hide" id="sres"></div></div><div class="grow"></div>' +
      '<button class="iconbtn" data-a="tema" aria-label="Ganti tema">' + ic(L.tema() === 'dark' ? 'sun' : 'moon', 19) + '</button>' +
      '<a class="iconbtn" href="#/verifikasi" aria-label="Notifikasi verifikasi">' + ic('bell', 19) + (cnt ? '<span class="dot"></span>' : '') + '</a>' +
      '<div class="userchip"><span class="avatar">' + esc(L.initials(u.nama)) + '</span><div class="nm"><b>' + esc(u.nama || '') + '</b><span>' + (u.peran === 'admin' ? 'Administrator' : 'Guru Pengampu') + '</span></div></div></header>' +
      '<main class="page" id="pg" tabindex="-1"></main></div></div>' +
      '<nav class="bnav" id="bnav" aria-label="Navigasi bawah">' + bn + '<button data-a="menu" aria-label="Menu">' + ic('menu', 22) + '<span>Menu</span></button></nav>' +
      '<div class="drawer-bg" id="dbg"></div><aside class="drawer" id="drw" aria-label="Menu">' + brand() + '<nav class="nav" id="dnav">' + menuHtml(menuAktif, true) + '</nav>' + foot() + '</aside>';
  }
  function shellUpdate(menuAktif) {
    const n = $('#nav'); if (n) n.innerHTML = menuHtml(menuAktif);
    const dn = $('#dnav'); if (dn) dn.innerHTML = menuHtml(menuAktif, true);
    const cnt = L.totalVerif();
    $$('#bnav a').forEach(a => { const k = a.getAttribute('href').slice(2); a.classList.toggle('on', k === menuAktif); if (k === 'verifikasi') { let c = a.querySelector('.cnt'); if (cnt) { if (!c) { c = document.createElement('span'); c.className = 'cnt'; a.appendChild(c); } c.textContent = cnt; } else if (c) c.remove(); } });
  }
  function tutupDrawer() { drawerOpen = false; const a = $('#drw'), b = $('#dbg'); if (a) a.classList.remove('show'); if (b) b.classList.remove('show'); }
  function bukaDrawer() { drawerOpen = true; $('#drw').classList.add('show'); $('#dbg').classList.add('show'); }

  /* ---------- Pencarian global ---------- */
  function cari(q) {
    q = q.trim().toLowerCase(); const el = $('#sres'); if (!el) return;
    if (q.length < 2) { el.classList.add('hide'); return; }
    const d = L.S.d || {}, out = [];
    (d.siswa || []).filter(s => (s.nama + ' ' + s.nis + ' ' + (s.nisn || '')).toLowerCase().indexOf(q) >= 0).slice(0, 5).forEach(s => out.push(['user', s.nama, 'NIS ' + s.nis + ' • ' + L.d.namaKelas(s.kelasId), '#/master/siswa?q=' + encodeURIComponent(s.nis), s.nis]));
    (d.ujian || []).filter(u => (u.nama + ' ' + u.kode).toLowerCase().indexOf(q) >= 0).slice(0, 5).forEach(u => out.push(['file', u.nama, u.kode + ' • ' + L.d.namaKelas(u.kelasId), '#/' + (L.d.stat(u.id).n ? 'hasil' : 'ujian') + (L.d.stat(u.id).n ? '/' + encodeURIComponent(u.id) : ''), null]));
    (d.ljk || []).filter(l => { const s = L.d.siswa(l.siswaId) || {}; return (s.nama + ' ' + s.nis + ' ' + l.id).toLowerCase().indexOf(q) >= 0; }).slice(0, 4).forEach(l => { const s = L.d.siswa(l.siswaId) || {}; out.push(['scan', 'LJK ' + (s.nama || l.id), (L.d.ujian(l.ujianId) || {}).nama + ' • ' + l.status, '#/verifikasi/' + encodeURIComponent(l.ujianId), null]); });
    el.innerHTML = out.length ? out.map(o => '<a href="' + o[3] + '" data-sr>' + ic(o[0], 17) + '<div><b class="small">' + esc(o[1]) + '</b><div class="tiny muted">' + esc(o[2]) + '</div></div></a>').join('') : '<div class="empty" style="padding:16px">Tidak ada hasil untuk “' + esc(q) + '”.</div>';
    el.classList.remove('hide');
  }

  /* ---------- Render ---------- */
  function setRoot(html) { const a = $('#app'); a.innerHTML = html; }
  function loading(t) { setRoot('<div class="skp" role="status" aria-label="' + esc(t || 'Memuat') + '"><i class="sk" style="width:38%;height:26px"></i><i class="sk" style="width:62%"></i><div class="grid g3 mt"><i class="sk" style="height:84px"></i><i class="sk" style="height:84px"></i><i class="sk" style="height:84px"></i></div><i class="sk mt" style="height:220px"></i></div>'); }

  async function route() {
    const my = ++tok;
    if (aktif && aktif.p && aktif.p.unmount) { try { aktif.p.unmount(); } catch (e) { console.error(e); } }
    aktif = null; tutupDrawer();
    const r = parse();
    if (!L.S.token && !L.restore()) { if (r.nama !== 'login') { location.hash = '#/login'; return; } }
    if (!L.S.token) return renderPage({ p: P.login, args: [], menu: 'login' }, my);
    if (r.nama === 'login' || !r.nama) { location.hash = '#/dashboard'; return; }
    const ph = pilihHalaman(r);
    if (!ph || !ph.p) { location.hash = '#/dashboard'; return; }
    if (ADMIN_ONLY.indexOf(r.nama) >= 0 && !L.isAdmin()) { L.toast('Halaman ini khusus Administrator.', 'warn'); location.hash = '#/dashboard'; return; }
    if (!L.S.d) {
      loading('Menyiapkan data…');
      try { await L.bootstrap(true); } catch (e) { if (my !== tok) return; setRoot('<div class="loadpage col"><b>Gagal memuat data</b><span class="muted">' + esc(e.message) + '</span><button class="btn pri" onclick="location.reload()">Muat ulang</button><button class="btn" onclick="L.logout()">Keluar</button></div>'); return; }
      if (my !== tok) return;
    }
    renderPage(ph, my);
  }

  function renderPage(ph, my) {
    const p = ph.p;
    document.title = (JUDUL[(parse().nama)] || 'Koreksi LJK') + ' — Koreksi LJK AI';
    let html;
    try { html = p.view(ph.args); } catch (e) { console.error(e); html = '<div class="empty"><b>Terjadi kesalahan menampilkan halaman</b><div>' + esc(e.message) + '</div></div>'; }
    if (p.full) { setRoot(html); } else {
      if (!$('#pg') || !$('#side')) setRoot(shell(ph.menu)); else shellUpdate(ph.menu);
      $('#pg').innerHTML = html;
    }
    aktif = ph; window.scrollTo(0, 0);
    const root = p.full ? $('#app') : $('#pg');
    [$('#app'), $('#pg')].forEach(el => { if (el) { el.onclick = el.oninput = el.onchange = el.onkeydown = el.onsubmit = null; } });
    try { const r = p.mount && p.mount(root, ph.args); if (r && r.catch) r.catch(e => { console.error(e); if (my === tok) L.toast(e.message || 'Terjadi kesalahan.', 'err'); }); } catch (e) { console.error(e); L.toast(e.message || 'Terjadi kesalahan.', 'err'); }
  }
  L.route = route;

  /* ---------- Event global (delegasi) ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (b && !b.closest('#pg') && !b.closest('.login')) {
      const a = b.dataset.a;
      if (a === 'menu') bukaDrawer();
      else if (a === 'tema') { L.setTema(L.tema() === 'dark' ? 'light' : 'dark'); const ik = b.querySelector('.ic'); if (ik) b.innerHTML = ic(L.tema() === 'dark' ? 'sun' : 'moon', 19); }
      else if (a === 'keluar') { L.confirm('Keluar dari aplikasi?', 'Sesi Anda akan diakhiri di perangkat ini.', 'Keluar').then(y => { if (y) L.logout(); }); }
    }
    if (e.target.closest('[data-close-drawer]') || e.target.id === 'dbg') tutupDrawer();
    if (!e.target.closest('.search')) { const s = $('#sres'); if (s) s.classList.add('hide'); }
    if (e.target.closest('[data-sr]')) { const s = $('#sres'); if (s) s.classList.add('hide'); const g = $('#gs'); if (g) g.value = ''; }
  });
  document.addEventListener('input', e => { if (e.target.id === 'gs') cari(e.target.value); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (drawerOpen) tutupDrawer(); const s = $('#sres'); if (s) s.classList.add('hide'); } });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', () => { const o = $('#offbar'); if (o) o.classList.add('hide'); });
  window.addEventListener('offline', () => { const o = $('#offbar'); if (o) o.classList.remove('hide'); });
  L.onChange(() => { if (L.S.token && $('#side')) shellUpdate((aktif && aktif.menu) || ''); });

  /* ---------- Mulai ---------- */
  async function mulai() {
    const punya = L.restore();
    if (!location.hash || location.hash === '#') location.hash = punya ? '#/dashboard' : '#/login';
    await route();
    if (punya && L.S.d) {   // tampil instan dari cache, segarkan di latar belakang
      try { await L.bootstrap(true); if ($('#side')) { shellUpdate((aktif && aktif.menu) || ''); const n = parse().nama; if (['dashboard', 'ujian', 'unggah', 'verifikasi', 'hasil', 'analisis', 'cetak'].indexOf(n) >= 0 && !document.querySelector('.mbg')) route(); } } catch (e) { /* biarkan data cache */ }
    }
  }
  mulai();
})();
