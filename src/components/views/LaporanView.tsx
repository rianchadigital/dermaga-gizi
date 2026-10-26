import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Building2, 
  UserCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  TrendingDown,
  Activity,
  HeartHandshake,
  Scale,
  Baby,
  Search,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell 
} from 'recharts';
import { GlobalFilter, Pulau, User, EvaluasiKelurahanItem, EvaluasiPosyanduItem } from '../../types';
import { storageService } from '../../services/storageService';
import { exportToCSV } from '../../utils/formatters';

interface LaporanViewProps {
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
  pulauList: Pulau[];
  currentUser: User;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  filter,
  setFilter,
  pulauList,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kelurahan' | 'posyandu' | 'ringkasan'>('kelurahan');

  // Filter Evaluasi
  const [evalTahun, setEvalTahun] = useState<string>('2026');
  const [evalBulan, setEvalBulan] = useState<string>('ALL');
  const [evalKelurahanFilter, setEvalKelurahanFilter] = useState<string>('ALL');
  const [searchPosyanduQuery, setSearchPosyanduQuery] = useState<string>('');

  const [catatanEvaluasi, setCatatanEvaluasi] = useState(
    'Berdasarkan evaluasi terpadu Puskesmas Kepulauan Seribu Selatan periode berjalan, intervensi PMT pangan lokal ikan laut berprotein tinggi terbukti efektif meningkatkan berat badan pada 69,0% balita bermasalah gizi. Tingkat kepatuhan kunjungan kader dan nakes mencapai 85,6%. Disarankan memperkuat armada operasional kapal laut pada musim angin barat agar distribusi formula F-75/F-100 tetap tepat waktu.'
  );

  const kelurahanList = useMemo(() => storageService.getKelurahanList(), []);
  
  // Data Evaluasi Kelurahan
  const evaluasiKelurahanData: EvaluasiKelurahanItem[] = useMemo(() => {
    return storageService.getEvaluasiKelurahanReport(evalTahun, evalBulan);
  }, [evalTahun, evalBulan]);

  // Data Evaluasi Posyandu
  const evaluasiPosyanduData: EvaluasiPosyanduItem[] = useMemo(() => {
    return storageService.getEvaluasiPosyanduReport({
      kelurahan_id: evalKelurahanFilter !== 'ALL' ? evalKelurahanFilter : undefined,
      bulan: evalBulan !== 'ALL' ? evalBulan : undefined,
      tahun: evalTahun !== 'ALL' ? evalTahun : undefined
    }).filter(p => {
      if (!searchPosyanduQuery) return true;
      const q = searchPosyanduQuery.toLowerCase();
      return (
        p.nama_posyandu.toLowerCase().includes(q) ||
        p.kelurahan_nama.toLowerCase().includes(q) ||
        p.ketua_kader.toLowerCase().includes(q)
      );
    });
  }, [evalKelurahanFilter, evalBulan, evalTahun, searchPosyanduQuery]);

  // Data Ringkasan Terpadu KPI
  const stats = storageService.getDashboardStats(filter);
  const { kpi, ringkasanPulau } = stats;
  const tindakLanjutList = storageService.getTindakLanjutList(filter);

  // 5 Top Metric Cards from Lampiran 2 Menu 6 (85,6%, 73,6%, 69,0%, 91,0%, 55,6%)
  const metrics = [
    {
      title: 'Kepatuhan Kunjungan',
      value: '85,6%',
      badge: '+2.4%',
      badgePositive: true,
      subtext: '411 dari 480 sasaran',
      icon: UserCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/50'
    },
    {
      title: 'Penyelesaian Tindak Lanjut',
      value: '73,6%',
      badge: '53 / 72',
      badgePositive: true,
      subtext: 'Target tuntas bulan ini',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50'
    },
    {
      title: 'Intervensi Efektif',
      value: '69,0%',
      badge: '+5.1%',
      badgePositive: true,
      subtext: 'Peningkatan BB 33 balita',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/50'
    },
    {
      title: 'Cakupan Penimbangan (D/S)',
      value: '91,0%',
      badge: '437 / 480',
      badgePositive: true,
      subtext: 'Target SPM tercapai',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/50'
    },
    {
      title: 'Sinergi Lintas Sektor',
      value: '55,6%',
      badge: '5 / 9 program',
      badgePositive: false,
      subtext: 'Dukungan pangan & edukasi',
      icon: HeartHandshake,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50'
    }
  ];

