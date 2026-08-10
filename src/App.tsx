import React, { useState } from 'react';
import { Header } from './components/Header';
import { RfidReaderHardware } from './components/RfidReaderHardware';
import { DashboardKitchen } from './components/DashboardKitchen';
import { DashboardAdmin } from './components/DashboardAdmin';
import { AiAssistantChat } from './components/AiAssistantChat';
import { 
  Santri, 
  SesiMakan, 
  TapRecord, 
  Peringatan, 
  UserAccount, 
  SystemConfig, 
  Role 
} from './types';
import { 
  INITIAL_SANTRI, 
  INITIAL_SESI_MAKAN, 
  generateSeedTapRecords, 
  INITIAL_PERINGATAN, 
  INITIAL_USERS, 
  INITIAL_SYSTEM_CONFIG 
} from './data/mockData';

export default function App() {
  const [activeView, setActiveView] = useState<'reader' | 'kitchen' | 'admin' | 'ai'>('reader');
  const [userRole, setUserRole] = useState<Role>('admin');

  // Core Application Persistent State
  const [santriList, setSantriList] = useState<Santri[]>(INITIAL_SANTRI);
  const [sesiList, setSesiList] = useState<SesiMakan[]>(INITIAL_SESI_MAKAN);
  const [tapRecords, setTapRecords] = useState<TapRecord[]>(() => generateSeedTapRecords());
  const [peringatanList, setPeringatanList] = useState<Peringatan[]>(INITIAL_PERINGATAN);
  const [usersList, setUsersList] = useState<UserAccount[]>(INITIAL_USERS);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_SYSTEM_CONFIG);

  // New Tap Record Handler from Hardware RFID Reader
  const handleTapCard = (record: Omit<TapRecord, 'id'>) => {
    const newRecordWithId: TapRecord = {
      ...record,
      id: `tap-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    setTapRecords(prev => {
      const updatedRecords = [newRecordWithId, ...prev];
      // Evaluate alert rules with updated records to avoid stale closure
      evaluateAlertRules(newRecordWithId.santri_id, updatedRecords);
      return updatedRecords;
    });
  };

  const evaluateAlertRules = (santriId: string, updatedTapRecords?: TapRecord[]) => {
    const santriObj = santriList.find(s => s.id === santriId);
    if (!santriObj) return;

    // Use updated records if provided (to handle the just-tapped record), otherwise fallback to state
    const recordsToEvaluate = updatedTapRecords || tapRecords;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // --- LEVEL 1: 2 consecutive meal sessions missed ---
    // Define ordered session IDs
    const sessionOrder = ['sesi-pagi', 'sesi-siang', 'sesi-malam'];
    
    // Get all tap records for this santri sorted by time (newest first)
    const allSantriTaps = recordsToEvaluate
      .filter(r => r.santri_id === santriId && r.status === 'berhasil')
      .sort((a, b) => b.timestamp_tap.localeCompare(a.timestamp_tap));

    // Build a set of "date|sessionId" that this santri attended
    const attendedSessions = new Set(
      allSantriTaps.map(r => {
        const tapDate = r.timestamp_tap.split('T')[0];
        return `${tapDate}|${r.sesi_id}`;
      })
    );

    // Generate last 7 days of expected sessions and check for 2 consecutive misses
    const recentDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
      recentDates.push(d.toISOString().split('T')[0]);
    }

    // Build chronological list of all expected sessions
    const expectedSessions: { date: string; sesiId: string; sesiNama: string }[] = [];
    for (const date of recentDates) {
      for (const sesiId of sessionOrder) {
        const sesiObj = sesiList.find(s => s.id === sesiId);
        expectedSessions.push({
          date,
          sesiId,
          sesiNama: sesiObj?.nama_sesi || sesiId
        });
      }
    }

    // Check for 2 consecutive misses
    let consecutiveMisses = 0;
    let maxConsecutiveMisses = 0;
    for (const expected of expectedSessions) {
      const key = `${expected.date}|${expected.sesiId}`;
      if (attendedSessions.has(key)) {
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
        if (consecutiveMisses > maxConsecutiveMisses) {
          maxConsecutiveMisses = consecutiveMisses;
        }
      }
    }

    // --- LEVEL 2: >3 meals missed in 7 days ---
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const tapsLast7Days = allSantriTaps.filter(r => r.timestamp_tap >= sevenDaysAgo);
    const totalPossibleMeals7 = 7 * 3; // 21
    const missedMeals7 = totalPossibleMeals7 - tapsLast7Days.length;

    // --- LEVEL 3: >7 meals missed in 14 days ---
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const tapsLast14Days = allSantriTaps.filter(r => r.timestamp_tap >= fourteenDaysAgo);
    const totalPossibleMeals14 = 14 * 3; // 42
    const missedMeals14 = totalPossibleMeals14 - tapsLast14Days.length;

    // Apply alert rules using functional updater to avoid stale closure on peringatanList
    // Check Level 3 first (highest priority)
    if (missedMeals14 > 7) {
      setPeringatanList(prev => {
        const alreadyExists = prev.some(p => p.santri_id === santriId && p.level === 3 && p.status === 'aktif');
        if (alreadyExists) return prev;
        const newL3: Peringatan = {
          id: `warn-l3-${Date.now()}`,
          santri_id: santriId,
          santri_nama: santriObj.nama,
          santri_kelas: santriObj.kelas,
          santri_kamar: santriObj.kamar,
          level: 3,
          tanggal_mulai: todayStr,
          status: 'aktif',
          deskripsi: `Darurat! Melewatkan ${missedMeals14} sesi makan dalam 14 hari terakhir.`
        };
        return [newL3, ...prev];
      });
      return; // Level 3 is the highest, skip lower levels
    }

    // Check Level 2
    if (missedMeals7 > 3) {
      setPeringatanList(prev => {
        const alreadyExists = prev.some(p => p.santri_id === santriId && p.level === 2 && p.status === 'aktif');
        if (alreadyExists) return prev;
        const newL2: Peringatan = {
          id: `warn-l2-${Date.now()}`,
          santri_id: santriId,
          santri_nama: santriObj.nama,
          santri_kelas: santriObj.kelas,
          santri_kamar: santriObj.kamar,
          level: 2,
          tanggal_mulai: todayStr,
          status: 'aktif',
          deskripsi: `Waspada! Melewatkan ${missedMeals7} sesi makan dalam 7 hari terakhir.`
        };
        return [newL2, ...prev];
      });
    }

    // Check Level 1
    if (maxConsecutiveMisses >= 2) {
      setPeringatanList(prev => {
        const alreadyExists = prev.some(p => p.santri_id === santriId && p.level === 1 && p.status === 'aktif');
        if (alreadyExists) return prev;
        const newL1: Peringatan = {
          id: `warn-l1-${Date.now()}`,
          santri_id: santriId,
          santri_nama: santriObj.nama,
          santri_kelas: santriObj.kelas,
          santri_kamar: santriObj.kamar,
          level: 1,
          tanggal_mulai: todayStr,
          status: 'aktif',
          deskripsi: `Peringatan! Santri melewatkan ${maxConsecutiveMisses} sesi makan berturut-turut.`
        };
        return [newL1, ...prev];
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#2B2824] font-sans selection:bg-[#CFAB8D] selection:text-[#2B2824] flex flex-col justify-between">
      <div>
        {/* Top Main Navigation Header */}
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          userRole={userRole}
          setUserRole={setUserRole}
          sesiList={sesiList}
          systemConfig={systemConfig}
          setSystemConfig={setSystemConfig}
        />

        {/* Main View Display */}
        <main className="pb-12">
          {activeView === 'reader' && (
            <RfidReaderHardware
              santriList={santriList}
              sesiList={sesiList}
              tapRecords={tapRecords}
              onTapCard={handleTapCard}
              systemConfig={systemConfig}
            />
          )}

          {activeView === 'kitchen' && (
            <DashboardKitchen
              santriList={santriList}
              sesiList={sesiList}
              tapRecords={tapRecords}
              systemConfig={systemConfig}
            />
          )}

          {activeView === 'admin' && (
            <DashboardAdmin
              santriList={santriList}
              setSantriList={setSantriList}
              sesiList={sesiList}
              setSesiList={setSesiList}
              tapRecords={tapRecords}
              peringatanList={peringatanList}
              setPeringatanList={setPeringatanList}
              usersList={usersList}
              setUsersList={setUsersList}
              systemConfig={systemConfig}
            />
          )}

          {activeView === 'ai' && (
            <AiAssistantChat
              santriList={santriList}
              sesiList={sesiList}
              tapRecords={tapRecords}
              peringatanList={peringatanList}
            />
          )}
        </main>
      </div>

      {/* Global Bold Typography Status Footer */}
      <footer className="w-full bg-[#2B2824] text-[#ECEEDF] py-3 px-6 md:px-10 flex flex-col sm:flex-row justify-between items-center text-xs uppercase font-bold tracking-wider gap-2">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#BBDCE5] animate-ping" />
          <span>STATUS: SANTRI MEAL RFID LIVE ENGINE</span>
        </span>
        <span className="hidden md:flex gap-6 text-[#D9C4B0]">
          <span>TAPS TODAY: {tapRecords.filter(t => t.timestamp_tap.startsWith(new Date().toISOString().split('T')[0]) && t.status === 'berhasil').length}</span>
          <span>SANTRI: {santriList.length} AKTIF</span>
          <span>SISTEM: ONLINE</span>
        </span>
        <span className="text-[#D9C4B0]">© 2026 ARSITEKTUR DIGITAL PESANTREN</span>
      </footer>
    </div>
  );
}
