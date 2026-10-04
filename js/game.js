const sesiGame = KOKA.wajibLogin();

async function muatMisi() {
  if (!sesiGame) return;
  const data = await KOKA.ambilJSON(`game-kelas${sesiGame.kelas}.json`);
  const progres = KOKA.ambilProgres();
  const wadah = document.getElementById('grid-misi');

  wadah.innerHTML = data.misi.map(misi => {
    const hasil = progres.misiSelesai[misi.id];
    const bintang = hasil ? hitungBintang(hasil.skor, hasil.total) : 0;
    return `
      <div class="kartu-misi">
        <div class="lencana">🏁</div>
        <h4>${misi.judul}</h4>
        <div class="status-misi">4 game seru • ${jumlahSelesai(misi)}/4 selesai</div>
        ${hasil ? `<div class="bintang-hasil">${'⭐'.repeat(bintang)}${'☆'.repeat(3 - bintang)}</div>` : ''}
        <a class="btn btn-oren btn-block btn-sm" href="petualangan.html?bab=${misi.babTerkait}">${jumlahSelesai(misi) ? 'Lanjutkan' : 'Mulai Misi'} 🎮</a>
      </div>
    `;
  }).join('');
}

function jumlahSelesai(misi) {
  const p = KOKA.ambilProgres(), pt = (p.petualangan && p.petualangan.misi) || {};
  return (p.misiSelesai[misi.id] ? 1 : 0) + [2,3,4].filter(i => pt[`${misi.babTerkait}-m${i}`]).length;
}

function hitungBintang(skor, total) {
  const persen = skor / total;
  if (persen >= 1) return 3;
  if (persen >= 0.6) return 2;
  if (persen > 0) return 1;
  return 0;
}

muatMisi();
