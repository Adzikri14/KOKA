/* ==========================================================================
   KOKA — game-play.js
   Mekanik ala "Hunter Coin": siswa MENYUSUN dulu urutan perintah arah
   (atas/bawah/kiri/kanan) menjadi sebuah program, lalu menekan "Jalankan".
   Robot bergerak mengikuti program tersebut di atas SATU medan 6x6 berisi
   5 koin dan beberapa rintangan (batu/box/laser):
     - Menabrak rintangan -> program berhenti, nyawa (hati) berkurang,
       robot kembali ke posisi awal, program direset (harus disusun ulang).
     - Menyentuh koin -> program BERHENTI SEJENAK, muncul soal pilihan
       ganda. Jawaban benar = koin didapat, salah = nyawa berkurang.
       Setelah dijawab, sisa program otomatis dilanjutkan.
   Misi selesai saat semua 5 koin sudah dicoba (benar/salah) atau nyawa habis.

   Ganti gambar di:
     assets/images/game/koin.png
     assets/images/game/rintangan-batu.png
     assets/images/game/rintangan-box.png
     assets/images/game/rintangan-laser.png
   tanpa perlu mengubah kode ini.

   Untuk mengubah denah, edit DENAH_MEDAN di bawah ini.
   Simbol: S = start, . = jalan kosong, C = koin,
           R1 = rintangan batu, R2 = rintangan box, R3 = rintangan laser
   ========================================================================== */

const sesiPlay = KOKA.wajibLogin();

const GAMBAR_RINTANGAN = {
  R1: '../assets/images/game/rintangan-batu.png',
  R2: '../assets/images/game/rintangan-box.png',
  R3: '../assets/images/game/rintangan-laser.png'
};

// Beberapa VARIAN denah (posisi rintangan berbeda-beda), supaya:
// 1) tiap bab/misi tidak selalu memakai denah yang sama, dan
// 2) saat nyawa habis lalu "Ulangi", posisi rintangan bisa berganti.
// Semua varian tetap 6x6, 1 titik S, dan 5 koin (C) agar tingkat kesulitan setara.
const DAFTAR_DENAH = [
  // Varian A (denah lama/awal)
  [
    ['S', '.', 'R1', '.', 'C', '.'],
    ['.', '.', 'R1', '.', '.', 'R2'],
    ['C', '.', '.', 'R3', '.', '.'],
    ['.', 'R2', '.', '.', 'C', '.'],
    ['.', '.', 'C', '.', 'R3', '.'],
    ['.', '.', '.', 'R1', '.', 'C']
  ],
  // Varian B
  [
    ['S', '.', '.', 'R1', '.', 'C'],
    ['.', 'R2', '.', '.', '.', '.'],
    ['.', 'R2', 'C', '.', 'R3', '.'],
    ['.', '.', '.', '.', '.', 'C'],
    ['R1', '.', 'C', '.', '.', '.'],
    ['.', '.', '.', 'R3', '.', 'C']
  ],
  // Varian C
  [
    ['S', 'R1', '.', '.', 'C', '.'],
    ['.', 'R1', '.', 'R2', '.', '.'],
    ['.', '.', 'C', '.', '.', 'R3'],
    ['C', '.', '.', 'R2', '.', '.'],
    ['.', 'R3', '.', '.', 'C', '.'],
    ['.', '.', '.', '.', '.', 'C']
  ],
  // Varian D
  [
    ['S', '.', 'R2', '.', '.', '.'],
    ['.', '.', 'R2', '.', 'C', '.'],
    ['R1', '.', '.', '.', '.', 'C'],
    ['R1', '.', 'C', '.', 'R3', '.'],
    ['.', '.', '.', '.', 'R3', '.'],
    ['.', 'C', '.', '.', '.', 'C']
  ]
];
const JUMLAH_BARIS = DAFTAR_DENAH[0].length;
const JUMLAH_KOLOM = DAFTAR_DENAH[0][0].length;
let indexDenahAktif = -1;

const SIMBOL_ARAH = { atas: '▲', bawah: '▼', kiri: '◀', kanan: '▶' };
const DELTA_ARAH = {
  atas: { dr: -1, dc: 0 },
  bawah: { dr: 1, dc: 0 },
  kiri: { dr: 0, dc: -1 },
  kanan: { dr: 0, dc: 1 }
};

let dataMisi = null;
let cellTypes = [];
let posisiAwal = { r: 0, c: 0 };
let posisiSekarang = { r: 0, c: 0 };
let koinCells = [];        // urutan koordinat koin, dipetakan ke soal[i]
let koinTerjawab = [];     // true/false per indeks koin
let programPerintah = [];
let sedangBerjalan = false;
let sedangTanyaSoal = false;

