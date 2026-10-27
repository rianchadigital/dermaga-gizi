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
  Trash2,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  FileDown,
  Building,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  
  // Modal Hapus Data Balita
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    sasaran: SasaranBalita | null;
  } | null>(null);

  // Modal Import Excel
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<SasaranBalita>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const [waAlertModal, setWaAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    pulauName: string;
    text: string;
    link: string;
    recipients: string[];
  } | null>(null);

  const sasaranList = storageService.getSasaranList(filter);
  const posyanduList = storageService.getPosyanduList();
  const kelurahanList = storageService.getKelurahanList();

  const filteredSasaran = sasaranList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.kode_sasaran.toLowerCase().includes(q) || 
      s.inisial.toLowerCase().includes(q) ||
      (s.posyandu && s.posyandu.toLowerCase().includes(q)) ||
      (s.bulan_pengukuran && s.bulan_pengukuran.toLowerCase().includes(q)) ||
      (s.kategori_masalah_terakhir && s.kategori_masalah_terakhir.toLowerCase().includes(q));
  });

  const canEdit = currentUser.role !== 'VIEWER';
  // Hanya Tenaga Gizi dan Admin (termasuk Kepala Puskesmas) yang dapat menghapus
  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'TENAGA_GIZI' || currentUser.role === 'KEPALA_PUSKESMAS';

  const defaultBulan = 'Oktober 2026';
  const bulanOptions = [
    'Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026',
    'Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026',
    'September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026'
  ];

  const handleOpenCreate = () => {
    const selectedPulau = pulauList.find(p => p.pulau_id === filter.pulau_id) || pulauList[0];
    const pulauCode = selectedPulau.nama_pulau.substring(6, 9).toUpperCase() || 'TDG';
    const randomCode = Math.floor(10 + Math.random() * 89);
    
    // Temukan posyandu pertama yang sesuai pulau atau default
    const matchedPosyandu = posyanduList.find(pos => pos.pulau_id === selectedPulau.pulau_id);

    setActiveSasaran({
      sasaran_id: `SAS-${Date.now().toString().slice(-4)}`,
      kode_sasaran: `BLT-${pulauCode}-0${randomCode}`,
      inisial: 'An. ',
      tanggal_lahir: '01/01/2024',
      jenis_kelamin: 'L',
      pulau_id: selectedPulau.pulau_id,
      unit_pelayanan: selectedPulau.unit_pelayanan,
      posyandu: matchedPosyandu ? matchedPosyandu.nama_posyandu : 'Posyandu Mawar I',
      bulan_pengukuran: defaultBulan,
      nik: '',
      nama_ortu: '',
      no_wa_ortu: '',
      alamat: '',
      rt_rw: 'RT 01 / RW 01',
      tanggal_registrasi: new Date().toLocaleDateString('id-ID'),
      status_aktif: true,
      kategori_masalah_terakhir: 'Gizi Baik (Normal)',
      bb_terakhir: 10.0,
      tb_terakhir: 80.0,
      lila: 13.0,
      tanggal_pantau_terakhir: new Date().toLocaleDateString('id-ID')
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SasaranBalita) => {
    setActiveSasaran({ 
      ...s,
      bulan_pengukuran: s.bulan_pengukuran || defaultBulan,
      posyandu: s.posyandu || posyanduList[0]?.nama_posyandu || 'Posyandu Mawar I'
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (s: SasaranBalita) => {
    setActiveSasaran({ ...s });
    setIsDetailOpen(true);
  };

  const handleDeleteSasaran = async () => {
    if (!deleteConfirmModal?.sasaran) return;
    const sasaranToDelete = deleteConfirmModal.sasaran;
    await apiService.deleteSasaran(sasaranToDelete.sasaran_id);
    setDeleteConfirmModal(null);
    onRefreshData();
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
      `Telah ditambahkan data sasaran balita:\n` +
      `• Kode Sasaran: *${saved.kode_sasaran}* (${saved.inisial})\n` +
      `• Wilayah: *${p?.nama_pulau || saved.pulau_id}*\n` +
      `• Posyandu: *${saved.posyandu || '-'}*\n` +
      `• Bulan Pengukuran: *${saved.bulan_pengukuran || '-'}*\n` +
      `• Status Gizi: *${saved.kategori_masalah_terakhir || 'Dalam Verifikasi'}*\n` +
      `• Antropometri: BB ${saved.bb_terakhir} kg, TB ${saved.tb_terakhir} cm, LiLA ${saved.lila || '-'} cm\n\n` +
      `Pemberitahuan telah otomatis diteruskan ke Kader Posyandu, Petugas Pustu, Nutrisionis, dan Lintas Sektor setempat.`;

    setWaAlertModal({
      isOpen: true,
      title: `Notifikasi WhatsApp: ${saved.kode_sasaran}`,
      pulauName: p?.nama_pulau || 'Kepulauan Seribu Selatan',
      text,
      link: `https://wa.me/?text=${encodeURIComponent(text)}`,
      recipients: [
        'Kader Posyandu ' + (saved.posyandu || p?.nama_pulau || ''),
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
      `• Posyandu: *${s.posyandu || '-'}*\n` +
      `• Bulan Pengukuran: *${s.bulan_pengukuran || '-'}*\n` +
      `• Status Gizi: *${s.kategori_masalah_terakhir || 'Normal'}*\n` +
      `• Antropometri: BB ${s.bb_terakhir}kg, TB ${s.tb_terakhir}cm\n\n` +
      `Silakan koordinasikan dengan kader posyandu dan tim lintas sektor setempat.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExport = () => {
    const headers = [
      'ID Sasaran',
      'Kode Sasaran (Anonim)',
      'Inisial / Nama',
      'NIK Balita',
      'Tanggal Lahir',
      'Jenis Kelamin',
      'Pulau',
      'Posyandu',
      'Bulan Pengukuran',
      'Nama Orang Tua',
      'BB (kg)',
      'TB (cm)',
      'LiLA (cm)',
      'Kategori Masalah Gizi',
      'Tanggal Pantau Terakhir'
    ];

    const rows = filteredSasaran.map(s => {
      const p = pulauList.find(item => item.pulau_id === s.pulau_id);
      return [
        s.sasaran_id,
        s.kode_sasaran,
        s.inisial,
        s.nik || '-',
        s.tanggal_lahir,
        s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        p?.nama_pulau || s.pulau_id,
        s.posyandu || '-',
        s.bulan_pengukuran || '-',
        s.nama_ortu || '-',
        s.bb_terakhir || '-',
        s.tb_terakhir || '-',
        s.lila || '-',
        s.kategori_masalah_terakhir || '-',
        s.tanggal_pantau_terakhir || '-'
      ];
    });

    exportToCSV(`Sasaran_Balita_Gizi_${filter.pulau_id}`, headers, rows);
    storageService.addLog('EXPORT', 'SASARAN', 'EXPORT-ALL', `Ekspor ${rows.length} data sasaran balita`, 'SUCCESS');
  };

  // --- Handlers Import Excel ---
  const handleOpenImportModal = () => {
    setParsedData([]);
    setImportFileName('');
    setImportError('');
    setImportSuccessMsg('');
    setIsImportModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Kode Sasaran': 'BLT-TDG-091',
        'Nama Balita': 'An. Rizky Pratama',
        'NIK': '3101015509230001',
        'Jenis Kelamin': 'L',
        'Tanggal Lahir': '15/05/2024',
        'Nama Orang Tua': 'Hendra / Siti',
        'No WA Ortu': '081298765432',
        'Alamat': 'Jl. Dermaga Pelabuhan No 12',
        'RT/RW': 'RT 02 / RW 01',
        'Pulau': 'Pulau Tidung',
        'Posyandu': 'Posyandu Melati 1',
        'Bulan Pengukuran': 'Oktober 2026',
        'Berat Badan (kg)': 9.4,
        'Tinggi Badan (cm)': 78.5,
        'LiLA (cm)': 12.5,
        'Status Gizi': 'Gizi Baik (Normal)'
      },
      {
        'Kode Sasaran': 'BLT-PAR-092',
        'Nama Balita': 'An. Zahra Aulia',
        'NIK': '3101016208240002',
        'Jenis Kelamin': 'P',
        'Tanggal Lahir': '20/08/2024',
        'Nama Orang Tua': 'Budi / Aminah',
        'No WA Ortu': '081387654321',
        'Alamat': 'Pantai Pasir Perawan',
        'RT/RW': 'RT 01 / RW 02',
        'Pulau': 'Pulau Pari',
        'Posyandu': 'Posyandu Cempaka 2',
        'Bulan Pengukuran': 'Oktober 2026',
        'Berat Badan (kg)': 7.2,
        'Tinggi Badan (cm)': 68.0,
        'LiLA (cm)': 11.2,
        'Status Gizi': 'Wasting (Kurus/Gizi Kurang)'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Sasaran_Balita');
    XLSX.writeFile(workbook, 'Template_Import_Sasaran_Balita_DermagaGizi.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError('');
    setImportSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 2) {
          setImportError('Berkas Excel kosong atau tidak memiliki baris data.');
          return;
        }

        const headers: string[] = (rawJson[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
        
        const getIdx = (aliases: string[]) => headers.findIndex(h => aliases.some(a => h.includes(a)));

        const colKode = getIdx(['kode']);
        const colNama = getIdx(['nama', 'inisial', 'balita']);
        const colNik = getIdx(['nik']);
        const colJK = getIdx(['jk', 'kelamin', 'gender', 'jenis']);
        const colLahir = getIdx(['lahir', 'tanggal', 'tgl']);
        const colOrtu = getIdx(['ortu', 'orang tua', 'ibu', 'ayah']);
        const colNoWA = getIdx(['wa', 'hp', 'telepon', 'telp']);
        const colAlamat = getIdx(['alamat', 'domisili']);
        const colRtRw = getIdx(['rt', 'rw']);
        const colPulau = getIdx(['pulau', 'wilayah']);
        const colPosyandu = getIdx(['posyandu', 'pos']);
        const colBulan = getIdx(['bulan', 'periode', 'waktu']);
        const colBB = getIdx(['berat', 'bb']);
        const colTB = getIdx(['tinggi', 'tb', 'panjang']);
        const colLiLA = getIdx(['lila', 'lingkar']);
        const colStatus = getIdx(['status', 'gizi', 'kategori']);

        const results: Partial<SasaranBalita>[] = [];

        for (let i = 1; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || row.length === 0) continue;

          const namaRaw = colNama >= 0 ? String(row[colNama] || '').trim() : '';
          if (!namaRaw) continue; // Baris kosong dilewati

          const jkRaw = colJK >= 0 ? String(row[colJK] || '').trim().toUpperCase() : 'L';
          const jk: 'L' | 'P' = (jkRaw.startsWith('P') || jkRaw.includes('PEREMPUAN')) ? 'P' : 'L';

          const bbVal = colBB >= 0 ? parseFloat(String(row[colBB]).replace(',', '.')) : 10.0;
          const tbVal = colTB >= 0 ? parseFloat(String(row[colTB]).replace(',', '.')) : 80.0;
          const lilaVal = colLiLA >= 0 ? parseFloat(String(row[colLiLA]).replace(',', '.')) : undefined;

          let statusGizi: KategoriMasalahGizi = 'Gizi Baik (Normal)';
          if (colStatus >= 0 && row[colStatus]) {
            const sg = String(row[colStatus]).toLowerCase();
            if (sg.includes('buruk')) statusGizi = 'Gizi Buruk';
            else if (sg.includes('kurang') || sg.includes('wasting')) statusGizi = 'Wasting (Kurus/Gizi Kurang)';
            else if (sg.includes('stunting') || sg.includes('pendek')) statusGizi = 'Stunting (Pendek)';
            else if (sg.includes('underweight') || sg.includes('bb kurang')) statusGizi = 'Underweight (BB Kurang)';
            else if (sg.includes('lebih') || sg.includes('obesitas')) statusGizi = 'Risiko Gizi Lebih / Obesitas';
          }

          const pulauStr = colPulau >= 0 ? String(row[colPulau] || '') : '';
          const matchedPulau = pulauList.find(p => p.nama_pulau.toLowerCase().includes(pulauStr.toLowerCase())) || pulauList[0];
          
          const posyanduStr = colPosyandu >= 0 ? String(row[colPosyandu] || '') : '';
          const matchedPosyandu = posyanduList.find(pos => pos.nama_posyandu.toLowerCase().includes(posyanduStr.toLowerCase())) || posyanduList[0];

          results.push({
            kode_sasaran: colKode >= 0 && row[colKode] ? String(row[colKode]).trim() : undefined,
            inisial: namaRaw.startsWith('An.') ? namaRaw : `An. ${namaRaw}`,
            nik: colNik >= 0 ? String(row[colNik] || '').trim() : '',
            jenis_kelamin: jk,
            tanggal_lahir: colLahir >= 0 && row[colLahir] ? String(row[colLahir]).trim() : '01/01/2024',
            nama_ortu: colOrtu >= 0 ? String(row[colOrtu] || '').trim() : '',
            no_wa_ortu: colNoWA >= 0 ? String(row[colNoWA] || '').trim() : '',
            alamat: colAlamat >= 0 ? String(row[colAlamat] || '').trim() : '',
            rt_rw: colRtRw >= 0 ? String(row[colRtRw] || '').trim() : 'RT 01 / RW 01',
            pulau_id: matchedPulau.pulau_id,
            unit_pelayanan: matchedPulau.unit_pelayanan,
            posyandu: posyanduStr || (matchedPosyandu ? matchedPosyandu.nama_posyandu : 'Posyandu Mawar I'),
            bulan_pengukuran: colBulan >= 0 && row[colBulan] ? String(row[colBulan]).trim() : 'Oktober 2026',
            bb_terakhir: !isNaN(bbVal) && bbVal > 0 ? bbVal : 10.0,
            tb_terakhir: !isNaN(tbVal) && tbVal > 0 ? tbVal : 80.0,
            lila: !isNaN(lilaVal!) && lilaVal! > 0 ? lilaVal : undefined,
            kategori_masalah_terakhir: statusGizi,
            tanggal_pantau_terakhir: new Date().toLocaleDateString('id-ID')
          });
        }

        if (results.length === 0) {
          setImportError('Tidak ada baris data balita valid yang berhasil dibaca dari lembar Excel.');
          return;
        }

        setParsedData(results);
      } catch (err: any) {
        setImportError('Gagal memproses file Excel: ' + (err.message || 'Format berkas tidak sesuai.'));
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);

    try {
      const result = await apiService.importSasaranBatch(parsedData);
      setIsImporting(false);
      setImportSuccessMsg(`Berhasil mengimpor ${result.count} data balita ke sistem!`);
      onRefreshData();
      setTimeout(() => {
        setIsImportModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setIsImporting(false);
      setImportError('Gagal menyimpan hasil import: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Title & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Registrasi & Pemantauan Sasaran Balita
            </h1>
            <span className="text-xs bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full font-mono tabular-nums">
              {filteredSasaran.length} Balita
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pencatatan antropometri balita per Posyandu & Bulan Pengukuran dengan dukungan import Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Import Excel */}
          {canEdit && (
            <button
              onClick={handleOpenImportModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Import Data Balita dari File Excel (.xlsx / .xls / .csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrasi Balita Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode sasaran, inisial, posyandu, atau periode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-sky-500 text-xs dark:text-white"
          />
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-xs">
          Pulau aktif: <span className="font-semibold text-slate-800 dark:text-slate-200">{filter.pulau_id === 'ALL' ? 'Semua Pulau' : pulauList.find(p => p.pulau_id === filter.pulau_id)?.nama_pulau}</span>
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{s.kode_sasaran}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.inisial} · {s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1.5 ${
                    s.kategori_masalah_terakhir === 'Gizi Baik (Normal)' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span className="font-medium truncate max-w-[110px]">{s.kategori_masalah_terakhir || 'Normal'}</span>
                  </span>
                </div>

                {/* Data Detail Body */}
                <div className="py-3 space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Pulau Domisili:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{pulau?.nama_pulau || s.pulau_id}</span>
                  </div>

                  {/* Posyandu & Bulan Pengukuran */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Posyandu:</span>
                    <span className="font-semibold text-sky-700 dark:text-sky-400 truncate max-w-[170px]" title={s.posyandu || '-'}>
                      {s.posyandu || 'Posyandu Mawar I'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Bulan Pengukuran:</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                      {s.bulan_pengukuran || 'Oktober 2026'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="text-[10px] text-slate-400">BB (kg)</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.bb_terakhir ? `${s.bb_terakhir}` : '-'}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="text-[10px] text-slate-400">TB (cm)</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.tb_terakhir ? `${s.tb_terakhir}` : '-'}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="text-[10px] text-slate-400">LiLA (cm)</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.lila ? `${s.lila}` : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pantau: {s.tanggal_pantau_terakhir || s.tanggal_registrasi}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSendWA(s)}
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Kirim Notifikasi WhatsApp ke Kader/Lintas Sektor"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDetail(s)}
                    className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1 text-slate-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Update Antropometri"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Tombol Hapus khusus Tenaga Gizi & Admin */}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteConfirmModal({ isOpen: true, sasaran: s })}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Data Sasaran Balita (Khusus Tenaga Gizi & Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form Sasaran (Registrasi & Antropometri) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Registrasi & Antropometri Balita
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kode Sasaran Anonim *</label>
                  <input
                    type="text"
                    value={activeSasaran.kode_sasaran || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, kode_sasaran: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Inisial / Nama Balita *</label>
                  <input
                    type="text"
                    value={activeSasaran.inisial || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, inisial: e.target.value }))}
                    placeholder="Contoh: An. MF"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">NIK Balita (16 Digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={activeSasaran.nik || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, nik: e.target.value }))}
                    placeholder="3101xxxxxxxxxxxx"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Orang Tua / Ibu</label>
                  <input
                    type="text"
                    value={activeSasaran.nama_ortu || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, nama_ortu: e.target.value }))}
                    placeholder="Nama Ayah / Ibu"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={activeSasaran.tanggal_lahir || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, tanggal_lahir: e.target.value }))}
                    placeholder="DD/MM/YYYY"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin</label>
                  <select
                    value={activeSasaran.jenis_kelamin || 'L'}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, jenis_kelamin: e.target.value as any }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Pulau & Posyandu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Pulau Domisili *</label>
                  <select
                    value={activeSasaran.pulau_id || ''}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const p = pulauList.find(item => item.pulau_id === pid);
                      const matchedPos = posyanduList.find(pos => pos.pulau_id === pid);
                      setActiveSasaran(prev => ({ 
                        ...prev, 
                        pulau_id: pid,
                        unit_pelayanan: p ? p.unit_pelayanan : prev.unit_pelayanan,
                        posyandu: matchedPos ? matchedPos.nama_posyandu : prev.posyandu
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    required
                  >
                    {pulauList.map(p => (
                      <option key={p.pulau_id} value={p.pulau_id}>{p.nama_pulau}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Posyandu *</label>
                  <select
                    value={activeSasaran.posyandu || ''}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, posyandu: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    required
                  >
                    {posyanduList
                      .filter(pos => !activeSasaran.pulau_id || pos.pulau_id === activeSasaran.pulau_id)
                      .map(pos => (
                        <option key={pos.posyandu_id} value={pos.nama_posyandu}>
                          {pos.nama_posyandu} ({pos.rw || pos.rt})
                        </option>
                      ))}
                    {/* Fallback option */}
                    <option value="Posyandu Mawar I">Posyandu Mawar I</option>
                    <option value="Posyandu Melati 2">Posyandu Melati 2</option>
                    <option value="Posyandu Cempaka 3">Posyandu Cempaka 3</option>
                  </select>
                </div>
              </div>

              {/* Bulan Pengukuran */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bulan Pengukuran *
                  </label>
                  <select
                    value={activeSasaran.bulan_pengukuran || defaultBulan}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, bulan_pengukuran: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-semibold text-sky-800 dark:text-sky-300"
                    required
                  >
                    {bulanOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pengukuran
                  </label>
                  <input
                    type="text"
                    value={activeSasaran.tanggal_pantau_terakhir || new Date().toLocaleDateString('id-ID')}
                    onChange={(e) => setActiveSasaran(prev => ({ ...prev, tanggal_pantau_terakhir: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs dark:text-white"
                  />
                </div>
              </div>

              {/* Antropometri */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="font-bold text-slate-700 dark:text-slate-200">Hasil Pengukuran Antropometri</div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">Berat Badan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSasaran.bb_terakhir || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, bb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">Tinggi / Panjang (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSasaran.tb_terakhir || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, tb_terakhir: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">LiLA (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={activeSasaran.lila || ''}
                      onChange={(e) => setActiveSasaran(prev => ({ ...prev, lila: parseFloat(e.target.value) || 0 }))}
                      placeholder="Contoh: 12.5"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Kategori Masalah Gizi */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Status Gizi Terverifikasi
                </label>
                <select
                  value={activeSasaran.kategori_masalah_terakhir || 'Gizi Baik (Normal)'}
                  onChange={(e) => setActiveSasaran(prev => ({ ...prev, kategori_masalah_terakhir: e.target.value as KategoriMasalahGizi }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white font-medium"
                >
                  <option value="Gizi Baik (Normal)">Gizi Baik (Normal)</option>
                  <option value="Stunting (Pendek)">Stunting (Pendek)</option>
                  <option value="Wasting (Kurus/Gizi Kurang)">Wasting (Kurus/Gizi Kurang)</option>
                  <option value="Underweight (BB Kurang)">Underweight (BB Kurang)</option>
                  <option value="Gizi Buruk">Gizi Buruk</option>
                  <option value="Risiko Gizi Lebih / Obesitas">Risiko Gizi Lebih / Obesitas</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-base">Rekam Medis Terbatas Sasaran</div>
              <button onClick={() => setIsDetailOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Kode Sasaran:</span>
                <span className="font-mono font-bold text-sky-800 dark:text-sky-300">{activeSasaran.kode_sasaran}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inisial / Nama:</span>
                <span className="font-semibold">{activeSasaran.inisial}</span>
              </div>
              {activeSasaran.nik && (
                <div className="flex justify-between">
                  <span className="text-slate-400">NIK:</span>
                  <span className="font-mono">{activeSasaran.nik}</span>
                </div>
              )}
              {activeSasaran.nama_ortu && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Orang Tua / Ibu:</span>
                  <span>{activeSasaran.nama_ortu}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Pulau:</span>
                <span>{pulauList.find(p => p.pulau_id === activeSasaran.pulau_id)?.nama_pulau}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Posyandu:</span>
                <span className="font-semibold text-sky-700 dark:text-sky-400">{activeSasaran.posyandu || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bulan Pengukuran:</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">{activeSasaran.bulan_pengukuran || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Gizi:</span>
                <span className="font-bold text-rose-700 dark:text-rose-400">{activeSasaran.kategori_masalah_terakhir}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Antropometri:</span>
                <span className="font-mono">
                  BB: {activeSasaran.bb_terakhir} kg | TB: {activeSasaran.tb_terakhir} cm {activeSasaran.lila ? `| LiLA: ${activeSasaran.lila} cm` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pemantauan Terakhir:</span>
                <span>{activeSasaran.tanggal_pantau_terakhir || '-'}</span>
              </div>
            </div>
            <button
              onClick={() => setIsDetailOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Balita (Khusus Tenaga Gizi & Admin) */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && deleteConfirmModal.sasaran && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hapus Data Sasaran Balita?</h4>
                <p className="text-slate-500 text-[11px]">Wewenang Tenaga Gizi & Administrator Puskesmas</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-slate-700 dark:text-slate-300 space-y-1">
              <div>Kode: <strong className="font-mono text-rose-800 dark:text-rose-300">{deleteConfirmModal.sasaran.kode_sasaran}</strong></div>
              <div>Nama: <strong>{deleteConfirmModal.sasaran.inisial}</strong></div>
              <div>Posyandu: <span>{deleteConfirmModal.sasaran.posyandu || '-'}</span></div>
              <div>Status Gizi: <span>{deleteConfirmModal.sasaran.kategori_masalah_terakhir}</span></div>
            </div>

            <p className="text-[11px] text-slate-500">
              Data yang dihapus akan dicatat dalam log sistem. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSasaran}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Import Data Sasaran Balita dari Excel (.xlsx / .csv)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unggah daftar balita, hasil penimbangan posyandu, dan status gizi secara massal
                  </p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tombol Unduh Template */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-emerald-900 dark:text-emerald-200">
                  Format Template Excel Siap Pakai
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Unduh template resmi berformat .xlsx dengan kolom standar: Nama, NIK, Posyandu, Bulan Pengukuran, BB, TB, LiLA, dan Status Gizi.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer self-start sm:self-auto"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Template (.xlsx)</span>
              </button>
            </div>

            {/* Input Berkas */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2 hover:border-emerald-500 transition-colors">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Pilih Berkas Excel (.xlsx, .xls) atau CSV
              </div>
              <p className="text-[11px] text-slate-400">
                Maksimal ukuran 10 MB per file
              </p>
              <label className="inline-block mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl cursor-pointer">
                <span>Pilih Dokumen File</span>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>
              {importFileName && (
                <div className="mt-2 text-xs font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                  Berkas terpilih: {importFileName}
                </div>
              )}
            </div>

            {/* Error & Success Feedback */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {/* Preview Table parsedData */}
            {parsedData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Pratinjau Data yang Terdeteksi ({parsedData.length} Balita):</span>
                  <span className="text-[10px] text-slate-400">Pastikan kolom sesuai sebelum import</span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Nama Balita</th>
                        <th className="p-2">JK</th>
                        <th className="p-2">Posyandu</th>
                        <th className="p-2">Bulan</th>
                        <th className="p-2">BB / TB</th>
                        <th className="p-2">Status Gizi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedData.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 dark:text-white">{row.inisial}</td>
                          <td className="p-2">{row.jenis_kelamin}</td>
                          <td className="p-2 text-sky-700 dark:text-sky-400">{row.posyandu}</td>
                          <td className="p-2 text-amber-700 dark:text-amber-400">{row.bulan_pengukuran}</td>
                          <td className="p-2 font-mono">{row.bb_terakhir}kg / {row.tb_terakhir}cm</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-medium">
                              {row.kategori_masalah_terakhir}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Tutup
              </button>
              {parsedData.length > 0 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isImporting ? 'Sedang Menyimpan...' : `Simpan & Import ${parsedData.length} Balita`}</span>
                </button>
              )}
            </div>

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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
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
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(waAlertModal.link, '_blank');
                  setWaAlertModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
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
