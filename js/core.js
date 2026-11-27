/* ===== core.js — utilitas umum, ikon, grafik SVG, modal, gambar ===== */
(function () {
  'use strict';
  const L = window.L = { page: {}, util: {} };

  L.$ = (s, r) => (r || document).querySelector(s);
  L.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  L.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  L.uid = (p) => (p || '') + Math.random().toString(36).slice(2, 10);
  L.num = (n, d) => (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 1 : d });
  L.clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
  L.round = (n, d) => { const p = Math.pow(10, d == null ? 1 : d); return Math.round((Number(n) || 0) * p) / p; };
  L.initials = n => String(n || '?').replace(/^(Drs?\.|Hj?\.|Ir\.)\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  L.debounce = (fn, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 250); }; };
  L.tgl = (s, pendek) => {
    if (!s) return '—';
    const d = new Date(String(s).length === 10 ? s + 'T00:00:00' : s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('id-ID', pendek ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' });
  };
  L.jam = s => { const d = new Date(s); return isNaN(d) ? '—' : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':'); };
  L.polos = h => String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  L.potong = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  L.sanitizeRich = html => {
    let s = String(html || '').replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
    s = s.replace(/<\/?(div|p)(\s[^>]*)?>/gi, m => m[1] === '/' ? '' : '<br>');
    s = s.replace(/<\/?(strong)>/gi, m => m.replace('strong', 'b')).replace(/<\/?(em)>/gi, m => m.replace('em', 'i'));
    s = s.replace(/<(?!\/?(?:b|i|u|sub|sup|br)\s*\/?>)[^>]*>/gi, '');
    return s.replace(/<(b|i|u|sub|sup)\s[^>]*>/gi, '<$1>').replace(/(<br>\s*){3,}/g, '<br><br>').replace(/^(<br>)+|(<br>)+$/g, '');
  };

  /* ---------- Ikon (gaya garis, SVG inline) ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    box: '<path d="M3 8l9-5 9 5v10l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13.5" r="3.8"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 5.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    out: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arr: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arl: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    chevr: '<path d="M9 6l6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    file: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/>',
    xls: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    dl: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10"/>',
    rot: '<path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/>',
    zi: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>',
    zo: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>',
    contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M17 6l3 3M14 9l2 2"/>',
    link: '<path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
    folder: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    refresh: '<path d="M21 12a9 9 0 01-15.5 6.2L3 16M3 12a9 9 0 0115.5-6.2L21 8M3 21v-5h5M21 3v5h-5"/>',
    book: '<path d="M4 4h6a3 3 0 013 3v14a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v14a2 2 0 012-2h7z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h8V3M8 21v-7h8v7"/>',
    chevu: '<path d="m6 15 6-6 6 6"/>', chevd: '<path d="m6 9 6 6 6-6"/>', minus: '<path d="M5 12h14"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    cloud: '<path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.5 4.5 0 0 1 17.5 18z"/><path d="M12 12v6m0-6-2.5 2.5M12 12l2.5 2.5"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    wifi: '<path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5v.01"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    gal: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.7"/><path d="M21 15l-5-5L5 21"/>'
  };

  /* ---------- Jenjang (SD/SMP/SMA) diturunkan dari tingkat kelas ---------- */
  const ROMAWI = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  L.tingkatAngka = t => { t = String(t == null ? '' : t).trim().toUpperCase(); if (/^\d+$/.test(t)) return Math.min(12, Math.max(1, +t)); return ROMAWI[t] || 10; };
  L.opsiDefault = t => { const n = L.tingkatAngka(t); return n <= 3 ? 3 : n <= 9 ? 4 : 5; };
  L.jenjang = t => { const n = L.tingkatAngka(t); return { n, nama: n <= 6 ? 'SD' : n <= 9 ? 'SMP' : 'SMA', opsi: L.opsiDefault(t) }; };
  // Paksa setiap LJK muat satu halaman F4 (215 x 330 mm): bila isi lebih tinggi dari lembar, perkecil otomatis (min 55%)
  // Pastikan SETIAP LJK muat tepat satu halaman F4: coba tata letak normal -> rapat -> sangat rapat, baru perkecil skala.
  L.fitSheets = root => {
    (root || document).querySelectorAll('.sheet').forEach(sh => {
      const inn = sh.querySelector('.in'); if (!inn) return;
      const cs = getComputedStyle(sh), avail = sh.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      let skala = 1, lv = '';
      ['', 'cmp', 'cmp2'].some(k => {
        sh.classList.remove('cmp', 'cmp2'); if (k) sh.classList.add(k); inn.style.zoom = ''; lv = k;
        const need = inn.scrollHeight; skala = need > avail ? avail / need * 0.985 : 1; return skala >= 0.8;
      });
      if (skala < 1) inn.style.zoom = Math.max(0.45, skala).toFixed(3);
      sh.dataset.fit = inn.style.zoom || '1'; sh.dataset.lv = lv; sh.dataset.muat = skala >= 0.6 ? '1' : '0';
    });
  };
  L.ic = (n, size) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"' + (size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '') + '>' + (P[n] || P.info) + '</svg>';

  /* ---------- Toast ---------- */
  L.toast = (msg, tipe, ms) => {
    const box = L.$('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (tipe || 'ok'); el.setAttribute('role', tipe === 'err' ? 'alert' : 'status');
    el.innerHTML = L.ic(tipe === 'err' ? 'warn' : tipe === 'warn' ? 'info' : 'checkc') + '<div>' + L.esc(msg) + '</div>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.25s'; setTimeout(() => el.remove(), 260); }, ms || (tipe === 'err' ? 5200 : 2800));
  };

  /* ---------- Modal ---------- */
  L.modal = (opt) => {
    const bg = document.createElement('div');
    bg.className = 'mbg'; bg.setAttribute('role', 'dialog'); bg.setAttribute('aria-modal', 'true');
    bg.innerHTML = '<div class="modal ' + (opt.size || 'w-m') + '"><div class="modal-h"><h2>' + (opt.title || '') + '</h2><button class="ibtn" data-close aria-label="Tutup">' + L.ic('x') + '</button></div><div class="modal-b">' + (opt.body || '') + '</div>' + (opt.footer ? '<div class="modal-f">' + opt.footer + '</div>' : '') + '</div>';
    const prev = document.activeElement;
    const close = () => { bg.remove(); document.removeEventListener('keydown', esc); if (prev && prev.focus) try { prev.focus(); } catch (e) { } if (opt.onClose) opt.onClose(); };
    const esc = e => { if (e.key === 'Escape') close(); };
    bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
    bg.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(bg);
    const f = bg.querySelector('input,select,textarea,button.pri'); if (f && !opt.noFocus) setTimeout(() => f.focus(), 30);
    return { el: bg, close, $: s => bg.querySelector(s), $$: s => Array.from(bg.querySelectorAll(s)) };
  };
  L.confirm = (title, msg, okLabel, danger) => new Promise(res => {
    let done = false;
    const m = L.modal({ title, size: 'w-s', body: '<p class="muted">' + msg + '</p>', onClose: () => { if (!done) res(false); },
      footer: '<button class="btn" data-close>Batal</button><button class="btn ' + (danger ? 'dng' : 'pri') + '" data-ok>' + (okLabel || 'Ya, lanjutkan') + '</button>' });
    m.$('[data-ok]').onclick = () => { done = true; m.close(); res(true); };
  });

  /* ---------- Skrip pustaka eksternal (dengan cadangan) ---------- */
  const lib = {};
  L.loadScript = (key, urls) => {
    if (lib[key]) return lib[key];
    lib[key] = new Promise((ok, no) => {
      let i = 0;
      const next = () => {
        if (i >= urls.length) { delete lib[key]; return no(new Error('Pustaka ' + key + ' gagal dimuat (cek koneksi internet).')); }
        const s = document.createElement('script'); s.src = urls[i++]; s.async = true;
        s.onload = () => ok(true); s.onerror = () => { s.remove(); next(); };
        document.head.appendChild(s);
      };
      next();
    });
    return lib[key];
  };
  L.libs = {
    xlsx: () => window.XLSX ? Promise.resolve() : L.loadScript('xlsx', ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']),
    qr: () => window.qrcode ? Promise.resolve() : L.loadScript('qr', ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js']),
    jsqr: () => window.jsQR ? Promise.resolve() : L.loadScript('jsqr', ['https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js', 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'])
  };

  L.download = (blob, nama) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  };
  L.csv = (rows) => '﻿' + rows.map(r => r.map(c => { c = String(c == null ? '' : c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',')).join('\r\n');
  /** Ekspor tabel: xlsx bila pustaka tersedia, jika tidak CSV. */
  L.exportTabel = async (nama, sheetNama, rows) => {
    try {
      await L.libs.xlsx();
      const ws = XLSX.utils.aoa_to_sheet(rows), wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, String(sheetNama || 'Data').slice(0, 30));
      XLSX.writeFile(wb, nama + '.xlsx');
    } catch (e) {
      L.download(new Blob([L.csv(rows)], { type: 'text/csv;charset=utf-8' }), nama + '.csv');
      L.toast('Pustaka Excel tidak tersedia — diunduh sebagai CSV.', 'warn');
    }
  };
  /** Cetak area kustom (PDF lewat dialog cetak peramban). */
  L.cetak = (html, cls) => {
    const a = L.$('#print-area'); a.className = cls || ''; a.innerHTML = html;
    a.style.cssText = 'display:block;position:absolute;left:-9999px;top:0;width:215mm'; L.fitSheets(a); a.style.cssText = '';
    setTimeout(() => { window.print(); }, 150);
  };

  /* ---------- Gambar: kompres, kualitas, QR ---------- */
  L.img = {
    load(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Gambar tidak dapat dibaca.')); i.src = src; }); },
    async fromBlob(blob) {
      const url = URL.createObjectURL(blob);
      try { return await L.img.load(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
    },
    /** Memperkecil ke sisi terpanjang `maks` px, JPEG, kembali {dataUrl, base64, w, h, blob}. */
    async compress(source, maks, q) {
      const im = source instanceof Blob ? await L.img.fromBlob(source) : source;
      const w0 = im.naturalWidth || im.videoWidth || im.width, h0 = im.naturalHeight || im.videoHeight || im.height;
      const k = Math.min(1, (maks || 1800) / Math.max(w0, h0));
      const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL('image/jpeg', q || 0.82);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q || 0.82));
      return { dataUrl, base64: dataUrl.split(',')[1], w: c.width, h: c.height, blob, canvas: c };
    },
    /** Heuristik kualitas: ketajaman (varians Laplacian) + kecerahan. */
    kualitas(src) {
      const w0 = src.naturalWidth || src.videoWidth || src.width, h0 = src.naturalHeight || src.videoHeight || src.height;
      const k = 420 / Math.max(w0, h0), w = Math.max(8, Math.round(w0 * k)), h = Math.max(8, Math.round(h0 * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h);
      let sum = 0;
      for (let i = 0; i < w * h; i++) { g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114; sum += g[i]; }
      const mean = sum / (w * h);
      let s = 0, s2 = 0, n = 0;
      for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
        const i = yy * w + xx, l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
        s += l; s2 += l * l; n++;
      }
      const v = s2 / n - (s / n) * (s / n);
      const tajam = L.clamp(v / 9, 0, 100), terang = mean < 70 ? L.clamp(mean / 70 * 100, 0, 100) : mean > 235 ? L.clamp((255 - mean) / 20 * 100, 0, 100) : 100;
      const skor = Math.round(tajam * 0.7 + terang * 0.3), isu = [];
      if (tajam < 45) isu.push('foto buram / kurang tajam');
      if (mean < 70) isu.push('pencahayaan kurang');
      if (mean > 235) isu.push('terlalu terang / silau');
      if (w0 < 1000 && h0 < 1000) isu.push('resolusi rendah');
      return { skor, tajam: Math.round(tajam), terang: Math.round(terang), label: skor >= 80 ? 'Baik' : skor >= 55 ? 'Cukup' : 'Buram', isu };
    },
    /** Membaca QR identitas LJK: kembali {u, s, n} atau null. */
    async qr(src) {
      try { await L.libs.jsqr(); } catch (e) { return null; }
      const w0 = src.naturalWidth || src.videoWidth || src.width, h0 = src.naturalHeight || src.videoHeight || src.height;
      for (const maks of [1100, 1600, 700]) {
        const k = Math.min(1, maks / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, w, h);
        const r = jsQR(x.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
        if (r && r.data) { const p = String(r.data).split('|'); if (p[0] === 'LJK' && p.length >= 4) return { u: p[1], s: p[2], n: p[3] }; }
      }
      return null;
    }
  };

  /* ---------- Grafik SVG ---------- */
  const C = { pri: 'var(--pri)', ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)', vio: 'var(--vio)', sky: 'var(--sky)', mute: 'var(--line2)' };
  L.chart = {
    C,
    /** Histogram: bins [{label, v, hi}] */
    hist(bins, o) {
      o = o || {}; const W = 560, H = 250, pl = 34, pb = 38, pt = 22, pr = 8, mx = Math.max(4, Math.ceil(Math.max.apply(null, bins.map(b => b.v)) / 4) * 4);
      const bw = (W - pl - pr) / bins.length; let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + L.esc(o.label || 'Histogram sebaran nilai') + '">';
      for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * (1 - i / 4); s += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(mx * i / 4) + '</text>'; }
      bins.forEach((b, i) => {
        const h = (H - pt - pb) * b.v / mx, x = pl + i * bw + bw * 0.16, y = H - pb - h, w = bw * 0.68;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.max(h, 0) + '" rx="6" fill="' + (b.c || (b.hi ? C.pri : 'color-mix(in srgb,var(--pri) 38%,var(--card))')) + '"><title>' + L.esc(b.label) + ': ' + b.v + ' siswa</title></rect>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y - 6) + '" text-anchor="middle" style="font-weight:700;fill:var(--tx)">' + b.v + '</text><text x="' + (x + w / 2) + '" y="' + (H - pb + 17) + '" text-anchor="middle">' + L.esc(b.label) + '</text>';
      });
      if (o.kkmIdx != null && o.kkmIdx >= 0) { const x = pl + o.kkmIdx * bw; s += '<line x1="' + x + '" x2="' + x + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + C.err + '" stroke-dasharray="4 4" stroke-width="1.6"/><text x="' + (x + 4) + '" y="' + (pt - 6) + '" style="fill:var(--err);font-weight:700">KKM ' + o.kkm + '</text>'; }
      return s + '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" style="font-size:10px;letter-spacing:.08em">' + L.esc(o.xl || 'RENTANG NILAI SISWA') + '</text></svg>';
    },
    donut(parts, center, sub, size) {
      const r = 62, c = 2 * Math.PI * r, tot = parts.reduce((t, p) => t + p.v, 0) || 1; let off = 0, s = '<svg viewBox="0 0 170 170" class="chart" style="width:' + (size || 170) + 'px;height:' + (size || 170) + 'px" role="img" aria-label="Diagram komposisi"><circle cx="85" cy="85" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="22"/>';
      parts.forEach(p => { const len = c * p.v / tot; if (p.v > 0) s += '<circle cx="85" cy="85" r="' + r + '" fill="none" stroke="' + p.c + '" stroke-width="22" stroke-dasharray="' + len + ' ' + (c - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 85 85)"><title>' + L.esc(p.l) + ': ' + p.v + '</title></circle>'; off += len; });
      return s + '<text x="85" y="' + (sub ? 82 : 91) + '" text-anchor="middle" style="font-size:25px;font-weight:800;fill:var(--tx)">' + L.esc(center) + '</text>' + (sub ? '<text x="85" y="101" text-anchor="middle" style="font-size:9.5px">' + L.esc(sub) + '</text>' : '') + '</svg>';
    },
    /** Batang vertikal: items [{label,v,c,note}] skala 0..max, garis acuan opsional */
    bars(items, o) {
      o = o || {}; const W = Math.max(300, items.length * 44 + 60), H = 230, pl = 34, pb = 34, pt = 20, mx = o.max || 100, bw = (W - pl - 8) / items.length;
      let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + L.esc(o.label || 'Grafik batang') + '">';
      for (let i = 0; i <= 4; i++) { const y = pt + (H - pt - pb) * (1 - i / 4); s += '<line class="gl" x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + (o.dec ? (mx * i / 4).toFixed(1) : Math.round(mx * i / 4)) + '</text>'; }
      items.forEach((b, i) => { const h = (H - pt - pb) * Math.min(b.v, mx) / mx, x = pl + i * bw + bw * 0.2, w = bw * 0.6, y = H - pb - h;
        s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.max(h, 0) + '" rx="5" fill="' + (b.c || C.pri) + '"><title>' + L.esc(b.label) + ': ' + b.v + (b.note ? ' — ' + L.esc(b.note) : '') + '</title></rect>';
        if (items.length <= 24) s += '<text x="' + (x + w / 2) + '" y="' + (H - pb + 15) + '" text-anchor="middle" style="font-size:' + (items.length > 16 ? 8.5 : 10) + 'px">' + L.esc(b.label) + '</text>'; });
      (o.lines || []).forEach(l => { const y = H - pb - (H - pt - pb) * l.v / mx; s += '<line x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '" stroke="' + (l.c || C.err) + '" stroke-dasharray="4 4" stroke-width="1.4"/><text x="' + (W - 8) + '" y="' + (y - 4) + '" text-anchor="end" style="fill:' + (l.c || C.err) + ';font-weight:700">' + L.esc(l.t) + '</text>'; });
      return s + '</svg>';
    }
  };
})();