let nyawa = 3;
let koinDidapat = 0;
let koinDicoba = 0;

const params = new URLSearchParams(window.location.search);
const idMisi = params.get('misi');

async function muatMisi() {
  const dataKelas = await KOKA.ambilJSON(`game-kelas${sesiPlay.kelas}.json`);
  dataMisi = dataKelas.misi.find(m => m.id === idMisi);

  if (!dataMisi) {
    alert('Misi tidak ditemukan.');
    window.location.href = 'game.html';
    return;
  }

  document.getElementById('judul-misi-aktif').textContent = dataMisi.judul.toUpperCase();

  // Pilih varian denah berdasarkan nomor misi/bab, supaya bab 1, 2, 3, dst
  // tidak selalu memakai denah (posisi rintangan) yang sama.
  indexDenahAktif = ((dataMisi.nomor || 1) - 1) % DAFTAR_DENAH.length;
  siapkanMedan(DAFTAR_DENAH[indexDenahAktif]);
  render();
  renderProgram();
  perbaruiHUD();
}

function siapkanMedan(denah) {
  cellTypes = denah.map(baris => baris.slice());
  koinCells = [];
  for (let r = 0; r < JUMLAH_BARIS; r++) {
    for (let c = 0; c < JUMLAH_KOLOM; c++) {
      if (cellTypes[r][c] === 'S') { posisiAwal = { r, c }; cellTypes[r][c] = '.'; }
      if (cellTypes[r][c] === 'C') koinCells.push({ r, c });
    }
  }
  koinTerjawab = koinCells.map(() => false);
  posisiSekarang = { ...posisiAwal };
}

function render() {
  const wadah = document.getElementById('medan-game');
  let html = '';
  for (let r = 0; r < JUMLAH_BARIS; r++) {
    for (let c = 0; c < JUMLAH_KOLOM; c++) {
      const tipe = cellTypes[r][c];
      const indexKoin = koinCells.findIndex(k => k.r === r && k.c === c);
      const iniKoinAktif = indexKoin !== -1 && !koinTerjawab[indexKoin];
      const adaKarakter = posisiSekarang.r === r && posisiSekarang.c === c;

      let kelas = 'sel-medan';
      let isi = '';
      if (tipe === 'R1' || tipe === 'R2' || tipe === 'R3') {
        kelas += ' terhalang';
        isi = `<img src="${GAMBAR_RINTANGAN[tipe]}" alt="Rintangan">`;
      }
      if (iniKoinAktif) {
        kelas += ' ada-koin';
        isi = `<img class="gbr-koin" src="../assets/images/game/koin.png" alt="Koin">`;
      }
      if (adaKarakter) {
        isi += `<img class="karakter-medan" src="../assets/images/mascot/maskot-berdiri.png" alt="Karakter">`;
      }
      html += `<div class="${kelas}" data-r="${r}" data-c="${c}">${isi}</div>`;
    }
  }
  wadah.innerHTML = html;
}

function renderProgram() {
  const wadah = document.getElementById('susunan-perintah');
  if (programPerintah.length === 0) {
    wadah.innerHTML = `<span class="placeholder-kosong">(belum ada perintah)</span>`;
  } else {
    wadah.innerHTML = programPerintah.map((arah, i) =>
      `<span class="chip-perintah" data-index="${i}">${SIMBOL_ARAH[arah]}</span>`
    ).join('');
  }
  aturTombolAktif(!sedangBerjalan && !sedangTanyaSoal);
}

function tambahPerintah(arah) {
  if (sedangBerjalan || sedangTanyaSoal) return;
  programPerintah.push(arah);
  renderProgram();
}
function hapusTerakhir() {
  if (sedangBerjalan || sedangTanyaSoal) return;
  programPerintah.pop();
  renderProgram();
}
function resetProgram() {
  if (sedangBerjalan || sedangTanyaSoal) return;
  programPerintah = [];
  renderProgram();
}

function aturTombolAktif(aktif) {
  ['tambah-atas', 'tambah-bawah', 'tambah-kiri', 'tambah-kanan'].forEach(id => {
    document.getElementById(id).disabled = !aktif;
  });
  document.getElementById('btn-hapus-terakhir').disabled = !aktif;
  document.getElementById('btn-reset-program').disabled = !aktif;
  document.getElementById('btn-jalankan').disabled = !aktif || programPerintah.length === 0;
}

