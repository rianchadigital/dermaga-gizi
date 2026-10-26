import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Baby, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Building2, 
  UserCheck, 
  MessageCircle, 
  ExternalLink, 
  FileText, 
  Printer, 
  Users, 
  Scale, 
  Ruler, 
  HeartHandshake, 
  Clock, 
  X,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { 
  Kelurahan, 
  Posyandu, 
  LaporanPosyandu, 
  BalitaKurangGiziInput, 
  KategoriMasalahGizi, 
  User, 
  WhatsAppNotification,
  TindakLanjut 
} from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';

interface InputLaporanPosyanduViewProps {
  currentUser: User;
  onRefreshData: () => void;
  onNavigateTab?: (tab: any, params?: any) => void;
}

const KATEGORI_GIZI_OPTIONS: KategoriMasalahGizi[] = [
  'Wasting (Kurus/Gizi Kurang)',
  'Gizi Buruk',
  'Stunting (Pendek)',
  'Underweight (BB Kurang)',
  'Risiko Gizi Lebih / Obesitas',
  'Gizi Baik (Normal)'
];

export const InputLaporanPosyanduView: React.FC<InputLaporanPosyanduViewProps> = ({
  currentUser,
  onRefreshData,
  onNavigateTab
}) => {
  const kelurahanList = useMemo(() => storageService.getKelurahanList(), []);
  const allPosyanduList = useMemo(() => storageService.getPosyanduList(), []);
  
  // State Filter Riwayat
  const [filterKelurahanRiwayat, setFilterKelurahanRiwayat] = useState<string>('ALL');
  const [filterBulanRiwayat, setFilterBulanRiwayat] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form State
  const defaultKel = kelurahanList[0]?.kelurahan_id || 'KEL-01';
  const [selectedKelurahanId, setSelectedKelurahanId] = useState<string>(defaultKel);
  const posyanduFiltered = useMemo(() => {
    return allPosyanduList.filter(p => p.kelurahan_id === selectedKelurahanId);
  }, [allPosyanduList, selectedKelurahanId]);

  const [selectedPosyanduId, setSelectedPosyanduId] = useState<string>(() => {
    const matched = allPosyanduList.find(p => p.kelurahan_id === defaultKel);
    return matched ? matched.posyandu_id : (allPosyanduList[0]?.posyandu_id || 'POS-01');
  });

  const activePosyandu = useMemo(() => {
    return allPosyanduList.find(p => p.posyandu_id === selectedPosyanduId) || posyanduFiltered[0];
  }, [allPosyanduList, selectedPosyanduId, posyanduFiltered]);

  const todayIso = new Date().toISOString().split('T')[0];
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>(todayIso);
  const [bulan, setBulan] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState<string>('2026');
  const [petugasPelapor, setPetugasPelapor] = useState<string>(currentUser.nama || 'Ibu Kader Posyandu');
  const [noWaPetugas, setNoWaPetugas] = useState<string>(currentUser.no_wa || '6281299887711');

  // Angka Penimbangan (S, D, T)
  const [totalSasaran, setTotalSasaran] = useState<number>(() => activePosyandu?.total_sasaran || 95);
  const [totalDitimbang, setTotalDitimbang] = useState<number>(85);
  const [keteranganSweeping, setKeteranganSweeping] = useState<string>(
    'Balita tidak hadir dijadwalkan sweeping kunjungan rumah bersama nakes pustu & TPK kelurahan.'
  );

  // Update Sasaran when posyandu changes
  const handleSelectPosyandu = (posId: string) => {
    setSelectedPosyanduId(posId);
    const p = allPosyanduList.find(item => item.posyandu_id === posId);
    if (p) {
      setTotalSasaran(p.total_sasaran);
      setTotalDitimbang(Math.round(p.total_sasaran * 0.85));
    }
  };

  const handleSelectKelurahan = (kelId: string) => {
    setSelectedKelurahanId(kelId);
    const inKel = allPosyanduList.filter(p => p.kelurahan_id === kelId);
    if (inKel.length > 0) {
      setSelectedPosyanduId(inKel[0].posyandu_id);
      setTotalSasaran(inKel[0].total_sasaran);
      setTotalDitimbang(Math.round(inKel[0].total_sasaran * 0.85));
    }
  };

  // Kalkulasi Otomatis
  const totalTidakHadir = Math.max(0, totalSasaran - totalDitimbang);
  const persentaseDS = totalSasaran > 0 ? (totalDitimbang / totalSasaran) * 100 : 0;

  // Daftar Balita Kurang Gizi yang Ditemukan
  const [daftarBalitaKurangGizi, setDaftarBalitaKurangGizi] = useState<BalitaKurangGiziInput[]>([]);

  // Modal Notifikasi WhatsApp Lintas Sektor
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    laporan?: LaporanPosyandu;
    notifications: WhatsAppNotification[];
    tindakLanjutList: TindakLanjut[];
  }>({ notifications: [], tindakLanjutList: [] });

  // Modal Detail Laporan Riwayat
  const [selectedDetailLaporan, setSelectedDetailLaporan] = useState<LaporanPosyandu | null>(null);

  // Handler Tambah Item Balita Kurang Gizi
  const handleAddBalitaKurangGizi = () => {
    const newItem: BalitaKurangGiziInput = {
      id: `BG-INP-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      nama_balita: '',
      nik: '',
      nama_ortu: '',
      no_wa_ortu: '',
      jenis_kelamin: 'L',
      tanggal_lahir: '2024-06-15',
      usia_bulan: 24,
      berat_badan: 7.5,
      tinggi_badan: 75.0,
      lila: 11.5,
      status_gizi: 'Wasting (Kurus/Gizi Kurang)',
      catatan_kondisi: 'BB tidak naik dalam 2 kali penimbangan, nafsu makan menurun.',
      rencana_tindak_lanjut: 'Pemberian PMT Pemulihan pangan lokal protein tinggi dan rujukan poli gizi puskesmas.'
    };
    setDaftarBalitaKurangGizi(prev => [...prev, newItem]);
  };

  const handleUpdateBalita = (id: string, field: keyof BalitaKurangGiziInput, val: any) => {
    setDaftarBalitaKurangGizi(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleRemoveBalita = (id: string) => {
    setDaftarBalitaKurangGizi(prev => prev.filter(item => item.id !== id));
  };

  // Submit Laporan Posyandu
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  const handleSubmitLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePosyandu) return;

    setIsSubmitting(true);
    setSubmitSuccessMsg('');

    try {
      const selectedKel = kelurahanList.find(k => k.kelurahan_id === selectedKelurahanId);
      const newLaporan: LaporanPosyandu = {
        laporan_id: `LAP-POS-${Date.now().toString().slice(-6)}`,
        tanggal_pelaksanaan: tanggalPelaksanaan,
        bulan,
        tahun,
        kelurahan_id: selectedKelurahanId,
        kelurahan_nama: selectedKel?.nama_kelurahan || 'Kelurahan Pulau Tidung',
        posyandu_id: activePosyandu.posyandu_id,
        posyandu_nama: activePosyandu.nama_posyandu,
        petugas_pelapor: petugasPelapor,
        no_wa_petugas: noWaPetugas,
        total_sasaran: Number(totalSasaran),
        total_ditimbang: Number(totalDitimbang),
        total_tidak_hadir: totalTidakHadir,
        persentase_d_s: Math.round(persentaseDS * 10) / 10,
        keterangan_sweeping: keteranganSweeping,
        daftar_balita_kurang_gizi: daftarBalitaKurangGizi,
        status_notifikasi_wa: 'TERKIRIM',
        created_at: new Date().toLocaleDateString('id-ID'),
        created_by: currentUser.nama
      };

      const res = await apiService.saveLaporanPosyandu(newLaporan);
      onRefreshData();

      // Jika ada balita kurang gizi, tampilkan modal broadcast WA
      if (daftarBalitaKurangGizi.length > 0) {
        setBroadcastResult({
          laporan: res.savedLaporan,
          notifications: res.createdNotifications,
          tindakLanjutList: res.createdTindakLanjut
        });
        setIsBroadcastModalOpen(true);
      } else {
        setSubmitSuccessMsg('Laporan Posyandu berhasil disimpan. Tidak ada temuan balita kurang gizi.');
        setTimeout(() => setSubmitSuccessMsg(''), 5000);
      }

      // Reset daftar balita kurang gizi form
      setDaftarBalitaKurangGizi([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Riwayat Laporan Posyandu
  const riwayatLaporan = storageService.getLaporanPosyanduList({
    kelurahan_id: filterKelurahanRiwayat !== 'ALL' ? filterKelurahanRiwayat : undefined,
    bulan: filterBulanRiwayat !== 'ALL' ? filterBulanRiwayat : undefined
  }).filter(lap => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lap.posyandu_nama.toLowerCase().includes(q) ||
      lap.kelurahan_nama.toLowerCase().includes(q) ||
      lap.petugas_pelapor.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#102d52] via-[#0f3d6d] to-[#125894] rounded-2xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/20 border border-sky-300/30 text-sky-200 text-xs font-semibold">
              <ClipboardList className="w-3.5 h-3.5 text-amber-300" />
              <span>Modul Petugas Posyandu & Kader Wilayah Kepulauan</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Input Laporan Penimbangan Posyandu
            </h1>
            <p className="text-xs md:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
              Petugas melaporkan hasil penimbangan bulanan (Sasaran, Ditimbang, dan Tidak Hadir). 
              Balita yang terindikasi kurang gizi otomatis diteruskan ke <strong>Daftar Tindak Lanjut</strong> dan memicu <strong>Notifikasi WhatsApp Lintas Sektor</strong> (Lurah, PKK, TPK, Puskesmas).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl px-3.5 py-2 text-xs">
              <div className="text-[11px] text-sky-200">Petugas Aktif</div>
              <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentUser.nama}</span>
              </div>
              <div className="text-[10px] text-sky-300 font-mono mt-0.5">
                Peran: {currentUser.role.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none">
          <svg width="240" height="140" viewBox="0 0 240 140" fill="none">
            <circle cx="160" cy="70" r="100" fill="white" />
          </svg>
        </div>
      </div>

      {/* Success Alert */}
      {submitSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* FORM INPUT LAPORAN UTAMA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Formulir Rekapitulasi Penimbangan Posyandu
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Isi data cakupan penimbangan dan input balita yang membutuhkan tindak lanjut gizi
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitLaporan} className="p-4 md:p-6 space-y-6">
          
          {/* Bagian 1: Identitas & Lokasi Posyandu */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>1. Identitas Lokasi & Jadwal Pelayanan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Kelurahan */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kelurahan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedKelurahanId}
                  onChange={(e) => handleSelectKelurahan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  {kelurahanList.map(k => (
                    <option key={k.kelurahan_id} value={k.kelurahan_id}>
                      {k.nama_kelurahan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Posyandu */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Posyandu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPosyanduId}
                  onChange={(e) => handleSelectPosyandu(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  {posyanduFiltered.map(p => (
                    <option key={p.posyandu_id} value={p.posyandu_id}>
                      {p.nama_posyandu} ({p.pulau_nama} - {p.rw})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Pelaksanaan */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalPelaksanaan}
                  onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Periode Bulan */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bulan
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                      return <option key={m} value={m}>{names[i]}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tahun
                  </label>
                  <input
                    type="text"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-slate-800 dark:text-slate-200 text-center font-mono"
                  />
                </div>
              </div>

            </div>

            {/* Info Posyandu terpilih */}
            {activePosyandu && (
              <div className="mt-3 p-3 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-xl text-xs text-sky-900 dark:text-sky-300 flex flex-wrap items-center gap-x-5 gap-y-1">
                <div><strong>Wilayah:</strong> {activePosyandu.pulau_nama} · {activePosyandu.rw} / {activePosyandu.rt}</div>
                <div><strong>Ketua Kader:</strong> {activePosyandu.ketua_kader}</div>
                <div><strong>No. WA Posyandu:</strong> {activePosyandu.no_wa_kader}</div>
                <div><strong>Jadwal Rutin:</strong> {activePosyandu.jadwal_hari}</div>
              </div>
            )}
          </div>

          {/* Bagian 2: Data Hasil Penimbangan (S, D, T) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Rekapitulasi Penimbangan Balita (S / D / T)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Sasaran (S) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Total Sasaran Balita (S)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={totalSasaran}
                    onChange={(e) => setTotalSasaran(Number(e.target.value))}
                    className="w-full text-base font-bold text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <span className="text-xs text-slate-500 font-medium">Anak</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Data sasaran posyandu</div>
              </div>

              {/* Total Ditimbang (D) */}
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/30">
                <label className="block text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1">
                  Jumlah Bayi Ditimbang (D)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={totalSasaran}
                    value={totalDitimbang}
                    onChange={(e) => setTotalDitimbang(Number(e.target.value))}
                    className="w-full text-base font-bold text-sky-700 dark:text-sky-300 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                    required
                  />
                  <span className="text-xs text-slate-500 font-medium">Anak</span>
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">Hadir & ditimbang di pos</div>
              </div>

              {/* Tidak Hadir (T = S - D) */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
                <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  Bayi Tidak Hadir (T)
                </label>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-200 py-1 font-mono">
                  {totalTidakHadir} <span className="text-xs font-normal text-amber-700">Anak</span>
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400">
                  Otomatis (S - D)
                </div>
              </div>

              {/* Cakupan D/S (%) */}
              <div className={`p-4 rounded-xl border ${
                persentaseDS >= 80 
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30' 
                  : 'border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30'
              }`}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Cakupan Penimbangan (D/S)
                </label>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black font-mono ${
                    persentaseDS >= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {persentaseDS.toFixed(1)}%
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    persentaseDS >= 80 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                  }`}>
                    {persentaseDS >= 80 ? 'Target Terpenuhi' : 'Perlu Sweeping'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Standar SPM Nasional: ≥ 80%</div>
              </div>

            </div>

            {/* Catatan Sweeping untuk balita yang tidak hadir */}
            {totalTidakHadir > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rencana Sweeping / Kunjungan Rumah untuk {totalTidakHadir} Balita Tidak Hadir:
                </label>
                <input
                  type="text"
                  value={keteranganSweeping}
                  onChange={(e) => setKeteranganSweeping(e.target.value)}
                  placeholder="Contoh: Sweeping dijadwalkan hari Rabu bersama kader dan tim TPK..."
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          {/* Bagian 3: Input Balita Kurang Gizi yang Ditemukan */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5 text-rose-600" />
                  <span>3. Input Temuan Bayi / Balita Kurang Gizi & Bermasalah Gizi</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Setiap balita yang dimasukkan di sini akan <strong>otomatis terdaftar ke Daftar Tindak Lanjut</strong> dan memicu <strong>Notifikasi WhatsApp Lintas Sektor</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddBalitaKurangGizi}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Balita Bermasalah Gizi</span>
              </button>
            </div>

            {daftarBalitaKurangGizi.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <Baby className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Balita Kurang Gizi yang Ditambahkan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-3">
                  Jika pada sesi penimbangan ini ditemukan balita gizi kurang, gizi buruk, stunting, atau underweight, klik tombol di bawah untuk mendata dan memicu notifikasi lintas sektor.
                </p>
                <button
                  type="button"
                  onClick={handleAddBalitaKurangGizi}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Temuan Kasus Gizi</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {daftarBalitaKurangGizi.map((balita, idx) => (
                  <div 
                    key={balita.id} 
                    className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 relative space-y-4 transition-all"
                  >
                    {/* Header Balita Card */}
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          Data Kasus Balita #{idx + 1}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-semibold">
                          Otomatis Kirim WA ke Lintas Sektor
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBalita(balita.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100/50"
                        title="Hapus data balita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Input Grid Balita */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      
                      {/* Nama Lengkap Balita */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Balita <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: An. Muhammad Rizki"
                          value={balita.nama_balita}
                          onChange={(e) => handleUpdateBalita(balita.id, 'nama_balita', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-2 focus:ring-rose-500 font-medium"
                        />
                      </div>

                      {/* NIK Balita */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          NIK Balita (16 Digit)
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="310101..."
                          value={balita.nik}
                          onChange={(e) => handleUpdateBalita(balita.id, 'nik', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-2 focus:ring-rose-500 font-mono"
                        />
                      </div>

                      {/* Nama Orang Tua / Wali */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Bpk / Ibu..."
                          value={balita.nama_ortu}
                          onChange={(e) => handleUpdateBalita(balita.id, 'nama_ortu', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* No WA Orang Tua */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          No. WA Orang Tua
                        </label>
                        <input
                          type="text"
                          placeholder="628..."
                          value={balita.no_wa_ortu}
                          onChange={(e) => handleUpdateBalita(balita.id, 'no_wa_ortu', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-2 focus:ring-rose-500 font-mono"
                        />
                      </div>

                      {/* Jenis Kelamin & Tanggal Lahir */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Jenis Kelamin
                          </label>
                          <select
                            value={balita.jenis_kelamin}
                            onChange={(e) => handleUpdateBalita(balita.id, 'jenis_kelamin', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5"
                          >
                            <option value="L">Laki-Laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Usia (Bulan)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={balita.usia_bulan}
                            onChange={(e) => handleUpdateBalita(balita.id, 'usia_bulan', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-center font-bold"
                          />
                        </div>
                      </div>

                      {/* BB, TB, LiLA */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Berat Badan (BB) kg
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={balita.berat_badan}
                            onChange={(e) => handleUpdateBalita(balita.id, 'berat_badan', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 font-bold"
                          />
                          <span className="text-[10px] text-slate-500">kg</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tinggi / Panjang Badan (TB)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={balita.tinggi_badan}
                            onChange={(e) => handleUpdateBalita(balita.id, 'tinggi_badan', Number(e.target.value))}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 font-bold"
                          />
                          <span className="text-[10px] text-slate-500">cm</span>
                        </div>
                      </div>

                      {/* Status Masalah Gizi */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Kategori Masalah Gizi <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={balita.status_gizi}
                          onChange={(e) => handleUpdateBalita(balita.id, 'status_gizi', e.target.value as KategoriMasalahGizi)}
                          className="w-full text-xs rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 px-2 py-1.5 font-bold text-rose-700 dark:text-rose-400 focus:ring-2 focus:ring-rose-500"
                        >
                          {KATEGORI_GIZI_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Catatan & Rencana Intervensi Tindak Lanjut */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Catatan Kondisi / Gejala Klinis:
                        </label>
                        <textarea
                          rows={2}
                          value={balita.catatan_kondisi}
                          onChange={(e) => handleUpdateBalita(balita.id, 'catatan_kondisi', e.target.value)}
                          placeholder="Misal: Nafsu makan kurang, riwayat batuk pilek, tidak mau makan lauk..."
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Rencana Intervensi Tindak Lanjut Awal:
                        </label>
                        <textarea
                          rows={2}
                          value={balita.rencana_tindak_lanjut}
                          onChange={(e) => handleUpdateBalita(balita.id, 'rencana_tindak_lanjut', e.target.value)}
                          placeholder="Misal: Segera koordinasi dengan TPK kelurahan & pemberian PMT lokal 90 hari..."
                          className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian 4: Petugas Pelapor & Tombol Simpan */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <strong>Petugas Pelapor:</strong> {petugasPelapor}
              </div>
              <div>
                <strong>No. WA:</strong> {noWaPetugas}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan & Menyiapkan Notifikasi...' : 'Simpan Laporan & Kirim Notifikasi WA'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* RIWAYAT LAPORAN POSYANDU */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Header Filter */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Riwayat Rekapitulasi Laporan Posyandu</span>
              <span className="text-xs bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full">
                {riwayatLaporan.length} Laporan
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar penimbangan yang telah dilaporkan petugas dan tersimpan dalam sistem
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kelurahan */}
            <select
              value={filterKelurahanRiwayat}
              onChange={(e) => setFilterKelurahanRiwayat(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Kelurahan</option>
              {kelurahanList.map(k => (
                <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
              ))}
            </select>

            {/* Filter Bulan */}
            <select
              value={filterBulanRiwayat}
              onChange={(e) => setFilterBulanRiwayat(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Bulan</option>
              <option value="10">Oktober 2026</option>
              <option value="09">September 2026</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari posyandu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-36 sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Tanggal & Posyandu</th>
                <th className="py-3 px-4">Wilayah Kelurahan</th>
                <th className="py-3 px-4 text-center">Sasaran (S)</th>
                <th className="py-3 px-4 text-center">Ditimbang (D)</th>
                <th className="py-3 px-4 text-center">Tidak Hadir (T)</th>
                <th className="py-3 px-4 text-center">Cakupan (D/S)</th>
                <th className="py-3 px-4 text-center">Temuan Masalah Gizi</th>
                <th className="py-3 px-4">Pelapor</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {riwayatLaporan.map((lap) => {
                const temuanCount = lap.daftar_balita_kurang_gizi?.length || 0;
                return (
                  <tr key={lap.laporan_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{lap.posyandu_nama}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{lap.tanggal_pelaksanaan}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs">{lap.kelurahan_nama}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-semibold font-mono">
                      {lap.total_sasaran}
                    </td>

                    <td className="py-3 px-4 text-center font-bold font-mono text-sky-600 dark:text-sky-400">
                      {lap.total_ditimbang}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      {lap.total_tidak_hadir}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lap.persentase_d_s >= 80 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {lap.persentase_d_s.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {temuanCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{temuanCount} Kasus Gizi</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Normal</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{lap.petugas_pelapor}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{lap.no_wa_petugas || '-'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedDetailLaporan(lap)}
                        className="px-2.5 py-1 text-[11px] bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg font-semibold transition-colors border border-sky-200 dark:border-sky-800"
                      >
                        Detail & Cetak
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOTIFIKASI WHATSAPP BROADCAST LINTAS SEKTOR (MUNCUL OTOMATIS SAAT TEMUAN GIZI DIINPUT) */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-rose-200 uppercase tracking-wider">
                    Sistem Notifikasi Darurat Gizi WhatsApp
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Pemberitahuan Lintas Sektor Otomatis Terkirim!
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Alert Info */}
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-900 dark:text-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Ditemukan {broadcastResult.laporan?.daftar_balita_kurang_gizi.length} Balita Bermasalah Gizi di {broadcastResult.laporan?.posyandu_nama}!
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    Data balita telah otomatis didaftarkan ke <strong>Daftar Tindak Lanjut</strong> dan siap diintervensi oleh petugas Puskesmas & Tim Pendamping Keluarga (TPK).
                  </p>
                </div>
              </div>

              {/* Daftar Balita Yang Ditemukan */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Daftar Balita Yang Membutuhkan Tindak Lanjut:
                </h4>
                <div className="space-y-2">
                  {broadcastResult.laporan?.daftar_balita_kurang_gizi.map((b, i) => (
                    <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{i + 1}. {b.nama_balita}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 font-bold">
                            {b.status_gizi}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Usia: {b.usia_bulan} bln · BB: {b.berat_badan} kg · TB: {b.tinggi_badan} cm · Ortu: {b.nama_ortu}
                        </div>
                      </div>
                      <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium sm:text-right">
                        Rencana: {b.rencana_tindak_lanjut}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daftar Stakeholder Lintas Sektor Yang Ternotifikasi */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Stakeholders Lintas Sektor yang Telah Masuk Antrean Broadcast WA ({broadcastResult.notifications.length} Kontak):
                </h4>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {broadcastResult.notifications.map((notif) => (
                    <div key={notif.notif_id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {notif.penerima_nama}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>{notif.penerima_role}</span>
                          <span>•</span>
                          <span className="font-mono">{notif.penerima_wa}</span>
                        </div>
                      </div>

                      <a
                        href={notif.link_wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Pesan WhatsApp terformat otomatis sesuai standar protokol Puskesmas
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  Tutup
                </button>
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      setIsBroadcastModalOpen(false);
                      onNavigateTab('tindak-lanjut');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Lihat Daftar Tindak Lanjut</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DETAIL & CETAK LAPORAN POSYANDU */}
      {selectedDetailLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Lembar Rekapitulasi Kegiatan Penimbangan Posyandu
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetailLaporan(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs printable-content">
              {/* Kop Surat Puskesmas */}
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                <h2 className="text-xs font-bold uppercase text-slate-600 tracking-wider">Pemerintah Provinsi DKI Jakarta · Dinas Kesehatan</h2>
                <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">Puskesmas Kepulauan Seribu Selatan</h1>
                <p className="text-[10px] text-slate-500">Laporan Monitoring Gizi Terintegrasi (DERMAGA GIZI) · Wilayah Kerja Kepulauan</p>
              </div>

              {/* Informasi Laporan */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div><strong>Posyandu:</strong> {selectedDetailLaporan.posyandu_nama}</div>
                <div><strong>Tanggal Kegiatan:</strong> {selectedDetailLaporan.tanggal_pelaksanaan}</div>
                <div><strong>Kelurahan:</strong> {selectedDetailLaporan.kelurahan_nama}</div>
                <div><strong>Pelapor:</strong> {selectedDetailLaporan.petugas_pelapor}</div>
              </div>

              {/* Angka Penimbangan */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 border rounded-lg">
                  <div className="text-[10px] text-slate-500">Sasaran (S)</div>
                  <div className="text-base font-bold">{selectedDetailLaporan.total_sasaran}</div>
                </div>
                <div className="p-2 border rounded-lg bg-sky-50 dark:bg-sky-950/30">
                  <div className="text-[10px] text-sky-600">Ditimbang (D)</div>
                  <div className="text-base font-bold text-sky-700">{selectedDetailLaporan.total_ditimbang}</div>
                </div>
                <div className="p-2 border rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <div className="text-[10px] text-amber-600">Tidak Hadir (T)</div>
                  <div className="text-base font-bold text-amber-700">{selectedDetailLaporan.total_tidak_hadir}</div>
                </div>
                <div className="p-2 border rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="text-[10px] text-emerald-600">Cakupan (D/S)</div>
                  <div className="text-base font-bold text-emerald-700">{selectedDetailLaporan.persentase_d_s}%</div>
                </div>
              </div>

              {/* Keterangan Sweeping */}
              {selectedDetailLaporan.keterangan_sweeping && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-900 dark:text-amber-200">
                  <strong>Rencana Sweeping:</strong> {selectedDetailLaporan.keterangan_sweeping}
                </div>
              )}

              {/* Temuan Balita Kurang Gizi */}
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Daftar Kasus Balita Bermasalah Gizi ({selectedDetailLaporan.daftar_balita_kurang_gizi?.length || 0} Anak):
                </h4>
                {selectedDetailLaporan.daftar_balita_kurang_gizi?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDetailLaporan.daftar_balita_kurang_gizi.map((b, i) => (
                      <div key={b.id} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>{i + 1}. {b.nama_balita} ({b.jenis_kelamin})</span>
                          <span className="text-rose-600 font-semibold">{b.status_gizi}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          NIK: {b.nik || '-'} · Usia: {b.usia_bulan} bln · BB: {b.berat_badan}kg · TB: {b.tinggi_badan}cm · LiLA: {b.lila || '-'}cm
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300">
                          <strong>Orang Tua:</strong> {b.nama_ortu} ({b.no_wa_ortu || '-'})
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-300">
                          <strong>Tindak Lanjut:</strong> {b.rencana_tindak_lanjut}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Tidak ada temuan kasus balita kurang gizi pada laporan ini.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedDetailLaporan(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Rekapitulasi</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