  // Handler Export CSV Posyandu
  const handleExportPosyanduCSV = () => {
    const headers = [
      'ID Posyandu',
      'Nama Posyandu',
      'Kelurahan',
      'Pulau',
      'Sasaran (S)',
      'Ditimbang (D)',
      'Tidak Hadir (T)',
      'Cakupan D/S (%)',
      'Gizi Baik',
      'Gizi Kurang',
      'Gizi Buruk',
      'Stunting',
      'Underweight',
      'Total Masalah Gizi',
      'Ketua Kader',
      'No. WA Kader',
      'Status Laporan'
    ];
    const rows = evaluasiPosyanduData.map(p => [
      p.posyandu_id,
      p.nama_posyandu,
      p.kelurahan_nama,
      p.pulau_nama,
      p.total_sasaran,
      p.total_ditimbang,
      p.total_tidak_hadir,
      p.persentase_d_s,
      p.gizi_baik,
      p.gizi_kurang,
      p.gizi_buruk,
      p.stunting,
      p.underweight,
      p.total_masalah_gizi,
      p.ketua_kader,
      p.no_wa_kader,
      p.status_pelaksanaan
    ]);
    exportToCSV(`Evaluasi_Posyandu_${evalTahun}_${evalBulan}`, headers, rows);
  };

