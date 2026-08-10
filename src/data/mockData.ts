import { Santri, SesiMakan, TapRecord, Peringatan, UserAccount, SystemConfig } from '../types';

export const INITIAL_SESI_MAKAN: SesiMakan[] = [
  {
    id: 'sesi-pagi',
    nama_sesi: 'Sarapan',
    jam_buka: '05:00',
    jam_tutup: '07:30',
    aktif: true,
    keterangan: 'Sarapan Pagi - Setelah Subuh'
  },
  {
    id: 'sesi-siang',
    nama_sesi: 'Makan Siang',
    jam_buka: '11:30',
    jam_tutup: '13:30',
    aktif: true,
    keterangan: 'Makan Siang - Jam Istirahat Sekolah'
  },
  {
    id: 'sesi-malam',
    nama_sesi: 'Makan Malam',
    jam_buka: '17:30',
    jam_tutup: '20:00',
    aktif: true,
    keterangan: 'Makan Malam - Sebelum Isya'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    nama: 'Ustadz Ahmad Musyrif',
    role: 'admin',
    email: 'admin@pesantren.id'
  },
  {
    id: 'usr-2',
    nama: 'Kang Mamat (Dapur A)',
    role: 'penjaga_dapur',
    email: 'dapur1@pesantren.id'
  },
  {
    id: 'usr-3',
    nama: 'Mbak Siti (Dapur B)',
    role: 'penjaga_dapur',
    email: 'dapur2@pesantren.id'
  }
];

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  mode_simulasi_jam: false,
  jam_simulasi: '12:15',
  suara_notifikasi: true,
  mode_offline: false
};

export const INITIAL_SANTRI: Santri[] = [
  {
    id: 'san-001',
    nama: 'Ahmad Fauzi',
    rfid_uid: '0005265485',
    kelas: 'Kelas 3A',
    kamar: 'Kamar Al-Farabi',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567801',
    tanggal_daftar: '2025-07-10'
  },
  {
    id: 'san-002',
    nama: 'Farhan Rizky',
    rfid_uid: 'A1-B2-C3-D4',
    kelas: 'Kelas 2B',
    kamar: 'Kamar Ibn Sina',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567802',
    tanggal_daftar: '2025-07-10'
  },
  {
    id: 'san-003',
    nama: 'Muhammad Budi',
    rfid_uid: '98-76-54-32',
    kelas: 'Kelas 1A',
    kamar: 'Kamar Al-Ghazali',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567803',
    tanggal_daftar: '2025-07-12'
  },
  {
    id: 'san-004',
    nama: 'Siti Aminah',
    rfid_uid: 'F4-33-21-99',
    kelas: 'Kelas 3B',
    kamar: 'Kamar Khadijah',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567804',
    tanggal_daftar: '2025-07-10'
  },
  {
    id: 'san-005',
    nama: 'Aisyah Zahra',
    rfid_uid: '88-AA-BB-CC',
    kelas: 'Kelas 2A',
    kamar: 'Kamar Aisyah',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567805',
    tanggal_daftar: '2025-07-11'
  },
  {
    id: 'san-006',
    nama: 'Zulfikar Ali',
    rfid_uid: '44-55-66-77',
    kelas: 'Aliyah 10',
    kamar: 'Kamar Al-Farabi',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567806',
    tanggal_daftar: '2024-07-15'
  },
  {
    id: 'san-007',
    nama: 'Candra Kirana',
    rfid_uid: '11-22-33-44',
    kelas: 'Kelas 1C',
    kamar: 'Kamar Ibn Sina',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Sakit',
    status_aktif: true,
    wali_hp: '081234567807',
    tanggal_daftar: '2025-07-15'
  },
  {
    id: 'san-008',
    nama: 'Rizky Pratama',
    rfid_uid: '55-66-77-88',
    kelas: 'Aliyah 11',
    kamar: 'Kamar Al-Ghazali',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567808',
    tanggal_daftar: '2024-07-10'
  },
  {
    id: 'san-009',
    nama: 'Dewi Sartika',
    rfid_uid: '99-88-77-66',
    kelas: 'Kelas 2A',
    kamar: 'Kamar Khadijah',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Izin/Pulang',
    status_aktif: true,
    wali_hp: '081234567809',
    tanggal_daftar: '2025-07-10'
  },
  {
    id: 'san-010',
    nama: 'Fikri Haikal',
    rfid_uid: '77-11-22-33',
    kelas: 'Aliyah 12',
    kamar: 'Kamar Al-Farabi',
    foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567810',
    tanggal_daftar: '2023-07-10'
  },
  {
    id: 'san-011',
    nama: 'Hafiz Ridwan',
    rfid_uid: '33-44-55-66',
    kelas: 'Kelas 3A',
    kamar: 'Kamar Ibn Sina',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567811',
    tanggal_daftar: '2025-07-10'
  },
  {
    id: 'san-012',
    nama: 'Nabila Putri',
    rfid_uid: '12-34-56-78',
    kelas: 'Kelas 1B',
    kamar: 'Kamar Aisyah',
    foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    status_santri: 'Aktif',
    status_aktif: true,
    wali_hp: '081234567812',
    tanggal_daftar: '2025-07-15'
  }
];

