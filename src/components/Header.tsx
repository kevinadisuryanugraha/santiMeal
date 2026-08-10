import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Utensils, 
  ShieldCheck, 
  UserCheck, 
  Cpu, 
  Bot, 
  SlidersHorizontal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { SesiMakan, SystemConfig, Role } from '../types';
import { getCurrentTimeHHMM, getActiveSession } from '../utils/helpers';

interface HeaderProps {
  activeView: 'reader' | 'kitchen' | 'admin' | 'ai';
  setActiveView: (view: 'reader' | 'kitchen' | 'admin' | 'ai') => void;
  userRole: Role;
  setUserRole: (role: Role) => void;
  sesiList: SesiMakan[];
  systemConfig: SystemConfig;
  setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  userRole,
  setUserRole,
  sesiList,
  systemConfig,
  setSystemConfig
}) => {
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [showSimModal, setShowSimModal] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      if (systemConfig.mode_simulasi_jam) {
        setTimeDisplay(systemConfig.jam_simulasi);
      } else {
        setTimeDisplay(getCurrentTimeHHMM());
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [systemConfig.mode_simulasi_jam, systemConfig.jam_simulasi]);

  const activeSesi = getActiveSession(sesiList, timeDisplay);

  return (
    <header className="bg-[#2B2824] border-b border-[#D9C4B0]/20 text-[#ECEEDF] sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-auto py-3 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#CFAB8D] text-[#2B2824] rounded-xl flex items-center justify-center font-black shadow-md shrink-0">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 min-w-0">
                <h1 className="font-black text-xs sm:text-base md:text-lg text-[#ECEEDF] uppercase tracking-wider font-display truncate">
                  SantriMeal <span className="text-[#BBDCE5]">AI</span>
                </h1>
                <span className="bg-[#BBDCE5]/20 text-[#BBDCE5] text-[8px] sm:text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#BBDCE5]/30 font-bold shrink-0">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#D9C4B0]/80 uppercase tracking-widest hidden sm:block truncate">
                Presensi Konsumsi RFID & Analytics Pesantren
              </p>
            </div>
          </div>

          {/* Active Session & Live Clock */}
          <div className="hidden lg:flex items-center space-x-3 bg-white/5 px-3.5 py-2 rounded-xl border border-[#D9C4B0]/20 text-xs uppercase tracking-wider font-mono">
            <div className="flex items-center space-x-2 text-[#BBDCE5] font-bold text-sm">
              <Clock className="w-4 h-4 text-[#BBDCE5] animate-pulse" />
              <span>{timeDisplay}</span>
            </div>
            <div className="h-4 w-px bg-[#D9C4B0]/20" />
            {activeSesi ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#CFAB8D] text-[#2B2824]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2B2824] mr-1.5 animate-ping"></span>
                {activeSesi.nama_sesi} ({activeSesi.jam_buka}-{activeSesi.jam_tutup})
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#D9C4B0]/20 text-[#D9C4B0] border border-[#D9C4B0]/30">
                Luar Sesi Makan
              </span>
            )}
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Clock badge for mobile screens */}
            <div className="lg:hidden flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg border border-[#D9C4B0]/20 text-[11px] font-mono text-[#BBDCE5] font-bold">
              <Clock className="w-3 h-3 text-[#BBDCE5]" />
              <span>{timeDisplay}</span>
            </div>

            {/* Simulation & Sound Controls */}
            <button
              onClick={() => setShowSimModal(!showSimModal)}
              className={`p-2 sm:p-2.5 min-h-[40px] min-w-[40px] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                systemConfig.mode_simulasi_jam
                  ? 'bg-[#CFAB8D] text-[#2B2824]'
                  : 'bg-white/5 hover:bg-white/10 text-[#D9C4B0] border border-[#D9C4B0]/20'
              }`}
              title="Atur Waktu Simulasi"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">
                {systemConfig.mode_simulasi_jam ? `SIM: ${systemConfig.jam_simulasi}` : 'SIMULASI'}
              </span>
            </button>

            <button
              onClick={() => setSystemConfig(prev => ({ ...prev, suara_notifikasi: !prev.suara_notifikasi }))}
              className={`p-2 sm:p-2.5 min-h-[40px] min-w-[40px] rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                systemConfig.suara_notifikasi
                  ? 'bg-white/10 text-[#BBDCE5] border border-[#BBDCE5]/30'
                  : 'bg-white/5 text-[#D9C4B0]/50 border border-[#D9C4B0]/20'
              }`}
              title={systemConfig.suara_notifikasi ? 'Suara Aktif' : 'Suara Mute'}
            >
              {systemConfig.suara_notifikasi ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Offline Mode Indicator */}
            <button
              onClick={() => setSystemConfig(prev => ({ ...prev, mode_offline: !prev.mode_offline }))}
              className={`p-2 sm:p-2.5 min-h-[40px] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                systemConfig.mode_offline
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-white/5 text-[#D9C4B0] border border-[#D9C4B0]/20'
              }`}
              title={systemConfig.mode_offline ? 'Mode Offline Active' : 'Online'}
            >
              {systemConfig.mode_offline ? <WifiOff className="w-4 h-4 text-red-400 animate-pulse" /> : <Wifi className="w-4 h-4 text-[#BBDCE5]" />}
              <span className="hidden md:inline text-[11px]">
                {systemConfig.mode_offline ? 'OFFLINE' : 'ONLINE'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Session mobile banner if open */}
        {activeSesi && (
          <div className="lg:hidden pb-2 pt-0.5 flex items-center justify-between text-[11px] font-mono text-[#D9C4B0] border-t border-[#D9C4B0]/10">
            <span className="flex items-center space-x-1 text-[#BBDCE5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BBDCE5] animate-ping inline-block mr-1"></span>
              Sesi Aktif: <strong>{activeSesi.nama_sesi}</strong>
            </span>
            <span>{activeSesi.jam_buka} - {activeSesi.jam_tutup}</span>
          </div>
        )}

        {/* Navigation Tabs - Touch Friendly Horizontal Scroll */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-[#D9C4B0]/20 pt-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveView('reader')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap min-h-[40px] sm:min-h-[44px] ${
              activeView === 'reader'
                ? 'bg-[#ECEEDF] text-[#2B2824] shadow-md'
                : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">HARDWARE</span> RFID
          </button>

          <button
            onClick={() => setActiveView('kitchen')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap min-h-[40px] sm:min-h-[44px] ${
              activeView === 'kitchen'
                ? 'bg-[#ECEEDF] text-[#2B2824] shadow-md'
                : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>PENJAGA DAPUR</span>
          </button>

          <button
            onClick={() => setActiveView('admin')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap min-h-[40px] sm:min-h-[44px] ${
              activeView === 'admin'
                ? 'bg-[#ECEEDF] text-[#2B2824] shadow-md'
                : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">DASHBOARD </span>ADMIN
          </button>

          <button
            onClick={() => setActiveView('ai')}
            className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap min-h-[40px] sm:min-h-[44px] ${
              activeView === 'ai'
                ? 'bg-[#ECEEDF] text-[#2B2824] shadow-md'
                : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>ASISTEN AI</span>
          </button>
        </div>
      </div>

      {/* Simulation Time Modal */}
      {showSimModal && (
        <div className="bg-[#2B2824] border-t border-[#D9C4B0]/30 p-4 shadow-xl text-[#ECEEDF]">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#D9C4B0]">
              <span className="font-bold text-[#BBDCE5] block mb-0.5">⏱️ Pengaturan Mode Simulasi Waktu</span>
              Ubah jam virtual untuk menguji perilaku sesi Sarapan (05:00), Makan Siang (11:30), atau Makan Malam (17:30).
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <input
                type="time"
                value={systemConfig.jam_simulasi}
                onChange={(e) => setSystemConfig(prev => ({ ...prev, jam_simulasi: e.target.value }))}
                className="bg-[#1D1B18] border border-[#D9C4B0]/40 text-[#ECEEDF] px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-[#CFAB8D]"
              />
              <button
                onClick={() => setSystemConfig(prev => ({ ...prev, mode_simulasi_jam: !prev.mode_simulasi_jam }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  systemConfig.mode_simulasi_jam
                    ? 'bg-[#CFAB8D] text-[#2B2824] hover:bg-[#c49a78]'
                    : 'bg-[#BBDCE5] text-[#2B2824] hover:bg-[#a8cfda]'
                }`}
              >
                {systemConfig.mode_simulasi_jam ? 'Matikan SIM' : 'Aktifkan SIM'}
              </button>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-[#D9C4B0] hover:text-white text-xs px-2 py-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