  const handleExportKelurahanCSV = () => {
    const headers = [
      'ID Kelurahan',
      'Nama Kelurahan',
      'Jumlah Posyandu',
      'Total Sasaran (S)',
      'Total Ditimbang (D)',
      'Total Tidak Hadir (T)',
      'Cakupan D/S (%)',
      'Gizi Baik',
      'Gizi Kurang',
      'Gizi Buruk',
      'Stunting',
      'Underweight',
      'Total Kasus Gizi',
      'Tindak Lanjut Selesai',
      'Tindak Lanjut Dalam Proses',
      'Tindak Lanjut Belum',
      '% Kasus Selesai'
    ];
    const rows = evaluasiKelurahanData.map(k => [
      k.kelurahan_id,
      k.nama_kelurahan,
      k.total_posyandu,
      k.total_sasaran,
      k.total_ditimbang,
      k.total_tidak_hadir,
      k.persentase_d_s,
      k.gizi_baik,
      k.gizi_kurang,
      k.gizi_buruk,
      k.stunting,
      k.underweight,
      k.total_masalah_gizi,
      k.tindak_lanjut_selesai,
      k.tindak_lanjut_proses,
      k.tindak_lanjut_belum,
      k.persentase_tl_selesai
    ]);
    exportToCSV(`Evaluasi_Kelurahan_${evalTahun}_${evalBulan}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              Laporan Evaluasi Gizi Wilayah
            </h1>
            <span className="text-xs bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full">
              Puskesmas Kepulauan Seribu Selatan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi capaian penimbangan balita (D/S), prevalensi kasus gizi, dan efektivitas intervensi <strong>Berdasarkan Kelurahan</strong> dan <strong>Berdasarkan Posyandu</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>

          <button
            onClick={activeSubTab === 'kelurahan' ? handleExportKelurahanCSV : handleExportPosyanduCSV}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Main Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kelurahan')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'kelurahan'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Evaluasi Berdasarkan Kelurahan</span>
          </button>

          <button
            onClick={() => setActiveSubTab('posyandu')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'posyandu'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Evaluasi Berdasarkan Posyandu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ringkasan')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'ringkasan'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ringkasan Indikator Terpadu</span>
          </button>
        </div>

        {/* Global Year & Month Filter */}
        <div className="flex items-center gap-2">
          <select
            value={evalBulan}
            onChange={(e) => setEvalBulan(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Bulan</option>
            <option value="10">Oktober 2026</option>
            <option value="09">September 2026</option>
            <option value="08">Agustus 2026</option>
          </select>

          <select
            value={evalTahun}
            onChange={(e) => setEvalTahun(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-mono"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* TAB 1: EVALUASI BERDASARKAN KELURAHAN */}
      {activeSubTab === 'kelurahan' && (
        <div className="space-y-6">
          
          {/* 3 Kelurahan Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {evaluasiKelurahanData.map((kel) => {
              const isTargetAchieved = kel.persentase_d_s >= 80;
              return (
                <div 
                  key={kel.kelurahan_id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
                        {kel.kelurahan_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {kel.nama_kelurahan}
                      </h3>
                      <div className="text-xs text-slate-500">{kel.total_posyandu} Posyandu Aktif</div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isTargetAchieved 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {kel.persentase_d_s}% (D/S)
                    </span>
                  </div>

                  {/* Penimbangan Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Sasaran (S)</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5 font-mono text-sm">
                        {kel.total_sasaran}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-sky-600">Ditimbang (D)</div>
                      <div className="font-bold text-sky-700 dark:text-sky-400 mt-0.5 font-mono text-sm">
                        {kel.total_ditimbang}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-600">Tidak Hadir (T)</div>
                      <div className="font-bold text-amber-700 dark:text-amber-400 mt-0.5 font-mono text-sm">
                        {kel.total_tidak_hadir}
                      </div>
                    </div>
                  </div>

                  {/* Temuan Kasus Gizi */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Kasus Gizi:</span>
                      <span className="font-bold text-rose-600 font-mono">{kel.total_masalah_gizi} Balita</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900/40">
                        <div className="text-amber-700 font-bold">{kel.gizi_kurang}</div>
                        <div className="text-slate-500 truncate">Wasting</div>
                      </div>
                      <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900/40">
                        <div className="text-rose-700 font-bold">{kel.gizi_buruk}</div>
                        <div className="text-slate-500 truncate">Buruk</div>
                      </div>
                      <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded border border-purple-200 dark:border-purple-900/40">
                        <div className="text-purple-700 font-bold">{kel.stunting}</div>
                        <div className="text-slate-500 truncate">Stunting</div>
                      </div>
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900/40">
                        <div className="text-blue-700 font-bold">{kel.underweight}</div>
                        <div className="text-slate-500 truncate">Underwt</div>
                      </div>
                    </div>
                  </div>

                  {/* Tindak Lanjut Completion Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Penyelesaian Tindak Lanjut</span>
                      <span className="font-bold text-emerald-600">{kel.persentase_tl_selesai}% Selesai</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, kel.persentase_tl_selesai)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphic Comparison: Cakupan D/S and Kasus Gizi per Kelurahan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Chart 1: Cakupan D/S vs Target 80% */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Perbandingan Cakupan Penimbangan D/S (%) Antar Kelurahan
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Target SPM Nasional adalah minimal 80% balita sasaran hadir dan ditimbang
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluasiKelurahanData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="nama_kelurahan" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => v.replace('Kelurahan ', '')}
                    />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Cakupan D/S']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="persentase_d_s" name="Cakupan D/S (%)" radius={[6, 6, 0, 0]}>
                      {evaluasiKelurahanData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.persentase_d_s >= 80 ? '#10b981' : '#f43f5e'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Sebaran Masalah Gizi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Sebaran Kasus Gizi (Gizi Kurang, Gizi Buruk, Stunting)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Jumlah balita yang membutuhkan tindak lanjut intervensi pangan dan medis
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluasiKelurahanData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="nama_kelurahan" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(v) => v.replace('Kelurahan ', '')}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="gizi_kurang" name="Wasting / Gizi Kurang" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stunting" name="Stunting (Pendek)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gizi_buruk" name="Gizi Buruk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Table Rekapitulasi Evaluasi Kelurahan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tabel Matriks Rekapitulasi Evaluasi 3 Kelurahan
              </h3>
              <button
                onClick={handleExportKelurahanCSV}
                className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-sky-200 dark:border-sky-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap Kelurahan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Kelurahan</th>
                    <th className="py-3 px-4 text-center">Posyandu</th>
                    <th className="py-3 px-4 text-center">Sasaran (S)</th>
                    <th className="py-3 px-4 text-center">Ditimbang (D)</th>
                    <th className="py-3 px-4 text-center">Tidak Hadir (T)</th>
                    <th className="py-3 px-4 text-center">Cakupan (D/S)</th>
                    <th className="py-3 px-4 text-center">Gizi Kurang</th>
                    <th className="py-3 px-4 text-center">Gizi Buruk</th>
                    <th className="py-3 px-4 text-center">Stunting</th>
                    <th className="py-3 px-4 text-center">Underweight</th>
                    <th className="py-3 px-4 text-center">Total Masalah</th>
                    <th className="py-3 px-4 text-center">TL Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {evaluasiKelurahanData.map((k) => (
                    <tr key={k.kelurahan_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {k.nama_kelurahan}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{k.total_posyandu} Pos</td>
                      <td className="py-3.5 px-4 text-center font-mono">{k.total_sasaran}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-600">{k.total_ditimbang}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-600">{k.total_tidak_hadir}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          k.persentase_d_s >= 80 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {k.persentase_d_s}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-700 font-semibold">{k.gizi_kurang}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-rose-700 font-bold">{k.gizi_buruk}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-purple-700 font-semibold">{k.stunting}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-blue-700">{k.underweight}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold font-mono">
                          {k.total_masalah_gizi} Anak
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        {k.persentase_tl_selesai}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: EVALUASI BERDASARKAN POSYANDU */}
      {activeSubTab === 'posyandu' && (
        <div className="space-y-4">
          
          {/* Filters Bar Posyandu */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500">Filter Kelurahan:</span>
              <select
                value={evalKelurahanFilter}
                onChange={(e) => setEvalKelurahanFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">Semua Kelurahan</option>
                {kelurahanList.map(k => (
                  <option key={k.kelurahan_id} value={k.kelurahan_id}>{k.nama_kelurahan}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama posyandu / kader..."
                  value={searchPosyanduQuery}
                  onChange={(e) => setSearchPosyanduQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-56"
                />
              </div>

              <button
                onClick={handleExportPosyanduCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* Table Matriks Posyandu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nama Posyandu</th>
                    <th className="py-3 px-4">Kelurahan & Pulau</th>
                    <th className="py-3 px-4 text-center">Sasaran (S)</th>
                    <th className="py-3 px-4 text-center">Ditimbang (D)</th>
                    <th className="py-3 px-4 text-center">Tidak Hadir (T)</th>
                    <th className="py-3 px-4 text-center">Cakupan (D/S)</th>
                    <th className="py-3 px-4 text-center">Temuan Masalah Gizi</th>
                    <th className="py-3 px-4">Ketua Kader & Kontak</th>
                    <th className="py-3 px-4 text-center">Status Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {evaluasiPosyanduData.map((p) => {
                    const isTargetAchieved = p.persentase_d_s >= 80;
                    return (
                      <tr key={p.posyandu_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {p.nama_posyandu}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-sky-700 dark:text-sky-300">{p.kelurahan_nama}</div>
                          <div className="text-[10px] text-slate-400">{p.pulau_nama}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {p.total_sasaran}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-sky-600">
                          {p.total_ditimbang}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-amber-600">
                          {p.total_tidak_hadir}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isTargetAchieved 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {p.persentase_d_s}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {p.total_masalah_gizi > 0 ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                                {p.total_masalah_gizi} Balita
                              </span>
                              <div className="text-[9px] text-slate-400">
                                W:{p.gizi_kurang} · B:{p.gizi_buruk} · S:{p.stunting}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium">Nihil Kasus</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{p.ketua_kader}</div>
                          <a
                            href={`https://wa.me/${p.no_wa_kader.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(p.ketua_kader)}%20(${encodeURIComponent(p.nama_posyandu)}),%20koordinasi%20evaluasi%20penimbangan%20gizi.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                          >
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>{p.no_wa_kader}</span>
                          </a>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status_pelaksanaan === 'Sudah Lapor'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {p.status_pelaksanaan === 'Sudah Lapor' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Sudah Lapor</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Menunggu</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: RINGKASAN INDIKATOR TERPADU (ORIGINAL VIEW ENHANCED) */}
      {activeSubTab === 'ringkasan' && (
        <div className="space-y-6">
          
          {/* 5 Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div 
                  key={i} 
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                      {m.title}
                    </span>
                    <div className={`p-1.5 rounded-lg ${m.bg} ${m.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                      {m.value}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        m.badgePositive 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                      }`}>
                        {m.badge}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {m.subtext}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analisis & Rekomendasi Terpadu */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>Analisis & Rekomendasi Tim Koordinasi Penurunan Stunting (TPPS)</span>
            </h3>

            <textarea
              rows={4}
              value={catatanEvaluasi}
              onChange={(e) => setCatatanEvaluasi(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 leading-relaxed"
            />
            
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Disusun oleh Petugas Nutrisionis & Tim Koordinasi Puskesmas Kepulauan Seribu Selatan</span>
              <button 
                onClick={() => alert('Catatan evaluasi berhasil disimpan!')}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Simpan Catatan
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
