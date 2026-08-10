import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  UserCheck, 
  Clock, 
  UtensilsCrossed
} from 'lucide-react';
import { Santri, SesiMakan, TapRecord, SystemConfig } from '../types';
import { getActiveSession, getCurrentTimeHHMM, formatIndonesianDateTime } from '../utils/helpers';

interface DashboardKitchenProps {
  santriList: Santri[];
  sesiList: SesiMakan[];
  tapRecords: TapRecord[];
  systemConfig: SystemConfig;
}

export const DashboardKitchen: React.FC<DashboardKitchenProps> = ({
  santriList,
  sesiList,
  tapRecords,
  systemConfig
}) => {
  const [selectedSesiId, setSelectedSesiId] = useState<string>('auto');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sudah' | 'belum'>('all');
  const [selectedKamar, setSelectedKamar] = useState<string>('all');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentTime = getCurrentTimeHHMM(systemConfig.mode_simulasi_jam ? systemConfig.jam_simulasi : undefined);
  const activeSesiAuto = getActiveSession(sesiList, currentTime);

  // Determine current effective meal session
  const activeSesi = useMemo(() => {
    if (selectedSesiId === 'auto') return activeSesiAuto;
    return sesiList.find(s => s.id === selectedSesiId) || null;
  }, [selectedSesiId, activeSesiAuto, sesiList]);

  // Extract unique Kamar & Kelas for filter dropdowns
  const kamarOptions = useMemo(() => {
    const kamars = new Set(santriList.map(s => s.kamar));
    return Array.from(kamars);
  }, [santriList]);

  const kelasOptions = useMemo(() => {
    const kelases = new Set(santriList.map(s => s.kelas));
    return Array.from(kelases);
  }, [santriList]);

  // Get today's tap records for active session
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionTaps = useMemo(() => {
    if (!activeSesi) return [];
    return tapRecords.filter(r => 
      r.timestamp_tap.startsWith(todayStr) && 
      r.sesi_id === activeSesi.id && 
      r.status === 'berhasil'
    );
  }, [tapRecords, activeSesi, todayStr]);

  const setOfSantriIdSudahMakan = useMemo(() => {
    return new Set(todaySessionTaps.map(t => t.santri_id));
  }, [todaySessionTaps]);

  // Compute metrics
  const totalSantriActive = santriList.length;
  const totalSudahMakan = setOfSantriIdSudahMakan.size;
  const totalBelumMakan = totalSantriActive - totalSudahMakan;
  const percentage = totalSantriActive > 0 ? Math.round((totalSudahMakan / totalSantriActive) * 100) : 0;

  // Filter santri list based on search and selected filters
  const filteredSantri = useMemo(() => {
    return santriList.filter(santri => {
      const sudah = setOfSantriIdSudahMakan.has(santri.id);

      // Status filter
      if (filterStatus === 'sudah' && !sudah) return false;
      if (filterStatus === 'belum' && sudah) return false;

      // Kamar filter
      if (selectedKamar !== 'all' && santri.kamar !== selectedKamar) return false;

      // Kelas filter
      if (selectedKelas !== 'all' && santri.kelas !== selectedKelas) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = santri.nama.toLowerCase().includes(q);
        const matchKamar = santri.kamar.toLowerCase().includes(q);
        const matchKelas = santri.kelas.toLowerCase().includes(q);
        const matchUid = santri.rfid_uid.toLowerCase().includes(q);
        if (!matchNama && !matchKamar && !matchKelas && !matchUid) return false;
      }

      return true;
    });
  }, [santriList, setOfSantriIdSudahMakan, filterStatus, selectedKamar, selectedKelas, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Kitchen Guard Top Header Bar */}
      <div className="bg-[#2B2824] border border-[#D9C4B0]/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 text-[#ECEEDF]">
        <div>
          <div className="flex items-center space-x-2 text-[#BBDCE5] font-mono font-bold text-[11px] sm:text-xs uppercase tracking-widest mb-1">
            <UtensilsCrossed className="w-4 h-4 text-[#BBDCE5] shrink-0" />
            <span>OPERATOR DASHBOARD PENJAGA DAPUR (READ-ONLY)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#ECEEDF] font-display uppercase tracking-tight">
            PEMANTAUAN PRESENSI <span className="text-[#CFAB8D]">MAKAN REAL-TIME</span>
          </h2>
          <p className="text-[#D9C4B0] text-xs mt-1">
            Pantau kehadiran santri per sesi makan, filter daftar berdasarkan kamar/kelas, dan cek santri yang belum makan.
          </p>
        </div>

        {/* Session Switcher Selector */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white/10 p-1.5 sm:p-2 rounded-2xl border border-[#D9C4B0]/20 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedSesiId('auto')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap min-h-[38px] ${
              selectedSesiId === 'auto'
                ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
                : 'text-[#D9C4B0] hover:text-[#ECEEDF]'
            }`}
          >
            OTOMATIS ({activeSesiAuto ? activeSesiAuto.nama_sesi : 'TUTUP'})
          </button>
          {sesiList.map(sesi => (
            <button
              key={sesi.id}
              onClick={() => setSelectedSesiId(sesi.id)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap min-h-[38px] ${
                selectedSesiId === sesi.id
                  ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
                  : 'text-[#D9C4B0] hover:text-[#ECEEDF]'
              }`}
            >
              {sesi.nama_sesi}
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Attendance Progress Counter */}
      <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md space-y-4 text-[#2B2824]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9C4B0]/40 pb-4">
          <div>
            <span className="text-xs text-[#635C55] font-mono uppercase tracking-wider">
              {activeSesi ? (
                <>SESI MAKAN AKTIF: <strong className="text-[#2B2824] bg-[#BBDCE5]/40 px-2 py-0.5 rounded">{activeSesi.nama_sesi}</strong> ({activeSesi.jam_buka} - {activeSesi.jam_tutup})</>
              ) : (
                <>SESI MAKAN: <strong className="text-[#2B2824] bg-red-100 px-2 py-0.5 rounded">TIDAK ADA SESI AKTIF</strong></>
              )}
            </span>
            <div className="flex items-baseline space-x-2 mt-1.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-[#2B2824] font-display">{totalSudahMakan}</span>
              <span className="text-base sm:text-lg text-[#635C55] font-bold uppercase tracking-wider">/ {totalSantriActive} SANTRI HADIR</span>
              <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-widest bg-[#CFAB8D] text-[#2B2824]">
                {percentage}% PROGRESS
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-[#2B2824] font-mono uppercase tracking-wider flex-wrap">
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl text-emerald-900 min-h-[40px]">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>SUDAH: <strong className="font-bold">{totalSudahMakan}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-red-50 border border-red-300 px-3 py-2 rounded-xl text-red-900 min-h-[40px]">
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>BELUM: <strong className="font-bold">{totalBelumMakan}</strong></span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#ECEEDF] rounded-full h-4 overflow-hidden p-0.5 border border-[#D9C4B0]">
            <div
              className="bg-[#CFAB8D] h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-[#635C55] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, kamar, kelas, atau UID..."
              className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#CFAB8D] min-h-[42px]"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="lg:col-span-4 grid grid-cols-3 rounded-xl bg-[#ECEEDF] p-1 border border-[#D9C4B0] font-mono uppercase gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                filterStatus === 'all' ? 'bg-[#CFAB8D] text-[#2B2824] shadow' : 'text-[#635C55] hover:text-[#2B2824]'
              }`}
            >
              SEMUA ({totalSantriActive})
            </button>
            <button
              onClick={() => setFilterStatus('sudah')}
              className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                filterStatus === 'sudah' ? 'bg-[#CFAB8D] text-[#2B2824] shadow' : 'text-[#635C55] hover:text-[#2B2824]'
              }`}
            >
              SUDAH ({totalSudahMakan})
            </button>
            <button
              onClick={() => setFilterStatus('belum')}
              className={`py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                filterStatus === 'belum' ? 'bg-red-600 text-white shadow' : 'text-[#635C55] hover:text-[#2B2824]'
              }`}
            >
              BELUM ({totalBelumMakan})
            </button>
          </div>

          {/* Kamar Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedKamar}
              onChange={(e) => setSelectedKamar(e.target.value)}
              className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#CFAB8D] min-h-[42px]"
            >
              <option value="all">Semua Kamar</option>
              {kamarOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Kelas Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#CFAB8D] min-h-[42px]"
            >
              <option value="all">Semua Kelas</option>
              {kelasOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Santri Status Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredSantri.length === 0 ? (
          <div className="col-span-full bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-8 sm:p-12 text-center text-[#635C55] space-y-2">
            <UserCheck className="w-12 h-12 text-[#D9C4B0] mx-auto" />
            <p className="font-black text-[#2B2824] text-base uppercase tracking-wider">Tidak Ada Data Santri Ditemukan</p>
            <p className="text-xs text-[#635C55]">Coba ubah filter atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredSantri.map(santri => {
            const sudahMakan = setOfSantriIdSudahMakan.has(santri.id);
            const tapRecordSantri = todaySessionTaps.find(t => t.santri_id === santri.id);

            return (
              <div
                key={santri.id}
                className={`border rounded-2xl p-3.5 sm:p-4 transition-all ${
                  sudahMakan
                    ? 'bg-[#ECEEDF] border-[#CFAB8D] shadow'
                    : 'bg-[#FFFFFF] border-[#D9C4B0] hover:border-[#CFAB8D]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img
                      src={santri.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={santri.nama}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 shrink-0 ${
                        sudahMakan ? 'ring-[#CFAB8D]' : 'ring-[#D9C4B0]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-[#2B2824] text-xs sm:text-sm font-display truncate">{santri.nama}</h4>
                      <p className="text-[11px] text-[#635C55] uppercase tracking-wider mt-0.5 truncate">
                        {santri.kelas} • {santri.kamar}
                      </p>
                      <span className="text-[10px] font-mono text-[#2B5261] truncate block">UID: {santri.rfid_uid}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {sudahMakan ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#CFAB8D] text-[#2B2824]">
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#2B2824] shrink-0" />
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3.5 h-3.5 mr-1 text-red-600 shrink-0" />
                        Belum
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer status detail */}
                <div className="mt-3 pt-3 border-t border-[#D9C4B0]/40 flex items-center justify-between text-xs text-[#635C55] font-mono uppercase">
                  {sudahMakan && tapRecordSantri ? (
                    <span className="text-[#2B2824] flex items-center space-x-1 font-bold">
                      <Clock className="w-3 h-3 text-[#CFAB8D] shrink-0" />
                      <span>TAP: {new Date(tapRecordSantri.timestamp_tap).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  ) : (
                    <span className="text-[#635C55]/60">BELUM TAP</span>
                  )}

                  {santri.status_santri !== 'Aktif' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {santri.status_santri}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


