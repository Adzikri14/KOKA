/* ==========================================================================
   KOKA — audio.js
   Audio latar belakang bervolume rendah untuk halaman belajar (dashboard,
   materi, petunjuk, CP/TP/ATP, game). File ini SENGAJA TIDAK disertakan di
   halaman-halaman Asesmen, sehingga musik otomatis berhenti begitu siswa
   membuka Sumatif / Pengumpulan Proyek (berpindah halaman = audio berhenti).

   Ganti file audio di: assets/audio/latar-belakang.mp3
   ========================================================================== */

const KOKA_AUDIO = {
  KEY: 'koka_audio_on',
  KEY_POSISI: 'koka_audio_posisi',

  init() {
    const aktif = localStorage.getItem(this.KEY) !== 'off'; // default: menyala

    const audio = document.createElement('audio');
    audio.id = 'audio-latar-koka';
    audio.loop = true;
    audio.volume = 0.18;
    audio.src = KOKA.pathAsset('audio/latar-belakang.mp3');
    document.body.appendChild(audio);
    this.audio = audio;

    // Lanjutkan dari posisi terakhir (bukan dari awal) saat pindah halaman
    const posisiTersimpan = parseFloat(sessionStorage.getItem(this.KEY_POSISI));
    audio.addEventListener('loadedmetadata', () => {
      if (!isNaN(posisiTersimpan) && posisiTersimpan < audio.duration) {
        audio.currentTime = posisiTersimpan;
      }
    });

    // Simpan posisi secara berkala & sebelum pindah/tutup halaman
    audio.addEventListener('timeupdate', () => {
      sessionStorage.setItem(this.KEY_POSISI, audio.currentTime);
    });
    window.addEventListener('pagehide', () => {
      sessionStorage.setItem(this.KEY_POSISI, audio.currentTime);
    });

    const tombol = document.createElement('button');
    tombol.id = 'tombol-audio-koka';
    tombol.className = 'tombol-audio-mengambang';
    tombol.setAttribute('aria-label', 'Aktifkan/matikan musik latar');
    tombol.textContent = aktif ? '🔊' : '🔇';
    tombol.addEventListener('click', () => this.toggle());
    document.body.appendChild(tombol);
    this.tombol = tombol;

    if (aktif) this.cobaPutar();
  },

  cobaPutar() {
    const janji = this.audio.play();
    if (janji && janji.catch) {
      janji.catch(() => {
        // Browser memblokir autoplay sebelum ada interaksi pengguna.
        // Coba putar lagi begitu pengguna melakukan klik pertama di halaman.
        const coba = () => {
          this.audio.play().catch(() => {});
          document.removeEventListener('click', coba);
        };
        document.addEventListener('click', coba, { once: true });
      });
    }
  },

  toggle() {
    if (this.audio.paused) {
      this.cobaPutar();
      localStorage.setItem(this.KEY, 'on');
      this.tombol.textContent = '🔊';
    } else {
      this.audio.pause();
      localStorage.setItem(this.KEY, 'off');
      this.tombol.textContent = '🔇';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => KOKA_AUDIO.init());
