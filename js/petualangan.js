/* KOKA — petualangan.js: halaman 5 game per BAB (Game 1 = Robot Koin, Game 2-5 = blok kode / bug / kartu). Tiap game 3 ronde. */
const sesiP = KOKA.wajibLogin();
const idBab = new URLSearchParams(location.search).get('bab');
const app = document.getElementById('app');
const XP_MISI = 20, XP_BAB = 50;
let bab = null, mi = 0, ti = 0, hati = 3;

const prog = () => { const p = KOKA.ambilProgres(); p.petualangan = p.petualangan || { xp: 0, misi: {}, badge: [] }; return p; };
const kunci = i => `${bab.id}-m${i + 1}`;
const ok = (p, i) => bab.misi[i] && (bab.misi[i].robot ? p.misiSelesai[bab.misi[i].robot] : p.petualangan.misi[kunci(i)]);
const acak = a => {
  let b = [...a];
  for (let coba = 0; coba < 10; coba++) {
    b = [...a].sort(() => Math.random() - .5);
    if (b.some((x, i) => x !== a[i])) break; // pastikan urutannya berubah (maks. 10 percobaan, tidak bisa macet)
  }
  return b;
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const tunggu = ms => new Promise(r => setTimeout(r, ms));
const WARNA = ['#6C4CE8', '#FF7EB6', '#2E9EE8', '#45C299', '#F0A81A'];

async function mulai() {
  try { bab = (await KOKA.ambilJSON(`petualangan-kelas${sesiP.kelas}.json`)).bab.find(b => b.id === idBab); } catch (e) {}
  if (!bab) {
    const g = (await KOKA.ambilJSON(`game-kelas${sesiP.kelas}.json`)).misi.find(x => x.babTerkait === idBab);
    if (!g) { app.innerHTML = '<p class="kartu-tugas">Bab tidak ditemukan.</p>'; return; }
    bab = { id: idBab, judul: g.judul.replace(/^Misi \d+: /, ''), badge: '🏅 Penjelajah', misi: [{ nama: 'Robot Koin', ikon: '🤖', robot: g.id, tujuan: 'Game 1: susun panah robot, ambil 3 koin.' }] };
  }
  document.getElementById('judul-bab').textContent = bab.judul;
  peta();
}

function peta() {
  const p = prog();
  document.getElementById('xp-info').textContent = `⭐ ${p.petualangan.xp} XP`;
  const sel = [0, 1, 2, 3].filter(i => ok(p, i)).length;
  app.innerHTML = `<div class="peta"><div class="hud"><span>Progres bab</span><span>${sel}/4 game</span></div>` +
    [0, 1, 2, 3].map(i => {
      const m = bab.misi[i] || { nama: 'Segera hadir', ikon: '🔒', tujuan: 'Game ini sedang disiapkan.' };
      const done = ok(p, i), buka = !!bab.misi[i] && (i === 0 || ok(p, i - 1));
      return `<button class="node ${done ? 'selesai' : buka ? '' : 'kunci'}" data-i="${i}" ${buka ? '' : 'disabled'}>
        <span class="ik">${buka ? m.ikon : '🔒'}</span><span><b>Game ${i + 1} — ${m.nama}</b><small>${esc(m.tujuan)}</small></span></button>`;
    }).join('') + (sel === 5 ? `<p class="umpan ok">🏅 Badge: ${bab.badge}</p>` : '') + '</div>';
  app.querySelectorAll('.node:not(.kunci)').forEach(b => b.onclick = () => {
    mi = +b.dataset.i;
    if (bab.misi[mi].robot) { location.href = 'game-play.html?misi=' + bab.misi[mi].robot; return; }
    ti = 0; hati = 3; ronde();
  });
}

function ronde() {
  const m = bab.misi[mi], r = m.tahap[ti];
  app.innerHTML = `<div class="kartu-tugas"><div class="hud"><span>${m.ikon} Game ${mi + 1}: ${m.nama}</span><span>${'❤️'.repeat(hati)} • Ronde ${ti + 1}/${m.tahap.length}</span></div>
    ${m.cerita && ti === 0 ? `<p><i>${esc(m.cerita)}</i></p>` : ''}<h3>${esc(r.judul)}</h3><div id="isi"></div><div id="umpan"></div></div>`;
  ({ blok, bug, memori })[r.tipe](r, document.getElementById('isi'));
}

/* true = benar -> tombol lanjut; false = nyawa berkurang */
function hasil(benar) {
  const u = document.getElementById('umpan');
  if (benar) {
    u.innerHTML = '<p class="umpan ok">🎉 Hebat!</p><button class="btn btn-oren btn-block" id="lanjut">Lanjut ➜</button>';
    document.getElementById('lanjut').onclick = () => { ti++; ti >= bab.misi[mi].tahap.length ? selesaiMisi() : ronde(); };
    return;
  }
  hati--;
  if (hati <= 0) { u.innerHTML = '<p class="umpan no">💔 Nyawa habis. Coba lagi dari awal!</p><button class="btn btn-oren btn-block" id="ulang">Ulangi Game</button>'; document.getElementById('ulang').onclick = () => { ti = 0; hati = 3; ronde(); }; return 'mati'; }
  u.innerHTML = `<p class="umpan no">❌ Belum pas, coba lagi! Sisa ${'❤️'.repeat(hati)}</p>`;
}

const htmlBlok = (b, i, kls = '') => `<div class="blok ${kls}" style="--w:${WARNA[i % 5]}"><span class="b-ik">${b.ik}</span><span>${esc(b.t)}</span></div>`;

/* GAME: Susun Blok Kode */
function blok(r, w) {
  const urut = r.blok.map((b, i) => i);
  let susun = [], palet = acak(urut), jalan = false;
  const gbr = () => {
    w.innerHTML = `<div class="panggung" id="pg">${susun.length ? '' : '🧒 ➜ ' + r.hasil}</div>
      <div class="rakit">${susun.map((i, n) => `<button class="blok-btn" data-n="${n}">${htmlBlok(r.blok[i], i)}</button>`).join('') || '<small>Ketuk blok di bawah untuk menyusun program ⬇️</small>'}</div>
      <div class="palet">${palet.map(i => `<button class="blok-btn" data-i="${i}">${htmlBlok(r.blok[i], i)}</button>`).join('')}</div>
      <button class="btn btn-sm" id="reset">↺ Ulang</button> <button class="btn btn-oren" id="jalan">▶ Jalankan</button>`;
    if (jalan) return;
    w.querySelectorAll('.palet .blok-btn').forEach(b => b.onclick = () => { const i = +b.dataset.i; susun.push(i); palet = palet.filter(x => x !== i); gbr(); });
    w.querySelectorAll('.rakit .blok-btn').forEach(b => b.onclick = () => { const i = susun.splice(+b.dataset.n, 1)[0]; palet.push(i); gbr(); });
    w.querySelector('#reset').onclick = () => { susun = []; palet = acak(urut); gbr(); };
    w.querySelector('#jalan').onclick = async () => {
      if (palet.length) return;
      jalan = true; w.querySelectorAll('button').forEach(x => x.disabled = true);
      const bl = [...w.querySelectorAll('.rakit .blok')]; const pg = w.querySelector('#pg'); pg.textContent = '🧒';
      for (let n = 0; n < susun.length; n++) {
        bl[n].classList.add('aktif'); await tunggu(550);
        if (susun[n] !== n) { bl[n].classList.add('gagal'); pg.textContent = '🧒💭❓'; await tunggu(700); jalan = false; susun = []; palet = acak(urut); gbr(); hasil(false) === 'mati' && w.querySelectorAll('button').forEach(x => x.disabled = true); return; }
        pg.textContent += ' ' + r.blok[n].ik;
      }
      pg.textContent += ' ➜ ' + r.hasil; pg.classList.add('sukses'); hasil(true);
    };
  };
  gbr();
}

/* GAME: Detektif Bug */
function bug(r, w) {
  w.innerHTML = `<div class="panggung">🔍 Ketuk blok yang SALAH tempat!</div><div class="rakit">${r.blok.map((b, i) => `<button class="blok-btn" data-i="${i}">${htmlBlok(b, i)}</button>`).join('')}</div>`;
  w.querySelectorAll('.blok-btn').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (i === r.salah) { b.querySelector('.blok').classList.add('bug'); b.querySelector('.b-ik').textContent = '🐞'; w.querySelectorAll('.blok-btn').forEach(x => x.disabled = true); hasil(true); }
    else { b.classList.add('goyang'); setTimeout(() => b.classList.remove('goyang'), 500); if (hasil(false) === 'mati') w.querySelectorAll('.blok-btn').forEach(x => x.disabled = true); }
  });
}

