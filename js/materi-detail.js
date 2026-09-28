const sesiDetail = KOKA.wajibLogin();

function renderBlok(blok) {
  switch (blok.tipe) {
    case 'judul':
      return `<h3>${blok.teks}</h3>`;
    case 'subjudul':
      return `<h4 class="subjudul-materi">${blok.teks}</h4>`;
    case 'paragraf':
      return `<p class="paragraf-materi">${blok.teks}</p>`;
    case 'list':
      return `<ul class="list-materi">${blok.item.map(i => `<li>${i}</li>`).join('')}</ul>`;
    case 'info':
      return `<div class="kotak-info-materi"><h5>${blok.judul}</h5><p>${blok.teks}</p></div>`;
    case 'kode':
      return `<div class="kotak-kode-materi"><span class="judul-kode">${blok.judul}</span>${blok.teks}</div>`;
    case 'gambar':
      return `<div class="gambar-materi"><img src="../assets/${blok.src}" alt="${blok.keterangan || ''}"><div class="keterangan">${blok.keterangan || ''}</div></div>`;
    case 'aktivitas':
      return `<div class="kotak-aktivitas"><div class="emoji">🙌</div><p>${blok.teks}</p></div>`;
    case 'tabel':
      return `<table class="tabel-materi">
        <thead><tr>${blok.kolom.map(k => `<th>${k}</th>`).join('')}</tr></thead>
        <tbody>${blok.baris.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    default:
      return '';
  }
}

function renderKuisRefleksi(kuis) {
  if (!kuis || kuis.length === 0) return '';
  return `
    <div class="kuis-refleksi-box">
      <h3>📝 Kuis Refleksi</h3>
      <p class="catatan">Kuis ini hanya untuk refleksi mandiri, bukan penilaian. Pilih jawabanmu untuk melihat kunci jawabannya!</p>
      ${kuis.map((s, i) => `
        <div class="soal-refleksi">
          <p>${i + 1}. ${s.soal}</p>
          <div class="opsi-refleksi" data-jawaban="${s.jawaban}">
            ${s.pilihan.map((p, j) => `
              <label onclick="cekJawabanRefleksi(this, ${j})">
                <input type="radio" name="refleksi-${i}"> ${String.fromCharCode(97 + j)}. ${p}
              </label>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function cekJawabanRefleksi(labelEl, indexDipilih) {
  const wadah = labelEl.closest('.opsi-refleksi');
  const jawabanBenar = parseInt(wadah.dataset.jawaban, 10);
  wadah.querySelectorAll('label').forEach((l, idx) => {
    l.classList.remove('benar', 'salah');
    if (idx === jawabanBenar) l.classList.add('benar');
    else if (idx === indexDipilih) l.classList.add('salah');
  });
}

function renderKolomRefleksi() {
  return `
    <div class="kolom-refleksi-box">
      <h3>💭 Kolom Refleksi</h3>
      <p class="catatan-refleksi">Ceritakan apa yang sudah kamu pelajari dari bab ini, atau bagian mana yang masih terasa sulit.</p>
      <textarea id="isi-refleksi" class="textarea-refleksi" rows="4" placeholder="Tulis refleksimu di sini..."></textarea>
      <div class="pesan-sukses-refleksi" id="pesan-sukses-refleksi">Refleksimu berhasil dikirim ke gurumu. Terima kasih! 🎉</div>
      <button class="btn btn-oren" id="btn-kirim-refleksi">Kirim Refleksi 📩</button>
    </div>
  `;
}

function pasangHandlerRefleksi(bab) {
  const btn = document.getElementById('btn-kirim-refleksi');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const isi = document.getElementById('isi-refleksi').value.trim();
    if (!isi) {
      alert('Tulis dulu refleksimu sebelum dikirim ya.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    const payload = {
      jenis: 'refleksi',
      nama: sesiDetail.nama,
      kelas: sesiDetail.kelas,
      babId: bab.id,
      babJudul: bab.judul,
      isiRefleksi: isi,
      waktu: new Date().toISOString()
    };

    try {
      await fetch(KOKA_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Gagal mengirim refleksi ke server.', err);
    }

    document.getElementById('pesan-sukses-refleksi').style.display = 'block';
    btn.textContent = 'Terkirim ✔';
  });
}

async function muatDetail() {
  const params = new URLSearchParams(window.location.search);
  const idBab = params.get('bab');
  const data = await KOKA.ambilJSON(`materi-kelas${sesiDetail.kelas}.json`);
  const bab = data.bab.find(b => b.id === idBab);
  const wadah = document.getElementById('isi-materi');

  if (!bab) {
    wadah.innerHTML = `<div class="bab-kosong"><div class="emoji-besar">❓</div><p>Bab tidak ditemukan.</p></div>`;
    return;
  }

  document.getElementById('judul-topbar-bab').textContent = `Bab ${bab.nomor}`;

  if (!bab.aktif || bab.konten.length === 0) {
    wadah.innerHTML = `
      <div class="bab-kosong">
        <div class="emoji-besar">🔒</div>
        <h3>${bab.judul}</h3>
        <p>Materi bab ini akan segera hadir. Nantikan ya!</p>
      </div>`;
    return;
  }

  wadah.innerHTML = `
    <h2 style="text-align:center;margin-bottom:22px;">Bab ${bab.nomor} — ${bab.judul}</h2>
    ${bab.konten.map(renderBlok).join('')}
    ${renderKuisRefleksi(bab.kuisRefleksi)}
    ${renderKolomRefleksi()}
    <div class="tombol-selesai-bab">
      <button class="btn btn-oren" id="btn-selesai-bab">Tandai Sudah Dibaca ✔</button>
    </div>
  `;

  pasangHandlerRefleksi(bab);

  const progres = KOKA.ambilProgres();
  const sudahSelesai = progres.materiSelesai.includes(bab.id);
  const btn = document.getElementById('btn-selesai-bab');
  if (sudahSelesai) {
    btn.textContent = 'Sudah Dibaca ✔';
    btn.disabled = true;
  }
  btn.addEventListener('click', () => {
    KOKA.tandaiMateriSelesai(bab.id);
    btn.textContent = 'Sudah Dibaca ✔';
    btn.disabled = true;
  });
}

muatDetail();
