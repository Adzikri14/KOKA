const sesiMateri = KOKA.wajibLogin();

async function muatDaftarBab() {
  if (!sesiMateri) return;
  document.getElementById('topbar-kelas').textContent = sesiMateri.kelas;

  const data = await KOKA.ambilJSON(`materi-kelas${sesiMateri.kelas}.json`);
  const progres = KOKA.ambilProgres();
  const wadah = document.getElementById('grid-bab');

  wadah.innerHTML = data.bab.map(bab => {
    const selesai = progres.materiSelesai.includes(bab.id);
    if (!bab.aktif) {
      return `
        <div class="kartu-bab nonaktif">
          <div class="thumb"><span class="no-bab">${bab.nomor}</span><span class="emoji-kosong">🔒</span></div>
          <div class="info-bab">
            <h4>${bab.judul}</h4>
            <span class="badge badge-nonaktif">Belum Aktif</span>
          </div>
        </div>`;
    }
    return `
      <a class="kartu-bab aktif" href="materi-detail.html?bab=${bab.id}">
        <div class="thumb">
          <span class="no-bab">${bab.nomor}</span>
          ${bab.gambarSampul ? `<img src="../assets/${bab.gambarSampul}" alt="${bab.judul}">` : '<span class="emoji-kosong">📘</span>'}
        </div>
        <div class="info-bab">
          <h4>${bab.judul}</h4>
          <div class="baris-bawah">
            <span class="badge ${selesai ? 'badge-aktif' : 'badge-ungu'}">${selesai ? '✔ Selesai' : 'Aktif'}</span>
            <span class="panah-buka-bab">Buka →</span>
          </div>
        </div>
      </a>`;
  }).join('');
}

muatDaftarBab();
