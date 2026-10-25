/**
 * DERMAGA GIZI - Google Apps Script Backend (Code.gs)
 * Puskesmas Kepulauan Seribu Selatan
 *
 * INSTRUKSI DEPLOYMENT:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda (misal beri nama: "DB_DERMAGA_GIZI_SERIBU_SELATAN").
 * 2. Buka menu Ekstensi > Apps Script (Extensions > Apps Script).
 * 3. Hapus kode default, lalu tempel seluruh isi file ini ke dalam editor (Code.gs).
 * 4. Klik simpan (Ctrl+S / Cmd+S).
 * 5. Jalankan fungsi 'initializeDatabase' sekali dari toolbar fungsi editor untuk membuat seluruh sheet dan data awal secara otomatis.
 * 6. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 7. Pilih jenis 'Web app' (Aplikasi web).
 * 8. Konfigurasi:
 *    - Description: "DERMAGA GIZI API v1.0"
 *    - Execute as: "Me" (Saya - akun Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar aplikasi web DERMAGA GIZI dapat memanggil API)
 * 9. Klik 'Deploy', berikan izin akses saat diminta, lalu salin 'Web app URL' (akhiran /exec).
 * 10. Buka aplikasi web DERMAGA GIZI > Menu "Pengaturan Aplikasi", lalu tempel URL tersebut.
 */

// Konstanta Nama Sheet Database
var SHEETS = {
  USERS: 'USERS',
  PULAU: 'PULAU',
  SASARAN: 'SASARAN',
  PEMANTAUAN: 'PEMANTAUAN',
  TINDAK_LANJUT: 'TINDAK_LANJUT',
  KENDALA: 'KENDALA',
  LINTAS_SEKTOR: 'LINTAS_SEKTOR',
  RIWAYAT_AKTIVITAS: 'RIWAYAT_AKTIVITAS',
  EVALUASI: 'EVALUASI',
  KONFIGURASI: 'KONFIGURASI',
  REFERENSI: 'REFERENSI'
};

// Header Kolom untuk Setiap Sheet
var HEADERS = {
  USERS: ['user_id', 'email', 'nama', 'role', 'unit', 'pulau_id', 'status_aktif', 'created_at', 'updated_at'],
  PULAU: ['pulau_id', 'nama_pulau', 'unit_pelayanan', 'latitude', 'longitude', 'status_akses', 'keterangan', 'status_aktif'],
  SASARAN: ['sasaran_id', 'kode_sasaran', 'inisial', 'tanggal_lahir', 'jenis_kelamin', 'pulau_id', 'unit_pelayanan', 'tanggal_registrasi', 'status_aktif'],
  PEMANTAUAN: ['pemantauan_id', 'sasaran_id', 'tanggal_pemantauan', 'petugas_id', 'indikator_terukur', 'kategori_masalah', 'hasil_pemeriksaan', 'catatan_terbatas', 'periode', 'created_at'],
  TINDAK_LANJUT: ['tindak_lanjut_id', 'sasaran_id', 'pemantauan_id', 'kategori', 'rencana_intervensi', 'tanggal_rencana', 'tenggat', 'petugas_id', 'status', 'prioritas', 'tanggal_selesai', 'catatan', 'created_at', 'updated_at'],
  KENDALA: ['kendala_id', 'tanggal_kejadian', 'pulau_id', 'kategori', 'deskripsi', 'dampak', 'rencana_penyelesaian', 'penanggung_jawab', 'tenggat', 'status', 'created_at', 'updated_at'],
  LINTAS_SEKTOR: ['kegiatan_id', 'tanggal_kesepakatan', 'nama_kegiatan', 'pulau_id', 'mitra', 'penanggung_jawab', 'tenggat', 'indikator', 'target', 'realisasi', 'progres', 'status', 'catatan', 'updated_at'],
  RIWAYAT_AKTIVITAS: ['log_id', 'waktu', 'user_id', 'aksi', 'jenis_data', 'record_id', 'ringkasan_perubahan', 'status'],
  EVALUASI: ['evaluasi_id', 'periode_awal', 'periode_akhir', 'pulau_id', 'indikator', 'hasil', 'analisis', 'rekomendasi', 'petugas_id', 'created_at'],
  KONFIGURASI: ['key', 'value', 'deskripsi', 'updated_at']
};

