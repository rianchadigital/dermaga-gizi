/**
 * Raw Content of Code.gs for Google Apps Script deployment
 * Automatically exported for one-click copy and download in the application
 */

export const FULL_CODE_GS = `/**
 * =========================================================================================
 * DERMAGA GIZI - GOOGLE APPS SCRIPT BACKEND & WHATSAPP API (Code.gs)
 * Puskesmas Kepulauan Seribu Selatan - Provinsi DKI Jakarta
 * =========================================================================================
 * 
 * FITUR UTAMA:
 * 1. setupDatabase() / initializeDatabase() : Pembuatan seluruh sheet, kolom header, 
 *    dan data master awal (Kelurahan, Posyandu, Lintas Sektor, Pengguna) secara OTOMATIS.
 * 2. API WhatsApp Gateway : Pengiriman notifikasi otomatis langsung ke nomor WhatsApp
 *    para pimpinan & anggota lintas sektor (Lurah, Camat, TP PKK, TPK, Puskesmas, Kader).
 *    Mendukung Fonnte, Wablas, dan Webhook kustom dengan normalisasi nomor internasional (628...).
 * 3. Notifikasi Otomatis : Trigger pengiriman WhatsApp saat kader/petugas menginput temuan
 *    balita stunting, gizi kurang, wasting, atau saat lintas sektor melakukan tindak lanjut.
 * 4. Web App API (doGet & doPost) : Sinkronisasi data dua arah dengan frontend React.
 * 5. Menu Kustom Spreadsheet : Menu "⛵ DERMAGA GIZI" langsung di menu bar Google Spreadsheet.
 * 
 * CARA PEMASANGAN DI GOOGLE SPREADSHEET:
 * 1. Buka Google Spreadsheet baru di https://sheets.new (atau gunakan spreadsheet yang sudah ada).
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus seluruh kode bawaan yang ada di editor, lalu TEMPEL SELURUH KODE FILE INI.
 * 4. Klik tombol Simpan (ikon disket / Ctrl+S).
 * 5. Pilih fungsi 'setupDatabase' dari dropdown fungsi di bagian atas editor, lalu klik "Jalankan" (Run).
 *    -> Berikan izin akses Google (Review Permissions > Pilih Akun > Advanced > Go to Untitled (unsafe) > Allow).
 *    -> Seluruh sheet (13 sheet) beserta header dan data master akan dibuat otomatis!
 * 6. Untuk mengaktifkan Web App:
 *    - Klik tombol "Terapkan" (Deploy) di sudut kanan atas > "Penerapan baru" (New deployment).
 *    - Pilih jenis: "Aplikasi web" (Web app).
 *    - Konfigurasi:
 *        * Deskripsi: "DERMAGA GIZI Production v2.0"
 *        * Jalankan sebagai (Execute as): "Saya" (Me - akun Google Anda)
 *        * Yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> WAJIB agar web app bisa terhubung!
 *    - Klik "Terapkan" (Deploy).
 *    - Salin "URL Aplikasi Web" (berakhiran /exec).
 *    - Masukkan URL tersebut ke aplikasi DERMAGA GIZI di menu "Pengaturan Sistem" > "Integrasi Google Spreadsheet".
 * =========================================================================================
 */

// ==========================================
// KONSTANTA NAMA SHEET DATABASE
// ==========================================
var SHEETS = {
  USERS: 'USERS',
  PULAU: 'PULAU',
  MASTER_KELURAHAN: 'MASTER_KELURAHAN',
  MASTER_POSYANDU: 'MASTER_POSYANDU',
  MASTER_LINTAS_SEKTOR: 'MASTER_LINTAS_SEKTOR',
  SASARAN: 'SASARAN',
  PEMANTAUAN: 'PEMANTAUAN',
  LAPORAN_POSYANDU: 'LAPORAN_POSYANDU',
  TINDAK_LANJUT: 'TINDAK_LANJUT',
  KENDALA: 'KENDALA',
  LINTAS_SEKTOR: 'LINTAS_SEKTOR',
  RIWAYAT_AKTIVITAS: 'RIWAYAT_AKTIVITAS',
  KONFIGURASI: 'KONFIGURASI'
};

// ==========================================
// STRUKTUR HEADER KOLOM BAKU
// ==========================================
var HEADERS = {
  USERS: [
    'user_id', 'email', 'nama', 'no_wa', 'role', 'unit', 'pulau_id', 'status_aktif', 'created_at', 'updated_at'
  ],
  PULAU: [
    'pulau_id', 'nama_pulau', 'unit_pelayanan', 'latitude', 'longitude', 'status_akses', 'keterangan', 'status_aktif'
  ],
  MASTER_KELURAHAN: [
    'kelurahan_id', 'nama_kelurahan', 'kecamatan', 'daftar_pulau', 'lurah_nama', 'no_wa_lurah', 'jumlah_rw', 'jumlah_rt', 'total_sasaran_balita'
  ],
  MASTER_POSYANDU: [
    'posyandu_id', 'nama_posyandu', 'kelurahan_id', 'kelurahan_nama', 'pulau_id', 'pulau_nama', 'rw', 'rt', 'lokasi_alamat', 'ketua_kader', 'no_wa_kader', 'jumlah_kader', 'jadwal_hari', 'total_sasaran', 'status_aktif'
  ],
  MASTER_LINTAS_SEKTOR: [
    'user_id', 'nama', 'jabatan', 'instansi_sektor', 'kelurahan_id', 'kelurahan_nama', 'no_wa', 'email', 'status_notifikasi_wa', 'status_aktif'
  ],
  SASARAN: [
    'sasaran_id', 'kode_sasaran', 'inisial', 'tanggal_lahir', 'jenis_kelamin', 'pulau_id', 'unit_pelayanan', 'tanggal_registrasi', 'status_aktif', 'kategori_masalah_terakhir', 'bb_terakhir', 'tb_terakhir', 'tanggal_pantau_terakhir'
  ],
  PEMANTAUAN: [
    'pemantauan_id', 'sasaran_id', 'tanggal_pemantauan', 'petugas_id', 'indikator_terukur', 'kategori_masalah', 'hasil_pemeriksaan', 'catatan_terbatas', 'periode', 'created_at'
  ],
  LAPORAN_POSYANDU: [
    'laporan_id', 'tanggal_pelaksanaan', 'bulan', 'tahun', 'kelurahan_id', 'kelurahan_nama', 'posyandu_id', 'posyandu_nama', 'petugas_pelapor', 'no_wa_petugas', 'total_sasaran', 'total_ditimbang', 'total_tidak_hadir', 'persentase_d_s', 'keterangan_sweeping', 'jumlah_balita_kurang_gizi', 'status_notifikasi_wa', 'created_at', 'created_by'
  ],
  TINDAK_LANJUT: [
    'tindak_lanjut_id', 'sasaran_id', 'pemantauan_id', 'kategori', 'rencana_intervensi', 'tanggal_rencana', 'tenggat', 'petugas_id', 'status', 'prioritas', 'tanggal_selesai', 'catatan', 'is_from_posyandu', 'posyandu_nama', 'kelurahan_nama', 'tindak_lanjut_lintas_sektor_json', 'created_at', 'updated_at'
  ],
  KENDALA: [
    'kendala_id', 'tanggal_kejadian', 'pulau_id', 'kategori', 'deskripsi', 'dampak', 'rencana_penyelesaian', 'penanggung_jawab', 'tenggat', 'status', 'sasaran_terkait_kode', 'catatan_tindak_lanjut', 'created_at', 'updated_at'
  ],
  LINTAS_SEKTOR: [
    'kegiatan_id', 'tanggal_kesepakatan', 'nama_kegiatan', 'pulau_id', 'mitra', 'penanggung_jawab', 'tenggat', 'indikator', 'target', 'realisasi', 'progres', 'status', 'catatan', 'terakhir_evaluasi', 'updated_at'
  ],
  RIWAYAT_AKTIVITAS: [
    'log_id', 'waktu', 'user_id', 'user_name', 'aksi', 'jenis_data', 'record_id', 'ringkasan_perubahan', 'status'
  ],
  KONFIGURASI: [
    'key', 'value', 'deskripsi', 'updated_at'
  ]
};

// =========================================================================================
// MENU SPREADSHEET (Muncul otomatis saat spreadsheet dibuka)
// =========================================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⛵ DERMAGA GIZI')
    .addItem('🚀 Setup Database Otomatis (setupDatabase)', 'setupDatabase')
    .addSeparator()
    .addItem('📱 Tes Koneksi WhatsApp API', 'menuTestWhatsApp')
    .addItem('👥 Kirim Notifikasi Tes ke Lintas Sektor', 'menuBroadcastTestWhatsApp')
    .addSeparator()
    .addItem('📋 Cek Status Database & Jumlah Data', 'menuCheckStatus')
    .addItem('ℹ️ Panduan Konfigurasi WhatsApp Gateway', 'menuShowGuide')
    .addToUi();
}

/**
 * =========================================================================================
 * 1. SETUP DATABASE OTOMATIS (setupDatabase / initializeDatabase)
 * =========================================================================================
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = [];

  for (var key in HEADERS) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    var cols = HEADERS[key];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(cols);
      formatHeaderRow(sheet, cols.length);
      log.push('✅ Dibuat baru: ' + sheetName);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(cols);
        formatHeaderRow(sheet, cols.length);
        log.push('🔹 Header ditambahkan ke: ' + sheetName);
      } else {
        log.push('✔ Sudah ada: ' + sheetName);
      }
    }
  }

  // Isi data awal standar jika sheet masih kosong
  seedInitialData(ss);

  // Buat sheet default terhapus jika kosong
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() <= 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  var msg = 'Inisialisasi Database DERMAGA GIZI Berhasil!\\n\\n' + log.join('\\n');
  Logger.log(msg);

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Database DERMAGA GIZI siap digunakan!', 'Sukses', 5);
  } catch (e) {}

  return {
    success: true,
    message: 'Setup database DERMAGA GIZI berhasil dijalankan.',
    data: {
      log: log,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetsCount: ss.getSheets().length,
      timestamp: new Date().toISOString()
    }
  };
}

function initializeDatabase() {
  return setupDatabase();
}

function formatHeaderRow(sheet, colCount) {
  var range = sheet.getRange(1, 1, 1, colCount);
  range.setFontWeight('bold');
  range.setBackground('#0f2b48');
  range.setFontColor('#ffffff');
  range.setFontFamily('Arial');
  range.setFontSize(10);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  for (var c = 1; c <= colCount; c++) {
    sheet.setColumnWidth(c, 160);
  }
}

function seedInitialData(ss) {
  // 1. KONFIGURASI
  var configSheet = ss.getSheetByName(SHEETS.KONFIGURASI);
  if (configSheet && configSheet.getLastRow() <= 1) {
    var nowStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    var defaultConfigs = [
      ['APP_NAME', 'DERMAGA GIZI', 'Nama Sistem Terpadu Monitoring Gizi', nowStr],
      ['INSTANSI', 'Puskesmas Kepulauan Seribu Selatan', 'Faskes Penanggung Jawab', nowStr],
      ['WA_GATEWAY_PROVIDER', 'FONNTE', 'Pilihan gateway: FONNTE, WABLAS, atau WEBHOOK', nowStr],
      ['WA_API_TOKEN', 'YOUR_FONNTE_TOKEN_HERE', 'Token API WhatsApp (Dapatkan gratis di https://fonnte.com)', nowStr],
      ['WA_ADMIN_PHONE', '6281299887711', 'Nomor WhatsApp Admin / Koordinator Gizi', nowStr],
      ['WA_NOTIF_AUTO_SEND', 'TRUE', 'Kirim WA otomatis saat ada input kasus gizi (TRUE/FALSE)', nowStr],
      ['WA_WEBHOOK_URL', '', 'URL Webhook khusus jika menggunakan provider sendiri', nowStr],
      ['APP_URL', 'https://dermagagizi.puskesmasseribuselatan.com', 'URL Web Aplikasi Produksi', nowStr],
      ['TIMEZONE', 'Asia/Jakarta', 'Zona Waktu Standar Operasional', nowStr]
    ];
    for (var i = 0; i < defaultConfigs.length; i++) {
      configSheet.appendRow(defaultConfigs[i]);
    }
  }

  // 2. MASTER PULAU
  var pulauSheet = ss.getSheetByName(SHEETS.PULAU);
  if (pulauSheet && pulauSheet.getLastRow() <= 1) {
    var defaultPulau = [
      ['PULAU-01', 'Pulau Tidung', 'Puskesmas Kepulauan Seribu Selatan', -5.8032, 106.5235, 'Mudah', 'Pusat kecamatan dan faskes rujukan tingkat pertama utama wilayah selatan.', true],
      ['PULAU-02', 'Pulau Pari', 'Puskesmas Pembantu Pulau Pari', -5.8564, 106.6198, 'Sedang', 'Akses perahu reguler 40 menit dari dermaga Tidung, pos gizi aktif.', true],
      ['PULAU-03', 'Pulau Lancang', 'Puskesmas Pembantu Pulau Lancang', -5.8902, 106.5898, 'Tergantung Cuaca/Gelombang', 'Transportasi mengandalkan kapal nelayan & perahu dinas keliling.', true],
      ['PULAU-04', 'Pulau Untung Jawa', 'Puskesmas Pembantu Pulau Untung Jawa', -5.9781, 106.7052, 'Mudah', 'Dekat dengan pesisir utara daratan Jakarta/Tangerang, dermaga feri aktif.', true]
    ];
    for (var p = 0; p < defaultPulau.length; p++) {
      pulauSheet.appendRow(defaultPulau[p]);
    }
  }

  // 3. MASTER KELURAHAN
  var kelSheet = ss.getSheetByName(SHEETS.MASTER_KELURAHAN);
  if (kelSheet && kelSheet.getLastRow() <= 1) {
    var defaultKel = [
      ['KEL-01', 'Kelurahan Pulau Tidung', 'Kepulauan Seribu Selatan', 'Pulau Tidung, Pulau Payung', 'Hafisurrahman, S.STP, M.Si', '6281288991122', 4, 16, 210],
      ['KEL-02', 'Kelurahan Pulau Pari', 'Kepulauan Seribu Selatan', 'Pulau Pari, Pulau Lancang', 'M. Adriansyah, S.IP', '6281311554433', 4, 14, 160],
      ['KEL-03', 'Kelurahan Pulau Untung Jawa', 'Kepulauan Seribu Selatan', 'Pulau Untung Jawa', 'Sidik Riyanto, S.AP', '6281988223311', 3, 9, 110]
    ];
    for (var k = 0; k < defaultKel.length; k++) {
      kelSheet.appendRow(defaultKel[k]);
    }
  }

  // 4. MASTER POSYANDU
  var posSheet = ss.getSheetByName(SHEETS.MASTER_POSYANDU);
  if (posSheet && posSheet.getLastRow() <= 1) {
    var defaultPos = [
      ['POS-01', 'Posyandu Melati 1', 'KEL-01', 'Kelurahan Pulau Tidung', 'PULAU-01', 'Pulau Tidung', 'RW 01', 'RT 01 - RT 04', 'Balai Warga RW 01, Jl. Dermaga Timur, Pulau Tidung', 'Ibu Aminah', '6281298765431', 5, 'Senin Minggu ke-1', 55, true],
      ['POS-02', 'Posyandu Melati 2', 'KEL-01', 'Kelurahan Pulau Tidung', 'PULAU-01', 'Pulau Tidung', 'RW 02', 'RT 01 - RT 04', 'RPTRA Tidung Ceria, Pulau Tidung', 'Ibu Rosmalia', '6281298765432', 5, 'Rabu Minggu ke-1', 50, true],
      ['POS-03', 'Posyandu Cempaka 1', 'KEL-01', 'Kelurahan Pulau Tidung', 'PULAU-01', 'Pulau Tidung', 'RW 03', 'RT 01 - RT 04', 'Pos RW 03, Pulau Tidung Barat', 'Ibu Nurjanah', '6281298765433', 5, 'Jumat Minggu ke-1', 52, true],
      ['POS-04', 'Posyandu Cempaka 2', 'KEL-01', 'Kelurahan Pulau Tidung', 'PULAU-01', 'Pulau Tidung', 'RW 04', 'RT 01 - RT 04', 'Gedung Serbaguna Pulau Payung / Tidung', 'Ibu Rusmini', '6281298765434', 4, 'Selasa Minggu ke-2', 53, true],
      ['POS-05', 'Posyandu Flamboyan 1', 'KEL-02', 'Kelurahan Pulau Pari', 'PULAU-02', 'Pulau Pari', 'RW 01', 'RT 01 - RT 03', 'Kantor Kelurahan Pulau Pari / Pos RW 01', 'Ibu Rohani', '6285712345678', 5, 'Senin Minggu ke-2', 45, true],
      ['POS-06', 'Posyandu Flamboyan 2', 'KEL-02', 'Kelurahan Pulau Pari', 'PULAU-02', 'Pulau Pari', 'RW 02', 'RT 01 - RT 04', 'RPTRA Pasir Perawan, Pulau Pari', 'Ibu Supartini', '6285712345679', 5, 'Rabu Minggu ke-2', 40, true],
      ['POS-07', 'Posyandu Mawar', 'KEL-02', 'Kelurahan Pulau Pari', 'PULAU-03', 'Pulau Lancang', 'RW 03', 'RT 01 - RT 06', 'Gedung Pustu & Pos Gizi Pulau Lancang', 'Ibu Maryanah', '6287811998877', 6, 'Kamis Minggu ke-3', 75, true],
      ['POS-08', 'Posyandu Anggrek', 'KEL-03', 'Kelurahan Pulau Untung Jawa', 'PULAU-04', 'Pulau Untung Jawa', 'RW 01', 'RT 01 - RT 05', 'Gedung Sasana Budaya RW 01, Untung Jawa', 'Ibu Siti Aisyah', '6281299884433', 5, 'Senin Minggu ke-3', 58, true],
      ['POS-09', 'Posyandu Kenanga', 'KEL-03', 'Kelurahan Pulau Untung Jawa', 'PULAU-04', 'Pulau Untung Jawa', 'RW 02 & RW 03', 'RT 01 - RT 04', 'Pos Pelayanan Terpadu RW 02, Untung Jawa', 'Ibu Fatimah Zahra', '6281377889900', 5, 'Rabu Minggu ke-3', 52, true]
    ];
    for (var po = 0; po < defaultPos.length; po++) {
      posSheet.appendRow(defaultPos[po]);
    }
  }

  // 5. MASTER LINTAS SEKTOR
  var lsUserSheet = ss.getSheetByName(SHEETS.MASTER_LINTAS_SEKTOR);
  if (lsUserSheet && lsUserSheet.getLastRow() <= 1) {
    var defaultLs = [
      ['ULS-001', 'Hafisurrahman, S.STP, M.Si', 'Lurah Pulau Tidung', 'Kelurahan Pulau Tidung', 'KEL-01', 'Kelurahan Pulau Tidung', '6281288991122', 'lurah.tidung@seribu.jakarta.go.id', true, true],
      ['ULS-002', 'M. Adriansyah, S.IP', 'Lurah Pulau Pari', 'Kelurahan Pulau Pari', 'KEL-02', 'Kelurahan Pulau Pari', '6281311554433', 'lurah.pari@seribu.jakarta.go.id', true, true],
      ['ULS-003', 'Sidik Riyanto, S.AP', 'Lurah Pulau Untung Jawa', 'Kelurahan Pulau Untung Jawa', 'KEL-03', 'Kelurahan Pulau Untung Jawa', '6281988223311', 'lurah.untungjawa@seribu.jakarta.go.id', true, true],
      ['ULS-004', 'Drs. H. Ismail Mustofa, M.Si', 'Camat Kepulauan Seribu Selatan', 'Kecamatan Kepulauan Seribu Selatan', 'ALL', 'Kecamatan Kepulauan Seribu Selatan', '6281177665544', 'camat.seribuselatan@seribu.jakarta.go.id', true, true],
      ['ULS-005', 'Hj. Endang Rahmawati', 'Ketua TP PKK Kecamatan', 'TP PKK Kepulauan Seribu Selatan', 'ALL', 'Semua Kelurahan', '6281299332211', 'pkk.seribuselatan@gmail.com', true, true],
      ['ULS-006', 'Ibu Hj. Marlina', 'Ketua TP PKK Kelurahan', 'TP PKK Kelurahan Pulau Tidung', 'KEL-01', 'Kelurahan Pulau Tidung', '6281344556677', 'pkk.tidung@gmail.com', true, true],
      ['ULS-007', 'Nurul Hidayati, S.Gz, RD', 'Koordinator Tenaga Gizi', 'Puskesmas Kepulauan Seribu Selatan', 'ALL', 'Puskesmas Kecamatan', '6281311223344', 'nutrisionis.selatan@seribu.jakarta.go.id', true, true],
      ['ULS-008', 'dr. Farah Anggraini, M.K.M.', 'Kepala Puskesmas', 'Puskesmas Kepulauan Seribu Selatan', 'ALL', 'Puskesmas Kecamatan', '6281188223344', 'kapus.seribuselatan@dinkes.jakarta.go.id', true, true],
      ['ULS-009', 'Ahmad Syafi\\'i, S.IP', 'Kasi Kesejahteraan Rakyat', 'Kelurahan Pulau Tidung', 'KEL-01', 'Kelurahan Pulau Tidung', '6281900112233', 'kesra.tidung@seribu.jakarta.go.id', true, true],
      ['ULS-010', 'Bdn. Siti Rohmah, S.Tr.Keb', 'Bidan Penanggung Jawab Pustu', 'Puskesmas Pembantu Pulau Untung Jawa', 'KEL-03', 'Kelurahan Pulau Untung Jawa', '6281288776655', 'pustu.untungjawa@seribuselatan.jakarta.go.id', true, true],
      ['ULS-011', 'dr. Dimas Surya Nugraha', 'Dokter PJ Pustu Pari', 'Puskesmas Pembantu Pulau Pari', 'KEL-02', 'Kelurahan Pulau Pari', '6285711223355', 'dokter.pari@seribuselatan.jakarta.go.id', true, true],
      ['ULS-012', 'Satpol PP & Dinsos Kecamatan', 'Satuan Tugas Lapangan / Bansos', 'Kecamatan Kepulauan Seribu Selatan', 'ALL', 'Semua Kelurahan', '6281277665544', 'satpol.seribuselatan@jakarta.go.id', true, true]
    ];
    for (var ls = 0; ls < defaultLs.length; ls++) {
      lsUserSheet.appendRow(defaultLs[ls]);
    }
  }

  // 6. USERS SISTEM
  var userSheet = ss.getSheetByName(SHEETS.USERS);
  if (userSheet && userSheet.getLastRow() <= 1) {
    var defaultUsers = [
      ['USR-001', 'admin.gizi@seribuselatan.jakarta.go.id', 'Hafiz Pratama, S.Kom', '6281299887711', 'ADMIN', 'Sistem Informasi & Tata Usaha', 'ALL', true, '01/01/2026', '01/01/2026'],
      ['USR-002', 'kapus.seribuselatan@dinkes.jakarta.go.id', 'dr. Farah Anggraini, M.K.M.', '6281188223344', 'KEPALA_PUSKESMAS', 'Pimpinan Puskesmas Kepulauan Seribu Selatan', 'ALL', true, '01/01/2026', '01/01/2026'],
      ['USR-003', 'nutrisionis.selatan@seribuselatan.jakarta.go.id', 'Nurul Hidayati, S.Gz, RD', '6281311223344', 'TENAGA_GIZI', 'Poli Gizi Puskesmas Kepulauan Seribu Selatan', 'PULAU-01', true, '05/01/2026', '15/01/2026'],
      ['USR-004', 'dokter.pari@seribuselatan.jakarta.go.id', 'dr. Dimas Surya Nugraha', '6285711223355', 'DOKTER_BIDAN_PERAWAT', 'Puskesmas Pembantu Pulau Pari', 'PULAU-02', true, '08/01/2026', '10/01/2026'],
      ['USR-005', 'pustu.untungjawa@seribuselatan.jakarta.go.id', 'Bdn. Siti Rohmah, S.Tr.Keb', '6281288776655', 'PETUGAS_PUSTU', 'Puskesmas Pembantu Pulau Untung Jawa', 'PULAU-04', true, '10/01/2026', '12/01/2026'],
      ['USR-006', 'kader.lancang@posyandu.org', 'Ibu Maryanah (Kader Melati)', '6287811998877', 'KADER', 'Posyandu Melati Pulau Lancang', 'PULAU-03', true, '12/01/2026', '12/01/2026'],
      ['USR-007', 'kesra.tidung@kelurahan.jakarta.go.id', 'Ahmad Syafi\\'i, S.IP (Kasi Kesra)', '6281900112233', 'LINTAS_SEKTOR', 'Seksi Kesra Kelurahan Pulau Tidung', 'PULAU-01', true, '15/01/2026', '15/01/2026']
    ];
    for (var u = 0; u < defaultUsers.length; u++) {
      userSheet.appendRow(defaultUsers[u]);
    }
  }
}

// =========================================================================================
// 2. WHATSAPP API & NOTIFIKASI OTOMATIS
// =========================================================================================

function normalizePhoneNumber(phone) {
  if (!phone) return '';
  var cleaned = String(phone).replace(/\\D/g, '');
  if (cleaned.indexOf('08') === 0) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.indexOf('8') === 0) {
    cleaned = '62' + cleaned;
  } else if (cleaned.indexOf('6208') === 0) {
    cleaned = '628' + cleaned.substring(4);
  }
  return cleaned;
}

function getConfigValue(key, defaultValue) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.KONFIGURASI);
    if (!sheet) return defaultValue;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase() === String(key).toUpperCase()) {
        return data[i][1] || defaultValue;
      }
    }
  } catch (e) {
    Logger.log('Gagal membaca config ' + key + ': ' + e.message);
  }
  return defaultValue;
}

function sendWhatsAppMessage(targetNumber, messageText, customToken) {
  var cleanPhone = normalizePhoneNumber(targetNumber);
  if (!cleanPhone || cleanPhone.length < 9) {
    return { success: false, message: 'Nomor telepon tidak valid: ' + targetNumber };
  }

  var provider = String(getConfigValue('WA_GATEWAY_PROVIDER', 'FONNTE')).toUpperCase();
  var token = customToken || getConfigValue('WA_API_TOKEN', '');
  var webhookUrl = getConfigValue('WA_WEBHOOK_URL', '');

  Logger.log('Mengirim WhatsApp ke ' + cleanPhone + ' via provider: ' + provider);

  if (!token || token === 'YOUR_FONNTE_TOKEN_HERE' || token === 'masukkan_token_fonnte_atau_wablas') {
    var mockMsg = 'Mode Simulasi: Token WA API belum diatur pada sheet KONFIGURASI. Pesan ke ' + cleanPhone + ' berhasil dicatat.';
    logInternalActivity('SYSTEM', 'WA_NOTIF', 'WHATSAPP', cleanPhone, 'Simulasi WA: ' + messageText.substring(0, 80) + '...', 'SUCCESS');
    return {
      success: true,
      simulated: true,
      message: mockMsg,
      phone: cleanPhone
    };
  }

  try {
    var response;
    var resCode = 0;
    var resText = '';

    if (provider === 'FONNTE') {
      var payload = {
        target: cleanPhone,
        message: messageText,
        countryCode: '62'
      };
      var options = {
        method: 'post',
        headers: { 'Authorization': token },
        payload: payload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch('https://api.fonnte.com/send', options);
      resCode = response.getResponseCode();
      resText = response.getContentText();

    } else if (provider === 'WABLAS') {
      var wablasPayload = {
        phone: cleanPhone,
        message: messageText
      };
      var wablasOptions = {
        method: 'post',
        headers: { 'Authorization': token },
        payload: wablasPayload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch('https://kudus.wablas.com/api/send-message', wablasOptions);
      resCode = response.getResponseCode();
      resText = response.getContentText();

    } else if (provider === 'WEBHOOK' && webhookUrl) {
      var customPayload = JSON.stringify({
        phone: cleanPhone,
        message: messageText,
        timestamp: new Date().toISOString()
      });
      var customOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        payload: customPayload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch(webhookUrl, customOptions);
      resCode = response.getResponseCode();
      resText = response.getContentText();
    } else {
      var fallbackPayload = {
        target: cleanPhone,
        message: messageText,
        countryCode: '62'
      };
      var fallbackOptions = {
        method: 'post',
        headers: { 'Authorization': token },
        payload: fallbackPayload,
        muteHttpExceptions: true
      };
      response = UrlFetchApp.fetch('https://api.fonnte.com/send', fallbackOptions);
      resCode = response.getResponseCode();
      resText = response.getContentText();
    }

    var isSuccess = (resCode >= 200 && resCode < 300);
    logInternalActivity('SYSTEM', 'WA_NOTIF', 'WHATSAPP', cleanPhone, 'Kirim WA (' + provider + ' - ' + resCode + ') ke ' + cleanPhone, isSuccess ? 'SUCCESS' : 'FAILED');

    return {
      success: isSuccess,
      statusCode: resCode,
      message: isSuccess ? 'Pesan WhatsApp berhasil dikirim ke ' + cleanPhone : 'Gagal mengirim pesan (Kode HTTP ' + resCode + ')',
      response: resText
    };

  } catch (err) {
    Logger.log('Kesalahan pengiriman WhatsApp: ' + err.message);
    logInternalActivity('SYSTEM', 'WA_NOTIF', 'WHATSAPP', cleanPhone, 'Error WA: ' + err.message, 'FAILED');
    return {
      success: false,
      message: 'Gagal mengirim pesan WhatsApp: ' + err.message
    };
  }
}

function sendBroadcastWhatsApp(phoneArray, messageText) {
  var results = [];
  var successCount = 0;
  var failCount = 0;

  for (var i = 0; i < phoneArray.length; i++) {
    var phone = phoneArray[i];
    var res = sendWhatsAppMessage(phone, messageText);
    if (res.success) {
      successCount++;
    } else {
      failCount++;
    }
    results.push({ phone: phone, result: res });
    Utilities.sleep(300);
  }

  return {
    total: phoneArray.length,
    successCount: successCount,
    failCount: failCount,
    results: results
  };
}

function broadcastGiziAlertToLintasSektor(laporanData, balitaKurangGiziList) {
  if (!balitaKurangGiziList || balitaKurangGiziList.length === 0) {
    return { success: true, count: 0, message: 'Tidak ada kasus gizi bermasalah yang perlu dinotifikasikan.' };
  }

  var autoNotif = String(getConfigValue('WA_NOTIF_AUTO_SEND', 'TRUE')).toUpperCase();
  if (autoNotif !== 'TRUE') {
    return { success: false, message: 'Fitur WA_NOTIF_AUTO_SEND dinonaktifkan di Sheet KONFIGURASI.' };
  }

  var lsList = getTableData(SHEETS.MASTER_LINTAS_SEKTOR);
  var targetKelurahanId = laporanData.kelurahan_id || 'ALL';

  var recipients = lsList.filter(function(u) {
    var isWaActive = (u.status_notifikasi_wa === true || String(u.status_notifikasi_wa).toUpperCase() === 'TRUE');
    var isWilayahMatch = (u.kelurahan_id === 'ALL' || u.kelurahan_id === targetKelurahanId);
    return isWaActive && isWilayahMatch && u.no_wa;
  });

  if (recipients.length === 0) {
    return { success: true, count: 0, message: 'Tidak ditemukan kontak lintas sektor aktif untuk kelurahan ini.' };
  }

  var balitaText = '';
  for (var i = 0; i < balitaKurangGiziList.length; i++) {
    var b = balitaKurangGiziList[i];
    balitaText += (i + 1) + '. *' + (b.nama_balita || b.inisial || 'Balita') + '* (' + (b.jenis_kelamin || '-') + ', ' + (b.usia_bulan || '-') + ' bln)\\n' +
                  '   • BB: ' + (b.berat_badan || '-') + ' kg | TB: ' + (b.tinggi_badan || '-') + ' cm\\n' +
                  '   • Masalah Gizi: *' + (b.status_gizi || b.kategori_masalah || 'Gizi Kurang') + '*\\n' +
                  '   • Rencana Tindak Lanjut: ' + (b.rencana_tindak_lanjut || 'Pendampingan PMT & kunjungan terpadu') + '\\n\\n';
  }

  var phones = recipients.map(function(r) { return r.no_wa; });
  var adminPhone = getConfigValue('WA_ADMIN_PHONE', '');
  if (adminPhone && phones.indexOf(adminPhone) === -1) {
    phones.push(adminPhone);
  }

  var pesan = '🚨 *PERINGATAN DINI KASUS GIZI BALITA - DERMAGA GIZI*\\n' +
              '*PUSKESMAS KEPULAUAN SERIBU SELATAN*\\n\\n' +
              'Pemberitahuan kepada Seluruh Pemangku Kepentingan Lintas Sektor:\\n\\n' +
              '📍 *Posyandu*: ' + (laporanData.posyandu_nama || '-') + '\\n' +
              '🏛️ *Kelurahan*: ' + (laporanData.kelurahan_nama || '-') + '\\n' +
              '📅 *Tanggal Kegiatan*: ' + (laporanData.tanggal_pelaksanaan || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy')) + '\\n' +
              '📊 *Hasil Penimbangan*: ' + (laporanData.total_ditimbang || 0) + ' hadir dari ' + (laporanData.total_sasaran || 0) + ' sasaran\\n\\n' +
              '⚠️ *TEMUAN BALITA MEMBUTUHKAN INTERVENSI LINTAS SEKTOR*:\\n\\n' +
              balitaText +
              'Mohon sinergi dan kolaborasi dari Lurah, Satpol PP, TP-PKK, TPK Stunting, Puskesmas, dan seluruh unit untuk segera menindaklanjuti.\\n\\n' +
              '_Sistem Terpadu DERMAGA GIZI - Puskesmas Kepulauan Seribu Selatan_';

  var broadcastResult = sendBroadcastWhatsApp(phones, pesan);
  return {
    success: true,
    recipientsCount: phones.length,
    broadcastResult: broadcastResult
  };
}

// =========================================================================================
// 3. HANDLER HTTP GET & POST (Web App API Endpoint)
// =========================================================================================

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse(true, 'Koneksi ke backend Google Apps Script aktif dan responsif.', {
        app: 'DERMAGA GIZI',
        instansi: 'Puskesmas Kepulauan Seribu Selatan',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'init' || action === 'setup' || action === 'setupDatabase') {
      var setupResult = setupDatabase();
      return jsonResponse(setupResult.success, setupResult.message, setupResult.data);
    }

    if (action === 'testWA') {
      var testPhone = params.phone || getConfigValue('WA_ADMIN_PHONE', '6281299887711');
      var testMsg = '🔔 *TES KONEKSI WHATSAPP API - DERMAGA GIZI*\\n' +
                    'Puskesmas Kepulauan Seribu Selatan\\n\\n' +
                    'Halo, koneksi WhatsApp Gateway berhasil aktif pada ' + 
                    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB.\\n' +
                    'Sistem siap mengirimkan notifikasi otomatis ke lintas sektor!';
      var waResult = sendWhatsAppMessage(testPhone, testMsg);
      return jsonResponse(waResult.success, waResult.message, waResult);
    }

    if (action === 'getAllData') {
      var allData = {
        pulau: getTableData(SHEETS.PULAU),
        kelurahan: getTableData(SHEETS.MASTER_KELURAHAN),
        posyandu: getTableData(SHEETS.MASTER_POSYANDU),
        lintas_sektor_users: getTableData(SHEETS.MASTER_LINTAS_SEKTOR),
        users: getTableData(SHEETS.USERS),
        sasaran: getTableData(SHEETS.SASARAN),
        pemantauan: getTableData(SHEETS.PEMANTAUAN),
        laporan_posyandu: getTableData(SHEETS.LAPORAN_POSYANDU),
        tindak_lanjut: getTableData(SHEETS.TINDAK_LANJUT),
        kendala: getTableData(SHEETS.KENDALA),
        lintas_sektor: getTableData(SHEETS.LINTAS_SEKTOR),
        konfigurasi: getTableData(SHEETS.KONFIGURASI),
        timestamp: new Date().toISOString()
      };
      return jsonResponse(true, 'Data terpadu Google Spreadsheet berhasil disinkronkan', allData);
    }

    if (action === 'getPulau') return jsonResponse(true, 'Data pulau', getTableData(SHEETS.PULAU));
    if (action === 'getKelurahan') return jsonResponse(true, 'Data kelurahan', getTableData(SHEETS.MASTER_KELURAHAN));
    if (action === 'getPosyandu') return jsonResponse(true, 'Data posyandu', getTableData(SHEETS.MASTER_POSYANDU));
    if (action === 'getUsers') return jsonResponse(true, 'Data pengguna', getTableData(SHEETS.USERS));
    if (action === 'getLintasSektorUsers') return jsonResponse(true, 'Data user lintas sektor', getTableData(SHEETS.MASTER_LINTAS_SEKTOR));
    if (action === 'getSasaran') return jsonResponse(true, 'Data sasaran balita', getTableData(SHEETS.SASARAN));
    if (action === 'getLaporanPosyandu') return jsonResponse(true, 'Data laporan posyandu', getTableData(SHEETS.LAPORAN_POSYANDU));
    if (action === 'getTindakLanjut') return jsonResponse(true, 'Data tindak lanjut', getTableData(SHEETS.TINDAK_LANJUT));
    if (action === 'getKendala') return jsonResponse(true, 'Data kendala', getTableData(SHEETS.KENDALA));
    if (action === 'getLintasSektor') return jsonResponse(true, 'Data lintas sektor', getTableData(SHEETS.LINTAS_SEKTOR));
    if (action === 'getLogs') return jsonResponse(true, 'Data riwayat audit', getTableData(SHEETS.RIWAYAT_AKTIVITAS));
    if (action === 'getConfig') return jsonResponse(true, 'Data konfigurasi', getTableData(SHEETS.KONFIGURASI));

    return jsonResponse(false, 'Aksi GET tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Terjadi kesalahan sistem backend GET: ' + err.message, null);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (pErr) {
        return jsonResponse(false, 'Format JSON request tidak valid', null);
      }
    }

    var action = postData.action || (e && e.parameter ? e.parameter.action : '');
    var data = postData.data || {};
    var currentUser = postData.user || { user_id: 'SYSTEM', nama: 'Petugas Sistem' };

    if (action === 'setupDatabase' || action === 'init') {
      var setupRes = setupDatabase();
      return jsonResponse(setupRes.success, setupRes.message, setupRes.data);
    }

    if (action === 'sendWhatsApp') {
      var target = data.target || data.phone || data.no_wa;
      var message = data.message || data.pesan;
      var waRes = sendWhatsAppMessage(target, message);
      return jsonResponse(waRes.success, waRes.message, waRes);
    }

    if (action === 'createLaporanPosyandu' || action === 'saveLaporanPosyandu') {
      var createdLaporan = handleCreateRecord(SHEETS.LAPORAN_POSYANDU, HEADERS.LAPORAN_POSYANDU, data, 'LAPORAN_POSYANDU', currentUser);
      var balitaList = data.daftar_balita_kurang_gizi || [];
      var notifReport = null;
      if (balitaList.length > 0) {
        notifReport = broadcastGiziAlertToLintasSektor(data, balitaList);
      }

      return jsonResponse(true, 'Laporan Posyandu berhasil disimpan.', {
        laporan: data,
        whatsapp_broadcast: notifReport
      });
    }

    if (action === 'createSasaran') {
      return handleCreateRecord(SHEETS.SASARAN, HEADERS.SASARAN, data, 'SASARAN', currentUser);
    }
    if (action === 'updateSasaran') {
      return handleUpdateRecord(SHEETS.SASARAN, 'sasaran_id', data.sasaran_id, data, 'SASARAN', currentUser);
    }

    if (action === 'createTindakLanjut') {
      return handleCreateRecord(SHEETS.TINDAK_LANJUT, HEADERS.TINDAK_LANJUT, data, 'TINDAK_LANJUT', currentUser);
    }
    if (action === 'updateTindakLanjut') {
      return handleUpdateRecord(SHEETS.TINDAK_LANJUT, 'tindak_lanjut_id', data.tindak_lanjut_id, data, 'TINDAK_LANJUT', currentUser);
    }

    if (action === 'createPosyandu') {
      return handleCreateRecord(SHEETS.MASTER_POSYANDU, HEADERS.MASTER_POSYANDU, data, 'POSYANDU', currentUser);
    }
    if (action === 'updatePosyandu') {
      return handleUpdateRecord(SHEETS.MASTER_POSYANDU, 'posyandu_id', data.posyandu_id, data, 'POSYANDU', currentUser);
    }

    if (action === 'createUserLintasSektor') {
      return handleCreateRecord(SHEETS.MASTER_LINTAS_SEKTOR, HEADERS.MASTER_LINTAS_SEKTOR, data, 'USER_LINTAS_SEKTOR', currentUser);
    }
    if (action === 'updateUserLintasSektor') {
      return handleUpdateRecord(SHEETS.MASTER_LINTAS_SEKTOR, 'user_id', data.user_id, data, 'USER_LINTAS_SEKTOR', currentUser);
    }

    if (action === 'createKendala') {
      return handleCreateRecord(SHEETS.KENDALA, HEADERS.KENDALA, data, 'KENDALA', currentUser);
    }
    if (action === 'updateKendala') {
      return handleUpdateRecord(SHEETS.KENDALA, 'kendala_id', data.kendala_id, data, 'KENDALA', currentUser);
    }

    if (action === 'createLintasSektor') {
      return handleCreateRecord(SHEETS.LINTAS_SEKTOR, HEADERS.LINTAS_SEKTOR, data, 'LINTAS_SEKTOR', currentUser);
    }
    if (action === 'updateLintasSektor') {
      return handleUpdateRecord(SHEETS.LINTAS_SEKTOR, 'kegiatan_id', data.kegiatan_id, data, 'LINTAS_SEKTOR', currentUser);
    }

    if (action === 'saveConfig') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var configSheet = ss.getSheetByName(SHEETS.KONFIGURASI);
      if (configSheet) {
        var key = data.key;
        var val = data.value;
        var desc = data.deskripsi || '';
        var lastRow = configSheet.getLastRow();
        var found = false;
        if (lastRow > 1) {
          var cfgValues = configSheet.getRange(2, 1, lastRow - 1, 4).getValues();
          for (var c = 0; c < cfgValues.length; c++) {
            if (cfgValues[c][0] === key) {
              configSheet.getRange(c + 2, 2).setValue(val);
              configSheet.getRange(c + 2, 4).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss'));
              found = true;
              break;
            }
          }
        }
        if (!found) {
          configSheet.appendRow([key, val, desc, Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss')]);
        }
        return jsonResponse(true, 'Konfigurasi ' + key + ' berhasil disimpan.', { key: key, value: val });
      }
    }

    return jsonResponse(false, 'Aksi POST tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Gagal memproses transaksi POST: ' + err.message, null);
  } finally {
    lock.releaseLock();
  }
}

function getTableData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var cellVal = values[i][j];
      if (cellVal instanceof Date) {
        rowObj[key] = Utilities.formatDate(cellVal, 'Asia/Jakarta', 'dd/MM/yyyy');
      } else {
        rowObj[key] = cellVal;
      }
    }
    rows.push(rowObj);
  }
  return rows;
}

function handleCreateRecord(sheetName, headerCols, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }

  var row = [];
  for (var i = 0; i < headerCols.length; i++) {
    var col = headerCols[i];
    var val = dataObj[col] !== undefined ? dataObj[col] : '';
    if (typeof val === 'object' && val !== null) {
      try { val = JSON.stringify(val); } catch (e) {}
    }
    if (col === 'created_at' || col === 'updated_at') {
      val = val || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    }
    row.push(val);
  }

  sheet.appendRow(row);

  var recordId = dataObj[headerCols[0]] || 'NEW_RECORD';
  logInternalActivity(user ? user.user_id : 'SYSTEM', 'CREATE', jenisData, recordId, 'Pembuatan data baru pada ' + sheetName, 'SUCCESS');

  return jsonResponse(true, 'Data berhasil disimpan ke ' + sheetName, dataObj);
}

function handleUpdateRecord(sheetName, idColName, idValue, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse(false, 'Sheet tidak ditemukan: ' + sheetName, null);

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return jsonResponse(false, 'Data kosong di sheet ' + sheetName, null);

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var idIndex = headers.indexOf(idColName);
  if (idIndex === -1) return jsonResponse(false, 'Kolom ID tidak ditemukan: ' + idColName, null);

  var targetRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(idValue)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return jsonResponse(false, 'Data dengan ' + idColName + ' = ' + idValue + ' tidak ditemukan di ' + sheetName, null);
  }

  dataObj.updated_at = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  for (var j = 0; j < headers.length; j++) {
    var colName = headers[j];
    if (dataObj[colName] !== undefined) {
      var cellVal = dataObj[colName];
      if (typeof cellVal === 'object' && cellVal !== null) {
        try { cellVal = JSON.stringify(cellVal); } catch (e) {}
      }
      sheet.getRange(targetRow, j + 1).setValue(cellVal);
    }
  }

  logInternalActivity(user ? user.user_id : 'SYSTEM', 'UPDATE', jenisData, idValue, 'Pembaruan data pada ' + sheetName, 'SUCCESS');

  return jsonResponse(true, 'Data berhasil diperbarui di ' + sheetName, dataObj);
}

function logInternalActivity(userId, aksi, jenisData, recordId, ringkasan, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.RIWAYAT_AKTIVITAS);
    if (!sheet) return;

    var logId = 'LOG-' + new Date().getTime();
    var waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([logId, waktu, userId || 'SYSTEM', 'Sistem', aksi, jenisData, recordId, ringkasan, status]);
  } catch (e) {}
}

function jsonResponse(success, message, data) {
  var output = {
    success: success,
    message: message,
    data: data,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function menuTestWhatsApp() {
  var ui = SpreadsheetApp.getUi();
  var defaultPhone = getConfigValue('WA_ADMIN_PHONE', '6281299887711');
  var response = ui.prompt(
    'Tes Pengiriman WhatsApp Gateway',
    'Masukkan nomor WhatsApp penerima untuk pengetesan (format: 628... atau 08...):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var phone = response.getResponseText().trim() || defaultPhone;
    var testMsg = '🔔 *TES KONEKSI WHATSAPP API - DERMAGA GIZI*\\n' +
                  'Puskesmas Kepulauan Seribu Selatan\\n\\n' +
                  'Uji coba WhatsApp API berhasil terkirim dari Google Spreadsheet pada ' +
                  Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss') + ' WIB.\\n\\n' +
                  'Sistem siap mengirimkan notifikasi penanganan gizi balita ke lintas sektor!';
    var res = sendWhatsAppMessage(phone, testMsg);
    ui.alert(res.success ? 'Berhasil Terkirim!' : 'Gagal Mengirim', res.message, ui.ButtonSet.OK);
  }
}

function menuBroadcastTestWhatsApp() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Konfirmasi Broadcast WhatsApp Lintas Sektor',
    'Apakah Anda ingin mengirim pesan uji coba ke seluruh kontak lintas sektor yang terdaftar aktif?',
    ui.ButtonSet.YES_NO
  );

  if (confirm === ui.Button.YES) {
    var dummyLaporan = {
      posyandu_nama: 'Posyandu Melati 1 (Uji Coba)',
      kelurahan_nama: 'Kelurahan Pulau Tidung',
      kelurahan_id: 'KEL-01',
      total_ditimbang: 45,
      total_sasaran: 50,
      tanggal_pelaksanaan: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy')
    };
    var dummyBalita = [
      {
        nama_balita: 'An. Contoh Uji Coba',
        jenis_kelamin: 'L',
        usia_bulan: 18,
        berat_badan: 8.2,
        tinggi_badan: 75,
        status_gizi: 'Stunting (Pendek)',
        rencana_tindak_lanjut: 'Pemberian PMT Pemulihan dan pendampingan TPK / PKK'
      }
    ];
    var res = broadcastGiziAlertToLintasSektor(dummyLaporan, dummyBalita);
    ui.alert('Hasil Broadcast', 'Pesan notifikasi berhasil diproses untuk ' + (res.recipientsCount || 0) + ' pemangku kepentingan.', ui.ButtonSet.OK);
  }
}

function menuCheckStatus() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var summary = [];
  var totalRows = 0;

  for (var key in SHEETS) {
    var name = SHEETS[key];
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      var rows = Math.max(0, sheet.getLastRow() - 1);
      totalRows += rows;
      summary.push('• ' + name + ': ' + rows + ' data');
    } else {
      summary.push('• ' + name + ': ❌ Belum dibuat');
    }
  }

  ui.alert(
    'Status Database DERMAGA GIZI',
    'Total Sheet: ' + ss.getSheets().length + '\\n' +
    'Total Rekord Data: ' + totalRows + '\\n\\n' +
    summary.join('\\n'),
    ui.ButtonSet.OK
  );
}

function menuShowGuide() {
  var ui = SpreadsheetApp.getUi();
  var token = getConfigValue('WA_API_TOKEN', 'Belum diisi');
  var provider = getConfigValue('WA_GATEWAY_PROVIDER', 'FONNTE');
  var adminPhone = getConfigValue('WA_ADMIN_PHONE', 'Belum diisi');

  var msg = 'PANDUAN WHATSAPP GATEWAY DERMAGA GIZI:\\n\\n' +
            '1. Provider Terpilih: ' + provider + '\\n' +
            '2. Status Token: ' + (token.indexOf('YOUR_') === -1 ? 'Sudah Diatur' : 'Masih Default') + '\\n' +
            '3. Nomor Admin: ' + adminPhone + '\\n\\n' +
            'CARA MENDAPATKAN TOKEN FONNTE (GRATIS):\\n' +
            '1. Buka https://fonnte.com dan daftar akun.\\n' +
            '2. Hubungkan nomor WhatsApp Anda dengan scan QR Code di menu Device Fonnte.\\n' +
            '3. Salin API Token yang diberikan.\\n' +
            '4. Buka sheet "KONFIGURASI", tempel token pada baris "WA_API_TOKEN".\\n' +
            '5. Sistem akan langsung aktif mengirim pesan otomatis ke seluruh lintas sektor!';

  ui.alert('Panduan Konfigurasi WhatsApp API', msg, ui.ButtonSet.OK);
}
`;
