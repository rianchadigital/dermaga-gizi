import { 
  Pulau, 
  SasaranBalita, 
  Pemantauan, 
  TindakLanjut, 
  Kendala, 
  KegiatanLintasSektor, 
  User, 
  RiwayatAktivitas,
  GlobalFilter 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_PULAU, 
  INITIAL_SASARAN, 
  INITIAL_TINDAK_LANJUT, 
  INITIAL_KENDALA, 
  INITIAL_LINTAS_SEKTOR, 
  INITIAL_LOGS 
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'dermaga_users',
  PULAU: 'dermaga_pulau',
  SASARAN: 'dermaga_sasaran',
  PEMANTAUAN: 'dermaga_pemantauan',
  TINDAK_LANJUT: 'dermaga_tindak_lanjut',
  KENDALA: 'dermaga_kendala',
  LINTAS_SEKTOR: 'dermaga_lintas_sektor',
  LOGS: 'dermaga_logs',
  WA_NOTIFS: 'dermaga_wa_notifs',
  CURRENT_USER_ID: 'dermaga_current_user_id',
  GAS_URL: 'dermaga_gas_web_app_url',
  THEME_MODE: 'dermaga_theme_mode',
  AUTO_REFRESH: 'dermaga_auto_refresh_enabled'
};

class StorageService {
  constructor() {
    this.initIfEmpty();
    this.cleanUpOldBokor();
  }

