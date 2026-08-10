const GEMINI_API_KEY = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';

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

// ── Helpers ──────────────────────────────────────────────

function reply(data: any, status = 200, extra?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extra || {}) },
  });
}

const CORS = { 'Access-Control-Allow-Origin': '*' };

async function callGemini(prompt: string, responseJson?: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.7,
      ...(responseJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.error?.message || 'Gemini API error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Route Handler ────────────────────────────────────────

export const onRequest = async (context: any) => {
  const { request, params } = context;
  const route = Array.isArray(params.route) ? params.route.join('/') : (params.route || '');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405, CORS);
  if (!GEMINI_API_KEY) return reply({ error: 'GEMINI_API_KEY not configured' }, 500, CORS);

  try {
    const body = (await request.json()) as any;

    // ── /api/gemini/analyze ──
    if (route === 'analyze') {
      const { stats, alerts, recentTapSummary } = body;
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
      const result = await callGemini(prompt);
      return reply({ result }, 200, CORS);
    }

    // ── /api/gemini/chat ──
    if (route === 'chat') {
      const { message, contextData } = body;
      const fullPrompt = `
Konteks Data Santri & Sistem Saat Ini:
${JSON.stringify(contextData || {}, null, 2)}

Pertanyaan/Instruksi dari Pengguna:
${message}
      `;
      const result = await callGemini(fullPrompt);
      return reply({ reply: result }, 200, CORS);
    }

    // ── /api/gemini/predict-at-risk ──
    if (route === 'predict-at-risk') {
      const { santriList, recentRecords } = body;
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
      const raw = await callGemini(prompt, 'application/json');
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return reply(JSON.parse(cleaned), 200, CORS);
    }

    return reply({ error: `Unknown route: ${route}` }, 404, CORS);
  } catch (error: any) {
    return reply({ error: error.message || 'Internal error' }, 500, CORS);
  }
};