/**
 * Inisialisasi Database: Membuat sheet yang belum ada, mengisi header kolom, dan tidak menghapus data lama.
 */
function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = [];

  for (var key in HEADERS) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(HEADERS[key]);
      sheet.getRange(1, 1, 1, HEADERS[key].length).setFontWeight('bold').setBackground('#0f2b48').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      log.push('Dibuat: ' + sheetName);
    } else {
      // Pastikan baris header sudah ada
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS[key]);
        sheet.getRange(1, 1, 1, HEADERS[key].length).setFontWeight('bold').setBackground('#0f2b48').setFontColor('#ffffff');
        sheet.setFrozenRows(1);
        log.push('Header ditambahkan ke: ' + sheetName);
      } else {
        log.push('Sudah ada: ' + sheetName);
      }
    }
  }

  // Tulis konfigurasi awal jika belum ada
  var configSheet = ss.getSheetByName(SHEETS.KONFIGURASI);
  if (configSheet && configSheet.getLastRow() <= 1) {
    configSheet.appendRow(['APP_NAME', 'DERMAGA GIZI', 'Nama Sistem Aplikasi Monitoring Gizi', new Date().toISOString()]);
    configSheet.appendRow(['INSTANSI', 'Puskesmas Kepulauan Seribu Selatan', 'Satuan Kerja Pemilik Data', new Date().toISOString()]);
    configSheet.appendRow(['VERSION', '1.1.0', 'Versi Rilis Backend', new Date().toISOString()]);
    configSheet.appendRow(['TIMEZONE', 'Asia/Jakarta', 'Zona Waktu Standar Operasional', new Date().toISOString()]);
  }

  return {
    success: true,
    message: 'Inisialisasi database berhasil dijalankan.',
    data: { log: log, spreadsheetId: ss.getId(), timestamp: new Date().toISOString() }
  };
}