/* GAME: Kartu Pasangan (memory) */
function memori(r, w) {
  const kartu = acak(r.pasang.flatMap((p, id) => [{ id, t: p[0] }, { id, t: p[1] }]));
  let buka = [], cocok = 0, kunciKlik = false;
  w.innerHTML = '<div class="grid-kartu">' + kartu.map((k, n) => `<button class="kartu-m" data-n="${n}"><span class="depan">❓</span><span class="belakang">${esc(k.t)}</span></button>`).join('') + '</div>';
  w.querySelectorAll('.kartu-m').forEach(el => el.onclick = async () => {
    const n = +el.dataset.n;
    if (kunciKlik || el.classList.contains('terbuka')) return;
    el.classList.add('terbuka'); buka.push(n);
    if (buka.length < 2) return;
    kunciKlik = true; await tunggu(800);
    const [a, b] = buka; const ea = w.querySelector(`[data-n="${a}"]`), eb = w.querySelector(`[data-n="${b}"]`);
    if (kartu[a].id === kartu[b].id) { ea.classList.add('cocok'); eb.classList.add('cocok'); if (++cocok === r.pasang.length) hasil(true); }
    else { ea.classList.remove('terbuka'); eb.classList.remove('terbuka'); }
    buka = []; kunciKlik = false;
  });
}

function selesaiMisi() {
  const p = prog(), k = kunci(mi), baru = !p.petualangan.misi[k];
  if (baru) { p.petualangan.misi[k] = true; p.petualangan.xp += XP_MISI; }
  const tamat = [0, 1, 2, 3].every(i => ok(p, i));
  if (tamat && baru && !p.petualangan.badge.includes(bab.id)) { p.petualangan.badge.push(bab.id); p.petualangan.xp += XP_BAB; }
  KOKA.simpanProgres(p);
  app.innerHTML = `<div class="kartu-tugas" style="text-align:center"><div class="selebrasi">${tamat ? '🏆' : '🎉'}</div>
    <h2>${tamat ? 'Petualangan Bab Selesai!' : `Game ${mi + 1} Selesai!`}</h2><p>+${XP_MISI} XP${tamat ? ` • +${XP_BAB} XP bonus • Badge ${bab.badge}` : ''}</p>
    <button class="btn btn-oren btn-block" id="kembali">Kembali ke Peta 🗺️</button></div>`;
  document.getElementById('kembali').onclick = peta;
}
mulai();
