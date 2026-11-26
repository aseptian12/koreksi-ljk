/* ===== queue.js — antrean unggah & koreksi LJK (dipakai halaman Unggah dan Pindai) ===== */
(function () {
  'use strict';
  const L = window.L;
  const Q = L.queue = { items: [], fns: [], running: false, stopped: false, kuotaHabis: false };

  Q.on = fn => { Q.fns.push(fn); return () => { Q.fns = Q.fns.filter(f => f !== fn); }; };
  const notif = () => Q.fns.slice().forEach(f => { try { f(); } catch (e) { console.error(e); } });
  Q.reset = () => { Q.items = []; Q.running = false; Q.stopped = false; Q.kuotaHabis = false; notif(); };
  Q.get = id => Q.items.find(i => i.id === id);
  Q.untuk = ujianId => Q.items.filter(i => i.ujianId === ujianId);
  Q.aktif = () => Q.items.filter(i => ['baca', 'antri', 'unggah', 'proses'].indexOf(i.status) >= 0).length;

  /** Tambah satu foto (File/Blob atau <canvas>). */
  Q.add = async function (src, ujianId, siswaId) {
    const it = { id: L.uid('q_'), ujianId, nama: (src && src.name) || 'Foto kamera', status: 'baca', siswaId: siswaId || '', nis: '', kualitas: 0, label: '', isu: [], ljkId: '', skor: null, pesan: '', thumb: '', waktu: Date.now(), b64: '' };
    Q.items.unshift(it); notif();
    try {
      let blob = src;
      if (src && src.toBlob) blob = await new Promise(r => src.toBlob(r, 'image/jpeg', 0.9));
      const im = await L.img.fromBlob(blob);
      const k = L.img.kualitas(im); it.kualitas = k.skor; it.label = k.label; it.isu = k.isu;
      const c = await L.img.compress(im, 1800, 0.82); it.b64 = c.base64;
      const t = await L.img.compress(im, 140, 0.6); it.thumb = t.dataUrl;
      L.gambarSimpan('pending_' + it.id, c.dataUrl);
      if (!it.siswaId) {
        const qr = await L.img.qr(c.canvas);
        if (qr) {
          if (qr.u !== ujianId) { it.status = 'tanpa-id'; it.pesan = 'QR milik ujian lain — pilih siswa secara manual atau periksa ujian yang dipilih.'; }
          else if (L.d.siswa(qr.s)) it.siswaId = qr.s;
          else { it.status = 'tanpa-id'; it.pesan = 'Siswa dari QR tidak ditemukan di data.'; }
        } else { it.status = 'tanpa-id'; it.pesan = 'QR tidak terbaca. Pilih siswa secara manual.'; }
      }
      if (it.siswaId) { const s = L.d.siswa(it.siswaId); it.nis = s ? s.nis : ''; it.status = 'antri'; }
    } catch (e) { it.status = 'gagal'; it.pesan = e.message; }
    notif(); Q.run();
    return it;
  };
  Q.addMany = async function (files, ujianId) {
    const arr = Array.from(files || []).filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic)$/i.test(f.name));
    if (!arr.length) { L.toast('Pilih berkas gambar (JPG / PNG).', 'warn'); return; }
    if (arr.length < (files || []).length) L.toast((files.length - arr.length) + ' berkas dilewati karena bukan gambar (PDF belum didukung).', 'warn');
    for (const f of arr) { if (f.size > 12 * 1024 * 1024) { L.toast(f.name + ' lebih dari 12 MB — dilewati.', 'warn'); continue; } await Q.add(f, ujianId); }
  };
  Q.assign = function (id, siswaId) {
    const it = Q.get(id); if (!it) return; const s = L.d.siswa(siswaId); if (!s) return;
    it.siswaId = siswaId; it.nis = s.nis; it.status = 'antri'; it.pesan = ''; notif(); Q.run();
  };
  Q.retry = function (id) { const it = Q.get(id); if (!it || !it.b64) return; it.status = it.siswaId ? 'antri' : 'tanpa-id'; it.pesan = ''; Q.kuotaHabis = false; notif(); Q.run(); };
  Q.remove = function (id) { Q.items = Q.items.filter(i => i.id !== id); notif(); };
  Q.stop = function () { Q.stopped = true; notif(); };
  Q.resume = function () { Q.stopped = false; notif(); Q.run(); };

  Q.run = async function () {
    if (Q.running) return; Q.running = true; let ujianSentuh = {};
    try {
      while (!Q.stopped && !Q.kuotaHabis) {
        const it = Q.items.slice().reverse().find(i => i.status === 'antri'); if (!it) break;
        try {
          it.status = 'unggah'; notif();
          const l = await L.api('ljk.unggah', { ujianId: it.ujianId, siswaId: it.siswaId, base64: it.b64, mime: 'image/jpeg', kualitas: it.kualitas, kualitasLabel: it.label });
          it.ljkId = l.id; L.gambarSimpan(l.id, 'data:image/jpeg;base64,' + it.b64);
          putLJK(l); it.status = 'proses'; notif();
          const r = await L.api('ljk.proses', { ljkId: l.id });
          putLJK(r.ljk); it.skor = r.hasil.nilaiAkhir; it.perlu = r.jumlahPerlu; it.status = r.jumlahPerlu ? 'perlu' : 'selesai';
          it.kualitas = r.ljk.kualitas || it.kualitas; it.label = r.ljk.kualitasLabel || it.label; it.pesan = r.ljk.catatan || '';
          ujianSentuh[it.ujianId] = 1;
        } catch (e) {
          it.status = 'gagal'; it.pesan = e.message;
          if (e.code === 'KUOTA') { Q.kuotaHabis = true; L.toast(e.message, 'err', 8000); }
          if (e.code === 'AUTH') { Q.stopped = true; }
        }
        it.b64 = it.status === 'gagal' ? it.b64 : ''; // bebaskan memori bila sukses
        notif();
      }
    } finally {
      Q.running = false;
      const ids = Object.keys(ujianSentuh);
      if (ids.length) { ids.forEach(id => delete L.S.jw[id]); try { await L.bootstrap(); } catch (e) { /* abaikan */ } }
      notif();
    }
  };
  function putLJK(l) {
    const a = L.S.d.ljk, i = a.findIndex(x => x.id === l.id);
    if (i >= 0) a[i] = l; else a.push(l);
  }
})();
