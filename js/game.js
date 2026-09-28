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
        <div class="status-misi">5 koin • ${hasil ? `Skor terbaik: ${hasil.skor}/${hasil.total}` : 'Belum dimainkan'}</div>
        ${hasil ? `<div class="bintang-hasil">${'⭐'.repeat(bintang)}${'☆'.repeat(3 - bintang)}</div>` : ''}
        <a class="btn btn-oren btn-block btn-sm" href="game-play.html?misi=${misi.id}">${hasil ? 'Main Lagi' : 'Mulai Misi'} 🎮</a>
      </div>
    `;
  }).join('');
}

function hitungBintang(skor, total) {
  const persen = skor / total;
  if (persen >= 1) return 3;
  if (persen >= 0.6) return 2;
  if (persen > 0) return 1;
  return 0;
}

muatMisi();
