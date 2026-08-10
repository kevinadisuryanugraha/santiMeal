export type Role = 'admin' | 'penjaga_dapur';

export type StatusSantri = 'Aktif' | 'Nonaktif' | 'Sakit' | 'Izin/Pulang';

export interface Santri {
  id: string;
  nama: string;
  rfid_uid: string;
  kelas: string; // e.g. 'Kelas 1A', 'Kelas 2B', 'Aliyah 10'
  kamar: string; // e.g. 'Kamar Al-Farabi', 'Kamar Ibn Sina'
  foto?: string;
  status_santri: StatusSantri;
  status_aktif: boolean;
  wali_hp?: string;
  tanggal_daftar: string;
}

export interface SesiMakan {
  id: string;
  nama_sesi: 'Sarapan' | 'Makan Siang' | 'Makan Malam';
  jam_buka: string; // e.g. '05:00'
  jam_tutup: string; // e.g. '07:30'
  aktif: boolean;
  keterangan?: string;
}

export type StatusTap = 'berhasil' | 'ditolak_duplikat' | 'ditolak_diluar_jam' | 'ditolak_kartu_nonaktif';

export interface TapRecord {
  id: string;
  santri_id: string;
  santri_nama: string;
  santri_kelas: string;
  santri_kamar: string;
  santri_foto?: string;
  sesi_id: string;
  sesi_nama: string;
  timestamp_tap: string; // ISO string
  status: StatusTap;
  pesan?: string;
}

export type LevelPeringatan = 1 | 2 | 3;

export interface Peringatan {
  id: string;
  santri_id: string;
  santri_nama: string;
  santri_kelas: string;
  santri_kamar: string;
  level: LevelPeringatan;
  tanggal_mulai: string;
  status: 'aktif' | 'ditangani';
  deskripsi: string;
  catatan_tindak_lanjut?: string;
  tanggal_ditangani?: string;
}

export interface UserAccount {
  id: string;
  nama: string;
  role: Role;
  email: string;
}

export interface SystemConfig {
  mode_simulasi_jam: boolean;
  jam_simulasi: string; // 'HH:mm' format e.g. '12:00'
  suara_notifikasi: boolean;
  mode_offline: boolean;
}

export interface AIReportResult {
  summary: string;
  anomalies: string[];
  recommendations: string[];
  atRiskSantri: {
    nama: string;
    kelas: string;
    alasan: string;
    tingkatRisiko: 'Tinggi' | 'Sedang' | 'Rendah';
    saranPengurus: string;
  }[];
}
