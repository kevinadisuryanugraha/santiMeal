import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid crashes if GEMINI_API_KEY is not set initially
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `
Kamu adalah AI Assistant untuk Sistem Konsumsi Santri berbasis RFID di lingkungan pesantren. Nama sistem ini adalah "SantriMeal AI".
=== KONTEKS SISTEM ===
Sistem ini mencatat kehadiran makan santri melalui tap kartu RFID pada 3 sesi harian:
- Sarapan (Pagi): 05:00 - 07:30
- Makan Siang: 11:30 - 13:30
- Makan Malam: 17:30 - 20:00
=== PENGGUNA SISTEM ===
1. SANTRI: pengguna kartu RFID, tidak punya akses dashboard.
2. PENJAGA DAPUR: melihat data real-time per sesi makan.
3. ADMIN: akses penuh, master data, laporan, dan konfigurasi.
=== ATURAN BISNIS UTAMA ===
- Setiap santri hanya boleh tap 1 kali per sesi makan.
- Tap di luar jam sesi ditolak otomatis oleh sistem.
- Santri yang tidak makan >= 2 sesi berturut-turut mendapat peringatan Level 1 (Kuning).
- Santri yang melewatkan > 3 makan dalam 7 hari mendapat peringatan Level 2 (Oranye).
- Santri yang melewatkan > 7 makan dalam 14 hari mendapat peringatan Level 3 (Red/Darurat).
=== TUGAS UTAMA AI ===
1. ANALISIS DATA: Interpretasikan data kehadiran makan dan identifikasi pola anomali.
2. GENERATE LAPORAN: Buat ringkasan harian, mingguan, dan bulanan dalam bahasa Indonesia yang jelas.
3. DETEKSI RISIKO: Identifikasi santri yang berisiko bermasalah dari pola makannya.
4. REKOMENDASI: Berikan saran tindakan konkret untuk admin dan musyrif.
5. JAWAB PERTANYAAN: Bantu admin dan penjaga dapur memahami data dengan bahasa sederhana.
6. ALERT SUMMARY: Rangkum semua peringatan aktif dan prioritaskan penanganannya.
=== FORMAT RESPONS ===
- Gunakan bahasa Indonesia yang sopan dan profesional.
- Sertakan emoji relevan untuk memudahkan pembacaan cepat.
- Untuk laporan: gunakan struktur yang terorganisir dengan header yang jelas.
- Untuk peringatan: selalu sertakan nama santri, level peringatan, dan rekomendasi tindakan.
- Untuk analisis: sertakan angka konkret dan persentase.
=== BATASAN ===
- Jangan pernah mengubah data — kamu hanya menganalisis dan melaporkan.
- Jaga privasi santri: jangan tampilkan data individual di laporan yang tidak perlu.
`;

// Helper to extract a clean error message from Gemini SDK errors
function extractErrorMessage(error: any): string {
  try {
    // Gemini SDK often wraps errors as JSON strings inside error.message
    if (typeof error.message === 'string') {
      const parsed = JSON.parse(error.message);
      if (parsed?.error?.message) return parsed.error.message;
    }
    return error.message || 'Unknown error';
  } catch {
    return error.message || 'Terjadi kesalahan pada layanan AI.';
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SantriMeal AI' });
});

// Endpoint: AI Daily Analysis & Summary
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { stats, alerts, recentTapSummary } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Berikut adalah data kehadiran makan santri pesantren hari ini:
- Total Santri: ${stats.totalSantri}
- Hadir Sarapan: ${stats.pagiCount} (${stats.pagiPercent}%)
- Hadir Makan Siang: ${stats.siangCount} (${stats.siangPercent}%)
- Hadir Makan Malam: ${stats.malamCount} (${stats.malamPercent}%)
- Jumlah Peringatan Aktif: Level 1 (${stats.level1Count}), Level 2 (${stats.level2Count}), Level 3 (${stats.level3Count})

Daftar Peringatan Aktif:
${JSON.stringify(alerts, null, 2)}

Ringkasan Tap Sesi Aktif:
${JSON.stringify(recentTapSummary, null, 2)}

Mohon buatkan Laporan Eksekutif Konsumsi Santri Hari Ini dan Analisis Risiko dengan struktur:
1. 📊 Ringkasan Kehadiran Sesi Makan & Evaluasi Tren
2. ⚠️ Analisis Peringatan Santri Berisiko (Sebutkan Santri Level 3 / Level 2 khusus)
3. 💡 Rekomendasi Tindakan Konkret untuk Pengurus/Musyrif & Tim Dapur
4. 🔮 Estimasi Kebutuhan Porsi Makan Besok
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text || 'Tidak dapat menghasilkan analisis AI.' });
  } catch (error: any) {
    console.error('Gemini Analyze API Error:', error);
    res.status(500).json({ error: extractErrorMessage(error) || 'Gagal menghasilkan analisis AI.' });
  }
});

// Endpoint: AI Chat Assistant
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, contextData } = req.body;
    const ai = getGeminiClient();

    const fullPrompt = `
Konteks Data Santri & Sistem Saat Ini:
${JSON.stringify(contextData || {}, null, 2)}

Pertanyaan/Instruksi dari Pengguna:
${message}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text || 'Maaf, saya tidak dapat merespons pertanyaan saat ini.' });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    res.status(500).json({ error: extractErrorMessage(error) || 'Terjadi kesalahan pada layanan AI.' });
  }
});

// Endpoint: AI At-Risk Prediction & Actions
app.post('/api/gemini/predict-at-risk', async (req, res) => {
  try {
    const { santriList, recentRecords } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Analisis data riwayat makan santri berikut untuk mengidentifikasi santri mana yang mulai mengalami kecenderungan jarang makan (pola anomali) dan berikan saran penanganan:

Data Santri Sample:
${JSON.stringify(santriList, null, 2)}

Riwayat Tap Terakhir:
${JSON.stringify(recentRecords, null, 2)}

Berikan output JSON terstruktur dengan format:
{
  "atRiskSantri": [
    {
      "nama": "Nama Santri",
      "kelas": "Kelas",
      "alasan": "Alasan detail kenapa dianggap berisiko",
      "tingkatRisiko": "Tinggi" | "Sedang" | "Rendah",
      "saranPengurus": "Langkah konkret musyrif/pengurus"
    }
  ],
  "ringkasanUmum": "Deskripsi singkat kondisi konsumsi nutrisi santri secara menyeluruh"
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atRiskSantri: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING },
                  kelas: { type: Type.STRING },
                  alasan: { type: Type.STRING },
                  tingkatRisiko: { type: Type.STRING },
                  saranPengurus: { type: Type.STRING },
                },
                required: ['nama', 'kelas', 'alasan', 'tingkatRisiko', 'saranPengurus'],
              },
            },
            ringkasanUmum: { type: Type.STRING },
          },
          required: ['atRiskSantri', 'ringkasanUmum'],
        },
      },
    });

    const rawText = response.text || '{}';
    const jsonStr = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini At-Risk API Error:', error);
    res.status(500).json({ error: extractErrorMessage(error) || 'Gagal memprediksi risiko santri.' });
  }
});

// Vite & Express Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SantriMeal AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
