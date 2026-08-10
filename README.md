<div align="center">
  <img src="https://img.shields.io/badge/status-production-success?style=for-the-badge" alt="Production Ready" />
  <img src="https://img.shields.io/badge/ai-gemini_2.0_flash-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/deployed-cloudflare_pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License" />
</div>

<br />

<div align="center">
  <h1>🍲 SantriMeal AI</h1>
  <h3>Sistem Presensi Konsumsi Santri Berbasis RFID &amp; AI Analytics untuk Pesantren</h3>
</div>

<br />

---

## 📖 Daftar Isi

- [🎯 Overview](#-overview)
- [✨ Fitur Utama](#-fitur-utama)
- [🧠 AI Capabilities](#-ai-capabilities)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Struktur Proyek](#-struktur-proyek)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Konfigurasi Environment](#️-konfigurasi-environment)
- [🏭 Production Build](#-production-build)
- [☁️ Deployment (Cloudflare Pages)](#️-deployment-cloudflare-pages)
- [📡 API Reference](#-api-reference)
- [📋 Aturan Bisnis](#-aturan-bisnis)
- [👥 User Roles](#-user-roles)
- [🔄 Workflow Sistem](#-workflow-sistem)
- [🎨 UI/UX](#-uiux)
- [🧪 Testing](#-testing)
- [📊 Monitoring](#-monitoring)
- [🤝 Kontribusi](#-kontribusi)
- [📝 License](#-license)

---

## 🎯 Overview

**SantriMeal AI** adalah sistem manajemen konsumsi makan santri berbasis **RFID (Radio-Frequency Identification)** yang terintegrasi dengan **Google Gemini AI** untuk analitik cerdas. Sistem ini dirancang khusus untuk lingkungan **Pesantren** guna memantau kehadiran makan santri secara real-time, mendeteksi anomali pola makan, memberikan peringatan dini risiko kesehatan, dan menghasilkan laporan eksekutif berbasis AI.

### 🎯 Mengapa SantriMeal AI?

| Masalah | Solusi SantriMeal AI |
|---------|---------------------|
| 🍽️ Santri sering melewatkan makan tanpa terpantau | Tap RFID wajib per sesi — tercatat otomatis |
| 📋 Laporan manual rentan error & lambat | AI Executive Summary otomatis per hari/minggu/bulan |
| ⚠️ Tidak ada early warning santri bermasalah | 3-Level Alert System dengan rekomendasi penanganan |
| 📊 Dapur kesulitan estimasi porsi | AI prediksi kebutuhan porsi berdasarkan tren |
| 🔒 Data tidak terpusat | Dashboard real-time untuk Admin & Penjaga Dapur |

---

## ✨ Fitur Utama

### 🔌 Modul RFID Reader (Hardware Interface)
- **Simulasi Tap Kartu** — input manual UID atau auto-detect scanner USB RFID
- **Validasi Real-time** — cek kartu terdaftar, status aktif, sesi makan, anti-duplikat
- **Feedback Visual & Audio** — OLED simulator, LED status, suara beep, TTS Bahasa Indonesia
- **Mode Offline** — queue tap lokal dengan sinkronisasi saat online
- **Mode Simulasi Jam** — uji perilaku sesi makan di luar jam operasional

### 🍳 Dashboard Penjaga Dapur
- **Presensi Real-time** — pantau santri sudah/belum makan per sesi
- **Progress Bar** — persentase kehadiran + counter sudah/belum
- **Filter Canggih** — berdasarkan kamar, kelas, nama, UID, status
- **Auto-Session Detection** — otomatis menampilkan sesi makan aktif

### 🛡️ Dashboard Admin
- **📊 KPI Cards** — Total Santri, Presensi Hari Ini, Peringatan Aktif, Porsi Dilayani
- **🤖 AI Executive Summary** — laporan harian oleh Gemini (analisis, risiko, estimasi porsi)
- **🔮 Prediksi Risiko** — deteksi dini santri berpotensi bermasalah
- **📈 Grafik Tren 7 Hari** — visualisasi batang Sarapan/Siang/Malam
- **👥 Master Data Santri** — CRUD lengkap (nama, RFID UID, kelas, kamar, status, wali)
- **🚨 Sistem Peringatan 3 Level** — Level 1 (Kuning), Level 2 (Oranye), Level 3 (Merah)
- **💳 Manajemen Kartu RFID** — penggantian kartu rusak/hilang, kartu sementara tamu
- **⏱️ Konfigurasi Sesi Makan** — atur jam buka/tutup Sarapan, Siang, Malam
- **📥 Export CSV** — download laporan santri lengkap

### 🤖 AI Assistant Chat
- **Chat Interaktif** — tanya jawab dengan Gemini AI tentang data santri
- **Quick Prompts** — 5 contoh pertanyaan siap pakai (1-klik)
- **Context-Aware** — AI memahami data real-time sistem
- **Bahasa Indonesia** — respons profesional & sopan dengan emoji

---

## 🧠 AI Capabilities

| Endpoint | Model | Fungsi |
|----------|-------|--------|
| `POST /api/gemini/analyze` | Gemini 2.0 Flash | Laporan Eksekutif Harian + Analisis Risiko |
| `POST /api/gemini/chat` | Gemini 2.0 Flash | Asisten Tanya-Jawab Kontekstual |
| `POST /api/gemini/predict-at-risk` | Gemini 2.0 Flash | Deteksi Dini Santri Berisiko (JSON) |

**AI menghasilkan:**
1. 📊 Ringkasan kehadiran sesi makan & evaluasi tren
2. ⚠️ Analisis peringatan santri berisiko prioritas
3. 💡 Rekomendasi tindakan konkret untuk Musyrif & Dapur
4. 🔮 Estimasi kebutuhan porsi makan besok (dengan buffer)
5. 🧬 Deteksi pola anomali individu & prediksi risiko

---

## 🏗️ Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                     PENGGUNA                              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Santri   │  │Penjaga Dapur │  │      Admin       │   │
│  │(Tap RFID) │  │  (Dashboard) │  │(Full Access+AI)  │   │
│  └─────┬─────┘  └──────┬───────┘  └────────┬─────────┘   │
└────────┼────────────────┼──────────────────┼─────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (React 19 + Vite 6)                 │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │RFID Reader  │ │Kitchen Dash  │ │  Admin Dashboard │   │
│  │  Hardware   │ │  (Read-Only) │ │  (AI + CRUD)     │   │
│  └─────────────┘ └──────────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────┐    │
│  │           AI Assistant Chat (Gemini)              │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP REST API
                           ▼
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Express / Cloudflare Functions)     │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐   │
│  │  /api/health │ │/api/gemini/* │ │   SPA Serving   │   │
│  └──────────────┘ └──────┬───────┘ └─────────────────┘   │
│                          │                                │
└──────────────────────────┼────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│              GOOGLE GEMINI AI (2.0 Flash)                 │
│     • generateContent  • System Instruction              │
│     • JSON Output      • Bahasa Indonesia                │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Frontend Framework** | React | 19.0 |
| **Build Tool** | Vite | 6.2 |
| **Language** | TypeScript | 5.8 |
| **Styling** | Tailwind CSS | 4.1 |
| **Charts** | Recharts | 3.10 |
| **Icons** | Lucide React | 0.546 |
| **Animation** | Motion | 12.23 |
| **Backend (Dev)** | Express.js | 4.21 |
| **Backend (Prod)** | Cloudflare Pages Functions | — |
| **AI SDK** | Google GenAI / Gemini REST API | 2.4 / v1beta |
| **Runtime** | Node.js / Cloudflare Workers | ≥18 |
| **Deployment** | Cloudflare Pages | — |

---

## 📂 Struktur Proyek

```
santrimeal-ai/
├── 📄 index.html                    # Entry HTML SPA
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 vite.config.ts                # Vite + Tailwind + React plugin
├── 📄 server.ts                     # Express dev server + Gemini API
├── 📄 metadata.json                 # AI Studio applet metadata
├── 📄 .env.example                  # Template environment variables
│
├── 📁 src/
│   ├── 📄 main.tsx                  # React entry point
│   ├── 📄 App.tsx                   # Root component + state management
│   ├── 📄 index.css                 # Tailwind + custom animations
│   ├── 📄 types.ts                  # TypeScript interfaces & types
│   ├── 📁 components/
│   │   ├── 📄 Header.tsx            # Navigation + clock + simulation
│   │   ├── 📄 RfidReaderHardware.tsx # RFID tap simulator + offline
│   │   ├── 📄 DashboardKitchen.tsx  # Kitchen guard dashboard
│   │   ├── 📄 DashboardAdmin.tsx    # Admin dashboard (5 tabs)
│   │   └── 📄 AiAssistantChat.tsx   # AI chat interface
│   ├── 📁 data/
│   │   └── 📄 mockData.ts           # Seed data + sample records
│   └── 📁 utils/
│       └── 📄 helpers.ts            # Audio, TTS, time, CSV utilities
│
├── 📁 functions/                    # Cloudflare Pages Functions
│   └── 📁 api/
│       ├── 📄 health.ts             # GET /api/health
│       └── 📁 gemini/
│           └── 📄 [[route]].ts      # Catch-all API Gemini routes
│
└── 📁 dist/                         # Production build output
    ├── 📄 index.html
    ├── 📁 assets/
    └── 📄 server.cjs
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18 (rekomendasi: Node 22 LTS)
- **npm** ≥ 9
- **Google Gemini API Key** — [dapatkan di Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone Repository

```bash
git clone https://github.com/kevinadisuryanugraha/santiMeal.git
cd santiMeal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
# Copy template environment
cp .env.example .env

# Edit .env — masukkan Gemini API key Anda
# GEMINI_API_KEY="your-api-key-here"
# APP_URL="http://localhost:3000"
```

### 4. Run Development Server

```bash
npm run dev
```

Buka browser di **http://localhost:3000** 🎉

---

## ⚙️ Konfigurasi Environment

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `GEMINI_API_KEY` | ✅ Ya | — | Google Gemini API Key untuk AI features |
| `APP_URL` | Tidak | `http://localhost:3000` | URL aplikasi |
| `PORT` | Tidak | `3000` | Port server (production) |
| `NODE_ENV` | Tidak | `development` | Environment mode |

---

## 🏭 Production Build

```bash
# 1. Set environment production
export NODE_ENV=production
export GEMINI_API_KEY="your-real-api-key"

# 2. Build frontend + server
npm run build

# 3. Start production server
npm start
```

Build output:
```
dist/
├── index.html              # SPA entry
├── assets/
│   ├── index-*.js          # Bundled React app (~680KB)
│   └── index-*.css         # Tailwind CSS (~43KB)
└── server.cjs              # Compiled Express server (CJS)
```

---

## ☁️ Deployment (Cloudflare Pages)

### Live URL
🔗 **[https://shiny-frog-3971.pages.dev](https://shiny-frog-3971.pages.dev)**

### Deploy Command

```bash
# Set credentials
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"

# Build
npm run build

# Set Gemini API key as secret
echo "your-api-key" | npx wrangler pages secret put GEMINI_API_KEY \
  --project-name shiny-frog-3971

# Deploy
npx wrangler pages deploy dist \
  --project-name shiny-frog-3971 \
  --branch main
```

**Catatan:** Functions di direktori `functions/` otomatis terdeteksi dan dideploy sebagai Cloudflare Pages Functions.

---

## 📡 API Reference

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "app": "SantriMeal AI"
}
```

---

### AI Daily Analysis

```http
POST /api/gemini/analyze
Content-Type: application/json

{
  "stats": {
    "totalSantri": 12,
    "pagiCount": 8,
    "pagiPercent": 67,
    "siangCount": 10,
    "siangPercent": 83,
    "malamCount": 9,
    "malamPercent": 75,
    "level1Count": 1,
    "level2Count": 1,
    "level3Count": 1
  },
  "alerts": [...],
  "recentTapSummary": [...]
}
```

**Response:**
```json
{
  "result": "📊 Ringkasan Kehadiran...\n⚠️ Analisis Peringatan...\n💡 Rekomendasi..."
}
```

---

### AI Chat Assistant

```http
POST /api/gemini/chat
Content-Type: application/json

{
  "message": "Buatkan laporan ringkasan konsumsi makan santri hari ini.",
  "contextData": {
    "totalSantri": 12,
    "activeAlerts": [...]
  }
}
```

**Response:**
```json
{
  "reply": "Assalamu'alaikum! Berikut laporan ringkasan konsumsi..."
}
```

---

### AI Risk Prediction

```http
POST /api/gemini/predict-at-risk
Content-Type: application/json

{
  "santriList": [...],
  "recentRecords": [...]
}
```

**Response:**
```json
{
  "atRiskSantri": [
    {
      "nama": "Farhan Rizky",
      "kelas": "Kelas 2B",
      "alasan": "Melewatkan >7 kali makan dalam 14 hari",
      "tingkatRisiko": "Tinggi",
      "saranPengurus": "Musyrif segera lakukan pengecekan langsung"
    }
  ],
  "ringkasanUmum": "Kondisi konsumsi nutrisi santri secara menyeluruh..."
}
```

---

## 📋 Aturan Bisnis

### Sesi Makan (3x Sehari)

| Sesi | Jam Buka | Jam Tutup |
|------|----------|-----------|
| 🥣 Sarapan | 05:00 | 07:30 |
| 🍲 Makan Siang | 11:30 | 13:30 |
| 🍱 Makan Malam | 17:30 | 20:00 |

### Aturan Tap RFID

- ✅ Setiap santri hanya boleh **1 kali tap per sesi makan**
- ❌ Tap di **luar jam sesi** ditolak otomatis
- ❌ Kartu **nonaktif** atau **tidak terdaftar** ditolak
- 🔄 Mode **Offline** — tap disimpan lokal, disinkronkan saat online

### Sistem Peringatan 3 Level

| Level | Warna | Kriteria | Tindakan |
|-------|-------|----------|----------|
| 🟡 **Level 1** | Kuning | ≥ 2 sesi berturut-turut terlewat | Cek ringan oleh Musyrif Kamar |
| 🟠 **Level 2** | Oranye | > 3 makan terlewat dalam 7 hari | Pemantauan khusus & wawancara |
| 🔴 **Level 3** | Merah | > 7 makan terlewat dalam 14 hari | **Darurat!** Intervensi kesehatan segera |

---

## 👥 User Roles

| Role | Hak Akses | Dashboard |
|------|-----------|-----------|
| 🛡️ **Admin** | Full access — Master data, laporan, AI, konfigurasi | Admin Dashboard (5 tab) |
| 🍳 **Penjaga Dapur** | Read-only — Pantau presensi real-time | Kitchen Dashboard |
| 🧑‍🎓 **Santri** | Tap RFID only — Tidak ada akses dashboard | — |

---

## 🔄 Workflow Sistem

```
1. Santri tap kartu RFID di reader dapur
       │
       ▼
2. Sistem validasi:
   ├── Kartu terdaftar? ──── Tidak ──→ ❌ DITOLAK
   ├── Status aktif? ─────── Tidak ──→ ❌ DITOLAK  
   ├── Dalam jam sesi? ───── Tidak ──→ ❌ DITOLAK (di luar jam)
   └── Sudah tap sesi ini? ── Ya ────→ ❌ DUPLIKAT
       │
       ▼ SUCCESS
3. Catat tap + Update presensi real-time
       │
       ▼
4. Trigger Alert System:
   └── Evaluasi aturan Level 1/2/3
       │
       ▼
5. Dashboard terupdate:
   ├── Kitchen: Progress bar + daftar santri
   └── Admin: KPI + chart + alert
       │
       ▼
6. Admin generate AI Report:
   └── Gemini analisis → Rekomendasi konkret
```

---

## 🎨 UI/UX

### Color Palette

| Warna | Hex | Penggunaan |
|-------|-----|------------|
| 🏴 Dark | `#2B2824` | Header, footer, text utama |
| 🥮 Tan | `#CFAB8D` | Primary button, highlight, progress |
| 🌫️ Sand | `#D9C4B0` | Border, muted text |
| 🥛 Cream | `#ECEEDF` | Card background, input fields |
| ☁️ Sky | `#BBDCE5` | Accent, time display, info badges |

### Responsive Design

- 📱 **Mobile-first** — semua halaman responsif
- 🖥️ **Desktop** — max-width `7xl` (1280px)
- 📐 **Grid System** — Tailwind responsive grid
- 👆 **Touch-friendly** — minimum tap target 44px

---

## 🧪 Testing

```bash
# Type check
npx tsc --noEmit

# Production build check
npm run build

# Lint (jika ada ESLint config)
npm run lint
```

**Test Coverage:**
- ✅ TypeScript strict compilation — **0 errors**
- ✅ Vite production build — **clean**
- ✅ Cloudflare deployment — **verified**
- ✅ API endpoints — **4/4 working**
- ✅ Gemini AI — **all 3 endpoints responding**
- ✅ Offline mode — **localStorage queue + sync**
- ✅ Alert system — **3-level evaluation with dedup**

---

## 📊 Monitoring

### Health Endpoint

```bash
curl https://shiny-frog-3971.pages.dev/api/health
# → {"status":"ok","app":"SantriMeal AI"}
```

### Status Footer (Real-time)

Footer di setiap halaman menampilkan:
- 🟢 Status sistem: **SANTRI MEAL RFID LIVE ENGINE**
- 📊 **TAPS TODAY** — jumlah tap berhasil hari ini
- 👥 **SANTRI** — total santri aktif
- 🌐 **SISTEM: ONLINE**

---

## 🤝 Kontribusi

1. **Fork** repository
2. Buat branch fitur: `git checkout -b fitur/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: deskripsi fitur'`
4. Push ke branch: `git push origin fitur/nama-fitur`
5. Buat **Pull Request**

### Commit Convention

| Prefix | Usage |
|--------|-------|
| `feat:` | Fitur baru |
| `fix:` | Bug fix |
| `docs:` | Dokumentasi |
| `style:` | Formatting, CSS |
| `refactor:` | Refactor kode |
| `test:` | Testing |
| `chore:` | Build, dependencies |

---

## 📝 License

MIT © 2026 — **Arsitektur Digital Pesantren**

---

<div align="center">
  <br />
  <p>
    <strong>SantriMeal AI</strong> — Menjaga nutrisi santri, membangun generasi pesantren yang sehat & cerdas.
  </p>
  <p>
    <sub>Powered by Google Gemini AI • Deployed on Cloudflare Pages</sub>
  </p>
</div>
