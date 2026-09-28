document.getElementById('form-login').addEventListener('submit', function (e) {
  e.preventDefault();
  const nama = document.getElementById('nama').value.trim();
  const kelas = document.getElementById('kelas').value;

  if (!nama || !kelas) return;

  KOKA.simpanSesi(nama, kelas);
  window.location.href = 'html/dashboard.html';
});