async function jalankanProgram() {
  if (sedangBerjalan || sedangTanyaSoal || programPerintah.length === 0) return;
  sedangBerjalan = true;
  aturTombolAktif(false);

  let indexLangkah = 0;
  await jalankanLangkahBerikutnya(indexLangkah);
}

async function jalankanLangkahBerikutnya(i) {
  if (i >= programPerintah.length) {
    // Program selesai dijalankan tanpa menabrak apa pun
    programPerintah = [];
    sedangBerjalan = false;
    renderProgram();
    cekAkhirMisi();
    return;
  }

  await tunggu(420);
  tandaiChipAktif(i);

  const delta = DELTA_ARAH[programPerintah[i]];
  const rBaru = posisiSekarang.r + delta.dr;
  const cBaru = posisiSekarang.c + delta.dc;
  const diLuarBatas = rBaru < 0 || rBaru >= JUMLAH_BARIS || cBaru < 0 || cBaru >= JUMLAH_KOLOM;
  const kenaRintangan = !diLuarBatas && ['R1', 'R2', 'R3'].includes(cellTypes[rBaru][cBaru]);

  if (diLuarBatas || kenaRintangan) {
    tandaiChipGagal(i);
    guncangSel(diLuarBatas ? posisiSekarang.r : rBaru, diLuarBatas ? posisiSekarang.c : cBaru);
    await tunggu(350);
    gagalMenabrak();
    return;
  }

  posisiSekarang = { r: rBaru, c: cBaru };
  render();

  const indexKoin = koinCells.findIndex(k => k.r === rBaru && k.c === cBaru);
  if (indexKoin !== -1 && !koinTerjawab[indexKoin]) {
    sedangTanyaSoal = true;
    bukaSoal(indexKoin, i);
    return; // lanjut dipanggil dari dalam jawabSoal()
  }

  await jalankanLangkahBerikutnya(i + 1);
}

function gagalMenabrak() {
  nyawa -= 1;
  posisiSekarang = { ...posisiAwal };
  programPerintah = [];
  sedangBerjalan = false;
  render();
  renderProgram();
  perbaruiHUD();

  tampilkanBanner('gagal', '💥 Robot menabrak rintangan! Coba susun ulang.');

  if (nyawa <= 0) {
    setTimeout(() => akhiriMisi(false), 900);
  }
}

function bukaSoal(indexKoin, indexLangkahProgram) {
  const soal = dataMisi.soal[indexKoin];
  if (!soal) { lanjutkanSetelahSoal(indexLangkahProgram); return; }

  document.getElementById('teks-soal-modal').textContent = soal.teks;
  document.getElementById('gambar-soal-modal').innerHTML = soal.gambar
    ? `<img src="../assets/${soal.gambar}" alt="Gambar soal">`
    : '';

  const wadahOpsi = document.getElementById('opsi-soal-modal');
  wadahOpsi.innerHTML = soal.pilihan.map((p, i) => `
    <button type="button" data-index="${i}">${String.fromCharCode(97 + i)}. ${p}</button>
  `).join('');

  wadahOpsi.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => jawabSoal(btn, parseInt(btn.dataset.index, 10), soal, indexKoin, indexLangkahProgram));
  });

  document.getElementById('modal-soal').style.display = 'flex';
}

function jawabSoal(tombolDiklik, indexDipilih, soal, indexKoin, indexLangkahProgram) {
  const semuaTombol = document.querySelectorAll('#opsi-soal-modal button');
  semuaTombol.forEach(b => b.disabled = true);

  const benar = indexDipilih === soal.jawaban;
  tombolDiklik.classList.add(benar ? 'dipilih-benar' : 'dipilih-salah');
  if (!benar) {
    const tombolBenar = document.querySelector(`#opsi-soal-modal button[data-index="${soal.jawaban}"]`);
    if (tombolBenar) tombolBenar.classList.add('dipilih-benar');
  }

  setTimeout(() => {
    koinTerjawab[indexKoin] = true;
    koinDicoba += 1;
    if (benar) { koinDidapat += 1; tampilkanBanner('sukses', '🎉 Kena Koin!'); }
    else { nyawa -= 1; tampilkanBanner('gagal', '❌ Jawaban salah, nyawa berkurang.'); }

    document.getElementById('modal-soal').style.display = 'none';
    sedangTanyaSoal = false;
    render();
    perbaruiHUD();

    if (nyawa <= 0) {
      sedangBerjalan = false;
      programPerintah = [];
      renderProgram();
      setTimeout(() => akhiriMisi(false), 700);
      return;
    }

    lanjutkanSetelahSoal(indexLangkahProgram);
  }, 900);
}

