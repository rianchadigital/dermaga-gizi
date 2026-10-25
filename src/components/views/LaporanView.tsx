import React, { useState } from 'react';
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
  HeartHandshake
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { GlobalFilter, Pulau, User } from '../../types';
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
  const [catatanEvaluasi, setCatatanEvaluasi] = useState(
    'Berdasarkan evaluasi terpadu Puskesmas Kepulauan Seribu Selatan periode berjalan, intervensi PMT pangan lokal ikan laut berprotein tinggi terbukti efektif meningkatkan berat badan pada 69,0% balita bermasalah gizi. Tingkat kepatuhan kunjungan kader dan nakes mencapai 85,6%. Disarankan memperkuat armada operasional kapal laut pada musim angin barat agar distribusi formula F-75/F-100 tetap tepat waktu.'
  );

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
      subtext: 'Status BB/TB membaik',
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50'
    },
    {
      title: 'Koordinasi Lintas Sektor',
      value: '91,0%',
      badge: '16 / 18',
      badgePositive: true,
      subtext: 'Mitra aktif kolaborasi',
      icon: HeartHandshake,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/50'
    },
    {
      title: 'Penurunan Kasus Berisiko',
      value: '55,6%',
      badge: '-12 kasus',
      badgePositive: true,
      subtext: 'Graduasi status gizi baik',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/50'
    }
  ];

  // Before & After Comparison Chart (Lampiran 2 Menu 6)
  const comparisonData = [
    { kategori: 'Gizi Kurang', awal: 38, evaluasi: 22 },
    { kategori: 'BB Tidak Naik', awal: 16, evaluasi: 8 },
    { kategori: 'Risiko Stunting', awal: 12, evaluasi: 6 },
    { kategori: 'Normal / Membaik', awal: 6, evaluasi: 36 }
  ];

  // Rekapitulasi per Wilayah 4 Pulau (Tanpa Pulau Bokor)
  const rekapWilayah = [
    {
      id: 'P01',
      pulau: 'Pulau Tidung',
      sasaran: 180,
      kasus: 28,
      pantauPct: '88,9%',
      tlSelesai: 21,
      tlTertunda: 7,
      kepatuhan: '89,5%',
      status: 'Terkendali'
    },
    {
      id: 'P02',
      pulau: 'Pulau Pari',
      sasaran: 150,
      kasus: 22,
      pantauPct: '84,0%',
      tlSelesai: 16,
      tlTertunda: 6,
      kepatuhan: '85,0%',
      status: 'Terkendali'
    },
    {
      id: 'P03',
      pulau: 'Pulau Lancang',
      sasaran: 100,
      kasus: 14,
      pantauPct: '82,0%',
      tlSelesai: 10,
      tlTertunda: 4,
      kepatuhan: '81,2%',
      status: 'Perhatian'
    },
    {
      id: 'P04',
      pulau: 'Pulau Untung Jawa',
      sasaran: 50,
      kasus: 8,
      pantauPct: '86,0%',
      tlSelesai: 6,
      tlTertunda: 2,
      kepatuhan: '87,5%',
      status: 'Terkendali'
    }
  ];

  const handlePrint = () => {
    window.print();
    storageService.addLog('EXPORT', 'SYSTEM', 'REPORT-PRINT', `Cetak dokumen laporan resmi periode ${filter.tahun}`, 'SUCCESS');
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Wilayah Pulau',
      'Sasaran Terdaftar',
      'Kasus Ditemukan',
      'Sasaran Dipantau (%)',
      'TL Selesai',
      'TL Tertunda',
      'Kepatuhan Intervensi (%)',
      'Status Wilayah'
    ];

    const rows = rekapWilayah.map((r, i) => [
      i + 1,
      r.pulau,
      r.sasaran,
      r.kasus,
      r.pantauPct,
      r.tlSelesai,
      r.tlTertunda,
      r.kepatuhan,
      r.status
    ]);

    exportToCSV(`Rekap_Laporan_Gizi_${filter.pulau_id}_${filter.tahun}`, headers, rows);
    storageService.addLog('EXPORT', 'SYSTEM', 'REPORT-CSV', `Ekspor rekap komparatif evaluasi gizi`, 'SUCCESS');
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header - Hidden on Print */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              Laporan dan Evaluasi Program Gizi
            </h1>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
              Format Siap Cetak
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kompilasi laporan capaian, efektivitas tindak lanjut balita gizi, dan rekomendasi strategis Puskesmas Kepulauan Seribu Selatan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* 5 Top Summary Metric Cards (Lampiran 2 Menu 6: 85,6%, 73,6%, 69,0%, 91,0%, 55,6%) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">
                  {m.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded font-mono">
                    {m.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{m.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualisasi: Before vs After Comparison (Lampiran 2 Menu 6) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Perbandingan Status Gizi Balita Sasaran (Awal Intervensi vs Evaluasi Terakhir)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluasi tren perbaikan status gizi balita setelah intervensi PMT pangan lokal dan tindak lanjut terpadu
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-400"></span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Awal Intervensi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">Evaluasi Terakhir</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="kategori" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              />
              <Bar dataKey="awal" name="Awal Intervensi" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="evaluasi" name="Evaluasi Terakhir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Hasil Signifikan:</strong> Penurunan 42,1% kasus Gizi Kurang (38 balita menjadi 22 balita) dan peningkatan balita Normal / Membaik dari 6 menjadi 36 balita.
          </span>
        </div>
      </div>

      {/* Tabel: Rekapitulasi Capaian per Wilayah Pulau (Lampiran 2 Menu 6) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Rekapitulasi Capaian per Wilayah Pulau
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Puskesmas Kepulauan Seribu Selatan · Periode Oktober 2026
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[150px]">Wilayah Pulau</th>
                <th className="py-3 px-3 text-center">Sasaran Terdaftar</th>
                <th className="py-3 px-3 text-center">Kasus Ditemukan</th>
                <th className="py-3 px-3 text-center">Dipantau (%)</th>
                <th className="py-3 px-3 text-center">TL Selesai</th>
                <th className="py-3 px-3 text-center">TL Tertunda</th>
                <th className="py-3 px-3 text-center">Kepatuhan (%)</th>
                <th className="py-3 px-3 text-center">Status Wilayah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rekapWilayah.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.pulau}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">{r.sasaran}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-amber-600">{r.kasus}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-600 font-semibold">{r.pantauPct}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-600 font-bold">{r.tlSelesai}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-500 font-bold">{r.tlTertunda}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-sky-600 font-semibold">{r.kepatuhan}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'Terkendali'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Row Total */}
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <td className="py-3 px-3 text-center" colSpan={2}>Total & Rata-Rata Wilayah</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums">480</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-amber-600">72</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-600">85,6%</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-600">53</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-500">19</td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-sky-600">85,8%</td>
                <td className="py-3 px-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-600">OPTIMAL</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Evaluasi Tenaga Gizi & Rekomendasi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
        <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          Catatan Evaluasi Program & Rencana Tindak Lanjut Tenaga Gizi
        </h2>
        <textarea
          rows={3}
          value={catatanEvaluasi}
          onChange={e => setCatatanEvaluasi(e.target.value)}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="text-[10px] text-slate-400 italic">
          * Catatan ini akan dicetak otomatis dalam lembar pengesahan laporan resmi Puskesmas Kepulauan Seribu Selatan.
        </div>
      </div>

      {/* Lembar Tanda Tangan Resmi (Cetak & Dokumentasi) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Mengetahui,</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Kepala Puskesmas Kepulauan Seribu Selatan</p>
            <div className="h-16 flex items-end">
              <div className="border-b border-slate-400 dark:border-slate-600 w-48 text-center pb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">dr. H. Rahmat Hidayat</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">NIP. 19780512 200501 1 003</p>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Kepulauan Seribu Selatan, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Penanggung Jawab Program Gizi</p>
            <div className="h-16 flex items-end justify-center sm:justify-end">
              <div className="border-b border-slate-400 dark:border-slate-600 w-48 text-center pb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Siti Rahmawati, S.Tr.Gz</span>
              </div>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">NIP. 19890420 201212 2 002</p>
          </div>
        </div>
      </div>

    </div>
  );
};
