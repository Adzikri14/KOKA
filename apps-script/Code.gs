/**
 * KOKA — Code.gs
 * Google Apps Script untuk menerima data dari web KOKA dan menyimpannya
 * ke Google Sheets (dan Google Drive khusus untuk file proyek).
 *
 * Menangani 3 jenis pengiriman:
 * 1. Hasil Asesmen Sumatif  -> dicatat di sheet "Hasil"
 * 2. Pengumpulan Proyek     -> dicatat di sheet "Proyek"
 *    - Jika siswa memilih "link", link langsung dicatat.
 *    - Jika siswa memilih "upload file", file (dikirim sebagai Base64)
 *      disimpan ke folder Google Drive, lalu link Drive-nya dicatat.
 * 3. Kolom Refleksi materi -> dicatat di sheet "Refleksi"
 *
 * CARA PAKAI:
 * 1. Buat Google Spreadsheet baru, beri nama misalnya "Data KOKA".
 *    Tidak perlu membuat sheet manual — sheet "Hasil", "Proyek", dan "Refleksi"
 *    akan dibuat otomatis oleh skrip ini saat data pertama masuk.
 * 2. Buka Extensions > Apps Script pada spreadsheet tersebut.
 * 3. Hapus isi Code.gs bawaan, tempel seluruh isi file ini.
 * 4. Ganti nilai SHEET_ID di bawah dengan ID spreadsheet Anda
 *    (lihat di URL spreadsheet: https://docs.google.com/spreadsheets/d/SHEET_ID/edit)
 * 5. (Opsional, hanya jika ingin siswa bisa upload file proyek)
 *    Buat folder baru di Google Drive khusus untuk menyimpan file proyek,
 *    lalu salin ID folder tersebut (lihat di URL folder) ke DRIVE_FOLDER_ID.
 * 6. Klik Deploy > New deployment > pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Salin URL Web App yang muncul, lalu tempel ke KOKA_CONFIG.APPS_SCRIPT_URL
 *    pada file js/config.js di proyek KOKA.
 */

const SHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
const DRIVE_FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE_ANDA"; // hanya dipakai untuk upload file proyek

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.jenis === 'proyek') {
      return simpanProyek(data);
    }
    if (data.jenis === 'refleksi') {
      return simpanRefleksi(data);
    }
    return simpanHasilSumatif(data);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", pesan: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function simpanHasilSumatif(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Hasil");

  if (!sheet) {
    sheet = ss.insertSheet("Hasil");
    sheet.appendRow([
      "Waktu", "Nama", "Kelas", "No Presensi", "Bab", "Token", "Paket",
      "Nilai", "Poin Didapat", "Total Poin", "Jumlah Soal"
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.nama || "",
    data.kelas || "",
    data.presensi || "",
    data.babJudul || data.babId || "",
    data.token || "",
    data.paket || "",
    data.nilai !== undefined ? data.nilai : "",
    data.poinDidapat !== undefined ? data.poinDidapat : "",
    data.totalPoin !== undefined ? data.totalPoin : "",
    data.jumlahSoal !== undefined ? data.jumlahSoal : ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function simpanProyek(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Proyek");

  if (!sheet) {
    sheet = ss.insertSheet("Proyek");
    sheet.appendRow([
      "Waktu", "Nama", "Kelas", "No Presensi", "Judul Proyek", "Metode", "Link / File"
    ]);
  }

  let tautanAkhir = data.link || "";

  // Jika siswa upload file, simpan ke Google Drive lalu ambil link-nya
  if (data.metode === 'file' && data.fileBase64) {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const bytes = Utilities.base64Decode(data.fileBase64);
    const namaFile = `${data.nama}_${data.judulProyek}_${new Date().getTime()}`;
    const blob = Utilities.newBlob(bytes, data.fileMime || 'application/octet-stream', namaFile);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    tautanAkhir = file.getUrl();
  }

  sheet.appendRow([
    new Date(),
    data.nama || "",
    data.kelas || "",
    data.presensi || "",
    data.judulProyek || "",
    data.metode || "",
    tautanAkhir
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", link: tautanAkhir }))
    .setMimeType(ContentService.MimeType.JSON);
}

function simpanRefleksi(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("Refleksi");

  if (!sheet) {
    sheet = ss.insertSheet("Refleksi");
    sheet.appendRow([
      "Waktu", "Nama", "Kelas", "Bab", "Isi Refleksi"
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.nama || "",
    data.kelas || "",
    data.babJudul || data.babId || "",
    data.isiRefleksi || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Fungsi uji coba manual dari editor Apps Script (opsional) */
function ujiCobaKirimSumatif() {
  const contohEvent = {
    postData: {
      contents: JSON.stringify({
        nama: "Contoh Siswa", kelas: "5", presensi: "12",
        token: "KOKA5B1A", babId: "k5-b1", babJudul: "Bab 1 — Berpikir Komputasional dalam Kehidupan Sehari-hari",
        paket: "A", nilai: 80, poinDidapat: 8, totalPoin: 10, jumlahSoal: 5
      })
    }
  };
  Logger.log(doPost(contohEvent).getContent());
}

function ujiCobaKirimProyekLink() {
  const contohEvent = {
    postData: {
      contents: JSON.stringify({
        jenis: "proyek", nama: "Contoh Siswa", kelas: "5", presensi: "12",
        judulProyek: "Animasi Kucing Berlari", metode: "link",
        link: "https://scratch.mit.edu/projects/000000"
      })
    }
  };
  Logger.log(doPost(contohEvent).getContent());
}
