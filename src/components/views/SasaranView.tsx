import React, { useState } from 'react';
import { 
  Baby, 
  Search, 
  Plus, 
  Download, 
  Edit3, 
  MapPin, 
  Calendar, 
  X, 
  Save, 
  Eye, 
  Scale, 
  Ruler, 
  Activity,
  Send,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { GlobalFilter, Pulau, SasaranBalita, User, KategoriMasalahGizi } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { getKategoriGiziBadge, exportToCSV } from '../../utils/formatters';

interface SasaranViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

export const SasaranView: React.FC<SasaranViewProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSasaran, setActiveSasaran] = useState<Partial<SasaranBalita>>({});
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [waAlertModal, setWaAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    pulauName: string;
    text: string;
    link: string;
    recipients: string[];
  } | null>(null);

  const sasaranList = storageService.getSasaranList(filter);

  const filteredSasaran = sasaranList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.kode_sasaran.toLowerCase().includes(q) || 
      s.inisial.toLowerCase().includes(q) ||
      (s.kategori_masalah_terakhir && s.kategori_masalah_terakhir.toLowerCase().includes(q));
  });

  const canEdit = currentUser.role !== 'VIEWER';

  const handleOpenCreate = () => {
    const selectedPulau = pulauList.find(p => p.pulau_id === filter.pulau_id) || pulauList[0];
    const pulauCode = selectedPulau.nama_pulau.substring(6, 9).toUpperCase() || 'TDG';
    const randomCode = Math.floor(10 + Math.random() * 89);
    
    setActiveSasaran({
      sasaran_id: `SAS-${Date.now().toString().slice(-4)}`,
      kode_sasaran: `BLT-${pulauCode}-0${randomCode}`,
      inisial: 'An. ',
      tanggal_lahir: '01/01/2024',
      jenis_kelamin: 'L',
      pulau_id: selectedPulau.pulau_id,
      unit_pelayanan: selectedPulau.unit_pelayanan,
      tanggal_registrasi: new Date().toLocaleDateString('id-ID'),
      status_aktif: true,
      kategori_masalah_terakhir: 'Gizi Baik (Normal)',
      bb_terakhir: 10.0,
      tb_terakhir: 80.0,
      tanggal_pantau_terakhir: new Date().toLocaleDateString('id-ID')
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SasaranBalita) => {
    setActiveSasaran({ ...s });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (s: SasaranBalita) => {
    setActiveSasaran({ ...s });
    setIsDetailOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSasaran.kode_sasaran || !activeSasaran.pulau_id) return;

    const saved = await apiService.createSasaran(activeSasaran as SasaranBalita);
    setIsModalOpen(false);
    onRefreshData();

    const p = pulauList.find(item => item.pulau_id === saved.pulau_id);
    const text = `🔔 *NOTIFIKASI DATA SASARAN BARU - DERMAGA GIZI*\n` +
      `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `Telah ditambahkan sasaran balita:\n` +
      `• Kode Sasaran: *${saved.kode_sasaran}* (${saved.inisial})\n` +
      `• Wilayah: *${p?.nama_pulau || saved.pulau_id}*\n` +
      `• Status Gizi: *${saved.kategori_masalah_terakhir || 'Dalam Verifikasi'}*\n` +
      `• Antropometri: BB ${saved.bb_terakhir} kg, TB ${saved.tb_terakhir} cm\n\n` +
      `Pemberitahuan telah otomatis diteruskan ke Kader Posyandu, Petugas Pustu, Nutrisionis, dan Kasi Kesra Lintas Sektor setempat.`;

    setWaAlertModal({
      isOpen: true,
      title: `Notifikasi WhatsApp: ${saved.kode_sasaran}`,
      pulauName: p?.nama_pulau || 'Kepulauan Seribu Selatan',
      text,
      link: `https://wa.me/?text=${encodeURIComponent(text)}`,
      recipients: [
        'Kader Posyandu ' + (p?.nama_pulau || ''),
        'Tenaga Gizi Puskesmas',
        'Dokter/Bidan Pustu Terkait',
        'Seksi Kesra Kelurahan (Lintas Sektor)'
      ]
    });
  };

  const handleSendWA = (s: SasaranBalita) => {
    storageService.notifyNewSasaran(s);
    const p = pulauList.find(item => item.pulau_id === s.pulau_id);
    const text = `🔔 *INFO SASARAN BALITA - DERMAGA GIZI*\n` +
      `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `Data Pemantauan Balita:\n` +
      `• Kode Sasaran: *${s.kode_sasaran}* (${s.inisial})\n` +
      `• Wilayah: *${p?.nama_pulau || s.pulau_id}*\n` +
      `• Status Gizi Terakhir: *${s.kategori_masalah_terakhir || 'Normal'}*\n` +
      `• Antropometri: BB ${s.bb_terakhir}kg, TB ${s.tb_terakhir}cm\n\n` +
      `Silakan koordinasikan dengan kader posyandu dan tim lintas sektor setempat.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExport = () => {
    const headers = [
      'ID Sasaran',
      'Kode Sasaran (Anonim)',
      'Inisial',
      'Tanggal Lahir',
      'Jenis Kelamin',
      'Pulau',
      'Unit Pelayanan',
      'Kategori Masalah Terakhir',
      'BB (kg)',
      'TB (cm)',
      'Tanggal Pantau Terakhir'
    ];

    const rows = filteredSasaran.map(s => {
      const p = pulauList.find(item => item.pulau_id === s.pulau_id);
      return [
        s.sasaran_id,
        s.kode_sasaran,
        s.inisial,
        s.tanggal_lahir,
        s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        p?.nama_pulau || s.pulau_id,
        s.unit_pelayanan,
        s.kategori_masalah_terakhir || '-',
        s.bb_terakhir || '-',
        s.tb_terakhir || '-',
        s.tanggal_pantau_terakhir || '-'
      ];
    });

    exportToCSV(`Sasaran_Balita_Gizi_${filter.pulau_id}`, headers, rows);
    storageService.addLog('EXPORT', 'SASARAN', 'EXPORT-ALL', `Ekspor ${rows.length} data sasaran balita`, 'SUCCESS');
  };

  return (
    <div className="space-y-4">
      
      {/* Title & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900">
              Registrasi & Pemantauan Sasaran Balita
            </h1>
            <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {filteredSasaran.length} Balita
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan antropometri balita dengan perlindungan privasi menggunakan kode sasaran anonim.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrasi Balita Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode sasaran atau inisial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white text-xs"
          />
        </div>
        <div className="text-slate-500 text-xs">
          Pulau aktif: <span className="font-semibold text-slate-800">{filter.pulau_id === 'ALL' ? 'Semua Pulau' : pulauList.find(p => p.pulau_id === filter.pulau_id)?.nama_pulau}</span>
        </div>
      </div>

      {/* Grid Sasaran Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSasaran.map(s => {
          const pulau = pulauList.find(p => p.pulau_id === s.pulau_id);
          const badge = getKategoriGiziBadge(s.kategori_masalah_terakhir);

          return (
            <div 
              key={s.sasaran_id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-xs"
            >
              <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                    <Baby className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-sm">{s.kode_sasaran}</div>
                    <div className="text-[11px] text-slate-500">{s.inisial} · {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5 ${
                  s.kategori_masalah_terakhir === 'Gizi Baik (Normal)' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span className="font-medium truncate max-w-[110px]">{s.kategori_masalah_terakhir || 'Normal'}</span>
                </span>
              </div>

              {/* Data Detail Body */}
              <div className="py-3 space-y-2 text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Pulau Domisili:</span>
                  <span className="font-semibold text-slate-800">{pulau?.nama_pulau || s.pulau_id}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Faskes / Pos Gizi:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[170px]" title={s.unit_pelayanan}>{s.unit_pelayanan}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-400">Berat Badan</div>
                    <div className="font-mono font-bold text-slate-800">{s.bb_terakhir ? `${s.bb_terakhir} kg` : '-'}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <div className="text-[10px] text-slate-400">Tinggi Badan</div>
                    <div className="font-mono font-bold text-slate-800">{s.tb_terakhir ? `${s.tb_terakhir} cm` : '-'}</div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pantau: {s.tanggal_pantau_terakhir || s.tanggal_registrasi}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSendWA(s)}
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                    title="Kirim Notifikasi WhatsApp ke Kader/Lintas Sektor"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetail(s)}
                    className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Update Antropometri"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form Sasaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-base">
                Registrasi & Antropometri Balita
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Sasaran Anonim *</label>
                  <input
                    type="text"
                    value={activeSasaran.kode_sasaran || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, kode_sasaran: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inisial / Nama Terbatas *</label>
                  <input
                    type="text"
                    value={activeSasaran.inisial || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, inisial: e.target.value }))}
                    placeholder="Contoh: An. MF"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={activeSasaran.tanggal_lahir || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={activeSasaran.jenis_kelamin || 'L'}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, jenis_kelamin: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pulau Domisili *</label>
                <select
                  value={activeSasaran.pulau_id || ''}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const p = pulauList.find(item => item.pulau_id === pid);
                    setActiveSasaran(prev => ({ 
                      ...prev, 
                      pulau_id: pid,
                      unit_pelayanan: p ? p.unit_pelayanan : prev.unit_pelayanan
                    }));
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                >
                  {pulauList.map(p => (
                    <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
                  ))}
                </select>
              </div>

              {/* Antropometri */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-700">Hasil Pengukuran Antropometri Terakhir</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Berat Badan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSasaran.bb_terakhir || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, bb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Tinggi / Panjang (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSasaran.tb_terakhir || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, tb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Kategori Masalah Gizi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Status Gizi Terverifikasi
                </label>
                <select
                  value={activeSasaran.kategori_masalah_terakhir || 'Gizi Baik (Normal)'}
                  onChange={(e) => setActiveSasaran(prev => ({ ...prev, kategori_masalah_terakhir: e.target.value as KategoriMasalahGizi }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Gizi Baik (Normal)">Gizi Baik (Normal)</option>
                  <option value="Stunting (Pendek)">Stunting (Pendek)</option>
                  <option value="Wasting (Kurus/Gizi Kurang)">Wasting (Kurus/Gizi Kurang)</option>
                  <option value="Underweight (BB Kurang)">Underweight (BB Kurang)</option>
                  <option value="Gizi Buruk">Gizi Buruk</option>
                  <option value="Risiko Gizi Lebih / Obesitas">Risiko Gizi Lebih / Obesitas</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Sasaran */}
      {isDetailOpen && activeSasaran && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-base">Rekam Medis Terbatas Sasaran</div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Kode Sasaran:</span>
                <span className="font-mono font-bold text-sky-800">{activeSasaran.kode_sasaran}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inisial:</span>
                <span className="font-semibold">{activeSasaran.inisial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pulau:</span>
                <span>{pulauList.find(p => p.pulau_id === activeSasaran.pulau_id)?.nama_pulau}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Gizi:</span>
                <span className="font-bold text-rose-700">{activeSasaran.kategori_masalah_terakhir}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Antropometri:</span>
                <span className="font-mono">{activeSasaran.bb_terakhir} kg / {activeSasaran.tb_terakhir} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pemantauan Terakhir:</span>
                <span>{activeSasaran.tanggal_pantau_terakhir || '-'}</span>
              </div>
            </div>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Notifikasi WhatsApp Otomatis */}
      {waAlertModal && waAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Sasaran Disimpan & Notifikasi WA Terkirim!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Notifikasi otomatis telah disiapkan untuk kader posyandu, tenaga gizi, dan lintas sektor {waAlertModal.pulauName}.
                </p>
              </div>
              <button 
                onClick={() => setWaAlertModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">Target Penerima Notifikasi:</div>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                {waAlertModal.recipients.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-mono text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap max-h-36 overflow-y-auto">
              {waAlertModal.text}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaAlertModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(waAlertModal.link, '_blank');
                  setWaAlertModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Buka WhatsApp Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
