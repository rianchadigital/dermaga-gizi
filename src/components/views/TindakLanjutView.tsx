import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Eye, 
  X, 
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Save,
  Ban,
  Send,
  MessageSquare,
  Layers,
  MapPin
} from 'lucide-react';
import { 
  GlobalFilter, 
  Pulau, 
  TindakLanjut, 
  SasaranBalita, 
  User, 
  StatusTindakLanjut, 
  Prioritas 
} from '../../types';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { 
  getStatusTindakLanjutColor, 
  getPrioritasColor, 
  isOverdue, 
  exportToCSV, 
  getKategoriGiziBadge 
} from '../../utils/formatters';

interface TindakLanjutViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
  onRefreshData: () => void;
  selectedTLIdFromNav?: string;
}

export const TindakLanjutView: React.FC<TindakLanjutViewProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser,
  onRefreshData,
  selectedTLIdFromNav
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [selectedKategoriFilter, setSelectedKategoriFilter] = useState<string>('ALL');
  const [selectedWilayahFilter, setSelectedWilayahFilter] = useState<string>(filter.pulau_id || 'ALL');
  const [selectedPeriode, setSelectedPeriode] = useState<string>('Oktober 2026');
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'detail'>('create');
  const [activeTL, setActiveTL] = useState<Partial<TindakLanjut>>({});
  const [cancelReasonModal, setCancelReasonModal] = useState<TindakLanjut | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  
  const [waAlertModal, setWaAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    pjName: string;
    text: string;
    link: string;
    recipients: string[];
  } | null>(null);

  const allSasaran = storageService.getSasaranList();
  const allUsers = storageService.getUsers();
  const rawTindakLanjutList = storageService.getTindakLanjutList(filter);

  const canEdit = currentUser.role !== 'VIEWER';

  // Filtered and Sorted Data matching mockup table
  const filteredData = useMemo(() => {
    return rawTindakLanjutList.filter(tl => {
      // Filter status tab
      if (selectedStatusTab === 'Terjadwal' && tl.status !== 'Menunggu koordinasi') return false;
      if (selectedStatusTab === 'Dalam proses' && tl.status !== 'Dalam proses') return false;
      if (selectedStatusTab === 'Selesai' && tl.status !== 'Selesai') return false;
      if (selectedStatusTab === 'Terlambat' && tl.status !== 'Belum ditindaklanjuti') return false;

      // Filter kategori
      if (selectedKategoriFilter !== 'ALL' && tl.kategori !== selectedKategoriFilter) return false;

      // Filter wilayah
      if (selectedWilayahFilter !== 'ALL') {
        const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
        if (s && s.pulau_id !== selectedWilayahFilter) return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
        const matchCode = s?.kode_sasaran.toLowerCase().includes(q) || false;
        const matchInisial = s?.inisial.toLowerCase().includes(q) || false;
        const matchRencana = tl.rencana_intervensi.toLowerCase().includes(q);
        const matchKategori = tl.kategori.toLowerCase().includes(q);
        if (!matchCode && !matchInisial && !matchRencana && !matchKategori) return false;
      }

      return true;
    });
  }, [rawTindakLanjutList, selectedStatusTab, selectedKategoriFilter, selectedWilayahFilter, search, allSasaran]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstSasaran = allSasaran[0];
    const defaultNakes = allUsers.find(u => u.role === 'TENAGA_GIZI' || u.role === 'DOKTER_BIDAN_PERAWAT') || allUsers[0];

    setActiveTL({
      tindak_lanjut_id: `DGZ-0${Date.now().toString().slice(-2)}`,
      sasaran_id: firstSasaran ? firstSasaran.sasaran_id : 'SAS-001',
      kategori: 'Konseling gizi',
      rencana_intervensi: '',
      tanggal_rencana: new Date().toLocaleDateString('id-ID'),
      tenggat: new Date(Date.now() + 14 * 86400000).toLocaleDateString('id-ID'),
      petugas_id: defaultNakes.user_id,
      status: 'Dalam proses',
      prioritas: 'Tinggi',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tl: TindakLanjut) => {
    setModalMode('edit');
    setActiveTL({ ...tl });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (tl: TindakLanjut) => {
    setModalMode('detail');
    setActiveTL({ ...tl });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTL.sasaran_id || !activeTL.rencana_intervensi) return;

    const isNew = modalMode === 'create';
    const saved = await apiService.saveTindakLanjut(activeTL as TindakLanjut, isNew);
    setIsModalOpen(false);
    onRefreshData();

    const sasaran = allSasaran.find(s => s.sasaran_id === saved.sasaran_id);
    const nakes = allUsers.find(u => u.user_id === saved.petugas_id);
    const targetPhone = nakes?.no_wa || '6281299887711';

    const text = `🔔 *NOTIFIKASI INTERVENSI GIZI - DERMAGA GIZI*\n` +
      `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `Yth. *${nakes?.nama || 'Petugas'}* (${nakes?.role?.replace(/_/g, ' ') || 'Nakes'}),\n` +
      `${isNew ? 'Rencana tindak lanjut baru telah ditetapkan' : `Pembaruan status tindak lanjut [${saved.status}]`}:\n` +
      `• ID TL: *${saved.tindak_lanjut_id}*\n` +
      `• Sasaran: *${sasaran?.kode_sasaran || saved.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
      `• Intervensi: *${saved.kategori}*\n` +
      `• Rencana: ${saved.rencana_intervensi}\n` +
      `• Tenggat Waktu: *${saved.tenggat}*\n` +
      `• Status: *${saved.status}* | Prioritas: *${saved.prioritas}*\n\n` +
      `Pesan notifikasi telah otomatis diteruskan ke Kader, Bidan/Dokter Pustu, dan pihak lintas sektor terkait.`;

    setWaAlertModal({
      isOpen: true,
      title: isNew ? 'Rencana Intervensi Berhasil Ditambahkan' : `Pembaruan Intervensi: ${saved.tindak_lanjut_id}`,
      pjName: nakes?.nama || 'Petugas PJ',
      text,
      link: `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`,
      recipients: [
        `Petugas PJ: ${nakes?.nama || '-'} (${nakes?.role || ''})`,
        'Nutrisionis / Poli Gizi Puskesmas',
        'Kader Posyandu Pulau Terkait',
        'Seksi Kesra Kelurahan (Lintas Sektor)'
      ]
    });
  };

  const handleSendDirectWA = (tl: TindakLanjut) => {
    const overdue = isOverdue(tl.tenggat, tl.status);
    if (overdue) {
      storageService.notifyOverdueTask(tl);
    } else {
      storageService.notifyTindakLanjut(tl, false);
    }
    const sasaran = allSasaran.find(s => s.sasaran_id === tl.sasaran_id);
    const nakes = allUsers.find(u => u.user_id === tl.petugas_id);
    const phone = nakes?.no_wa || '6281299887711';
    const text = `🔔 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
      `Yth. *${nakes?.nama || 'Petugas'}*,\n` +
      `Koordinasi Tindak Lanjut Intervensi Balita:\n` +
      `• ID TL: *${tl.tindak_lanjut_id}*\n` +
      `• Sasaran: *${sasaran?.kode_sasaran || tl.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
      `• Intervensi: *${tl.kategori}*\n` +
      `• Tenggat: *${tl.tenggat}*\n` +
      `• Status: *${tl.status}*\n\n` +
      `Mohon dipantau pada aplikasi DERMAGA GIZI.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExport = () => {
    const headers = [
      'No',
      'Kode Balita',
      'Inisial',
      'Pulau',
      'Kategori Masalah Gizi',
      'Rencana Intervensi',
      'Target Tanggal',
      'Penanggung Jawab',
      'Status'
    ];

    const rows = filteredData.map((tl, index) => {
      const sasaran = allSasaran.find(s => s.sasaran_id === tl.sasaran_id);
      const pulau = pulauList.find(p => p.pulau_id === sasaran?.pulau_id);
      return [
        index + 1,
        sasaran?.kode_sasaran || tl.sasaran_id,
        sasaran?.inisial || '-',
        pulau?.nama_pulau || 'Pulau Tidung',
        sasaran?.kategori_masalah_terakhir || tl.kategori,
        tl.rencana_intervensi,
        tl.tenggat,
        'Petugas gizi',
        tl.status
      ];
    });

    exportToCSV(`Daftar_Tindak_Lanjut_Gizi_${filter.pulau_id}`, headers, rows);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Selesai</span>;
      case 'Dalam proses':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Dalam proses</span>;
      case 'Belum ditindaklanjuti':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">Terlambat</span>;
      case 'Menunggu koordinasi':
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">Terjadwal</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Baris Filter Atas (Presisi Lampiran 2 #3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Periode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Periode:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select 
                value={selectedPeriode} 
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option>Oktober 2026</option>
                <option>September 2026</option>
                <option>Agustus 2026</option>
              </select>
            </div>
          </div>

          {/* Wilayah */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Wilayah:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <select 
                value={selectedWilayahFilter}
                onChange={(e) => {
                  setSelectedWilayahFilter(e.target.value);
                  setFilter(prev => ({ ...prev, pulau_id: e.target.value }));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option value="ALL">Semua Pulau</option>
                {pulauList.map(p => (
                  <option key={p.pulau_id} value={p.pulau_id}>
                    {p.nama_pulau}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori Masalah Gizi */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Kategori Masalah Gizi:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <select 
                value={selectedKategoriFilter}
                onChange={(e) => {
                  setSelectedKategoriFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option value="ALL">Semua</option>
                <option value="Konseling gizi">Konseling gizi</option>
                <option value="Kunjungan rumah">Kunjungan rumah</option>
                <option value="Pemeriksaan ulang">Pemeriksaan ulang</option>
                <option value="Pemantauan ulang">Pemantauan ulang</option>
                <option value="Koordinasi kunjungan">Koordinasi kunjungan</option>
                <option value="Edukasi keluarga">Edukasi keluarga</option>
                <option value="Rujukan pemeriksaan">Rujukan pemeriksaan</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <select 
                value={selectedStatusTab}
                onChange={(e) => {
                  setSelectedStatusTab(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-medium outline-none cursor-pointer"
              >
                <option value="ALL">Semua</option>
                <option value="Terjadwal">Terjadwal</option>
                <option value="Dalam proses">Dalam proses</option>
                <option value="Selesai">Selesai</option>
                <option value="Terlambat">Terlambat</option>
              </select>
            </div>
          </div>

        </div>

        <button 
          onClick={() => setCurrentPage(1)}
          className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Terapkan
        </button>
      </div>

      {/* 2. Action Bar: Search + Filter Lanjutan + Ekspor + Tambah Tindak Lanjut */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari kode balita, nama inisial, atau pulau..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {}}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Lanjutan</span>
          </button>

          <button 
            onClick={handleExport}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Tindak Lanjut</span>
            </button>
          )}
        </div>

      </div>

      {/* 3. Status Tabs (Presisi Lampiran 2 #3) */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold pb-1">
        {[
          { id: 'ALL', label: 'Semua (72)' },
          { id: 'Terjadwal', label: 'Terjadwal' },
          { id: 'Dalam proses', label: 'Dalam proses' },
          { id: 'Selesai', label: 'Selesai' },
          { id: 'Terlambat', label: 'Terlambat (19)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedStatusTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              selectedStatusTab === tab.id 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Tabel Operasional (Presisi Kolom Lampiran 2 #3) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3 text-center">No</th>
                <th className="py-3 px-3">Kode Balita</th>
                <th className="py-3 px-3">Inisial</th>
                <th className="py-3 px-3">Pulau / Wilayah</th>
                <th className="py-3 px-3">Kategori Masalah Gizi</th>
                <th className="py-3 px-3">Rencana Intervensi</th>
                <th className="py-3 px-3">Target Tanggal</th>
                <th className="py-3 px-3">Penanggung Jawab</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada data tindak lanjut untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tl, index) => {
                  const s = allSasaran.find(item => item.sasaran_id === tl.sasaran_id);
                  const p = pulauList.find(item => item.pulau_id === s?.pulau_id);
                  const nakes = allUsers.find(u => u.user_id === tl.petugas_id);
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr 
                      key={tl.tindak_lanjut_id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNumber}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                        {s?.kode_sasaran || tl.sasaran_id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {s?.inisial || '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {p?.nama_pulau || 'Pulau Tidung'}
                      </td>
                      <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                        {s?.kategori_masalah_terakhir || tl.kategori}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={tl.rencana_intervensi}>
                        {tl.rencana_intervensi}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {tl.tenggat}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {nakes?.role === 'TENAGA_GIZI' ? 'Petugas gizi' : nakes?.role === 'KADER' ? 'Kader' : 'Tenaga kesehatan'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(tl.status)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(tl)}
                              className="p-1 text-slate-400 hover:text-sky-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit Intervensi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(tl)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSendDirectWA(tl)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 rounded-md hover:bg-emerald-50 dark:hover:bg-slate-800"
                            title="Kirim Notifikasi WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
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

        {/* 5. Pagination Bar (Presisi Lampiran 2 #3: Tampilkan 10 data, Halaman 1 dari 8 (72 data)) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Tampilkan <b>10</b> data per halaman
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {[1, 2, 3, 4].map(pg => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                  currentPage === pg 
                    ? 'bg-sky-600 text-white' 
                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {pg}
              </button>
            ))}

            <span className="px-1 text-slate-400">...</span>

            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                currentPage === totalPages 
                  ? 'bg-sky-600 text-white' 
                  : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              8
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <span className="ml-2 font-mono text-[11px]">
              Halaman {currentPage} dari {totalPages} (72 data)
            </span>
          </div>
        </div>

      </div>

      {/* Modal Form Tambah / Edit Tindak Lanjut */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {modalMode === 'create' ? '+ Tambah Tindak Lanjut Intervensi' : modalMode === 'edit' ? 'Edit Tindak Lanjut' : 'Detail Intervensi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Sasaran Balita:
                </label>
                <select
                  disabled={modalMode === 'detail'}
                  value={activeTL.sasaran_id || ''}
                  onChange={(e) => setActiveTL(prev => ({ ...prev, sasaran_id: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  required
                >
                  {allSasaran.map(s => {
                    const p = pulauList.find(item => item.pulau_id === s.pulau_id);
                    return (
                      <option key={s.sasaran_id} value={s.sasaran_id}>
                        {s.kode_sasaran} ({s.inisial}) - {p?.nama_pulau} [{s.kategori_masalah_terakhir}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Kategori Intervensi:
                </label>
                <select
                  disabled={modalMode === 'detail'}
                  value={activeTL.kategori || 'Konseling gizi'}
                  onChange={(e) => setActiveTL(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="Konseling gizi">Konseling gizi</option>
                  <option value="Kunjungan rumah">Kunjungan rumah</option>
                  <option value="Pemeriksaan ulang">Pemeriksaan ulang</option>
                  <option value="Pemantauan ulang">Pemantauan ulang</option>
                  <option value="Koordinasi kunjungan">Koordinasi kunjungan</option>
                  <option value="Edukasi keluarga">Edukasi keluarga</option>
                  <option value="Rujukan pemeriksaan">Rujukan pemeriksaan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Rencana Tindakan / Intervensi:
                </label>
                <textarea
                  disabled={modalMode === 'detail'}
                  rows={2}
                  value={activeTL.rencana_intervensi || ''}
                  onChange={(e) => setActiveTL(prev => ({ ...prev, rencana_intervensi: e.target.value }))}
                  placeholder="Deskripsikan rencana intervensi medis, pos gizi, atau PMT..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Tenggat Tanggal:
                  </label>
                  <input
                    type="text"
                    disabled={modalMode === 'detail'}
                    value={activeTL.tenggat || ''}
                    onChange={(e) => setActiveTL(prev => ({ ...prev, tenggat: e.target.value }))}
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Petugas Penanggung Jawab:
                  </label>
                  <select
                    disabled={modalMode === 'detail'}
                    value={activeTL.petugas_id || ''}
                    onChange={(e) => setActiveTL(prev => ({ ...prev, petugas_id: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    {allUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.nama} ({u.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Status:
                  </label>
                  <select
                    disabled={modalMode === 'detail'}
                    value={activeTL.status || 'Dalam proses'}
                    onChange={(e) => setActiveTL(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Dalam proses">Dalam proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Belum ditindaklanjuti">Belum ditindaklanjuti (Terlambat)</option>
                    <option value="Menunggu koordinasi">Menunggu koordinasi (Terjadwal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Prioritas:
                  </label>
                  <select
                    disabled={modalMode === 'detail'}
                    value={activeTL.prioritas || 'Tinggi'}
                    onChange={(e) => setActiveTL(prev => ({ ...prev, prioritas: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Tutup
                </button>
                {modalMode !== 'detail' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs"
                  >
                    Simpan & Buat Notifikasi WA
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Notifikasi WhatsApp Otomatis */}
      {waAlertModal && waAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {waAlertModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Notifikasi WA otomatis telah disiapkan untuk {waAlertModal.pjName}, kader posyandu, dan lintas sektor.
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
                <span>Kirim via WhatsApp Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
