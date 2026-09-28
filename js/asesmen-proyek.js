/* ==========================================================================
   KOKA — asesmen-proyek.js
   Siswa dapat mengumpulkan proyek berupa LINK atau FILE (gambar/dokumen).
   Jika berupa file, file dikirim sebagai Base64 ke Google Apps Script, yang
   akan menyimpannya ke Google Drive lalu mencatat link Drive-nya ke
   Google Sheets. Jika berupa link, link tersebut langsung dicatat ke Sheets.
   ========================================================================== */

const sesiProyek = KOKA.wajibLogin();

let metodeAktif = 'link';
let fileTerpilihBase64 = null;
let fileTerpilihNama = '';
let fileTerpilihMime = '';

document.getElementById('p-kelas').value = sesiProyek.kelas;
document.getElementById('p-nama').value = sesiProyek.nama;

const BATAS_UKURAN_FILE = 5 * 1024 * 1024; // 5MB

document.getElementById('btn-metode-link').addEventListener('click', () => setMetode('link'));
document.getElementById('btn-metode-file').addEventListener('click', () => setMetode('file'));

function setMetode(metode) {
  metodeAktif = metode;
  document.getElementById('btn-metode-link').classList.toggle('aktif', metode === 'link');
  document.getElementById('btn-metode-file').classList.toggle('aktif', metode === 'file');
  document.getElementById('wadah-input-link').style.display = metode === 'link' ? 'block' : 'none';
  document.getElementById('wadah-input-file').style.display = metode === 'file' ? 'block' : 'none';
}

document.getElementById('p-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > BATAS_UKURAN_FILE) {
    alert('Ukuran file maksimal 5MB. Silakan pilih file yang lebih kecil.');
    e.target.value = '';
    return;
  }

  fileTerpilihNama = file.name;
  fileTerpilihMime = file.type;
  document.getElementById('nama-file-terpilih').textContent = `📄 ${file.name}`;

  const reader = new FileReader();
  reader.onload = () => {
    fileTerpilihBase64 = reader.result.split(',')[1];
  };
  reader.readAsDataURL(file);
});

document.getElementById('form-proyek').addEventListener('submit', async function (e) {
  e.preventDefault();

  const presensi = document.getElementById('p-presensi').value.trim();
  const judul = document.getElementById('p-judul').value.trim();
  const link = document.getElementById('p-link').value.trim();
  const btnKirim = document.getElementById('btn-kirim-proyek');

  if (!judul) {
    alert('Silakan tulis judul proyekmu terlebih dahulu.');
    return;
  }
  if (metodeAktif === 'link' && !link) {
    alert('Silakan isi link proyekmu terlebih dahulu.');
    return;
  }
  if (metodeAktif === 'file' && !fileTerpilihBase64) {
    alert('Silakan pilih file proyekmu terlebih dahulu.');
    return;
  }

  const payload = {
    jenis: 'proyek',
    nama: sesiProyek.nama,
    kelas: sesiProyek.kelas,
    presensi,
    judulProyek: judul,
    metode: metodeAktif,
    link: metodeAktif === 'link' ? link : '',
    fileNama: metodeAktif === 'file' ? fileTerpilihNama : '',
    fileMime: metodeAktif === 'file' ? fileTerpilihMime : '',
    fileBase64: metodeAktif === 'file' ? fileTerpilihBase64 : '',
    waktuKumpul: new Date().toISOString()
  };

  btnKirim.disabled = true;
  btnKirim.textContent = 'Mengirim...';

  try {
    await fetch(KOKA_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Gagal mengirim proyek ke server.', err);
  }

  document.getElementById('pesan-sukses').style.display = 'block';
  btnKirim.textContent = 'Terkirim ✔';
  document.getElementById('form-proyek').reset();
  document.getElementById('p-kelas').value = sesiProyek.kelas;
  document.getElementById('p-nama').value = sesiProyek.nama;
  document.getElementById('nama-file-terpilih').textContent = '';
  fileTerpilihBase64 = null;

  setTimeout(() => {
    btnKirim.disabled = false;
    btnKirim.textContent = 'Kumpulkan Proyek 🚀';
  }, 2500);

  window.scrollTo({ top: 0, behavior: 'smooth' });
});