/**
 * Handler HTTP GET untuk membaca data
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return jsonResponse(true, 'Koneksi ke backend Google Apps Script aktif.', {
        app: 'DERMAGA GIZI',
        instansi: 'Puskesmas Kepulauan Seribu Selatan',
        time: new Date().toISOString()
      });
    }

    if (action === 'init') {
      var initResult = initializeDatabase();
      return jsonResponse(initResult.success, initResult.message, initResult.data);
    }

    // Endpoint komprehensif untuk refresh 3 detik cepat
    if (action === 'getAllData') {
      var allData = {
        sasaran: getTableData(SHEETS.SASARAN),
        tindak_lanjut: getTableData(SHEETS.TINDAK_LANJUT),
        pulau: getTableData(SHEETS.PULAU),
        kendala: getTableData(SHEETS.KENDALA),
        lintas_sektor: getTableData(SHEETS.LINTAS_SEKTOR),
        timestamp: new Date().toISOString()
      };
      return jsonResponse(true, 'Data terpadu Google Spreadsheet berhasil disinkronkan', allData);
    }

    if (action === 'getPulau') {
      return jsonResponse(true, 'Data pulau berhasil dimuat', getTableData(SHEETS.PULAU));
    }

    if (action === 'getSasaran') {
      return jsonResponse(true, 'Data sasaran balita berhasil dimuat', getTableData(SHEETS.SASARAN));
    }

    if (action === 'getPemantauan') {
      return jsonResponse(true, 'Data pemantauan berhasil dimuat', getTableData(SHEETS.PEMANTAUAN));
    }

    if (action === 'getTindakLanjut') {
      return jsonResponse(true, 'Data tindak lanjut berhasil dimuat', getTableData(SHEETS.TINDAK_LANJUT));
    }

    if (action === 'getKendala') {
      return jsonResponse(true, 'Data kendala akses berhasil dimuat', getTableData(SHEETS.KENDALA));
    }

    if (action === 'getLintasSektor') {
      return jsonResponse(true, 'Data kegiatan lintas sektor berhasil dimuat', getTableData(SHEETS.LINTAS_SEKTOR));
    }

    if (action === 'getDashboard') {
      return handleGetDashboard(params);
    }

    if (action === 'getLogs') {
      return jsonResponse(true, 'Data log aktivitas berhasil dimuat', getTableData(SHEETS.RIWAYAT_AKTIVITAS));
    }

    return jsonResponse(false, 'Aksi GET tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Terjadi kesalahan sistem backend: ' + err.message, null);
  }
}

/**
 * Handler HTTP POST untuk penulisan & pembaruan data dengan ScriptLock
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Tunggu maksimal 15 detik untuk lock bersamaan
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

    if (action === 'init') {
      var initRes = initializeDatabase();
      return jsonResponse(initRes.success, initRes.message, initRes.data);
    }

    if (action === 'createSasaran') {
      return handleCreateRecord(SHEETS.SASARAN, HEADERS.SASARAN, data, 'SASARAN', currentUser);
    }

    if (action === 'updateSasaran') {
      return handleUpdateRecord(SHEETS.SASARAN, 'sasaran_id', data.sasaran_id, data, 'SASARAN', currentUser);
    }

    if (action === 'createPemantauan') {
      return handleCreateRecord(SHEETS.PEMANTAUAN, HEADERS.PEMANTAUAN, data, 'PEMANTAUAN', currentUser);
    }

    if (action === 'createTindakLanjut') {
      return handleCreateRecord(SHEETS.TINDAK_LANJUT, HEADERS.TINDAK_LANJUT, data, 'TINDAK_LANJUT', currentUser);
    }

    if (action === 'updateTindakLanjut') {
      return handleUpdateRecord(SHEETS.TINDAK_LANJUT, 'tindak_lanjut_id', data.tindak_lanjut_id, data, 'TINDAK_LANJUT', currentUser);
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

    return jsonResponse(false, 'Aksi POST tidak dikenali: ' + action, null);
  } catch (err) {
    return jsonResponse(false, 'Gagal memproses transaksi: ' + err.message, null);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pembacaan data dari sebuah sheet menjadi array of object
 */
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

/**
 * Handle Pembuatan Record Baru Secara Aman
 */
function handleCreateRecord(sheetName, headerCols, dataObj, jenisData, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    initializeDatabase();
    sheet = ss.getSheetByName(sheetName);
  }

  var row = [];
  for (var i = 0; i < headerCols.length; i++) {
    var col = headerCols[i];
    var val = dataObj[col] !== undefined ? dataObj[col] : '';
    if (col === 'created_at' || col === 'updated_at') {
      val = val || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    }
    row.push(val);
  }

  sheet.appendRow(row);

  // Catat riwayat audit
  var recordId = dataObj[headerCols[0]] || 'NEW_RECORD';
  logInternalActivity(user.user_id, 'CREATE', jenisData, recordId, 'Pembuatan data baru pada ' + sheetName, 'SUCCESS');

  return jsonResponse(true, 'Data berhasil disimpan ke ' + sheetName, dataObj);
}

/**
 * Handle Pembaruan Record Berdasarkan ID
 */
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
    return jsonResponse(false, 'Data dengan ' + idColName + ' = ' + idValue + ' tidak ditemukan', null);
  }

  dataObj.updated_at = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  for (var j = 0; j < headers.length; j++) {
    var colName = headers[j];
    if (dataObj[colName] !== undefined) {
      sheet.getRange(targetRow, j + 1).setValue(dataObj[colName]);
    }
  }

  logInternalActivity(user.user_id, 'UPDATE', jenisData, idValue, 'Pembaruan data pada ' + sheetName, 'SUCCESS');

  return jsonResponse(true, 'Data berhasil diperbarui', dataObj);
}

