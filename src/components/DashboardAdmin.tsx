import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  Clock, 
  Sparkles, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Search, 
  Bot, 
  RefreshCw, 
  TrendingUp, 
  ShieldAlert, 
  X
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
import { Santri, SesiMakan, TapRecord, Peringatan, UserAccount, SystemConfig } from '../types';
import { downloadCSV, formatIndonesianDate, formatIndonesianDateTime } from '../utils/helpers';

interface DashboardAdminProps {
  santriList: Santri[];
  setSantriList: React.Dispatch<React.SetStateAction<Santri[]>>;
  sesiList: SesiMakan[];
  setSesiList: React.Dispatch<React.SetStateAction<SesiMakan[]>>;
  tapRecords: TapRecord[];
  peringatanList: Peringatan[];
  setPeringatanList: React.Dispatch<React.SetStateAction<Peringatan[]>>;
  usersList: UserAccount[];
  setUsersList: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  systemConfig: SystemConfig;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  santriList,
  setSantriList,
  sesiList,
  setSesiList,
  tapRecords,
  peringatanList,
  setPeringatanList,
  usersList,
  setUsersList,
  systemConfig
}) => {
  const [adminTab, setAdminTab] = useState<'analytics' | 'santri' | 'alerts' | 'rfid' | 'config'>('analytics');
  
  // AI States
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isPredictingRisk, setIsPredictingRisk] = useState<boolean>(false);

  // Santri Modal States
  const [showSantriModal, setShowSantriModal] = useState<boolean>(false);
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null);
  const [santriForm, setSantriForm] = useState({
    nama: '',
    rfid_uid: '',
    kelas: 'Kelas 1A',
    kamar: 'Kamar Al-Farabi',
    status_santri: 'Aktif' as any,
    wali_hp: ''
  });

  // Alert Handling Modal State
  const [handlingAlert, setHandlingAlert] = useState<Peringatan | null>(null);
  const [alertNote, setAlertNote] = useState<string>('');

  // Search & Filters
  const [santriSearch, setSantriSearch] = useState<string>('');
  const [alertFilterLevel, setAlertFilterLevel] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Compute Overall KPI Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const totalSantri = santriList.length;
  
  const todayTaps = useMemo(() => {
    return tapRecords.filter(r => r.timestamp_tap.startsWith(todayStr) && r.status === 'berhasil');
  }, [tapRecords, todayStr]);

  const uniqueSantriTappedToday = useMemo(() => {
    return new Set(todayTaps.map(t => t.santri_id)).size;
  }, [todayTaps]);

  const todayAttendanceRate = totalSantri > 0 ? Math.round((uniqueSantriTappedToday / totalSantri) * 100) : 0;
  const activeAlertsCount = peringatanList.filter(p => p.status === 'aktif').length;
  const totalMealsServedAllTime = tapRecords.filter(r => r.status === 'berhasil').length;

  // Chart Data Preparation (Last 7 Days Consumption Trends)
  const chartTrendData = useMemo(() => {
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600 * 1000);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    return last7Days.map(dateStr => {
      const dayTaps = tapRecords.filter(r => r.timestamp_tap.startsWith(dateStr) && r.status === 'berhasil');
      const sarapanCount = dayTaps.filter(r => r.sesi_nama === 'Sarapan').length;
      const siangCount = dayTaps.filter(r => r.sesi_nama === 'Makan Siang').length;
      const malamCount = dayTaps.filter(r => r.sesi_nama === 'Makan Malam').length;

      const dayLabel = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

      return {
        tanggal: dayLabel,
        Sarapan: sarapanCount,
        'Makan Siang': siangCount,
        'Makan Malam': malamCount,
        Total: sarapanCount + siangCount + malamCount
      };
    });
  }, [tapRecords]);

  // Handle AI Report Generation (Gemini API Call)
  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    try {
      const stats = {
        totalSantri,
        pagiCount: todayTaps.filter(r => r.sesi_nama === 'Sarapan').length,
        pagiPercent: Math.round((todayTaps.filter(r => r.sesi_nama === 'Sarapan').length / totalSantri) * 100),
        siangCount: todayTaps.filter(r => r.sesi_nama === 'Makan Siang').length,
        siangPercent: Math.round((todayTaps.filter(r => r.sesi_nama === 'Makan Siang').length / totalSantri) * 100),
        malamCount: todayTaps.filter(r => r.sesi_nama === 'Makan Malam').length,
        malamPercent: Math.round((todayTaps.filter(r => r.sesi_nama === 'Makan Malam').length / totalSantri) * 100),
        level1Count: peringatanList.filter(p => p.level === 1 && p.status === 'aktif').length,
        level2Count: peringatanList.filter(p => p.level === 2 && p.status === 'aktif').length,
        level3Count: peringatanList.filter(p => p.level === 3 && p.status === 'aktif').length,
      };

      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          alerts: peringatanList.filter(p => p.status === 'aktif'),
          recentTapSummary: todayTaps.slice(0, 15)
        })
      });

      const data = await response.json();
      if (data.result) {
        setAiReport(data.result);
      } else {
        setAiReport('Gagal menerima respons analisis dari server AI.');
      }
    } catch (e: any) {
      console.error(e);
      setAiReport(`Terjadi kesalahan: ${e.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle AI Risk Prediction
  const handlePredictAtRisk = async () => {
    setIsPredictingRisk(true);
    try {
      const response = await fetch('/api/gemini/predict-at-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriList: santriList.slice(0, 10),
          recentRecords: tapRecords.slice(-30)
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiPrediction(data);
      } else {
        setToast({ message: data.error || 'Gagal memprediksi risiko santri', type: 'error' });
      }
    } catch (e: any) {
      console.error(e);
      setToast({ message: `Terjadi kesalahan: ${e.message}`, type: 'error' });
    } finally {
      setIsPredictingRisk(false);
    }
  };

  // CRUD Santri Handlers
  const handleOpenSantriModal = (santri?: Santri) => {
    if (santri) {
      setEditingSantri(santri);
      setSantriForm({
        nama: santri.nama,
        rfid_uid: santri.rfid_uid,
        kelas: santri.kelas,
        kamar: santri.kamar,
        status_santri: santri.status_santri,
        wali_hp: santri.wali_hp || ''
      });
    } else {
      setEditingSantri(null);
      setSantriForm({
        nama: '',
        rfid_uid: `RF-${Math.floor(1000 + Math.random() * 9000)}`,
        kelas: 'Kelas 1A',
        kamar: 'Kamar Al-Farabi',
        status_santri: 'Aktif',
        wali_hp: ''
      });
    }
    setShowSantriModal(true);
  };

  const handleSaveSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriForm.nama.trim() || !santriForm.rfid_uid.trim()) return;

    if (editingSantri) {
      setSantriList(prev => prev.map(s => s.id === editingSantri.id ? {
        ...s,
        nama: santriForm.nama,
        rfid_uid: santriForm.rfid_uid,
        kelas: santriForm.kelas,
        kamar: santriForm.kamar,
        status_santri: santriForm.status_santri,
        status_aktif: santriForm.status_santri !== 'Nonaktif',
        wali_hp: santriForm.wali_hp
      } : s));
    } else {
      const newSantriObj: Santri = {
        id: `san-${Date.now()}`,
        nama: santriForm.nama,
        rfid_uid: santriForm.rfid_uid,
        kelas: santriForm.kelas,
        kamar: santriForm.kamar,
        foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        status_santri: santriForm.status_santri,
        status_aktif: santriForm.status_santri !== 'Nonaktif',
        wali_hp: santriForm.wali_hp,
        tanggal_daftar: new Date().toISOString().split('T')[0]
      };
      setSantriList(prev => [newSantriObj, ...prev]);
    }

    setShowSantriModal(false);
  };

  const handleDeleteSantri = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data santri ini?')) {
      setSantriList(prev => prev.filter(s => s.id !== id));
    }
  };

  // Alert Handlers
  const handleResolveAlert = () => {
    if (!handlingAlert) return;
    setPeringatanList(prev => prev.map(p => p.id === handlingAlert.id ? {
      ...p,
      status: 'ditangani',
      catatan_tindak_lanjut: alertNote,
      tanggal_ditangani: new Date().toISOString().split('T')[0]
    } : p));
    setHandlingAlert(null);
    setAlertNote('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = santriList.map(s => {
      const todayTapsSantri = todayTaps.filter(t => t.santri_id === s.id);
      return {
        ID_Santri: s.id,
        Nama_Santri: s.nama,
        RFID_UID: s.rfid_uid,
        Kelas: s.kelas,
        Kamar: s.kamar,
        Status_Santri: s.status_santri,
        Hadir_Hari_Ini: todayTapsSantri.length > 0 ? 'Ya' : 'Tidak',
        Jumlah_Tap_Hari_Ini: todayTapsSantri.length,
        No_HP_Wali: s.wali_hp || '-'
      };
    });
    downloadCSV('Laporan_Konsumsi_Santri', exportData);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Admin KPI Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Santri */}
        <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#635C55] uppercase tracking-widest font-mono">TOTAL SANTRI</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2B2824] font-display mt-1">{totalSantri}</h3>
            <p className="text-[10px] sm:text-[11px] text-[#2B5261] font-mono mt-0.5">100% TERDAFTAR RFID</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#BBDCE5]/40 border border-[#BBDCE5] text-[#2B2824] flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 2: Kehadiran Hari Ini */}
        <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#635C55] uppercase tracking-widest font-mono">PRESENSI HARI INI</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2B2824] font-display mt-1">{todayAttendanceRate}%</h3>
            <p className="text-[10px] sm:text-[11px] text-[#635C55] font-mono mt-0.5">{uniqueSantriTappedToday} / {totalSantri} SANTRI</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#CFAB8D]/30 border border-[#CFAB8D] text-[#2B2824] flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#2B2824]" />
          </div>
        </div>

        {/* Card 3: Peringatan Aktif */}
        <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#635C55] uppercase tracking-widest font-mono">PERINGATAN AKTIF</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2B2824] font-display mt-1">{activeAlertsCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-red-700 font-mono mt-0.5">
              {peringatanList.filter(p => p.level === 3 && p.status === 'aktif').length} DARURAT (LVL 3)
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Card 4: Total Makan Melayani */}
        <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#635C55] uppercase tracking-widest font-mono">PORSI DILAYANI</p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#2B2824] font-display mt-1">{totalMealsServedAllTime}</h3>
            <p className="text-[10px] sm:text-[11px] text-[#635C55] font-mono mt-0.5">TERCATAT SISTEM</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#ECEEDF] border border-[#D9C4B0] text-[#2B2824] flex items-center justify-center font-bold shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Admin Tab Navigation Header */}
      <div className="bg-[#2B2824] border border-[#D9C4B0]/30 rounded-2xl p-1.5 sm:p-2 shadow-xl flex overflow-x-auto no-scrollbar gap-1.5 uppercase font-mono tracking-wider">
        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap min-h-[44px] ${
            adminTab === 'analytics'
              ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
              : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span>ANALITIK &amp; AI REPORT</span>
        </button>

        <button
          onClick={() => setAdminTab('santri')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap min-h-[44px] ${
            adminTab === 'santri'
              ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
              : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>MASTER SANTRI ({totalSantri})</span>
        </button>

        <button
          onClick={() => setAdminTab('alerts')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap min-h-[44px] ${
            adminTab === 'alerts'
              ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
              : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>PERINGATAN ({activeAlertsCount})</span>
        </button>

        <button
          onClick={() => setAdminTab('rfid')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap min-h-[44px] ${
            adminTab === 'rfid'
              ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
              : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>KARTU RFID</span>
        </button>

        <button
          onClick={() => setAdminTab('config')}
          className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap min-h-[44px] ${
            adminTab === 'config'
              ? 'bg-[#CFAB8D] text-[#2B2824] shadow'
              : 'text-[#D9C4B0] hover:text-[#ECEEDF] hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>JADWAL SESI &amp; AKUN</span>
        </button>
      </div>

      {/* TAB 1: ANALITIK & AI-POWERED REPORTS */}
      {adminTab === 'analytics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* AI Daily Executive Summary & Predict Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Executive Summary Card */}
            <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9C4B0]/40 pb-3">
                <div className="flex items-center space-x-2 text-[#2B2824] font-black text-xs uppercase tracking-widest font-mono">
                  <Bot className="w-5 h-5 text-[#2B2824] animate-pulse" />
                  <span>AI EXECUTIVE SUMMARY (GEMINI 3.6 FLASH)</span>
                </div>
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 bg-[#CFAB8D] hover:bg-[#c49a78] disabled:opacity-50 text-[#2B2824] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Menganalisis...' : 'Generate Summary'}</span>
                </button>
              </div>

              {aiReport ? (
                <div className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-4 text-xs text-[#2B2824] leading-relaxed max-h-[320px] overflow-y-auto whitespace-pre-line font-mono">
                  {aiReport}
                </div>
              ) : (
                <div className="bg-[#ECEEDF]/50 border border-dashed border-[#D9C4B0] rounded-2xl p-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-[#CFAB8D] mx-auto" />
                  <p className="text-xs text-[#635C55]">
                    Klik tombol <strong>Generate Summary</strong> untuk merangkum kondisi presensi makan santri hari ini, anomali, dan estimasi porsi.
                  </p>
                </div>
              )}
            </div>

            {/* AI At-Risk Santri Prediction */}
            <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9C4B0]/40 pb-3">
                <div className="flex items-center space-x-2 text-amber-800 font-black text-xs uppercase tracking-widest font-mono">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                  <span>PREDIKSI SANTRI BERISIKO</span>
                </div>
                <button
                  onClick={handlePredictAtRisk}
                  disabled={isPredictingRisk}
                  className="px-4 py-2 bg-amber-200 hover:bg-amber-300 disabled:opacity-50 text-amber-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isPredictingRisk ? 'Menganalisis...' : 'Deteksi Risiko AI'}</span>
                </button>
              </div>

              {aiPrediction?.atRiskSantri ? (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {aiPrediction.atRiskSantri.map((item: any, idx: number) => (
                    <div key={idx} className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2B2824] text-xs">{item.nama} ({item.kelas})</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.tingkatRisiko === 'Tinggi' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          Risiko {item.tingkatRisiko}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#635C55]">{item.alasan}</p>
                      <p className="text-[10px] text-[#2B5261] font-mono">💡 Saran Musyrif: {item.saranPengurus}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#ECEEDF]/50 border border-dashed border-[#D9C4B0] rounded-2xl p-8 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs text-[#635C55]">
                    Klik <strong>Deteksi Risiko AI</strong> untuk mengidentifikasi pola awal santri yang berpotensi memiliki masalah kesehatan/pola makan.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Consumption Trends Chart */}
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9C4B0]/40 pb-3">
              <div>
                <h3 className="font-black text-lg text-[#2B2824] font-display uppercase tracking-tight">GRAFIK TREN KONSUMSI SANTRI <span className="text-[#CFAB8D]">(7 HARI)</span></h3>
                <p className="text-xs text-[#635C55]">Visualisasi jumlah porsi makan per sesi (Sarapan, Makan Siang, Makan Malam)</p>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-[#ECEEDF] hover:bg-[#D9C4B0]/40 text-[#2B2824] text-xs font-black uppercase tracking-wider rounded-xl border border-[#D9C4B0] transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-[#CFAB8D]" />
                <span>Export Data CSV</span>
              </button>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9C4B0" />
                  <XAxis dataKey="tanggal" stroke="#2B2824" fontSize={11} />
                  <YAxis stroke="#2B2824" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9C4B0', borderRadius: '1rem', fontSize: '12px', color: '#2B2824' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Sarapan" fill="#CFAB8D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Makan Siang" fill="#BBDCE5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Makan Malam" fill="#2B2824" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER DATA SANTRI (CRUD) */}
      {adminTab === 'santri' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9C4B0]/40 pb-4">
              <div>
                <h3 className="font-black text-xl text-[#2B2824] font-display uppercase tracking-tight">MASTER DATA <span className="text-[#CFAB8D]">SANTRI PESANTREN</span></h3>
                <p className="text-xs text-[#635C55]">Kelola informasi profil, kelas, kamar, status, dan pemetaan kartu RFID.</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenSantriModal()}
                  className="px-4 py-2.5 bg-[#CFAB8D] hover:bg-[#c49a78] text-[#2B2824] font-black text-xs uppercase tracking-widest rounded-xl shadow transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Santri Baru</span>
                </button>
              </div>
            </div>

            {/* Table Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#635C55] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                placeholder="Cari nama santri, rfid uid, kelas, atau kamar..."
                className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] pl-10 pr-4 py-3 rounded-2xl text-xs focus:outline-none focus:border-[#CFAB8D]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#D9C4B0]">
              <table className="w-full min-w-[640px] text-left text-xs text-[#2B2824]">
                <thead className="bg-[#ECEEDF] text-[#635C55] font-mono uppercase text-[10px] tracking-wider border-b border-[#D9C4B0]">
                  <tr>
                    <th className="p-4">Santri</th>
                    <th className="p-4">RFID UID</th>
                    <th className="p-4">Kelas &amp; Kamar</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">No. Wali</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9C4B0]/40">
                  {santriList
                    .filter(s => {
                      if (!santriSearch) return true;
                      const q = santriSearch.toLowerCase();
                      return s.nama.toLowerCase().includes(q) || s.rfid_uid.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q) || s.kamar.toLowerCase().includes(q);
                    })
                    .map(santri => (
                      <tr key={santri.id} className="hover:bg-[#ECEEDF]/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={santri.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                              alt={santri.nama}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#D9C4B0]"
                            />
                            <div>
                              <p className="font-extrabold text-[#2B2824] text-xs font-display">{santri.nama}</p>
                              <p className="text-[10px] text-[#635C55] font-mono">ID: {santri.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#2B5261]">{santri.rfid_uid}</td>
                        <td className="p-4">
                          <p className="font-medium text-[#2B2824]">{santri.kelas}</p>
                          <p className="text-[10px] text-[#635C55]">{santri.kamar}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            santri.status_santri === 'Aktif' ? 'bg-[#CFAB8D] text-[#2B2824]' :
                            santri.status_santri === 'Sakit' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-[#ECEEDF] text-[#635C55] border border-[#D9C4B0]'
                          }`}>
                            {santri.status_santri}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[#635C55]">{santri.wali_hp || '-'}</td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenSantriModal(santri)}
                            className="p-2 bg-[#ECEEDF] hover:bg-[#D9C4B0]/50 text-[#2B2824] rounded-xl transition-colors border border-[#D9C4B0]"
                            title="Edit Data Santri"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSantri(santri.id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors border border-red-300"
                            title="Hapus Santri"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SISTEM PERINGATAN (ALERT SYSTEM) */}
      {adminTab === 'alerts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9C4B0]/40 pb-4">
              <div>
                <h3 className="font-black text-xl text-[#2B2824] font-display uppercase tracking-tight">SISTEM PERINGATAN <span className="text-[#CFAB8D]">POLI MAKAN</span></h3>
                <p className="text-xs text-[#635C55]">Deteksi otomatis Level 1 (Kuning), Level 2 (Oranye), dan Level 3 (Darurat/Merah).</p>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-2">
                <select
                  value={alertFilterLevel}
                  onChange={(e) => setAlertFilterLevel(e.target.value)}
                  className="bg-[#ECEEDF] border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="all">Semua Level Peringatan</option>
                  <option value="1">Level 1 (Kuning - 2 Sesi Consecutive)</option>
                  <option value="2">Level 2 (Oranye - &gt;3 Makan 7 Hari)</option>
                  <option value="3">Level 3 (Merah - &gt;7 Makan 14 Hari)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {peringatanList
                .filter(p => alertFilterLevel === 'all' || String(p.level) === alertFilterLevel)
                .map(alert => (
                  <div
                    key={alert.id}
                    className={`border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      alert.level === 3 ? 'bg-red-50 border-red-300' :
                      alert.level === 2 ? 'bg-amber-50 border-amber-300' :
                      'bg-[#ECEEDF]/60 border-[#D9C4B0]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          alert.level === 3 ? 'bg-red-600 text-white shadow' :
                          alert.level === 2 ? 'bg-amber-500 text-slate-950 shadow' :
                          'bg-[#CFAB8D] text-[#2B2824] shadow'
                        }`}>
                          LEVEL {alert.level} {alert.level === 3 ? 'DARURAT' : alert.level === 2 ? 'WASPADA' : 'PERINGATAN'}
                        </span>
                        <span className="font-extrabold text-[#2B2824] text-sm font-display">{alert.santri_nama} ({alert.santri_kelas})</span>
                        <span className="text-xs text-[#635C55]">• {alert.santri_kamar}</span>
                      </div>

                      <p className="text-xs text-[#2B2824] mt-1">{alert.deskripsi}</p>

                      {alert.catatan_tindak_lanjut && (
                        <p className="text-xs text-[#2B5261] font-mono mt-1">
                          📝 Catatan Musyrif: {alert.catatan_tindak_lanjut}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {alert.status === 'aktif' ? (
                        <button
                          onClick={() => {
                            setHandlingAlert(alert);
                            setAlertNote(alert.catatan_tindak_lanjut || '');
                          }}
                          className="px-4 py-2 bg-[#CFAB8D] hover:bg-[#c49a78] text-[#2B2824] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow"
                        >
                          Tindak Lanjuti
                        </button>
                      ) : (
                        <span className="px-3.5 py-1.5 bg-[#BBDCE5]/40 text-[#2B2824] border border-[#BBDCE5] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Sudah Ditangani</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MANAJEMEN KARTU RFID */}
      {adminTab === 'rfid' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="font-black text-xl text-[#2B2824] font-display uppercase tracking-tight">MANAJEMEN &amp; REGISTRASI <span className="text-[#CFAB8D]">KARTU RFID</span></h3>
            <p className="text-xs text-[#635C55]">Penggantian kartu rusak/hilang tanpa menghapus histori presensi santri.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-6 space-y-4">
                <h4 className="font-extrabold text-sm text-[#2B2824] flex items-center space-x-2 font-display uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-[#CFAB8D]" />
                  <span>REGISTRASI / GANTI KARTU</span>
                </h4>
                <p className="text-xs text-[#635C55]">Pilih santri dan masukkan UID kartu RFID baru.</p>
                <div className="space-y-3">
                  <select
                    id="rfid-santri-select"
                    className="w-full bg-[#FFFFFF] border border-[#D9C4B0] text-[#2B2824] p-3 rounded-xl text-xs"
                  >
                    {santriList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama} ({s.kelas}) - UID: {s.rfid_uid}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    id="rfid-new-uid"
                    placeholder="UID Kartu Baru (cth: E2-99-88-11)"
                    className="w-full bg-[#FFFFFF] border border-[#D9C4B0] text-[#2B2824] p-3 rounded-xl text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      const sel = (document.getElementById('rfid-santri-select') as HTMLSelectElement).value;
                      const uid = (document.getElementById('rfid-new-uid') as HTMLInputElement).value;
                      if (!uid.trim()) return;
                      setSantriList(prev => prev.map(s => s.id === sel ? { ...s, rfid_uid: uid.trim() } : s));
                      setToast({ message: 'UID Kartu RFID Berhasil Diperbarui!', type: 'success' });
                    }}
                    className="w-full py-3 bg-[#CFAB8D] hover:bg-[#c49a78] text-[#2B2824] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow"
                  >
                    Simpan Perubahan Kartu
                  </button>
                </div>
              </div>

              <div className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-6 space-y-4">
                <h4 className="font-extrabold text-sm text-[#2B2824] flex items-center space-x-2 font-display uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-amber-700" />
                  <span>KARTU SEMENTARA (TAMU / SANTRI BARU)</span>
                </h4>
                <p className="text-xs text-[#635C55]">Terbitkan kartu sementara untuk tamu atau santri baru yang belum masuk database.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Tamu / Santri Baru"
                    className="w-full bg-[#FFFFFF] border border-[#D9C4B0] text-[#2B2824] p-3 rounded-xl text-xs"
                  />
                  <button
                    onClick={() => setToast({ message: 'Kartu Sementara Berhasil Diterbitkan!', type: 'success' })}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow"
                  >
                    Terbitkan Kartu Sementara
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KONFIGURASI SESI MAKAN */}
      {adminTab === 'config' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="font-black text-xl text-[#2B2824] font-display uppercase tracking-tight">KONFIGURASI <span className="text-[#CFAB8D]">JADWAL SESI MAKAN</span></h3>
            <p className="text-xs text-[#635C55]">Atur jam buka &amp; jam tutup tap untuk Sarapan, Makan Siang, dan Makan Malam.</p>

            <div className="space-y-3">
              {sesiList.map(sesi => (
                <div key={sesi.id} className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-[#2B2824] text-sm font-display">{sesi.nama_sesi}</h4>
                    <p className="text-xs text-[#635C55]">{sesi.keterangan}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={sesi.jam_buka}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSesiList(prev => prev.map(s => s.id === sesi.id ? { ...s, jam_buka: val } : s));
                      }}
                      className="bg-[#FFFFFF] border border-[#D9C4B0] text-[#2B2824] px-3 py-1.5 rounded-xl text-xs font-mono"
                    />
                    <span className="text-[#635C55] text-xs font-mono">s/d</span>
                    <input
                      type="time"
                      value={sesi.jam_tutup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSesiList(prev => prev.map(s => s.id === sesi.id ? { ...s, jam_tutup: val } : s));
                      }}
                      className="bg-[#FFFFFF] border border-[#D9C4B0] text-[#2B2824] px-3 py-1.5 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Santri CRUD Modal */}
      {showSantriModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C4B0] pb-3">
              <h3 className="font-extrabold text-base text-[#2B2824] font-display uppercase tracking-wider">
                {editingSantri ? 'EDIT DATA SANTRI' : 'TAMBAH SANTRI BARU'}
              </h3>
              <button onClick={() => setShowSantriModal(false)} className="text-[#635C55] hover:text-[#2B2824]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSantri} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">NAMA LENGKAP SANTRI</label>
                <input
                  type="text"
                  required
                  value={santriForm.nama}
                  onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                  className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">RFID CARD UID</label>
                <input
                  type="text"
                  required
                  value={santriForm.rfid_uid}
                  onChange={(e) => setSantriForm({ ...santriForm, rfid_uid: e.target.value })}
                  className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">KELAS</label>
                  <input
                    type="text"
                    value={santriForm.kelas}
                    onChange={(e) => setSantriForm({ ...santriForm, kelas: e.target.value })}
                    className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">KAMAR</label>
                  <input
                    type="text"
                    value={santriForm.kamar}
                    onChange={(e) => setSantriForm({ ...santriForm, kamar: e.target.value })}
                    className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">STATUS SANTRI</label>
                <select
                  value={santriForm.status_santri}
                  onChange={(e) => setSantriForm({ ...santriForm, status_santri: e.target.value as any })}
                  className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin/Pulang">Izin/Pulang</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">NO. HP WALI SANTRI</label>
                <input
                  type="text"
                  value={santriForm.wali_hp}
                  onChange={(e) => setSantriForm({ ...santriForm, wali_hp: e.target.value })}
                  className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSantriModal(false)}
                  className="px-4 py-2 bg-[#ECEEDF] text-[#2B2824] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#D9C4B0]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#CFAB8D] text-[#2B2824] text-xs font-black uppercase tracking-widest rounded-xl shadow"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Handling Modal */}
      {handlingAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9C4B0] pb-3">
              <h3 className="font-extrabold text-base text-[#2B2824] font-display uppercase tracking-wider">TINDAK LANJUT PERINGATAN SANTRI</h3>
              <button onClick={() => setHandlingAlert(null)} className="text-[#635C55] hover:text-[#2B2824]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#2B2824] font-mono">
              <p><strong>SANTRI:</strong> {handlingAlert.santri_nama} ({handlingAlert.santri_kelas})</p>
              <p><strong>LEVEL:</strong> LEVEL {handlingAlert.level}</p>
              <p><strong>DESKRIPSI:</strong> {handlingAlert.deskripsi}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2B2824] block mb-1 uppercase tracking-wider font-mono">CATATAN TINDAK LANJUT MUSYRIF</label>
              <textarea
                rows={3}
                value={alertNote}
                onChange={(e) => setAlertNote(e.target.value)}
                placeholder="Tuliskan catatan konseling, kondisi kesehatan santri, atau hasil koordinasi..."
                className="w-full bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] p-3 rounded-xl text-xs focus:outline-none focus:border-[#CFAB8D]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setHandlingAlert(null)}
                className="px-4 py-2 bg-[#ECEEDF] text-[#2B2824] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#D9C4B0]"
              >
                Batal
              </button>
              <button
                onClick={handleResolveAlert}
                className="px-5 py-2 bg-[#CFAB8D] text-[#2B2824] text-xs font-black uppercase tracking-widest rounded-xl shadow"
              >
                Tandai Sudah Ditangani
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider animate-fadeIn flex items-center space-x-2 ${
          toast.type === 'success' ? 'bg-[#CFAB8D] text-[#2B2824] border border-[#CFAB8D]' :
          toast.type === 'error' ? 'bg-red-600 text-white border border-red-400' :
          'bg-[#BBDCE5] text-[#2B2824] border border-[#BBDCE5]'
        }`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}
    </div>
  );
};
