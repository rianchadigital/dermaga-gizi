/**
 * API Service for DERMAGA GIZI
 * Integrates with Google Apps Script Web App Backend & Google Spreadsheet
 * Synchronizes directly with the remote database (focus on database, not local)
 */

import { storageService } from './storageService';
import { ApiResponse, SasaranBalita, TindakLanjut, Kendala, KegiatanLintasSektor } from '../types';

class ApiService {
  private isPolling = false;

  public getBaseUrl(): string {
    return storageService.getGasUrl();
  }

  public isConnected(): boolean {
    const url = this.getBaseUrl();
    return !!(url && url.startsWith('https://script.google.com/'));
  }

  /**
   * Menguji koneksi Web App Google Apps Script
   */
  public async testConnection(url?: string): Promise<{ success: boolean; message: string; latencyMs?: number; details?: any }> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script belum dikonfigurasi. Aplikasi saat ini berjalan dalam Mode Demo.'
      };
    }

    if (!targetUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        message: 'Format URL tidak valid. URL Web App Google Apps Script harus diawali dengan https://script.google.com/'
      };
    }

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          success: false,
          message: `Server merespons dengan HTTP Status ${response.status} (${response.statusText}). Pastikan deployment 'Who has access' diatur ke 'Anyone'.`,
          latencyMs
        };
      }

      const json = await response.json();
      if (json && json.success) {
        // Ambil data awal dari database jika terkoneksi
        this.fetchDatabaseData();
        return {
          success: true,
          message: 'Koneksi berhasil! Database Google Spreadsheet aktif dan tersinkronisasi.',
          latencyMs,
          details: json.data
        };
      }

      return {
        success: false,
        message: json.message || 'Menerima respons tidak valid dari Google Apps Script.',
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Jaringan atau CORS'}. Pastikan akses diatur ke 'Anyone'.`,
        latencyMs
      };
    }
  }

  /**
   * Sinkronisasi data utama dari Google Spreadsheet Database (Remote) ke Aplikasi
   * Dipanggil secara periodik (polling 3 detik) atau pasca transaksi
   */
  public async fetchDatabaseData(): Promise<boolean> {
    if (!this.isConnected() || this.isPolling) return false;
    this.isPolling = true;

    try {
      const targetUrl = this.getBaseUrl();
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=getAllData&_t=${Date.now()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.data) {
          const changed = storageService.syncFromGas(json.data);
          this.isPolling = false;
          return changed;
        }
      }
    } catch (err) {
      // Background sync quiet catch
    } finally {
      this.isPolling = false;
    }

    return false;
  }

  /**
   * Inisialisasi Database Spreadsheet via Web App
   */
  public async initializeSpreadsheet(url?: string): Promise<ApiResponse> {
    const targetUrl = (url || this.getBaseUrl()).trim();
    if (!targetUrl) {
      return {
        success: false,
        message: 'URL Web App belum diisi.',
        data: null
      };
    }

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=init`;
      const res = await fetch(endpoint, { method: 'GET' });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal inisialisasi spreadsheet: ${err.message}`,
        data: null
      };
    }
  }

  // --- CRUD Sasaran ---
  public async createSasaran(sasaran: SasaranBalita): Promise<SasaranBalita> {
    const saved = storageService.saveSasaran(sasaran);
    
    // Trigger notifikasi WhatsApp otomatis ke Kader, Petugas, dan Lintas Sektor
    storageService.notifyNewSasaran(saved);

    if (this.isConnected()) {
      try {
        const payload = {
          action: 'createSasaran',
          data: saved,
          user: storageService.getCurrentUser()
        };
        await fetch(this.getBaseUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        // Lakukan sinkronisasi ulang langsung dengan database Google Spreadsheet
        setTimeout(() => this.fetchDatabaseData(), 500);
      } catch (e) {
        console.warn('Gagal sinkronisasi remote ke Google Apps Script:', e);
      }
    }
    return saved;
  }

  // --- CRUD Tindak Lanjut ---
  public async saveTindakLanjut(tl: TindakLanjut, isNew: boolean = false): Promise<TindakLanjut> {
    const saved = storageService.saveTindakLanjut(tl);

    // Trigger notifikasi WhatsApp otomatis ke Petugas PJ, Kader, dan Lintas Sektor
    storageService.notifyTindakLanjut(saved, isNew);

    if (this.isConnected()) {
      try {
        const payload = {
          action: tl.tindak_lanjut_id && !isNew ? 'updateTindakLanjut' : 'createTindakLanjut',
          data: saved,
          user: storageService.getCurrentUser()
        };
        await fetch(this.getBaseUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        setTimeout(() => this.fetchDatabaseData(), 500);
      } catch (e) {
        console.warn('Gagal sinkronisasi remote ke Google Apps Script:', e);
      }
    }
    return saved;
  }

  // --- CRUD Kendala ---
  public async saveKendala(k: Kendala): Promise<Kendala> {
    const saved = storageService.saveKendala(k);

    if (this.isConnected()) {
      try {
        const payload = {
          action: k.kendala_id ? 'updateKendala' : 'createKendala',
          data: saved,
          user: storageService.getCurrentUser()
        };
        await fetch(this.getBaseUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        setTimeout(() => this.fetchDatabaseData(), 500);
      } catch (e) {
        console.warn('Gagal sinkronisasi remote ke Google Apps Script:', e);
      }
    }
    return saved;
  }

  // --- CRUD Lintas Sektor ---
  public async saveLintasSektor(ls: KegiatanLintasSektor): Promise<KegiatanLintasSektor> {
    const saved = storageService.saveLintasSektor(ls);

    if (this.isConnected()) {
      try {
        const payload = {
          action: ls.kegiatan_id ? 'updateLintasSektor' : 'createLintasSektor',
          data: saved,
          user: storageService.getCurrentUser()
        };
        await fetch(this.getBaseUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        setTimeout(() => this.fetchDatabaseData(), 500);
      } catch (e) {
        console.warn('Gagal sinkronisasi remote ke Google Apps Script:', e);
      }
    }
    return saved;
  }
}

export const apiService = new ApiService();
