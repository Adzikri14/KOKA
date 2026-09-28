/* ==========================================================================
   KOKA — app.js
   Utilitas umum: session siswa (localStorage), helper navigasi & format.
   Tidak ada framework — murni JavaScript ES6+.
   ========================================================================== */

const KOKA = {
  SESSION_KEY: 'koka_session',

  /** Simpan sesi siswa setelah login (nama & kelas) */
  simpanSesi(nama, kelas) {
    const sesi = { nama, kelas, masuk: new Date().toISOString() };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sesi));
    return sesi;
  },

  /** Ambil sesi siswa aktif. Kembalikan null jika belum login. */
  ambilSesi() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /** Pastikan siswa sudah login, kalau belum lempar ke halaman login */
  wajibLogin() {
    const sesi = this.ambilSesi();
    if (!sesi) {
      window.location.href = this.pathKe('index.html');
      return null;
    }
    return sesi;
  },

  /** Keluar / logout, hapus sesi dan kembali ke login */
  keluar() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = this.pathKe('index.html');
  },

  /** Path relatif aman dari dalam folder /html/ maupun root */
  pathKe(tujuan) {
    const diDalamHtml = window.location.pathname.includes('/html/');
    return diDalamHtml ? '../' + tujuan.replace(/^html\//, '') : tujuan;
  },
  pathHtml(halaman) {
    const diDalamHtml = window.location.pathname.includes('/html/');
    return diDalamHtml ? halaman : 'html/' + halaman;
  },
  pathData(file) {
    const diDalamHtml = window.location.pathname.includes('/html/');
    return diDalamHtml ? '../data/' + file : 'data/' + file;
  },
  pathAsset(file) {
    const diDalamHtml = window.location.pathname.includes('/html/');
    return diDalamHtml ? '../assets/' + file : 'assets/' + file;
  },

  /** Ambil JSON lokal (bank soal, materi, dsb) via fetch — memerlukan web server (http/https), tidak berfungsi jika file dibuka langsung (file://) */
  async ambilJSON(namaFile) {
    const res = await fetch(this.pathData(namaFile));
    if (!res.ok) throw new Error('Gagal memuat ' + namaFile);
    return res.json();
  },

  /** Progres belajar (materi dibaca, misi selesai) disimpan per-siswa di localStorage */
  KEY_PROGRES: 'koka_progres',
  ambilProgres() {
    const raw = localStorage.getItem(this.KEY_PROGRES);
    return raw ? JSON.parse(raw) : { materiSelesai: [], misiSelesai: {} };
  },
  simpanProgres(progres) {
    localStorage.setItem(this.KEY_PROGRES, JSON.stringify(progres));
  },
  tandaiMateriSelesai(idBab) {
    const p = this.ambilProgres();
    if (!p.materiSelesai.includes(idBab)) p.materiSelesai.push(idBab);
    this.simpanProgres(p);
  },
  simpanSkorMisi(idMisi, skor, total) {
    const p = this.ambilProgres();
    p.misiSelesai[idMisi] = { skor, total, tanggal: new Date().toISOString() };
    this.simpanProgres(p);
  },

  /** Inisial nama untuk avatar bulat */
  inisial(nama) {
    if (!nama) return '?';
    return nama.trim().split(/\s+/).slice(0, 2).map(k => k[0].toUpperCase()).join('');
  }
};
