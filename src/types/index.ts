/**
 * DERMAGA GIZI - Type Definitions
 * Puskesmas Kepulauan Seribu Selatan
 */

export type Role = 
  | 'ADMIN' 
  | 'KEPALA_PUSKESMAS' 
  | 'TENAGA_GIZI' 
  | 'DOKTER_BIDAN_PERAWAT' 
  | 'PETUGAS_PUSTU' 
  | 'KADER' 
  | 'LINTAS_SEKTOR' 
  | 'VIEWER';

export interface User {
  user_id: string;
  email: string;
  nama: string;
  no_wa?: string; // Nomor WhatsApp aktif (format: 628...)
  role: Role;
  unit: string;
  pulau_id: string;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppNotification {
  notif_id: string;
  waktu: string;
  penerima_nama: string;
  penerima_role: Role;
  penerima_wa: string;
  kategori: 'SASARAN_BARU' | 'TINDAK_LANJUT_BARU' | 'TINDAK_LANJUT_UPDATE' | 'PERINGATAN_OVERDUE';
  judul: string;
  pesan: string;
  status: 'TERKIRIM' | 'MENUNGGU';
  link_wa: string;
}

export interface RolePerformanceSummary {
  role: Role;
  role_label: string;
  total_petugas: number;
  total_tindak_lanjut: number;
  selesai: number;
  dalam_proses: number;
  tertunda: number;
  overdue: number;
  persen_selesai: number;
  petugas_list: {
    user_id: string;
    nama: string;
    no_wa?: string;
    unit: string;
    total: number;
    selesai: number;
    tertunda: number;
    overdue: number;
    persen: number;
  }[];
}

export type StatusAkses = 'Mudah' | 'Sedang' | 'Tergantung Cuaca/Gelombang' | 'Terisolasi';

export interface Pulau {
  pulau_id: string;
  nama_pulau: string;
  unit_pelayanan: string;
  latitude: number;
  longitude: number;
  status_akses: StatusAkses;
  keterangan: string;
  status_aktif: boolean;
}

export type KategoriMasalahGizi = 
  | 'Stunting (Pendek)'
  | 'Wasting (Kurus/Gizi Kurang)'
  | 'Underweight (BB Kurang)'
  | 'Gizi Buruk'
  | 'Risiko Gizi Lebih / Obesitas'
  | 'Gizi Baik (Normal)';

export interface SasaranBalita {
  sasaran_id: string;
  kode_sasaran: string; // Anonymous code e.g. "BLT-TDG-042"
  inisial: string; // e.g. "An. AR"
  tanggal_lahir: string; // DD/MM/YYYY
  jenis_kelamin: 'L' | 'P';
  pulau_id: string;
  unit_pelayanan: string;
  tanggal_registrasi: string;
  status_aktif: boolean;
  kategori_masalah_terakhir?: KategoriMasalahGizi;
  bb_terakhir?: number; // kg
  tb_terakhir?: number; // cm
  tanggal_pantau_terakhir?: string;
}

export interface Pemantauan {
  pemantauan_id: string;
  sasaran_id: string;
  tanggal_pemantauan: string; // DD/MM/YYYY
  petugas_id: string;
  indikator_terukur: string; // e.g., "BB: 8.4kg, TB: 78cm, LiLA: 12.0cm"
  kategori_masalah: KategoriMasalahGizi;
  hasil_pemeriksaan: string;
  catatan_terbatas: string;
  periode: string; // e.g. "2026-10"
  created_at: string;
}

export type StatusTindakLanjut = 
  | 'Belum ditindaklanjuti'
  | 'Dalam proses'
  | 'Menunggu koordinasi'
  | 'Selesai'
  | 'Perlu evaluasi ulang'
  | 'Dibatalkan';

export type Prioritas = 'Tinggi' | 'Sedang' | 'Rendah';

export interface TindakLanjut {
  tindak_lanjut_id: string;
  sasaran_id: string;
  pemantauan_id?: string;
  kategori: string; // e.g. "Pemberian PMT Pemulihan", "Konseling Diet", "Rujukan Spesialis Anak"
  rencana_intervensi: string;
  tanggal_rencana: string;
  tenggat: string; // DD/MM/YYYY
  petugas_id: string;
  status: StatusTindakLanjut;
  prioritas: Prioritas;
  tanggal_selesai?: string;
  catatan: string;
  bukti_dukung?: string;
  alasan_pembatalan?: string;
  created_at: string;
  updated_at: string;
}

export type KategoriKendala = 
  | 'Transportasi'
  | 'Transportasi laut'
  | 'Cuaca dan gelombang'
  | 'Ketidakhadiran sasaran'
  | 'Perubahan jadwal pelayanan'
  | 'Perubahan jadwal posyandu'
  | 'Keterbatasan petugas'
  | 'Logistik dan ketersediaan intervensi'
  | 'Ketersediaan logistik PMT'
  | 'Komunikasi'
  | 'Kendala lainnya';

export type StatusKendala = 
  | 'Baru'
  | 'Dalam proses'
  | 'Menunggu koordinasi'
  | 'Selesai'
  | 'Belum terselesaikan';

export interface Kendala {
  kendala_id: string;
  tanggal_kejadian: string;
  pulau_id: string;
  kategori: KategoriKendala;
  deskripsi: string;
  dampak: string;
  rencana_penyelesaian: string;
  penanggung_jawab: string;
  tenggat: string;
  status: StatusKendala;
  sasaran_terkait_kode?: string;
  catatan_tindak_lanjut?: string;
  created_at: string;
  updated_at: string;
}

export type StatusLintasSektor = 
  | 'Dalam Perencanaan' 
  | 'Berjalan' 
  | 'Menunggu Evaluasi' 
  | 'Selesai' 
  | 'Tertunda'
  | 'Perlu koordinasi';

export interface KegiatanLintasSektor {
  kegiatan_id: string;
  tanggal_kesepakatan: string;
  nama_kegiatan: string;
  pulau_id: string;
  mitra: string; // e.g. "Kelurahan Pulau Tidung", "TP PKK", "Kecamatan", "Sekolah PAUD"
  penanggung_jawab: string;
  tenggat: string;
  indikator: string;
  target: number;
  realisasi: number;
  progres: number; // 0-100%
  status: StatusLintasSektor;
  catatan: string;
  terakhir_evaluasi: string;
  updated_at: string;
}

export interface RiwayatAktivitas {
  log_id: string;
  waktu: string;
  user_id: string;
  user_name: string;
  aksi: 'CREATE' | 'UPDATE' | 'CANCEL' | 'EXPORT' | 'INIT';
  jenis_data: 'SASARAN' | 'PEMANTAUAN' | 'TINDAK_LANJUT' | 'KENDALA' | 'LINTAS_SEKTOR' | 'SYSTEM';
  record_id: string;
  ringkasan_perubahan: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface EvaluasiIndikator {
  evaluasi_id: string;
  periode_awal: string;
  periode_akhir: string;
  pulau_id: string;
  indikator: string;
  hasil: string;
  analisis: string;
  rekomendasi: string;
  petugas_id: string;
  created_at: string;
}

export interface GlobalFilter {
  pulau_id: string; // 'ALL' or specific pulau_id
  tahun: string; // '2026'
  bulan: string; // 'ALL' or '01' - '12'
  kategori_masalah?: string;
  status_tindak_lanjut?: string;
  search_query?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error?: string;
}