/**
 * Catat aktivitas log internal ke sheet RIWAYAT_AKTIVITAS
 */
function logInternalActivity(userId, aksi, jenisData, recordId, ringkasan, status) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.RIWAYAT_AKTIVITAS);
    if (!sheet) return;

    var logId = 'LOG-' + new Date().getTime();
    var waktu = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([logId, waktu, userId || 'SYSTEM', aksi, jenisData, recordId, ringkasan, status]);
  } catch (e) {
    // Abaikan gagal log agar tidak menghambat transaksi utama
  }
}

/**
 * Agregasi Khusus untuk Dashboard Ringkasan Wilayah
 */
function handleGetDashboard(params) {
  var filterPulau = params.pulau_id || 'ALL';
  var filterTahun = params.tahun || '2026';

  var sasaranList = getTableData(SHEETS.SASARAN);
  var tlList = getTableData(SHEETS.TINDAK_LANJUT);
  var pulauList = getTableData(SHEETS.PULAU);
  var kendalaList = getTableData(SHEETS.KENDALA);

  // Filter sasaran
  var filteredSasaran = sasaranList.filter(function(s) {
    if (filterPulau !== 'ALL' && s.pulau_id !== filterPulau) return false;
    return s.status_aktif !== false;
  });

  // Filter tindak lanjut
  var filteredTL = tlList.filter(function(t) {
    if (filterPulau !== 'ALL') {
      // Temukan pulau sasaran
      var s = sasaranList.filter(function(x) { return x.sasaran_id === t.sasaran_id; })[0];
      if (!s || s.pulau_id !== filterPulau) return false;
    }
    return true;
  });

  var totalSasaran = filteredSasaran.length;
  var bermasalahGizi = 0;
  var sasaranDipantau = 0;

  for (var i = 0; i < filteredSasaran.length; i++) {
    var item = filteredSasaran[i];
    if (item.kategori_masalah_terakhir && item.kategori_masalah_terakhir !== 'Gizi Baik (Normal)') {
      bermasalahGizi++;
    }
    if (item.tanggal_pantau_terakhir) {
      sasaranDipantau++;
    }
  }

  var tlTertunda = 0;
  var tlSelesai = 0;
  var tlPerhatianSegera = 0;

  for (var j = 0; j < filteredTL.length; j++) {
    var tl = filteredTL[j];
    if (tl.status === 'Belum ditindaklanjuti' || tl.status === 'Menunggu koordinasi') {
      tlTertunda++;
    }
    if (tl.status === 'Selesai') {
      tlSelesai++;
    }
    if (tl.prioritas === 'Tinggi' && tl.status !== 'Selesai') {
      tlPerhatianSegera++;
    }
  }

  var cakupanPemantauan = totalSasaran > 0 ? ((sasaranDipantau / totalSasaran) * 100).toFixed(1) : 0;
  var wajibTL = tlTertunda + tlSelesai;
  var persenPenyelesaian = wajibTL > 0 ? ((tlSelesai / wajibTL) * 100).toFixed(1) : 0;

  return jsonResponse(true, 'Data dashboard berhasil dihitung', {
    kpi: {
      totalSasaran: totalSasaran,
      bermasalahGizi: bermasalahGizi,
      sasaranDipantau: sasaranDipantau,
      persenCakupanPemantauan: Number(cakupanPemantauan),
      tlTertunda: tlTertunda,
      tlSelesai: tlSelesai,
      tlPerhatianSegera: tlPerhatianSegera,
      persenPenyelesaian: Number(persenPenyelesaian)
    },
    meta: {
      filterPulau: filterPulau,
      filterTahun: filterTahun,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Format Standar JSON Response
 */
function jsonResponse(success, message, data) {
  var output = {
    success: success,
    message: message,
    data: data
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
