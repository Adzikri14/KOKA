KOKA.wajibLogin();

const hasilSumatif = JSON.parse(sessionStorage.getItem('koka_sumatif_hasil') || 'null');

if (!hasilSumatif) {
  window.location.href = 'dashboard.html';
} else {
  document.getElementById('nama-hasil-selesai').textContent = `${hasilSumatif.nama} — Kelas ${hasilSumatif.kelas}`;
  document.getElementById('nilai-akhir-selesai').textContent = hasilSumatif.nilai;
  document.getElementById('jumlah-soal-selesai').textContent = hasilSumatif.jumlahSoal;
  document.getElementById('poin-selesai').textContent = `${hasilSumatif.poinDidapat} / ${hasilSumatif.totalPoin}`;
  document.getElementById('paket-selesai').textContent = hasilSumatif.paket === 'A' ? 'Paket A' : 'Paket B';
}
