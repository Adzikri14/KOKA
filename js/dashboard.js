const sesi = KOKA.wajibLogin();

if (sesi) {
  document.getElementById('nama-siswa').textContent = sesi.nama;
  document.getElementById('kelas-siswa').textContent = sesi.kelas;
}

document.getElementById('btn-keluar').addEventListener('click', () => {
  if (confirm('Yakin ingin keluar dari KOKA?')) {
    KOKA.keluar();
  }
});
