/**
 * DERMAGA GIZI
 * Dashboard Elektronik Rekap, Monitoring, dan Analisis Gizi
 * Puskesmas Kepulauan Seribu Selatan
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardView } from './components/views/DashboardView';
import { MapView } from './components/views/MapView';
import { SasaranView } from './components/views/SasaranView';
import { TindakLanjutView } from './components/views/TindakLanjutView';
import { KinerjaRoleView } from './components/views/KinerjaRoleView';
import { KendalaView } from './components/views/KendalaView';
import { LintasSektorView } from './components/views/LintasSektorView';
import { LaporanView } from './components/views/LaporanView';
import { DataMasterView } from './components/views/DataMasterView';
import { MasterPosyanduView } from './components/views/MasterPosyanduView';
import { MasterLintasSektorView } from './components/views/MasterLintasSektorView';
import { InputLaporanPosyanduView } from './components/views/InputLaporanPosyanduView';
import { UsersView } from './components/views/UsersView';
import { SettingsView } from './components/views/SettingsView';
import { PanduanView } from './components/views/PanduanView';
import { WhatsAppNotificationModal } from './components/common/WhatsAppNotificationModal';
import { storageService } from './services/storageService';
import { apiService } from './services/apiService';
import { GlobalFilter, Pulau, User } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return storageService.getThemeMode() === 'dark';
  });

  // Auto-Refresh 3s State
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    return storageService.getAutoRefreshEnabled();
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Navigasi kontekstual antar modul
  const [selectedPulauIdNav, setSelectedPulauIdNav] = useState<string | undefined>(undefined);
  const [selectedTLIdNav, setSelectedTLIdNav] = useState<string | undefined>(undefined);

  // Global Filter State
  const [filter, setFilter] = useState<GlobalFilter>({
    pulau_id: 'ALL',
    tahun: '2026',
    bulan: 'ALL'
  });

  // Data State
  const [pulauList, setPulauList] = useState<Pulau[]>(() => storageService.getPulauList());
  const [currentUser, setCurrentUser] = useState<User>(() => storageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());

  // Dark Mode Effect on HTML Root Element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      storageService.setThemeMode('dark');
    } else {
      document.documentElement.classList.remove('dark');
      storageService.setThemeMode('light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => {
      const next = !prev;
      storageService.setAutoRefreshEnabled(next);
      return next;
    });
  };

  // Hitung Badge Notifikasi Sidebar
  const stats = storageService.getDashboardStats(filter);
  const overdueCount = stats.overdueList.length;
  const kendalaCount = storageService.getKendalaList(filter.pulau_id).filter(k => k.status !== 'Selesai').length;
  const waNotifCount = storageService.getWhatsAppNotifs().length;

  const handleRefreshData = useCallback(() => {
    setPulauList(storageService.getPulauList());
    setCurrentUser(storageService.getCurrentUser());
    setUsers(storageService.getUsers());
    setRefreshKey(prev => prev + 1);
  }, []);

  // Live Auto-Refresh Polling Interval Setiap 3 Detik ke Database
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      if (apiService.isConnected()) {
        setIsSyncing(true);
        try {
          const changed = await apiService.fetchDatabaseData();
          if (changed) {
            handleRefreshData();
          }
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Mode Demo: refresh state internal jika ada perubahan
        handleRefreshData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, handleRefreshData]);

  const handleSwitchUser = (userId: string) => {
    storageService.setCurrentUser(userId);
    const u = storageService.getCurrentUser();
    // Jika peran yang dipilih adalah KADER (Petugas Posyandu), arahkan ke menu yang diizinkan jika sedang di luar menu kader
    if (u.role === 'KADER' && activeTab !== 'dashboard' && activeTab !== 'map' && activeTab !== 'input-posyandu') {
      setActiveTab('input-posyandu');
    }
    handleRefreshData();
  };

  const handleNavigateTab = (tab: ActiveTab, params?: { pulauId?: string; tlId?: string }) => {
    if (params?.pulauId) {
      setSelectedPulauIdNav(params.pulauId);
      setFilter(prev => ({ ...prev, pulau_id: params.pulauId! }));
    }
    if (params?.tlId) {
      setSelectedTLIdNav(params.tlId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans transition-colors duration-200`}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overdueCount={overdueCount}
        kendalaCount={kendalaCount}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        waNotifCount={waNotifCount}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="md:ml-72 flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header
          filter={filter}
          setFilter={setFilter}
          pulauList={pulauList}
          currentUser={currentUser}
          users={users}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={toggleAutoRefresh}
          isSyncing={isSyncing}
          onSwitchUser={handleSwitchUser}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          onRefreshData={handleRefreshData}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
          waNotifCount={waNotifCount}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              key={refreshKey}
              filter={filter}
              setFilter={setFilter}
              pulauList={pulauList}
              onNavigateTab={handleNavigateTab}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            />
          )}

          {activeTab === 'map' && (
            <MapView
              key={refreshKey}
              filter={filter}
              setFilter={setFilter}
              pulauList={pulauList}
              selectedPulauIdFromNav={selectedPulauIdNav}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'input-posyandu' && (
            <InputLaporanPosyanduView
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {activeTab === 'master-posyandu' && (
            <MasterPosyanduView
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'master-lintas-sektor' && (
            <MasterLintasSektorView
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'sasaran' && (
            <SasaranView
              key={refreshKey}
              filter={filter}
              setFilter={setFilter}
              pulauList={pulauList}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'tindak-lanjut' && (
            <TindakLanjutView
              key={refreshKey}
              filter={filter}
              setFilter={setFilter}
              pulauList={pulauList}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              selectedTLIdFromNav={selectedTLIdNav}
            />
          )}

          {activeTab === 'kinerja-role' && (
            <KinerjaRoleView
              key={refreshKey}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            />
          )}

          {activeTab === 'kendala' && (
            <KendalaView
              key={refreshKey}
              filter={filter}
              pulauList={pulauList}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'lintas-sektor' && (
            <LintasSektorView
              key={refreshKey}
              filter={filter}
              pulauList={pulauList}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              key={refreshKey}
              filter={filter}
              setFilter={setFilter}
              pulauList={pulauList}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'master' && (
            <DataMasterView
              key={refreshKey}
              pulauList={pulauList}
              currentUser={currentUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'users' && (
            <UsersView
              key={refreshKey}
              users={users}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onRefreshData={handleRefreshData}
            />
          )}

          {activeTab === 'panduan' && (
            <PanduanView key={refreshKey} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              key={refreshKey}
              onRefreshData={handleRefreshData}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">DERMAGA GIZI</span> · Sistem Monitoring Gizi Terintegrasi Wilayah Kepulauan
            </div>
            <div className="text-[11px] text-slate-400">
              Puskesmas Kepulauan Seribu Selatan · Wilayah Kerja DKI Jakarta
            </div>
          </div>
        </footer>

      </div>

      {/* Global WhatsApp Notification Center Modal */}
      <WhatsAppNotificationModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onRefresh={handleRefreshData}
      />

    </div>
  );
}
