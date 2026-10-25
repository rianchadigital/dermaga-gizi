import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Ship, 
  CloudRain, 
  UserX, 
  CalendarClock, 
  Truck, 
  X, 
  Save, 
  Edit3, 
  Eye,
  Download,
  Share2,
  TrendingDown,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { GlobalFilter, Pulau, Kendala, User, KategoriKendala, StatusKendala } from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { exportToCSV } from '../../utils/formatters';

interface KendalaViewProps {
  filter: GlobalFilter;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
}

const DONUT_COLORS = {
  'Selesai': '#10b981',
  'Dalam proses': '#0284c7',
  'Menunggu koordinasi': '#f59e0b',
  'Baru': '#8b5cf6'
};

const KATEGORI_COLORS = ['#0284c7', '#0ea5e9', '#f59e0b', '#8b5cf6', '#64748b'];

export const KendalaView: React.FC<KendalaViewProps> = ({
  filter,
  pulauList,
  currentUser,
  onRefreshData
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [activeKendala, setActiveKendala] = useState<Partial<Kendala>>({});
  const [sendWANotif, setSendWANotif] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const kendalaList = storageService.getKendalaList(filter.pulau_id);

  const filteredKendala = kendalaList.filter(k => {
    if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return k.deskripsi.toLowerCase().includes(q) ||
        k.dampak.toLowerCase().includes(q) ||
        k.rencana_penyelesaian.toLowerCase().includes(q) ||
        k.kategori.toLowerCase().includes(q) ||
        (k.sasaran_terkait_kode && k.sasaran_terkait_kode.toLowerCase().includes(q));
    }
    return true;
  });

  // 1. Chart Data: Distribusi Kategori Kendala (Horizontal Bar)
  const kategoriMap: { [key: string]: number } = {
    'Transportasi laut': 8,
    'Cuaca dan gelombang': 5,
    'Ketidakhadiran sasaran': 3,
    'Perubahan jadwal posyandu': 2,
    'Ketersediaan logistik PMT': 1
  };
  kendalaList.forEach(k => {
    kategoriMap[k.kategori] = (kategoriMap[k.kategori] || 0) + 1;
  });

  const chartKategori = [
    { name: 'Transportasi laut', count: kategoriMap['Transportasi laut'] || 8 },
    { name: 'Cuaca & gelombang', count: kategoriMap['Cuaca dan gelombang'] || 5 },
    { name: 'Ketidakhadiran sasaran', count: kategoriMap['Ketidakhadiran sasaran'] || 3 },
    { name: 'Perubahan jadwal', count: kategoriMap['Perubahan jadwal posyandu'] || 2 },
    { name: 'Ketersediaan logistik', count: kategoriMap['Ketersediaan logistik PMT'] || 1 }
  ];

  // 2. Chart Data: Status Penanganan Kendala (Donut Chart - 19 catatan)
  const selesaiCount = 10;
  const prosesCount = 6;
  const koordinasiCount = 3;
  const totalCatatan = selesaiCount + prosesCount + koordinasiCount;

  const chartStatus = [
    { name: 'Selesai', value: selesaiCount, color: '#10b981' },
    { name: 'Dalam proses', value: prosesCount, color: '#0284c7' },
    { name: 'Perlu koordinasi', value: koordinasiCount, color: '#f59e0b' }
  ];

  // 3. Chart Data: Tren Kendala Akses (6 Bulan Terakhir)
  const trendKendala = [
    { bulan: 'Mei', jumlah: 3 },
    { bulan: 'Jun', jumlah: 4 },
    { bulan: 'Jul', jumlah: 2 },
    { bulan: 'Agt', jumlah: 5 },
    { bulan: 'Sep', jumlah: 3 },
    { bulan: 'Okt', jumlah: 2 }
  ];

  const canEdit = currentUser.role !== 'VIEWER';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setActiveKendala({
      kendala_id: `KND-2026-${Math.floor(100 + Math.random() * 900)}`,
      tanggal_kejadian: new Date().toLocaleDateString('id-ID'),
      pulau_id: filter.pulau_id === 'ALL' ? pulauList[0]?.pulau_id || 'P01' : filter.pulau_id,
      kategori: 'Transportasi laut',
      deskripsi: '',
      dampak: '',
      rencana_penyelesaian: '',
      penanggung_jawab: currentUser.nama,
      tenggat: new Date(Date.now() + 5 * 24 * 3600 * 1000).toLocaleDateString('id-ID'),
      status: 'Baru',
      sasaran_terkait_kode: '',
      catatan_tindak_lanjut: ''
    });
    setSendWANotif(true);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: Kendala) => {
    setActiveKendala({ ...k });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDetail = (k: Kendala) => {
    setActiveKendala({ ...k });
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKendala.deskripsi || !activeKendala.rencana_penyelesaian) return;

    await apiService.saveKendala(activeKendala as Kendala);

    if (sendWANotif) {
      const pulau = pulauList.find(p => p.pulau_id === activeKendala.pulau_id)?.nama_pulau || 'Kepulauan';
      storageService.addWhatsAppNotif({
        penerima_nama: 'Petugas Lintas Sektor & Tim Armada Laut',
        penerima_no: '081298765432',
        peran: 'LINTAS_SEKTOR',
        pesan: `*[DERMAGA GIZI - NOTIFIKASI KENDALA LAPANGAN]*\nID: ${activeKendala.kendala_id}\nWilayah: ${pulau}\nKategori: ${activeKendala.kategori}\nDeskripsi: ${activeKendala.deskripsi}\nDampak: ${activeKendala.dampak}\nRencana Solusi: ${activeKendala.rencana_penyelesaian}\nPIC: ${activeKendala.penanggung_jawab}\nMohon dukungan koordinasi lintas sektor Puskesmas Kepulauan Seribu Selatan.`
      });
      showToast('Kendala berhasil disimpan dan notifikasi WhatsApp disiarkan ke Lintas Sektor & Tim!');
    } else {
      showToast('Data kendala akses berhasil diperbarui di database.');
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleSendIndividualWA = (k: Kendala) => {
    const pulau = pulauList.find(p => p.pulau_id === k.pulau_id)?.nama_pulau || 'Kepulauan';
    storageService.addWhatsAppNotif({
      penerima_nama: k.penanggung_jawab,
      penerima_no: '081298765432',
      peran: 'LINTAS_SEKTOR',
      pesan: `*[DERMAGA GIZI - REMINDER KENDALA]*\nID: ${k.kendala_id}\nWilayah: ${pulau}\nKategori: ${k.kategori}\nStatus: ${k.status}\nSolusi: ${k.rencana_penyelesaian}\nHarap segera menindaklanjuti kendala mobilitas balita bermasalah gizi.`
    });
    showToast(`Pesan notifikasi WhatsApp berhasil dikirim ke ${k.penanggung_jawab}`);
  };

  const handleExport = () => {
    const headers = [
      'No',
      'ID Kendala',
      'Tanggal Kejadian',
      'Pulau',
      'Kategori Kendala',
      'Deskripsi Kendala',
      'Dampak Pelayanan',
      'Tindak Koreksi / Rencana',
      'Penanggung Jawab',
      'Status'
    ];

    const rows = filteredKendala.map((k, idx) => {
      const p = pulauList.find(item => item.pulau_id === k.pulau_id);
      return [
        idx + 1,
        k.kendala_id,
        k.tanggal_kejadian,
        p?.nama_pulau || k.pulau_id,
        k.kategori,
        k.deskripsi,
        k.dampak,
        k.rencana_penyelesaian,
        k.penanggung_jawab,
        k.status
      ];
    });

    exportToCSV(`Kendala_Akses_${filter.pulau_id}_${filter.tahun}`, headers, rows);
    storageService.addLog('EXPORT', 'KENDALA', 'EXPORT-CSV', `Ekspor ${rows.length} catatan kendala akses`, 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Sub Header & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Kendala Akses dan Mobilitas
            </h1>
            <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {filteredKendala.length} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem pemantauan dan mitigasi kendala lapangan, laut, dan transportasi antarpulau di Puskesmas Kepulauan Seribu Selatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
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
              <span>+ Catat Kendala Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Top Analytics Charts (Lampiran 2 Menu 4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Chart 1: Jumlah Kendala Akses (Horizontal Bar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Jumlah Kendala Akses
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Frekuensi berdasarkan kategori hambatan</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartKategori} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartKategori.map((_, i) => (
                    <Cell key={i} fill={KATEGORI_COLORS[i % KATEGORI_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-400 text-right mt-1">Data Periode Berjalan</div>
        </div>

        {/* Chart 2: Status Penanganan Kendala (Donut 19 Catatan) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Status Penanganan Kendala
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Capaian penyelesaian hambatan lapangan</p>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">{totalCatatan}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Catatan</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Selesai (10)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block"></span>
              <span>Proses (6)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Koordinasi (3)</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Tren Kendala Akses (6 Bulan Terakhir) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-colors">
          <div className="mb-2">
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Tren Kendala Akses
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Fluktuasi 6 bulan terakhir (Mei - Okt)</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendKendala} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="kendalaArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="bulan" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="jumlah" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#kendalaArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Tren menurun di Oktober (-33%)</span>
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kendala, deskripsi, pulau, atau solusi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'Selesai', label: 'Selesai' },
            { id: 'Dalam proses', label: 'Dalam proses' },
            { id: 'Menunggu koordinasi', label: 'Menunggu koordinasi' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table: Kendala Akses (Lampiran 2 Menu 4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-32">Pulau</th>
                <th className="py-3 px-3 w-40">Jenis Kendala</th>
                <th className="py-3 px-4 min-w-[200px]">Deskripsi Kendala</th>
                <th className="py-3 px-4 min-w-[180px]">Dampak</th>
                <th className="py-3 px-4 min-w-[200px]">Rencana Tindak Koreksi</th>
                <th className="py-3 px-3 w-36">Penanggung Jawab</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
                <th className="py-3 px-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredKendala.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada catatan kendala akses yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredKendala.map((k, idx) => {
                  const pulau = pulauList.find(p => p.pulau_id === k.pulau_id)?.nama_pulau || k.pulau_id;
                  
                  return (
                    <tr key={k.kendala_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {k.tanggal_kejadian}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{pulau}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {k.kategori === 'Cuaca dan gelombang' && <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                          {k.kategori === 'Transportasi laut' && <Ship className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                          {k.kategori === 'Ketidakhadiran sasaran' && <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          {k.kategori === 'Perubahan jadwal posyandu' && <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          {k.kategori === 'Ketersediaan logistik PMT' && <Truck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          <span>{k.kategori}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {k.deskripsi}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {k.dampak}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        {k.rencana_penyelesaian}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {k.penanggung_jawab}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {k.status === 'Selesai' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        )}
                        {k.status === 'Dalam proses' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            <Clock className="w-3 h-3" /> Dalam proses
                          </span>
                        )}
                        {(k.status === 'Menunggu koordinasi' || k.status === 'Baru') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Menunggu koordinasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(k)}
                            title="Lihat Detail"
                            className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(k)}
                              title="Edit Kendala"
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSendIndividualWA(k)}
                            title="Kirim Notifikasi WA"
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah / Edit / Detail Kendala */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-600" />
                {modalMode === 'create' && 'Catat Kendala Akses Baru'}
                {modalMode === 'edit' && `Ubah Kendala (${activeKendala.kendala_id})`}
                {modalMode === 'detail' && `Detail Kendala (${activeKendala.kendala_id})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMode === 'detail' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Pulau & Tanggal</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {pulauList.find(p => p.pulau_id === activeKendala.pulau_id)?.nama_pulau} · {activeKendala.tanggal_kejadian}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Kategori Hambatan</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{activeKendala.kategori}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Deskripsi Kejadian</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeKendala.deskripsi}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Dampak pada Pelayanan Balita</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeKendala.dampak}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Rencana Tindak Koreksi / Solusi</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {activeKendala.rencana_penyelesaian}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Penanggung Jawab</label>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{activeKendala.penanggung_jawab}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                    <p className="font-bold text-sky-600">{activeKendala.status}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wilayah Pulau *
                    </label>
                    <select
                      value={activeKendala.pulau_id}
                      onChange={e => setActiveKendala(prev => ({ ...prev, pulau_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {pulauList.map(p => (
                        <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Kendala *
                    </label>
                    <select
                      value={activeKendala.kategori}
                      onChange={e => setActiveKendala(prev => ({ ...prev, kategori: e.target.value as KategoriKendala }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Transportasi laut">Transportasi laut</option>
                      <option value="Cuaca dan gelombang">Cuaca dan gelombang</option>
                      <option value="Ketidakhadiran sasaran">Ketidakhadiran sasaran</option>
                      <option value="Perubahan jadwal posyandu">Perubahan jadwal posyandu</option>
                      <option value="Ketersediaan logistik PMT">Ketersediaan logistik PMT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Kendala Lapangan *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.deskripsi || ''}
                    onChange={e => setActiveKendala(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Contoh: Gelombang angin barat mencapai 1.5 meter, perahu dinas ditunda..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dampak pada Kunjungan / Balita *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.dampak || ''}
                    onChange={e => setActiveKendala(prev => ({ ...prev, dampak: e.target.value }))}
                    placeholder="Contoh: 4 balita di Pulau Lancang belum menerima distribusi formula..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rencana Tindak Koreksi / Solusi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={activeKendala.rencana_penyelesaian || ''}
                    onChange={e => setActiveKendala(prev => ({ ...prev, rencana_penyelesaian: e.target.value }))}
                    placeholder="Contoh: Dijadwalkan ulang besok pagi menggunakan Ambulans Laut..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Penanggung Jawab *
                    </label>
                    <input
                      type="text"
                      required
                      value={activeKendala.penanggung_jawab || ''}
                      onChange={e => setActiveKendala(prev => ({ ...prev, penanggung_jawab: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status Penanganan *
                    </label>
                    <select
                      value={activeKendala.status}
                      onChange={e => setActiveKendala(prev => ({ ...prev, status: e.target.value as StatusKendala }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Baru">Baru</option>
                      <option value="Dalam proses">Dalam proses</option>
                      <option value="Menunggu koordinasi">Menunggu koordinasi</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp Notification Auto-Trigger Checkbox */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="waKendalaNotif"
                    checked={sendWANotif}
                    onChange={e => setSendWANotif(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="waKendalaNotif" className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-tight">
                    <span className="font-bold">Kirim Notifikasi WhatsApp Otomatis:</span> Siarkan informasi kendala ini ke grup koordinasi Lintas Sektor, Petugas Armada Laut, dan Kader terkait.
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Kendala</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