// Helper to generate seed tap records for past 14 days
export function generateSeedTapRecords(): TapRecord[] {
  const records: TapRecord[] = [];
  const now = new Date();

  // Create historical logs for the past 14 days
  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];

    INITIAL_SANTRI.forEach((santri) => {
      // Special case: Farhan Rizky skips many meals (Level 3 scenario)
      if (santri.id === 'san-002') {
        if (dayOffset <= 7) {
          // Farhan missed all dinners and most lunches in past week
          // Only tapped morning sometimes
          if (dayOffset % 2 === 0) {
            records.push({
              id: `tap-${dateStr}-pagi-${santri.id}`,
              santri_id: santri.id,
              santri_nama: santri.nama,
              santri_kelas: santri.kelas,
              santri_kamar: santri.kamar,
              santri_foto: santri.foto,
              sesi_id: 'sesi-pagi',
              sesi_nama: 'Sarapan',
              timestamp_tap: `${dateStr}T06:15:00.000Z`,
              status: 'berhasil',
              pesan: 'Silakan Ambil Makan'
            });
          }
          return; // Skip lunch & dinner for Farhan
        }
      }

      // Special case: Candra Kirana was sick past 2 days
      if (santri.id === 'san-007' && dayOffset <= 2) {
        return; // Sick, no tap
      }

      // Special case: Dewi Sartika on home permit (Izin) past 3 days
      if (santri.id === 'san-009' && dayOffset <= 3) {
        return; // Permitted leave
      }

      // Normal attendance (~90% rate)
      const pagiTap = Math.random() < 0.92;
      const siangTap = Math.random() < 0.95;
      const malamTap = Math.random() < 0.90;

      if (pagiTap) {
        records.push({
          id: `tap-${dateStr}-pagi-${santri.id}`,
          santri_id: santri.id,
          santri_nama: santri.nama,
          santri_kelas: santri.kelas,
          santri_kamar: santri.kamar,
          santri_foto: santri.foto,
          sesi_id: 'sesi-pagi',
          sesi_nama: 'Sarapan',
          timestamp_tap: `${dateStr}T06:10:00.000Z`,
          status: 'berhasil',
          pesan: 'Silakan Ambil Makan'
        });
      }

      if (siangTap) {
        records.push({
          id: `tap-${dateStr}-siang-${santri.id}`,
          santri_id: santri.id,
          santri_nama: santri.nama,
          santri_kelas: santri.kelas,
          santri_kamar: santri.kamar,
          santri_foto: santri.foto,
          sesi_id: 'sesi-siang',
          sesi_nama: 'Makan Siang',
          timestamp_tap: `${dateStr}T12:20:00.000Z`,
          status: 'berhasil',
          pesan: 'Silakan Ambil Makan'
        });
      }

      if (malamTap) {
        records.push({
          id: `tap-${dateStr}-malam-${santri.id}`,
          santri_id: santri.id,
          santri_nama: santri.nama,
          santri_kelas: santri.kelas,
          santri_kamar: santri.kamar,
          santri_foto: santri.foto,
          sesi_id: 'sesi-malam',
          sesi_nama: 'Makan Malam',
          timestamp_tap: `${dateStr}T18:15:00.000Z`,
          status: 'berhasil',
          pesan: 'Silakan Ambil Makan'
        });
      }
    });
  }

  return records;
}

export const INITIAL_PERINGATAN: Peringatan[] = [
  {
    id: 'warn-001',
    santri_id: 'san-002',
    santri_nama: 'Farhan Rizky',
    santri_kelas: 'Kelas 2B',
    santri_kamar: 'Kamar Ibn Sina',
    level: 3,
    tanggal_mulai: new Date().toISOString().split('T')[0],
    status: 'aktif',
    deskripsi: 'Darurat! Melewatkan > 7 kali makan dalam 14 hari terakhir. Perlu konseling & pendekatan khusus musyrif.',
    catatan_tindak_lanjut: ''
  },
  {
    id: 'warn-002',
    santri_id: 'san-003',
    santri_nama: 'Muhammad Budi',
    santri_kelas: 'Kelas 1A',
    santri_kamar: 'Kamar Al-Ghazali',
    level: 1,
    tanggal_mulai: new Date().toISOString().split('T')[0],
    status: 'aktif',
    deskripsi: 'Peringatan! Tidak makan 2 sesi berturut-turut hari ini (Sarapan & Makan Siang).',
    catatan_tindak_lanjut: 'Santri mengaku ketiduran saat jam sarapan dan ada tugas kelompok saat makan siang.'
  },
  {
    id: 'warn-003',
    santri_id: 'san-007',
    santri_nama: 'Candra Kirana',
    santri_kelas: 'Kelas 1C',
    santri_kamar: 'Kamar Ibn Sina',
    level: 2,
    tanggal_mulai: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'aktif',
    deskripsi: 'Waspada! Melewatkan > 3 sesi makan dalam 7 hari terakhir.',
    catatan_tindak_lanjut: 'Santri sedang dirawat di pos kesehatan pesantren karena demam.'
  }
];
