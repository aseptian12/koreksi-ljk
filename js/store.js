/* ===== store.js — state, API, cache, simpan optimistis, auth ===== */
(function () {
  'use strict';
  const L = window.L, CFG = window.APP_CONFIG || {};
  L.DEMO = !CFG.GAS_URL;
  const KEY_SESI = 'ljk_sesi', KEY_BOOT = 'ljk_boot_';
  const S = L.S = { user: null, token: null, d: null, jw: {}, listeners: [] };

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penuh / diblokir */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  L.ls = ls;

  /* ---------- API ---------- */
  L.api = async function (action, data, opt) {
    opt = opt || {};
    if (L.DEMO) { await new Promise(r => setTimeout(r, opt.cepat ? 20 : 140)); return L.demo.call(action, data || {}, S.user); }
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), opt.timeout || 330000);
    let res;
    try {
      res = await fetch(CFG.GAS_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal,
        body: JSON.stringify({ action, token: S.token, data: data || {} })
      });
    } catch (e) {
      const err = new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      err.code = 'NETWORK'; throw err;
    } finally { clearTimeout(t); }
    let j;
    try { j = await res.json(); } catch (e) { const err = new Error('Balasan server tidak valid. Pastikan URL /exec benar dan deployment diatur "Anyone".'); err.code = 'BAD_RESPONSE'; throw err; }
    if (!j.success) {
      const err = new Error(j.message || 'Terjadi kesalahan.'); err.code = j.code || 'ERROR';
      if (err.code === 'AUTH' && action !== 'auth.masuk') { L.logout(true); }
      throw err;
    }
    return j.data;
  };

  /* ---------- Sesi & bootstrap ---------- */
  const PETA = { Kelas: 'kelas', Mapel: 'mapel', Siswa: 'siswa', Pengguna: 'pengguna', BankSoal: 'bankSoal' };
  L.sheetKey = n => PETA[n];
  L.onChange = fn => { S.listeners.push(fn); return () => { S.listeners = S.listeners.filter(f => f !== fn); }; };
  L.emit = () => S.listeners.slice().forEach(f => { try { f(); } catch (e) { console.error(e); } });

  L.restore = () => {
    const s = ls.get(KEY_SESI);
    if (!s || !s.token || Date.now() > s.exp) { ls.del(KEY_SESI); return false; }
    S.token = s.token; S.user = s.user;
    S.d = ls.get(KEY_BOOT + s.user.email) || null;
    return true;
  };
  L.setSesi = (token, user) => { S.token = token; S.user = user; ls.set(KEY_SESI, { token, user, exp: Date.now() + 5.8 * 3600e3 }); };
  L.cacheBoot = () => { if (S.user && S.d) { const c = Object.assign({}, S.d); ls.set(KEY_BOOT + S.user.email, c); } };

  L.bootstrap = async function (diam) {
    const d = await L.api('bootstrap', {});
    S.d = d; S.user = d.user || S.user; S.jw = {};
    L.cacheBoot(); if (!diam) L.emit();
    return d;
  };

  L.logout = function (kadaluarsa) {
    if (S.token && !kadaluarsa) L.api('auth.keluar', { token: S.token }, { cepat: true }).catch(() => { });
    ls.del(KEY_SESI); S.token = null; S.user = null; S.d = null; S.jw = {};
    if (L.queue) L.queue.reset();
    L.loginMsg = kadaluarsa ? 'Sesi Anda berakhir. Silakan masuk kembali.' : '';
    location.hash = '#/login';
  };

  /* ---------- Akses data (aman bila belum termuat) ---------- */
  const D = () => S.d || {};
  L.d = {
    kelas: id => (D().kelas || []).find(x => x.id === id),
    mapel: id => (D().mapel || []).find(x => x.id === id),
    siswa: id => (D().siswa || []).find(x => x.id === id),
    ujian: id => (D().ujian || []).find(x => x.id === id),
    bank: id => (D().bankSoal || []).find(x => x.id === id),
    pengguna: id => (D().pengguna || []).find(x => x.id === id),
    namaKelas: id => (L.d.kelas(id) || {}).nama || '—',
    namaMapel: id => (L.d.mapel(id) || {}).nama || '—',
    siswaKelas: (kid, semua) => (D().siswa || []).filter(s => s.kelasId === kid && (semua || s.aktif === 'Aktif')),
    soalUjian: uid => (D().soalUjian || []).filter(s => s.ujianId === uid).sort((a, b) => a.nomor - b.nomor),
    ljkUjian: uid => (D().ljk || []).filter(l => l.ujianId === uid),
    stat: uid => (D().stat || {})[uid] || { ljk: 0, selesai: 0, proses: 0, verif: 0, gagal: 0, n: 0, rata: 0, min: 0, max: 0, lulus: 0, hist: [0, 0, 0, 0, 0] },
    set: () => D().set || {}
  };
  L.jumlahSoal = uid => {
    const r = { PG: 0, ISIAN: 0, URAIAN: 0, total: 0, poin: 0 };
    L.d.soalUjian(uid).forEach(su => { const b = L.d.bank(su.soalId); if (b) { r[b.jenis]++; r.total++; r.poin += su.bobot; } });
    return r;
  };
  L.statusUjian = uj => {
    const st = L.d.stat(uj.id), n = L.jumlahSoal(uj.id).total, siswa = L.d.siswaKelas(uj.kelasId).length;
    if (!uj.dicetak) return n ? { kode: 'draftsoal', label: 'Draft Paket Soal', tone: '', filter: 'draft' } : { kode: 'draft', label: 'Draft', tone: '', filter: 'draft' };
    if (st.ljk === 0) return { kode: 'cetak', label: 'LJK Dicetak', tone: 'sky', filter: 'cetak' };
    if (st.proses > 0) return { kode: 'proses', label: 'Memproses AI (' + st.selesai + '/' + st.ljk + ')', tone: 'vio', filter: 'berjalan' };
    if (st.verif > 0) return { kode: 'verif', label: 'Perlu Verifikasi (' + st.verif + ')', tone: 'warn', filter: 'berjalan' };
    if (siswa && st.selesai < siswa) return { kode: 'jalan', label: 'Koreksi Berjalan', tone: 'pri', filter: 'berjalan' };
    return { kode: 'selesai', label: 'Selesai', tone: 'ok', filter: 'selesai' };
  };
  L.totalVerif = () => Object.values((S.d || {}).stat || {}).reduce((t, s) => t + (s.verif || 0), 0);
  L.isAdmin = () => !!(S.user && S.user.peran === 'admin');

  /* ---------- Jawaban per ujian (dimuat sesuai kebutuhan) ---------- */
  L.loadJawaban = async function (ujianId, paksa) {
    if (!paksa && S.jw[ujianId]) return S.jw[ujianId];
    const r = await L.api('jawaban.ujian', { ujianId });
    S.jw[ujianId] = r;
    if (S.d) { S.d.ljk = (S.d.ljk || []).filter(l => l.ujianId !== ujianId).concat(r.ljk); }
    return r;
  };
  const imgCache = {};
  L.gambar = async function (ljkId) {
    if (imgCache[ljkId]) return imgCache[ljkId];
    const r = await L.api('gambar.ambil', { ljkId });
    imgCache[ljkId] = r.dataUrl; return r.dataUrl;
  };
  L.gambarSimpan = (ljkId, url) => { imgCache[ljkId] = url; };

  /* ---------- Simpan / hapus data master (optimistis) ---------- */
  L.save = async function (sheet, records, opt) {
    opt = opt || {};
    const key = PETA[sheet], arr = S.d[key], snap = arr.slice();
    const temp = [];
    records.forEach(r => {
      const rec = Object.assign({}, r);
      if (!rec.id) { rec.id = L.uid('tmp_'); temp.push(rec.id); r._tmp = rec.id; }
      const i = S.d[key].findIndex(x => x.id === rec.id);
      if (i >= 0) S.d[key][i] = Object.assign({}, S.d[key][i], rec); else S.d[key].unshift(rec);
    });
    L.emit();
    try {
      const res = await L.api('crud.simpan', { sheet, records: records.map(r => { const c = Object.assign({}, r); delete c._tmp; return c; }), upsertUnik: !!opt.upsertUnik });
      S.d[key] = S.d[key].filter(x => temp.indexOf(x.id) < 0);
      res.records.forEach(r => { const i = S.d[key].findIndex(x => x.id === r.id); if (i >= 0) S.d[key][i] = r; else S.d[key].unshift(r); });
      records.forEach(r => delete r._tmp);
      if (sheet === 'Siswa' || sheet === 'Kelas') L.cacheBoot();
      L.cacheBoot(); L.emit();
      return res;
    } catch (e) { S.d[key] = snap; L.emit(); throw e; }
  };
  L.remove = async function (sheet, ids) {
    const key = PETA[sheet], snap = S.d[key].slice();
    S.d[key] = S.d[key].filter(x => ids.indexOf(x.id) < 0); L.emit();
    try { const r = await L.api('crud.hapus', { sheet, ids }); L.cacheBoot(); return r; } catch (e) { S.d[key] = snap; L.emit(); throw e; }
  };

  /* ---------- Login Google ---------- */
  L.googleToken = function () {
    return new Promise((ok, no) => {
      L.loadScript('gis', ['https://accounts.google.com/gsi/client']).then(() => {
        const c = google.accounts.oauth2.initTokenClient({
          client_id: CFG.GOOGLE_CLIENT_ID, scope: 'openid email profile',
          callback: r => r && r.access_token ? ok(r.access_token) : no(new Error(r && r.error === 'access_denied' ? 'Izin masuk dibatalkan.' : 'Login Google gagal.')),
          error_callback: e => no(new Error(e && e.type === 'popup_closed' ? 'Jendela login ditutup sebelum selesai.' : 'Login Google gagal. Izinkan pop-up untuk situs ini.'))
        });
        c.requestAccessToken({ prompt: 'select_account' });
      }).catch(() => no(new Error('Layanan Google tidak dapat dimuat. Periksa koneksi internet.')));
    });
  };
  L.masuk = async function (demoPeran) {
    if (L.DEMO) { const r = await L.api('auth.masuk', { peran: demoPeran || 'admin' }); L.setSesi(r.token, r.user); return r; }
    if (!CFG.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID belum diisi di js/config.js.');
    const t = await L.googleToken();
    const r = await L.api('auth.masuk', { accessToken: t });
    L.setSesi(r.token, r.user); return r;
  };

  /* ---------- Tema ---------- */
  L.setTema = t => { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('ljk_tema', t); } catch (e) { } const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#0c1222' : '#1d4ed8'; };
  L.tema = () => document.documentElement.getAttribute('data-theme');
})();
