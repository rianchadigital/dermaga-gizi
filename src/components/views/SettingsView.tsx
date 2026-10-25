import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  FileCode2, 
  Activity, 
  ShieldCheck, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { RiwayatAktivitas } from '../../types';

interface SettingsViewProps {
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [gasUrl, setGasUrl] = useState(storageService.getGasUrl());
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    details?: any;
  }>({
    tested: false,
    success: false,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'koneksi' | 'panduan' | 'audit'>('koneksi');

  const logs = storageService.getLogs();

  const handleSaveUrl = async () => {
    storageService.setGasUrl(gasUrl);
    await handleTestConnection();
    if (gasUrl.trim()) {
      await apiService.fetchDatabaseData();
    }
    onRefreshData();
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    const res = await apiService.testConnection(gasUrl);
    setTestResult({
      tested: true,
      success: res.success,
      message: res.message,
      latencyMs: res.latencyMs,
      details: res.details
    });
    setIsLoading(false);
    onRefreshData();
  };

  const handleInitSpreadsheet = async () => {
    setIsLoading(true);
    const res = await apiService.initializeSpreadsheet(gasUrl);
    alert(res.message);
    setIsLoading(false);
    handleTestConnection();
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data demo kembali ke setelan default awal?')) {
      storageService.resetToDefault();
      onRefreshData();
      alert('Data demo berhasil direset ke setelan awal.');
    }
  };

  const sampleScriptCode = `/**
 * DERMAGA GIZI - Google Apps Script Backend (Code.gs)
 * Puskesmas Kepulauan Seribu Selatan
 */
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

function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Membuat seluruh 10 sheet otomatis dengan header baku...
  return { success: true, message: "Database siap!" };
}

function doGet(e) {
  var action = (e && e.parameter ? e.parameter.action : '') || 'ping';
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Koneksi Google Apps Script Aktif",
      data: { app: "DERMAGA GIZI", time: new Date().toISOString() }
    })).setMimeType(ContentService.MimeType.JSON);
  }
  // Handler lainnya: getPulau, getSasaran, getTindakLanjut, getDashboard...
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    // Sinkronisasi create/update record...
  } finally {
    lock.releaseLock();
  }
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(sampleScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              Pengaturan Sistem & Integrasi Google Spreadsheet
            </h1>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
              Puskesmas Kep. Seribu Selatan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi koneksi Google Apps Script Web App, uji koneksi, panduan deployment, dan log audit aktivitas.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Data Demo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('koneksi')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'koneksi' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Koneksi & Diagnostik API</span>
        </button>
        <button
          onClick={() => setActiveTab('panduan')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'panduan' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Panduan Deployment Apps Script</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Riwayat Aktivitas & Audit ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Koneksi & Diagnostik */}
      {activeTab === 'koneksi' && (
        <div className="space-y-6">
          
          {/* Card URL Web App */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-900 text-sm mb-1">
                URL Google Apps Script Web App (API Endpoint)
              </label>
              <p className="text-slate-500 mb-2 leading-relaxed">
                Masukkan URL Web App hasil deployment Google Apps Script (berakhiran <code className="bg-slate-100 px-1 py-0.5 rounded text-sky-800">/exec</code>). Saat belum diisi, aplikasi beroperasi dalam Mode Demo yang aman dengan data lokal.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-sky-500 focus:bg-white transition-all"
                />
                <button
                  onClick={handleSaveUrl}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  <span>Simpan & Uji Koneksi</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Card */}
            {testResult.tested && (
              <div className={`p-4 rounded-xl border ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {testResult.success ? 'Koneksi Berhasil Aktif' : 'Status Koneksi: Perlu Konfigurasi'}
                    </div>
                    <p className="mt-1 leading-relaxed">{testResult.message}</p>
                    {testResult.latencyMs !== undefined && (
                      <div className="mt-2 text-[11px] font-mono text-slate-600">
                        Latensi respons: <b>{testResult.latencyMs} ms</b>
                      </div>
                    )}
                    {testResult.success && (
                      <div className="mt-3">
                        <button
                          onClick={handleInitSpreadsheet}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                        >
                          Inisialisasi Seluruh Sheet Otomatis
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Operasional Saat Ini */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-slate-800 dark:text-white">Fokus Penyimpanan Utama: </span>
                <span className={apiService.isConnected() ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>
                  {apiService.isConnected() ? 'Database Google Spreadsheet (Prioritas Utama, Bukan Lokal)' : 'Mode Demo Terproteksi (Lokal)'}
                </span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Sinkronisasi live polling otomatis berjalan setiap <b>3 detik</b> ke Google Spreadsheet Database saat aktif.
                </div>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 rounded-lg font-medium text-slate-700 dark:text-slate-200 text-xs self-start sm:self-center"
              >
                Uji Koneksi Ulang
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Panduan Deployment Apps Script */}
      {activeTab === 'panduan' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Petunjuk Langkah Demi Langkah Menghubungkan Google Spreadsheet
            </h2>
            <p className="text-slate-500">
              Ikuti 5 langkah sederhana berikut untuk menghubungkan DERMAGA GIZI dengan Google Drive Puskesmas:
            </p>
          </div>

          <ol className="space-y-4 list-decimal list-inside text-slate-700 leading-relaxed">
            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-900">Buat Google Spreadsheet Baru</span>
              <p className="text-slate-600 mt-1 pl-4">
                Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-sky-700 underline font-medium">sheets.new</a> pada peramban Anda dan beri nama: <code>DB_DERMAGA_GIZI_SERIBU_SELATAN</code>.
              </p>
            </li>

            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-900">Buka Editor Google Apps Script</span>
              <p className="text-slate-600 mt-1 pl-4">
                Pada menu atas Google Spreadsheet, klik <b>Ekstensi (Extensions) &gt; Apps Script</b>.
              </p>
            </li>

            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-900">Tempel Kode Backend (Code.gs)</span>
              <p className="text-slate-600 mt-1 pl-4">
                File <code>/src/gas/Code.gs</code> telah kami buatkan lengkap di proyek ini. Salin kodenya dan tempel ke editor Apps Script, lalu klik Simpan (Ctrl+S / Cmd+S).
              </p>
              <div className="mt-2 pl-4">
                <button
                  onClick={copyScriptToClipboard}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Kode Berhasil Disalin!' : 'Salin Kode Backend Code.gs'}</span>
                </button>
              </div>
            </li>

            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-900">Deploy sebagai Web App</span>
              <p className="text-slate-600 mt-1 pl-4">
                Klik tombol biru <b>Deploy (Terapkan) &gt; New deployment (Penerapan baru)</b> di kanan atas editor.
                Pilih tipe <b>Web app</b>. Atur:
                <br />· <i>Execute as:</i> <b>Me</b> (Akun Anda)
                <br />· <i>Who has access:</i> <b>Anyone</b> (Siapa saja)
              </p>
            </li>

            <li className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-900">Salin Web App URL ke DERMAGA GIZI</span>
              <p className="text-slate-600 mt-1 pl-4">
                Salin Web App URL yang diberikan Google (akhiran <code>/exec</code>), lalu tempel pada tab "Koneksi & Diagnostik API" di atas.
              </p>
            </li>
          </ol>
        </div>
      )}

      {/* Tab 3: Riwayat Aktivitas & Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Riwayat Aktivitas & Audit Trail (Sheet RIWAYAT_AKTIVITAS)</h2>
              <p className="text-[11px] text-slate-500">Mencatat waktu, pengguna, jenis aksi, dan rincian perubahan data</p>
            </div>
            <span className="font-mono text-slate-500 font-semibold">{logs.length} Log</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold z-10">
                <tr>
                  <th className="py-2.5 px-3">Waktu (WIB)</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-2 text-center">Aksi</th>
                  <th className="py-2.5 px-2">Modul</th>
                  <th className="py-2.5 px-3">Rincian Perubahan</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.waktu}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-800">{log.user_name}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.aksi === 'CREATE' ? 'bg-sky-100 text-sky-800' :
                        log.aksi === 'UPDATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.aksi === 'CANCEL' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 font-sans">{log.jenis_data}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 max-w-sm truncate" title={log.ringkasan_perubahan}>
                      {log.ringkasan_perubahan}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
