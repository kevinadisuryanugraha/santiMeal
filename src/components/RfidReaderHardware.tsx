import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  WifiOff, 
  RefreshCw,
  Clock,
  User,
  Radio
} from 'lucide-react';
import { Santri, SesiMakan, TapRecord, SystemConfig } from '../types';
import { getActiveSession, getCurrentTimeHHMM, playRfidSound, speakIndonesian } from '../utils/helpers';

interface RfidReaderHardwareProps {
  santriList: Santri[];
  sesiList: SesiMakan[];
  tapRecords: TapRecord[];
  onTapCard: (record: Omit<TapRecord, 'id'>) => void;
  systemConfig: SystemConfig;
}

export const RfidReaderHardware: React.FC<RfidReaderHardwareProps> = ({
  santriList,
  sesiList,
  tapRecords,
  onTapCard,
  systemConfig
}) => {
  const [lastScannedSantri, setLastScannedSantri] = useState<Santri | null>(null);
  const [scannedStatus, setScannedStatus] = useState<'idle' | 'success' | 'duplicate' | 'invalid_time' | 'inactive'>('idle');
  const [displayMessage, setDisplayMessage] = useState<string>('Mendekatkan Kartu RFID ke Reader...');
  const [manualUidInput, setManualUidInput] = useState<string>('0005265485');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const OFFLINE_QUEUE_KEY = 'santrimeal-offline-queue';

  const [offlineQueue, setOfflineQueue] = useState<TapRecord[]>(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist offline queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [offlineQueue]);

  const currentTime = getCurrentTimeHHMM(systemConfig.mode_simulasi_jam ? systemConfig.jam_simulasi : undefined);
  const activeSesi = getActiveSession(sesiList, currentTime);

  // Auto clear screen after 5 seconds
  useEffect(() => {
    if (scannedStatus !== 'idle') {
      const timer = setTimeout(() => {
        setScannedStatus('idle');
        setDisplayMessage('Mendekatkan Kartu RFID ke Reader...');
        setLastScannedSantri(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scannedStatus]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input for hardware USB RFID reader
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Ref guard to prevent duplicate tap processing during active scan
  const isProcessingRef = useRef(false);

  const handleSimulateTap = (uidToTap: string) => {
    if (!uidToTap.trim() || isProcessingRef.current) return;
    setManualUidInput('');
    isProcessingRef.current = true;
    setIsScanning(true);
    setScannedStatus('idle');

    // Immediate tactile Audio Beep when RFID card touches sensor
    if (systemConfig.suara_notifikasi) {
      playRfidSound('scan');
    }

    setTimeout(() => {
      try {
        setIsScanning(false);
      const todayStr = new Date().toISOString().split('T')[0];

      // Find santri by UID
      const santriMatch = santriList.find(s => s.rfid_uid.toLowerCase() === uidToTap.trim().toLowerCase());

      if (!santriMatch) {
        setScannedStatus('inactive');
        setDisplayMessage('❌ KARTU TIDAK TERDAFTAR!');
        if (systemConfig.suara_notifikasi) {
          playRfidSound('error');
          speakIndonesian('Kartu tidak terdaftar');
        }
        return;
      }

      setLastScannedSantri(santriMatch);

      // Check active status
      if (!santriMatch.status_aktif || santriMatch.status_santri === 'Nonaktif') {
        setScannedStatus('inactive');
        setDisplayMessage('❌ KARTU DI-NONAKTIFKAN');
        if (systemConfig.suara_notifikasi) {
          playRfidSound('error');
          speakIndonesian(`Kartu santri ${santriMatch.nama} di nonaktifkan`);
        }
        return;
      }

      // Check meal session open
      if (!activeSesi) {
        setScannedStatus('invalid_time');
        setDisplayMessage('⚠️ DI LUAR JAM SESI MAKAN');
        if (systemConfig.suara_notifikasi) {
          playRfidSound('warning');
          speakIndonesian('Di luar jam sesi makan');
        }

        onTapCard({
          santri_id: santriMatch.id,
          santri_nama: santriMatch.nama,
          santri_kelas: santriMatch.kelas,
          santri_kamar: santriMatch.kamar,
          santri_foto: santriMatch.foto,
          sesi_id: 'none',
          sesi_nama: 'Di Luar Jam',
          timestamp_tap: new Date().toISOString(),
          status: 'ditolak_diluar_jam',
          pesan: 'Tap dilakukan di luar jam operasional sesi makan'
        });
        return;
      }

      // Check if already tapped in this meal session today (both online records and offline queue)
      const alreadyTappedToday = (
        tapRecords.some(r => {
          const isSameDay = r.timestamp_tap.startsWith(todayStr);
          return isSameDay && r.santri_id === santriMatch.id && r.sesi_id === activeSesi.id && r.status === 'berhasil';
        }) ||
        offlineQueue.some(r => {
          const isSameDay = r.timestamp_tap.startsWith(todayStr);
          return isSameDay && r.santri_id === santriMatch.id && r.sesi_id === activeSesi.id && r.status === 'berhasil';
        })
      );

      if (alreadyTappedToday) {
        setScannedStatus('duplicate');
        setDisplayMessage('⛔ ANDA SUDAH MAKAN SESI INI');
        if (systemConfig.suara_notifikasi) {
          playRfidSound('error');
          speakIndonesian(`Maaf, santri ${santriMatch.nama} sudah makan sesi ini`);
        }

        onTapCard({
          santri_id: santriMatch.id,
          santri_nama: santriMatch.nama,
          santri_kelas: santriMatch.kelas,
          santri_kamar: santriMatch.kamar,
          santri_foto: santriMatch.foto,
          sesi_id: activeSesi.id,
          sesi_nama: activeSesi.nama_sesi,
          timestamp_tap: new Date().toISOString(),
          status: 'ditolak_duplikat',
          pesan: `Sudah tap pada sesi ${activeSesi.nama_sesi}`
        });
        return;
      }

      // SUCCESS TAP!
      setScannedStatus('success');
      setDisplayMessage('✅ SILAKAN AMBIL MAKAN');
      if (systemConfig.suara_notifikasi) {
        playRfidSound('success');
        speakIndonesian(`Silakan ambil makan, ${santriMatch.nama}`);
      }

      const newRecord: TapRecord = {
        id: `tap-${Date.now()}`,
        santri_id: santriMatch.id,
        santri_nama: santriMatch.nama,
        santri_kelas: santriMatch.kelas,
        santri_kamar: santriMatch.kamar,
        santri_foto: santriMatch.foto,
        sesi_id: activeSesi.id,
        sesi_nama: activeSesi.nama_sesi,
        timestamp_tap: new Date().toISOString(),
        status: 'berhasil',
        pesan: 'Silakan Ambil Makan'
      };

      if (systemConfig.mode_offline) {
        setOfflineQueue(prev => [...prev, newRecord]);
      } else {
        const { id: _id, ...recordWithoutId } = newRecord;
        onTapCard(recordWithoutId);
      }
      } finally {
        isProcessingRef.current = false;
      }
    }, 350);
  };

  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    
    // Sync each item and clear queue (strip id since onTapCard generates its own)
    offlineQueue.forEach(item => {
      const { id: _id, ...recordWithoutId } = item;
      onTapCard(recordWithoutId);
    });
    setOfflineQueue([]);
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Banner Intro */}
      <div className="bg-[#2B2824] border border-[#D9C4B0]/30 rounded-3xl p-5 sm:p-6 md:p-8 text-[#ECEEDF] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#BBDCE5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center space-x-2 text-[#BBDCE5] font-mono font-bold text-[11px] sm:text-xs uppercase tracking-widest">
            <Radio className="w-4 h-4 animate-pulse text-[#BBDCE5] shrink-0" />
            <span>MODUL RFID READER HARDWARE INTERFACE (ESP32 + MFRC522)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECEEDF] font-display uppercase tracking-tight">
            SIMULASI TAP KARTU <span className="text-[#CFAB8D]">RFID SANTRI</span>
          </h2>
          <p className="text-[#D9C4B0] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Sistem membaca UID kartu RFID secara real-time (&lt;1 detik), memverifikasi keabsahan sesi makan aktif, dan menampilkan konfirmasi visual LED &amp; suara bleep.
          </p>
        </div>

        {/* Offline Sync Banner */}
        {systemConfig.mode_offline && (
          <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 text-center space-y-2 relative z-10 w-full md:w-auto md:min-w-[200px]">
            <div className="flex items-center justify-center space-x-2 text-red-300 font-bold text-xs uppercase tracking-wider">
              <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
              <span>OFFLINE MODE</span>
            </div>
            <p className="text-xs text-red-200 font-mono">
              QUEUE: <strong className="text-white text-sm">{offlineQueue.length}</strong> TAPS
            </p>
            <button
              onClick={syncOfflineQueue}
              disabled={offlineQueue.length === 0}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 w-full shadow-lg min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SINKRONISASI SERVER</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: Left - OLED Hardware Box Simulator | Right - Tap Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Col: OLED Hardware Display Box */}
        <div className="lg:col-span-5 flex flex-col items-center w-full">
          <div className="w-full max-w-md bg-[#2B2824] border-2 border-[#D9C4B0]/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-[#ECEEDF]">
            {/* Top Hardware Header: Brand & LEDs */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D9C4B0]/20">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#BBDCE5] shadow-lg shadow-[#BBDCE5]/50 animate-pulse"></span>
                <span className="font-mono text-xs text-[#D9C4B0] font-black uppercase tracking-widest">
                  READER-01 (ESP32)
                </span>
              </div>

              {/* Status LEDs */}
              <div className="flex items-center space-x-4">
                {/* Green/Cyan LED */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border border-slate-700 transition-all duration-300 ${
                      scannedStatus === 'success'
                        ? 'bg-[#BBDCE5] shadow-lg shadow-[#BBDCE5]/80 ring-4 ring-[#BBDCE5]/30'
                        : 'bg-[#BBDCE5]/20'
                    }`}
                  />
                  <span className="text-[9px] text-[#D9C4B0] font-mono mt-1 font-bold">CYAN</span>
                </div>

                {/* Red LED */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border border-slate-700 transition-all duration-300 ${
                      scannedStatus === 'duplicate' || scannedStatus === 'invalid_time' || scannedStatus === 'inactive'
                        ? 'bg-red-500 shadow-lg shadow-red-500/80 ring-4 ring-red-500/30'
                        : 'bg-red-950'
                    }`}
                  />
                  <span className="text-[9px] text-[#D9C4B0] font-mono mt-1 font-bold">MERAH</span>
                </div>
              </div>
            </div>

            {/* Simulated OLED Screen Box */}
            <div className={`mt-5 rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 min-h-[250px] sm:min-h-[270px] flex flex-col justify-between ${
              scannedStatus === 'success'
                ? 'bg-[#1D1B18] border-[#BBDCE5] text-[#ECEEDF] shadow-[0_0_20px_rgba(187,220,229,0.25)]'
                : scannedStatus === 'duplicate' || scannedStatus === 'invalid_time' || scannedStatus === 'inactive'
                ? 'bg-[#1D1B18] border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-[#1D1B18] border-[#D9C4B0]/30 text-[#ECEEDF]'
            }`}>
              {/* Screen Top Info */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono pb-2 border-b border-white/10 uppercase font-bold tracking-wider">
                <span className="text-[#BBDCE5] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#BBDCE5]" />
                  <span>{currentTime}</span>
                </span>
                <span className="text-[#D9C4B0]">
                  {activeSesi ? activeSesi.nama_sesi : 'SESI TUTUP'}
                </span>
              </div>

              {/* Screen Content Body */}
              <div className="my-auto py-4 text-center">
                {isScanning ? (
                  <div className="space-y-3 py-6">
                    <RefreshCw className="w-10 h-10 text-[#BBDCE5] animate-spin mx-auto" />
                    <p className="font-mono text-xs text-[#BBDCE5] uppercase tracking-widest font-bold animate-pulse">Membaca Card UID...</p>
                  </div>
                ) : lastScannedSantri ? (
                  <div className="space-y-2.5 animate-fadeIn">
                    <div className="relative inline-block">
                      <img
                        src={lastScannedSantri.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt={lastScannedSantri.nama}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover mx-auto ring-2 ring-white/20 shadow-xl"
                      />
                      {scannedStatus === 'success' ? (
                        <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-[#BBDCE5] bg-[#2B2824] rounded-full absolute -bottom-1 -right-1" />
                      ) : (
                        <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-400 bg-[#2B2824] rounded-full absolute -bottom-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-lg sm:text-xl text-[#ECEEDF] tracking-wide font-display">{lastScannedSantri.nama}</h3>
                      <p className="text-xs text-[#D9C4B0] font-semibold uppercase tracking-wider mt-0.5">
                        {lastScannedSantri.kelas} • {lastScannedSantri.kamar}
                      </p>
                      <p className="text-[11px] font-mono text-[#BBDCE5] mt-0.5 font-bold">UID: {lastScannedSantri.rfid_uid}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 sm:py-6 space-y-2.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#BBDCE5]">
                      <CreditCard className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-[#BBDCE5] uppercase tracking-widest font-bold">TAP RFID SANTRI</p>
                      <p className="text-[11px] sm:text-xs text-[#D9C4B0]/80 mt-0.5 uppercase tracking-wider">Tempelkan Kartu Santri Pada Sensor</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OLED Bottom Status Text Banner */}
              <div className={`p-2.5 sm:p-3 rounded-xl font-black text-center text-[11px] sm:text-xs tracking-wider border font-mono uppercase transition-all ${
                scannedStatus === 'success'
                  ? 'bg-[#CFAB8D] text-[#2B2824] border-[#CFAB8D] shadow-lg'
                  : scannedStatus === 'duplicate' || scannedStatus === 'invalid_time' || scannedStatus === 'inactive'
                  ? 'bg-red-600 text-white border-red-400 shadow-lg'
                  : 'bg-white/5 text-[#D9C4B0] border-white/10'
              }`}>
                {displayMessage}
              </div>
            </div>

            {/* Hardware RFID Coil Sensor Graphic */}
            <div className="mt-4 sm:mt-5 border border-dashed border-[#D9C4B0]/30 rounded-2xl p-3.5 text-center bg-white/[0.02]">
              <div className="flex items-center justify-center space-x-2 text-[11px] font-mono text-[#D9C4B0] font-bold uppercase tracking-widest">
                <Radio className="w-4 h-4 text-[#BBDCE5] shrink-0" />
                <span>AREA SENSOR NFC / RFID 13.56 MHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Santri Quick Tap Selector & Manual Input */}
        <div className="lg:col-span-7 space-y-6 w-full">
          {/* Manual Input Card */}
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md space-y-4 text-[#2B2824]">
            <h3 className="font-black text-sm sm:text-base text-[#2B2824] flex items-center space-x-2 uppercase tracking-wider font-display">
              <CreditCard className="w-5 h-5 text-[#CFAB8D] shrink-0" />
              <span>INPUT MANUAL UID KARTU / SCANNER</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={manualUidInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setManualUidInput(val);
                  // Auto-process instantly when USB RFID Scanner inputs exact matching UID
                  const trimmed = val.trim();
                  if (trimmed.length >= 4) {
                    const match = santriList.find(s => s.rfid_uid.toLowerCase() === trimmed.toLowerCase());
                    if (match) {
                      handleSimulateTap(match.rfid_uid);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualUidInput.trim()) {
                    e.preventDefault();
                    handleSimulateTap(manualUidInput.trim());
                  }
                }}
                placeholder="Tempelkan/Scan Kartu RFID (Otomatis Diproses...)"
                className="flex-1 bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#CFAB8D] min-h-[44px]"
              />
              <button
                onClick={() => handleSimulateTap(manualUidInput)}
                disabled={!manualUidInput.trim()}
                className="px-6 py-3 bg-[#CFAB8D] hover:bg-[#b89578] disabled:opacity-50 text-[#2B2824] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 min-h-[44px] sm:w-auto w-full"
              >
                <span>Tap Kartu</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-[#635C55] pt-1 font-mono uppercase tracking-wider">
              <span>Sesi Aktif: <strong className="text-[#2B2824] bg-[#BBDCE5]/40 px-2 py-0.5 rounded">{activeSesi ? activeSesi.nama_sesi : 'TUTUP'}</strong></span>
              <span>Total Santri: <strong className="text-[#2B2824]">{santriList.length} Santri</strong></span>
            </div>
          </div>

          {/* Quick Santri Cards Selection Grid */}
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md space-y-4 text-[#2B2824]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[#2B2824] flex items-center space-x-2 uppercase tracking-wider font-display">
                  <User className="w-5 h-5 text-[#CFAB8D] shrink-0" />
                  <span>SIMULASI TAP CEPAT (PILIH SANTRI)</span>
                </h3>
                <p className="text-xs text-[#635C55] mt-1">
                  Klik kartu santri untuk mensimulasikan tap RFID langsung di reader.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
              {santriList.map((santri) => {
                const todayStr = new Date().toISOString().split('T')[0];
                const alreadyTapped = activeSesi
                  ? tapRecords.some(r => r.timestamp_tap.startsWith(todayStr) && r.santri_id === santri.id && r.sesi_id === activeSesi.id && r.status === 'berhasil')
                  : false;

                return (
                  <div
                    key={santri.id}
                    onClick={() => handleSimulateTap(santri.rfid_uid)}
                    className={`group relative border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] gap-2 ${
                      alreadyTapped
                        ? 'bg-[#ECEEDF]/40 border-[#D9C4B0]/40 opacity-60 hover:opacity-100'
                        : 'bg-[#ECEEDF]/70 border-[#D9C4B0] hover:border-[#CFAB8D] hover:bg-[#ECEEDF]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <img
                        src={santri.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt={santri.nama}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-[#D9C4B0] group-hover:ring-[#CFAB8D] transition-all shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-sm text-[#2B2824] group-hover:text-[#CFAB8D] transition-colors font-display truncate">
                          {santri.nama}
                        </h4>
                        <p className="text-[11px] text-[#635C55] uppercase tracking-wider font-semibold truncate">
                          {santri.kelas} • {santri.kamar}
                        </p>
                        <p className="text-[10px] font-mono text-[#2B5261] truncate">
                          UID: {santri.rfid_uid}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      {alreadyTapped ? (
                        <span className="px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Sudah
                        </span>
                      ) : (
                        <span className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[#CFAB8D] text-[#2B2824] shadow group-hover:scale-105 transition-all min-h-[36px] flex items-center justify-center">
                          TAP
                        </span>
                      )}

                      {santri.status_santri === 'Sakit' && (
                        <span className="text-[9px] text-amber-600 font-bold uppercase">Sakit</span>
                      )}
                      {santri.status_santri === 'Izin/Pulang' && (
                        <span className="text-[9px] text-sky-700 font-bold uppercase">Izin</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