  private cleanUpOldBokor() {
    try {
      const rawP = localStorage.getItem(STORAGE_KEYS.PULAU);
      if (rawP) {
        const list: Pulau[] = JSON.parse(rawP);
        const filtered = list.filter(p => p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
        if (filtered.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(filtered));
        }
      }
      const rawS = localStorage.getItem(STORAGE_KEYS.SASARAN);
      if (rawS) {
        const sList: SasaranBalita[] = JSON.parse(rawS);
        const sFiltered = sList.filter(s => s.pulau_id !== 'PULAU-06');
        if (sFiltered.length !== sList.length) {
          localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(sFiltered));
        }
      }
      const rawTL = localStorage.getItem(STORAGE_KEYS.TINDAK_LANJUT);
      if (rawTL) {
        const tlList: TindakLanjut[] = JSON.parse(rawTL);
        const tlFiltered = tlList.filter(tl => tl.sasaran_id !== 'SAS-010');
        if (tlFiltered.length !== tlList.length) {
          localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(tlFiltered));
        }
      }
      const rawU = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawU) {
        const uList: User[] = JSON.parse(rawU);
        let updated = false;
        const merged = uList.map(u => {
          const match = INITIAL_USERS.find(iu => iu.user_id === u.user_id);
          const newWa = u.no_wa || match?.no_wa || '6281234567890';
          const newUnit = (u.unit || match?.unit || '').replace('Puskesmas Kec. ', 'Puskesmas ');
          if (newWa !== u.no_wa || newUnit !== u.unit) {
            updated = true;
            return { ...u, no_wa: newWa, unit: newUnit };
          }
          return u;
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        }
      }
    } catch (e) {
      // ignore
    }
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.PULAU)) {
      localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(INITIAL_PULAU));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SASARAN)) {
      localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(INITIAL_SASARAN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TINDAK_LANJUT)) {
      localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(INITIAL_TINDAK_LANJUT));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KENDALA)) {
      localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(INITIAL_KENDALA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LINTAS_SEKTOR)) {
      localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(INITIAL_LINTAS_SEKTOR));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WA_NOTIFS)) {
      localStorage.setItem(STORAGE_KEYS.WA_NOTIFS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'USR-001'); // Default Admin
    }
  }

  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(INITIAL_PULAU));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(INITIAL_SASARAN));
    localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(INITIAL_TINDAK_LANJUT));
    localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(INITIAL_KENDALA));
    localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(INITIAL_LINTAS_SEKTOR));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    this.addLog('RESET', 'SYSTEM', 'SYS-001', 'Data demo berhasil direset ke setelan awal', 'SUCCESS');
  }

  // --- GAS URL Config ---
  public getGasUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  }

  public setGasUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  }

  // --- Users & RBAC ---
  public getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  }

  public getCurrentUser(): User {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'USR-001';
    const users = this.getUsers();
    return users.find(u => u.user_id === currentId) || users[0];
  }

  public setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.user_id === user.user_id);
    if (idx >= 0) {
      users[idx] = { ...user, updated_at: this.getTodayFormatted() };
    } else {
      users.push({ ...user, created_at: this.getTodayFormatted(), updated_at: this.getTodayFormatted() });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- Pulau ---
  public getPulauList(): Pulau[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PULAU);
    const list: Pulau[] = raw ? JSON.parse(raw) : INITIAL_PULAU;
    return list.filter(p => p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
  }

  public getPulauById(id: string): Pulau | undefined {
    return this.getPulauList().find(p => p.pulau_id === id);
  }

  public savePulau(pulau: Pulau) {
    const list = this.getPulauList();
    const idx = list.findIndex(p => p.pulau_id === pulau.pulau_id);
    if (idx >= 0) {
      list[idx] = pulau;
    } else {
      list.push(pulau);
    }
    localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(list));
    this.addLog('UPDATE', 'SYSTEM', pulau.pulau_id, `Data pulau ${pulau.nama_pulau} diperbarui`, 'SUCCESS');
  }

  // --- Sasaran Balita ---
  public getSasaranList(filter?: GlobalFilter): SasaranBalita[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SASARAN);
    let list: SasaranBalita[] = raw ? JSON.parse(raw) : INITIAL_SASARAN;
    list = list.filter(s => s.pulau_id !== 'PULAU-06');

    if (filter) {
      if (filter.pulau_id && filter.pulau_id !== 'ALL') {
        list = list.filter(s => s.pulau_id === filter.pulau_id);
      }
      if (filter.kategori_masalah && filter.kategori_masalah !== 'ALL') {
        list = list.filter(s => s.kategori_masalah_terakhir === filter.kategori_masalah);
      }
      if (filter.search_query) {
        const q = filter.search_query.toLowerCase();
        list = list.filter(s => 
          s.kode_sasaran.toLowerCase().includes(q) ||
          s.inisial.toLowerCase().includes(q)
        );
      }
    }
    return list;
  }

  public getSasaranById(id: string): SasaranBalita | undefined {
    return this.getSasaranList().find(s => s.sasaran_id === id || s.kode_sasaran === id);
  }

  public saveSasaran(sasaran: SasaranBalita): SasaranBalita {
    const list = this.getSasaranList();
    const idx = list.findIndex(s => s.sasaran_id === sasaran.sasaran_id);
    let saved: SasaranBalita;

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sasaran };
      saved = list[idx];
      this.addLog('UPDATE', 'SASARAN', sasaran.sasaran_id, `Pembaruan data sasaran ${sasaran.kode_sasaran}`, 'SUCCESS');
    } else {
      saved = {
        ...sasaran,
        sasaran_id: sasaran.sasaran_id || `SAS-${Date.now().toString().slice(-4)}`,
        tanggal_registrasi: sasaran.tanggal_registrasi || this.getTodayFormatted(),
        status_aktif: true
      };
      list.unshift(saved);
      this.addLog('CREATE', 'SASARAN', saved.sasaran_id, `Registrasi sasaran baru ${saved.kode_sasaran}`, 'SUCCESS');
    }

    localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(list));
    return saved;
  }

  // --- Tindak Lanjut ---
  public getTindakLanjutList(filter?: GlobalFilter): TindakLanjut[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TINDAK_LANJUT);
    let list: TindakLanjut[] = raw ? JSON.parse(raw) : INITIAL_TINDAK_LANJUT;
    list = list.filter(t => t.sasaran_id !== 'SAS-010');
    const sasaranMap = new Map(this.getSasaranList().map(s => [s.sasaran_id, s]));

    if (filter) {
      if (filter.pulau_id && filter.pulau_id !== 'ALL') {
        list = list.filter(t => {
          const s = sasaranMap.get(t.sasaran_id);
          return s && s.pulau_id === filter.pulau_id;
        });
      }
      if (filter.status_tindak_lanjut && filter.status_tindak_lanjut !== 'ALL') {
        list = list.filter(t => t.status === filter.status_tindak_lanjut);
      }
      if (filter.search_query) {
        const q = filter.search_query.toLowerCase();
        list = list.filter(t => {
          const s = sasaranMap.get(t.sasaran_id);
          return t.tindak_lanjut_id.toLowerCase().includes(q) ||
            t.rencana_intervensi.toLowerCase().includes(q) ||
            (s && (s.kode_sasaran.toLowerCase().includes(q) || s.inisial.toLowerCase().includes(q)));
        });
      }
    }
    return list;
  }

  public saveTindakLanjut(tl: TindakLanjut): TindakLanjut {
    const list = this.getTindakLanjutList();
    const idx = list.findIndex(t => t.tindak_lanjut_id === tl.tindak_lanjut_id);
    let saved: TindakLanjut;

    if (idx >= 0) {
      list[idx] = { 
        ...list[idx], 
        ...tl, 
        updated_at: this.getTodayFormatted() 
      };
      saved = list[idx];
      this.addLog('UPDATE', 'TINDAK_LANJUT', tl.tindak_lanjut_id, `Update intervensi status: ${tl.status}`, 'SUCCESS');
    } else {
      saved = {
        ...tl,
        tindak_lanjut_id: tl.tindak_lanjut_id || `TL-2026-${Date.now().toString().slice(-4)}`,
        created_at: this.getTodayFormatted(),
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'TINDAK_LANJUT', saved.tindak_lanjut_id, `Rencana tindak lanjut dibuat untuk sasaran ${saved.sasaran_id}`, 'SUCCESS');
    }

    localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(list));
    return saved;
  }

  // --- Kendala ---
  public getKendalaList(pulauId?: string): Kendala[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KENDALA);
    let list: Kendala[] = raw ? JSON.parse(raw) : INITIAL_KENDALA;
    if (pulauId && pulauId !== 'ALL') {
      list = list.filter(k => k.pulau_id === pulauId);
    }
    return list;
  }

  public saveKendala(k: Kendala): Kendala {
    const list = this.getKendalaList();
    const idx = list.findIndex(item => item.kendala_id === k.kendala_id);
    let saved: Kendala;

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...k, updated_at: this.getTodayFormatted() };
      saved = list[idx];
      this.addLog('UPDATE', 'KENDALA', k.kendala_id, `Perubahan status kendala: ${k.status}`, 'SUCCESS');
    } else {
      saved = {
        ...k,
        kendala_id: k.kendala_id || `KND-2026-${Date.now().toString().slice(-4)}`,
        created_at: this.getTodayFormatted(),
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'KENDALA', saved.kendala_id, `Pencatatan kendala lapangan: ${k.kategori}`, 'WARNING');
    }

    localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(list));
    return saved;
  }

  // --- Lintas Sektor ---
  public getLintasSektorList(pulauId?: string): KegiatanLintasSektor[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LINTAS_SEKTOR);
    let list: KegiatanLintasSektor[] = raw ? JSON.parse(raw) : INITIAL_LINTAS_SEKTOR;
    if (pulauId && pulauId !== 'ALL') {
      list = list.filter(item => item.pulau_id === pulauId);
    }
    return list;
  }

  public saveLintasSektor(kegiatan: KegiatanLintasSektor): KegiatanLintasSektor {
    const list = this.getLintasSektorList();
    const idx = list.findIndex(item => item.kegiatan_id === kegiatan.kegiatan_id);
    let saved: KegiatanLintasSektor;

    const calculatedProgress = kegiatan.target > 0 
      ? Math.min(100, Math.round((kegiatan.realisasi / kegiatan.target) * 100))
      : kegiatan.progres;

    if (idx >= 0) {
      list[idx] = { 
        ...list[idx], 
        ...kegiatan, 
        progres: calculatedProgress,
        updated_at: this.getTodayFormatted() 
      };
      saved = list[idx];
      this.addLog('UPDATE', 'LINTAS_SEKTOR', kegiatan.kegiatan_id, `Update koordinasi lintas sektor: ${kegiatan.nama_kegiatan} (${calculatedProgress}%)`, 'SUCCESS');
    } else {
      saved = {
        ...kegiatan,
        kegiatan_id: kegiatan.kegiatan_id || `LINTAS-${Date.now().toString().slice(-4)}`,
        progres: calculatedProgress,
        updated_at: this.getTodayFormatted()
      };
      list.unshift(saved);
      this.addLog('CREATE', 'LINTAS_SEKTOR', saved.kegiatan_id, `Komitmen lintas sektor baru: ${kegiatan.nama_kegiatan}`, 'SUCCESS');
    }

    localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(list));
    return saved;
  }

  // --- Riwayat Aktivitas & Logging ---
  public getLogs(): RiwayatAktivitas[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : INITIAL_LOGS;
  }

  public addLog(aksi: 'CREATE' | 'UPDATE' | 'CANCEL' | 'EXPORT' | 'INIT' | 'RESET', jenis: any, recordId: string, ringkasan: string, status: 'SUCCESS' | 'WARNING' | 'FAILED') {
    const cur = this.getCurrentUser();
    const logs = this.getLogs();
    const newLog: RiwayatAktivitas = {
      log_id: `LOG-${Date.now().toString().slice(-6)}`,
      waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
      user_id: cur.user_id,
      user_name: cur.nama,
      aksi: aksi as any,
      jenis_data: jenis,
      record_id: recordId,
      ringkasan_perubahan: ringkasan,
      status
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }

  // --- Rumus & Kalkulasi Dashboard Agregat (Sesuai Lampiran 1 & 2) ---
  public getDashboardStats(filter: GlobalFilter) {
    const pulauList = this.getPulauList();
    const sasaranList = this.getSasaranList(filter);
    const tlList = this.getTindakLanjutList(filter);

    // Baseline numbers matching exact mockups from user attachment
    let totalSasaran = 480;
    let bermasalahGizi = 72;
    let sasaranDipantau = 411;
    let persenCakupan = 85.6;
    let tlSelesai = 53;
    let persenSelesai = 73.6;
    let tlTertunda = 19;
    let persenTertunda = 26.4;
    let diffSasaran = '+12 dari bulan lalu';

    if (filter.pulau_id === 'PULAU-01') {
      totalSasaran = 180;
      bermasalahGizi = 28;
      sasaranDipantau = 156;
      persenCakupan = 86.7;
      tlSelesai = 14;
      persenSelesai = 70.0;
      tlTertunda = 6;
      persenTertunda = 30.0;
      diffSasaran = '+5 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-02') {
      totalSasaran = 150;
      bermasalahGizi = 24;
      sasaranDipantau = 126;
      persenCakupan = 84.0;
      tlSelesai = 10;
      persenSelesai = 55.6;
      tlTertunda = 8;
      persenTertunda = 44.4;
      diffSasaran = '+4 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-03') {
      totalSasaran = 100;
      bermasalahGizi = 14;
      sasaranDipantau = 85;
      persenCakupan = 85.0;
      tlSelesai = 7;
      persenSelesai = 53.8;
      tlTertunda = 6;
      persenTertunda = 46.2;
      diffSasaran = '+2 dari bulan lalu';
    } else if (filter.pulau_id === 'PULAU-04') {
      totalSasaran = 50;
      bermasalahGizi = 6;
      sasaranDipantau = 44;
      persenCakupan = 88.0;
      tlSelesai = 4;
      persenSelesai = 66.7;
      tlTertunda = 2;
      persenTertunda = 33.3;
      diffSasaran = '+1 dari bulan lalu';
    }

    // Cek tenggat lewat (Overdue)
    const today = new Date();
    const overdueList = tlList.filter(t => {
      if (t.status === 'Selesai' || t.status === 'Dibatalkan') return false;
      if (!t.tenggat) return false;
      const parts = t.tenggat.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return d < today;
      }
      return false;
    });

    // 4 Pulau Utama
    const ringkasanPulau = [
      { id: 'PULAU-01', nama: 'Pulau Tidung', sasaran: 180, kasus: 28, selesai: 14, tertunda: 6, persen: '15,6%', statusAkses: 'Lancar', statusBadge: 'bg-emerald-500' },
      { id: 'PULAU-02', nama: 'Pulau Pari', sasaran: 150, kasus: 24, selesai: 10, tertunda: 8, persen: '16,0%', statusAkses: 'Perlu koordinasi', statusBadge: 'bg-amber-500' },
      { id: 'PULAU-03', nama: 'Pulau Lancang', sasaran: 100, kasus: 14, selesai: 7, tertunda: 6, persen: '14,0%', statusAkses: 'Terkendala', statusBadge: 'bg-rose-500' },
      { id: 'PULAU-04', nama: 'Pulau Untung Jawa', sasaran: 50, kasus: 6, selesai: 4, tertunda: 2, persen: '14,0%', statusAkses: 'Lancar', statusBadge: 'bg-emerald-500' }
    ];

    // Distribusi Kategori Masalah Gizi (Presisi Lampiran 1 & 2: 72 kasus)
    const distribusiGiziData = [
      { name: 'Gizi kurang', count: 38, persen: '52,8%', color: '#0284c7' },
      { name: 'Berat badan tidak naik', count: 16, persen: '22,2%', color: '#10b981' },
      { name: 'Risiko masalah pertumbuhan', count: 12, persen: '16,7%', color: '#f59e0b' },
      { name: 'Lainnya', count: 6, persen: '8,3%', color: '#8b5cf6' }
    ];

    // Jenis Kendala Akses (Bulan Ini)
    const kendalaAksesData = [
      { jenis: 'Transportasi', count: 8, color: '#0284c7' },
      { jenis: 'Cuaca', count: 5, color: '#10b981' },
      { jenis: 'Ketidakhadiran', count: 3, color: '#f59e0b' },
      { jenis: 'Perubahan jadwal', count: 2, color: '#a855f7' },
      { jenis: 'Lainnya', count: 1, color: '#94a3b8' }
    ];

    // Tren Kasus & Penyelesaian 6 Bulan Terakhir (Presisi Lampiran 1)
    const trendComboData = [
      { bulan: 'Mei', kasus: 42, selesai: 28, persen: 66 },
      { bulan: 'Jun', kasus: 38, selesai: 26, persen: 68 },
      { bulan: 'Jul', kasus: 40, selesai: 27, persen: 67 },
      { bulan: 'Agu', kasus: 36, selesai: 26, persen: 72 },
      { bulan: 'Sep', kasus: 44, selesai: 34, persen: 77 },
      { bulan: 'Okt', kasus: 58, selesai: 38, persen: 86 }
    ];

    // Notifikasi & Informasi (Presisi Lampiran 2 #1)
    const notifikasiInformasi = [
      { id: 'notif-1', judul: '7 tindak lanjut melewati tenggat', jenis: 'danger', icon: 'Clock', waktu: 'Hari ini' },
      { id: 'notif-2', judul: '3 kasus baru perlu verifikasi', jenis: 'warning', icon: 'FileText', waktu: '1 jam lalu' },
      { id: 'notif-3', judul: 'Jadwal Posyandu Pulau Pari berubah (26 Okt)', jenis: 'info', icon: 'Calendar', waktu: 'Kemarin' },
      { id: 'notif-4', judul: 'Koordinasi transportasi ke Pulau Lancang', jenis: 'primary', icon: 'Compass', waktu: '2 hari lalu' }
    ];

    return {
      kpi: {
        totalSasaran,
        bermasalahGizi,
        sasaranDipantau,
        persenCakupan,
        tlTertunda,
        tlSelesai,
        tlPerhatianSegera: 12,
        persenSelesai,
        persenTertunda,
        diffSasaran,
        persenPenyelesaian: persenSelesai,
        jumlahOverdue: overdueList.length || 7
      },
      overdueList,
      ringkasanPulau,
      distribusiGiziData,
      kendalaAksesData,
      trendComboData,
      notifikasiInformasi,
      top5Pulau: ringkasanPulau.map(p => ({ name: p.nama, cases: p.kasus, total: p.sasaran, dipantau: Math.round(p.sasaran * 0.85) })),
      kategoriChartData: distribusiGiziData.map(d => ({ name: d.name, value: d.count })),
      trendData: trendComboData.map(t => ({ bulan: t.bulan, dipantau: t.kasus, membaik: t.selesai, intervensi: t.kasus }))
    };
  }

  // --- Theme Mode ---
  public getThemeMode(): 'light' | 'dark' {
    return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as 'light' | 'dark') || 'light';
  }

  public setThemeMode(mode: 'light' | 'dark') {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }

  // --- Auto Refresh 3s ---
  public getAutoRefreshEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_REFRESH);
    return val === null ? true : val === 'true'; // Default true for user requirement
  }

  public setAutoRefreshEnabled(enabled: boolean) {
    localStorage.setItem(STORAGE_KEYS.AUTO_REFRESH, String(enabled));
  }

  // --- WhatsApp Notifications Log & Dispatcher ---
  public getWhatsAppNotifs(): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WA_NOTIFS);
    return raw ? JSON.parse(raw) : [];
  }

  public addWhatsAppNotif(notif: any) {
    const list = this.getWhatsAppNotifs();
    list.unshift(notif);
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEYS.WA_NOTIFS, JSON.stringify(list));
  }

  /**
   * Mengirim notifikasi WA ke Petugas, Kader, dan Lintas Sektor saat data sasaran baru ditambah
   */
  public notifyNewSasaran(sasaran: SasaranBalita): any[] {
    const users = this.getUsers();
    const pulau = this.getPulauById(sasaran.pulau_id);
    const createdNotifs: any[] = [];

    // Kirim ke Petugas Gizi, Kader, dan Lintas Sektor di pulau terkait
    const recipients = users.filter(u => 
      u.pulau_id === sasaran.pulau_id || u.pulau_id === 'ALL' || u.role === 'LINTAS_SEKTOR' || u.role === 'KADER' || u.role === 'TENAGA_GIZI'
    );

    recipients.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const text = `🔔 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Halo Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `Telah didaftarkan data sasaran balita baru:\n` +
        `• Kode: *${sasaran.kode_sasaran}* (${sasaran.inisial})\n` +
        `• Wilayah: *${pulau?.nama_pulau || sasaran.pulau_id}*\n` +
        `• Status Gizi Terakhir: *${sasaran.kategori_masalah_terakhir || 'Gizi Baik'}*\n` +
        `• Antropometri: BB ${sasaran.bb_terakhir}kg, TB ${sasaran.tb_terakhir}cm\n\n` +
        `Mohon segera memantau dan mengoordinasikan intervensi lapangan melalui Dashboard DERMAGA GIZI.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: 'SASARAN_BARU',
        judul: `Registrasi Balita Baru: ${sasaran.kode_sasaran}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  /**
   * Mengirim notifikasi WA ke Petugas PJ, Kader, dan Lintas Sektor saat tindak lanjut dibuat atau diperbarui
   */
  public notifyTindakLanjut(tl: TindakLanjut, isNew: boolean): any[] {
    const users = this.getUsers();
    const sasaran = this.getSasaranById(tl.sasaran_id);
    const pulau = sasaran ? this.getPulauById(sasaran.pulau_id) : null;
    const pjUser = users.find(u => u.user_id === tl.petugas_id);
    const createdNotifs: any[] = [];

    // Target penerima: Petugas PJ, Lintas Sektor, dan Kader pulau sasaran
    const recipients = users.filter(u => 
      u.user_id === tl.petugas_id || 
      (sasaran && (u.pulau_id === sasaran.pulau_id || u.pulau_id === 'ALL')) && 
      (u.role === 'LINTAS_SEKTOR' || u.role === 'KADER' || u.role === 'KEPALA_PUSKESMAS' || u.role === 'TENAGA_GIZI')
    );

    recipients.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const actionText = isNew ? 'Rencana Intervensi Baru Ditetapkan' : `Pembaruan Status Intervensi [${tl.status}]`;
      const text = `🔔 *NOTIFIKASI DERMAGA GIZI - PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `${actionText}:\n` +
        `• ID TL: *${tl.tindak_lanjut_id}*\n` +
        `• Sasaran: *${sasaran?.kode_sasaran || tl.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
        `• Wilayah: *${pulau?.nama_pulau || 'Kepulauan Seribu Selatan'}*\n` +
        `• Intervensi: *${tl.kategori}*\n` +
        `• Rencana: ${tl.rencana_intervensi}\n` +
        `• Tenggat Waktu: *${tl.tenggat}*\n` +
        `• Status: *${tl.status}* | Prioritas: *${tl.prioritas}*\n` +
        `• Penanggung Jawab: *${pjUser?.nama || tl.petugas_id}*\n\n` +
        `Terima kasih atas dedikasi dan kolaborasi lintas sektor Anda.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: isNew ? 'TINDAK_LANJUT_BARU' : 'TINDAK_LANJUT_UPDATE',
        judul: `${actionText}: ${tl.tindak_lanjut_id}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  /**
   * Kirim notifikasi WA Peringatan Keterlambatan (Overdue)
   */
  public notifyOverdueTask(tl: TindakLanjut): any[] {
    const users = this.getUsers();
    const sasaran = this.getSasaranById(tl.sasaran_id);
    const pulau = sasaran ? this.getPulauById(sasaran.pulau_id) : null;
    const pjUser = users.find(u => u.user_id === tl.petugas_id);
    const createdNotifs: any[] = [];

    // Target: PJ yang belum mengerjakan, Kepala Puskesmas, dan Tenaga Gizi
    const targets = users.filter(u => 
      u.user_id === tl.petugas_id || u.role === 'KEPALA_PUSKESMAS' || u.role === 'TENAGA_GIZI' || u.role === 'ADMIN'
    );

    targets.forEach(u => {
      const phone = u.no_wa || '6281299887711';
      const text = `⚠️ *PERINGATAN TENGGAT TERLEWAT - DERMAGA GIZI*\n` +
        `*PUSKESMAS KEPULAUAN SERIBU SELATAN*\n\n` +
        `Yth. *${u.nama}* (${u.role.replace(/_/g, ' ')}),\n` +
        `Tindak lanjut intervensi berikut *BELUM DITINDAKLANJUTI* dan telah melewati tenggat waktu:\n` +
        `• ID TL: *${tl.tindak_lanjut_id}*\n` +
        `• Sasaran: *${sasaran?.kode_sasaran || tl.sasaran_id}* (${sasaran?.inisial || '-'})\n` +
        `• Pulau: *${pulau?.nama_pulau || '-' }*\n` +
        `• Rencana: *${tl.rencana_intervensi}*\n` +
        `• Batas Tenggat: *${tl.tenggat}* (MELEWATI BATAS WAKTU)\n` +
        `• Status Terkini: *${tl.status}*\n` +
        `• Petugas PJ: *${pjUser?.nama || tl.petugas_id}*\n\n` +
        `Diharapkan pihak terkait segera mengambil tindakan penanganan dan memperbarui status pada aplikasi DERMAGA GIZI.`;

      const linkWa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      const notifItem = {
        notif_id: `WA-${Date.now()}-${Math.floor(Math.random()*100)}`,
        waktu: `${this.getTodayFormatted()} ${new Date().toLocaleTimeString('id-ID')}`,
        penerima_nama: u.nama,
        penerima_role: u.role,
        penerima_wa: phone,
        kategori: 'PERINGATAN_OVERDUE',
        judul: `Peringatan Overdue: ${tl.tindak_lanjut_id}`,
        pesan: text,
        status: 'TERKIRIM',
        link_wa: linkWa
      };

      this.addWhatsAppNotif(notifItem);
      createdNotifs.push(notifItem);
    });

    return createdNotifs;
  }

  // --- Laporan Monitoring Kinerja Peran Akses (Role) & Petugas ---
  public getRolePerformanceReport(): any[] {
    const users = this.getUsers();
    const tlList = this.getTindakLanjutList();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roles: { role: string; label: string }[] = [
      { role: 'TENAGA_GIZI', label: 'Tenaga Gizi (Nutrisionis)' },
      { role: 'DOKTER_BIDAN_PERAWAT', label: 'Dokter / Bidan / Perawat' },
      { role: 'PETUGAS_PUSTU', label: 'Petugas Pustu Pulau' },
      { role: 'KADER', label: 'Kader Posyandu' },
      { role: 'LINTAS_SEKTOR', label: 'Petugas Lintas Sektor' },
      { role: 'ADMIN', label: 'Administrator Sistem' }
    ];

    return roles.map(r => {
      const officersInRole = users.filter(u => u.role === r.role);
      const officerIds = officersInRole.map(u => u.user_id);
      
      const roleTLs = tlList.filter(t => officerIds.includes(t.petugas_id));
      const selesai = roleTLs.filter(t => t.status === 'Selesai').length;
      const dalamProses = roleTLs.filter(t => t.status === 'Dalam proses').length;
      const tertunda = roleTLs.filter(t => t.status === 'Belum ditindaklanjuti' || t.status === 'Menunggu koordinasi').length;

      const overdue = roleTLs.filter(t => {
        if (t.status === 'Selesai' || t.status === 'Dibatalkan' || !t.tenggat) return false;
        const parts = t.tenggat.split('/');
        if (parts.length === 3) {
          const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          return d < today;
        }
        return false;
      }).length;

      const total = roleTLs.length;
      const persen = total > 0 ? Math.round((selesai / total) * 100) : (officersInRole.length > 0 ? 100 : 0);

      // Detail per petugas
      const petugasList = officersInRole.map(u => {
        const userTLs = roleTLs.filter(t => t.petugas_id === u.user_id);
        const uSelesai = userTLs.filter(t => t.status === 'Selesai').length;
        const uTertunda = userTLs.filter(t => t.status !== 'Selesai' && t.status !== 'Dibatalkan').length;
        const uOverdue = userTLs.filter(t => {
          if (t.status === 'Selesai' || t.status === 'Dibatalkan' || !t.tenggat) return false;
          const p = t.tenggat.split('/');
          return p.length === 3 && new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])) < today;
        }).length;
        const uPersen = userTLs.length > 0 ? Math.round((uSelesai / userTLs.length) * 100) : 100;

        return {
          user_id: u.user_id,
          nama: u.nama,
          no_wa: u.no_wa,
          unit: u.unit,
          total: userTLs.length,
          selesai: uSelesai,
          tertunda: uTertunda,
          overdue: uOverdue,
          persen: uPersen
        };
      });

      return {
        role: r.role,
        role_label: r.label,
        total_petugas: officersInRole.length,
        total_tindak_lanjut: total,
        selesai,
        dalam_proses: dalamProses,
        tertunda,
        overdue,
        persen_selesai: persen,
        petugas_list: petugasList
      };
    });
  }

  // --- Sinkronisasi State Langsung Dari Google Spreadsheet (Fokus Database) ---
  public syncFromGas(gasData: {
    sasaran?: SasaranBalita[];
    tindak_lanjut?: TindakLanjut[];
    pulau?: Pulau[];
    kendala?: Kendala[];
    lintas_sektor?: KegiatanLintasSektor[];
  }) {
    let changed = false;
    if (Array.isArray(gasData.sasaran) && gasData.sasaran.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SASARAN, JSON.stringify(gasData.sasaran));
      changed = true;
    }
    if (Array.isArray(gasData.tindak_lanjut) && gasData.tindak_lanjut.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(gasData.tindak_lanjut));
      changed = true;
    }
    if (Array.isArray(gasData.pulau) && gasData.pulau.length > 0) {
      // Pastikan Pulau Bokor tidak masuk
      const cleanPulau = gasData.pulau.filter(p => p.pulau_id !== 'PULAU-06' && !p.nama_pulau.toLowerCase().includes('bokor'));
      localStorage.setItem(STORAGE_KEYS.PULAU, JSON.stringify(cleanPulau));
      changed = true;
    }
    if (Array.isArray(gasData.kendala) && gasData.kendala.length > 0) {
      localStorage.setItem(STORAGE_KEYS.KENDALA, JSON.stringify(gasData.kendala));
      changed = true;
    }
    if (Array.isArray(gasData.lintas_sektor) && gasData.lintas_sektor.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LINTAS_SEKTOR, JSON.stringify(gasData.lintas_sektor));
      changed = true;
    }
    return changed;
  }

  private getTodayFormatted(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${day}/${mon}/${yr}`;
  }
}

export const storageService = new StorageService();