async function lanjutkanSetelahSoal(indexLangkahProgram) {
  await tunggu(300);
  await jalankanLangkahBerikutnya(indexLangkahProgram + 1);
}

function tunggu(ms) { return new Promise(res => setTimeout(res, ms)); }

function tandaiChipAktif(i) {
  const chip = document.querySelector(`.chip-perintah[data-index="${i}"]`);
  if (chip) chip.classList.add('chip-aktif');
}
function tandaiChipGagal(i) {
  const chip = document.querySelector(`.chip-perintah[data-index="${i}"]`);
  if (chip) { chip.classList.remove('chip-aktif'); chip.classList.add('chip-gagal'); }
}
function guncangSel(r, c) {
  const sel = document.querySelector(`.sel-medan[data-r="${r}"][data-c="${c}"]`);
  if (!sel) return;
  sel.classList.add('guncang');
  setTimeout(() => sel.classList.remove('guncang'), 300);
}

let timeoutBanner = null;
function tampilkanBanner(jenis, teks) {
  const banner = document.getElementById('banner-hasil-level');
  banner.className = `banner-hasil-level ${jenis}`;
  banner.textContent = teks;
  banner.style.display = 'block';
  clearTimeout(timeoutBanner);
  timeoutBanner = setTimeout(() => { banner.style.display = 'none'; }, 1800);
}

function cekAkhirMisi() {
  if (koinDicoba >= koinCells.length) {
    akhiriMisi(true);
  }
}

function perbaruiHUD() {
  document.getElementById('hud-koin').textContent = koinDidapat;
  document.getElementById('hud-progres').textContent = `Koin ${koinDicoba}/${koinCells.length}`;
  document.getElementById('hud-nyawa').textContent = '❤️'.repeat(Math.max(nyawa, 0)) + '🖤'.repeat(3 - Math.max(nyawa, 0));
}

function akhiriMisi(selesai) {
  const overlay = document.getElementById('overlay-hasil');
  const total = koinCells.length;
  overlay.style.display = 'flex';

  document.getElementById('skor-hasil').textContent = `${koinDidapat}/${total}`;

  let bintang = 0;
  if (selesai) {
    const persen = koinDidapat / total;
    bintang = persen >= 1 ? 3 : persen >= 0.6 ? 2 : 1;
    KOKA.simpanSkorMisi(idMisi, koinDidapat, total);
  }

  document.getElementById('bintang-hasil').textContent = '⭐'.repeat(bintang) + '☆'.repeat(3 - bintang);
  document.getElementById('judul-hasil').textContent = selesai ? 'Misi Selesai! 🎉' : 'Nyawa Habis 😥';
  document.getElementById('pesan-hasil').textContent = selesai
    ? 'Kerja bagus, Sahabat KOKA! Koin sudah masuk ke tabunganmu.'
    : 'Jangan menyerah, coba lagi ya!';
}

document.getElementById('tambah-atas').addEventListener('click', () => tambahPerintah('atas'));
document.getElementById('tambah-bawah').addEventListener('click', () => tambahPerintah('bawah'));
document.getElementById('tambah-kiri').addEventListener('click', () => tambahPerintah('kiri'));
document.getElementById('tambah-kanan').addEventListener('click', () => tambahPerintah('kanan'));
document.getElementById('btn-hapus-terakhir').addEventListener('click', hapusTerakhir);
document.getElementById('btn-reset-program').addEventListener('click', resetProgram);
document.getElementById('btn-jalankan').addEventListener('click', jalankanProgram);
document.getElementById('btn-ulangi').addEventListener('click', ulangiMisi);

function ulangiMisi() {
  // Pilih denah baru yang BEDA dari denah yang baru saja gagal,
  // supaya posisi rintangan berganti tiap kali "Ulangi" ditekan.
  let indexBaru = indexDenahAktif;
  if (DAFTAR_DENAH.length > 1) {
    while (indexBaru === indexDenahAktif) {
      indexBaru = Math.floor(Math.random() * DAFTAR_DENAH.length);
    }
  }
  indexDenahAktif = indexBaru;

  nyawa = 3;
  koinDidapat = 0;
  koinDicoba = 0;
  programPerintah = [];
  sedangBerjalan = false;
  sedangTanyaSoal = false;

  siapkanMedan(DAFTAR_DENAH[indexDenahAktif]);
  document.getElementById('overlay-hasil').style.display = 'none';
  render();
  renderProgram();
  perbaruiHUD();
}

muatMisi();
