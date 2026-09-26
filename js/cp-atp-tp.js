KOKA.wajibLogin();

let dataCPGlobal = null;
let kelasAktif = KOKA.ambilSesi()?.kelas === '6' ? '6' : '5';

async function muat() {
  if (!dataCPGlobal) dataCPGlobal = await KOKA.ambilJSON('cp-atp-tp.json');
  const dataCP = dataCPGlobal;

  const kunci = kelasAktif === '5' ? 'kelas5' : 'kelas6';
  const dataKelas = dataCP[kunci];

  const wadah = document.getElementById('daftar-bab-tp');
  wadah.innerHTML = `
    <table class="tabel-atp-tp">
      <thead>
        <tr>
          <th class="kolom-no">No</th>
          <th class="kolom-elemen">Elemen</th>
          <th class="kolom-cp">CP</th>
          <th class="kolom-materi">Materi</th>
          <th class="kolom-tp">TP</th>
          <th class="kolom-atp">ATP</th>
        </tr>
      </thead>
      <tbody>
        ${dataKelas.baris.map((baris, i) => {
          const cpTeks = dataCP.cpUmum.find(c => c.elemen === baris.elemen)?.cp || '';
          return `
          <tr>
            <td class="kolom-no">${i + 1}</td>
            <td class="kolom-elemen">${baris.elemen}</td>
            <td class="kolom-cp">${cpTeks}</td>
            <td class="kolom-materi">${baris.materi}</td>
            <td class="kolom-tp"><ul class="list-tp-tabel">${baris.tp.map(t => `<li>${t}</li>`).join('')}</ul></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

document.getElementById('tab5').addEventListener('click', () => setTab('5'));
document.getElementById('tab6').addEventListener('click', () => setTab('6'));

function setTab(kelas) {
  kelasAktif = kelas;
  document.getElementById('tab5').classList.toggle('aktif', kelas === '5');
  document.getElementById('tab6').classList.toggle('aktif', kelas === '6');
  muat();
}

muat();
