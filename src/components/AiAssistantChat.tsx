import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, RefreshCw } from 'lucide-react';
import { Santri, SesiMakan, TapRecord, Peringatan } from '../types';

interface AiAssistantChatProps {
  santriList: Santri[];
  sesiList: SesiMakan[];
  tapRecords: TapRecord[];
  peringatanList: Peringatan[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantChat: React.FC<AiAssistantChatProps> = ({
  santriList,
  sesiList,
  tapRecords,
  peringatanList
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: 'Assalamu\'alaikum! Saya **SantriMeal AI**, asisten kecerdasan buatan untuk sistem konsumsi santri pesantren. Ada yang bisa saya bantu terkait laporan presensi, analisa tren makan, atau rekomendasi penanganan santri hari ini?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const samplePrompts = [
    'Buatkan laporan ringkasan konsumsi makan santri hari ini.',
    'Tampilkan daftar santri dengan peringatan aktif dan rekomendasi penanganannya.',
    'Analisis tren makan minggu ini (Sarapan, Siang, Malam). Berikan poin evaluasinya.',
    'Santri bernama Farhan Rizky sering melewatkan makan malam. Bagaimana cara musyrif mendekatinya?',
    'Berdasarkan tren 7 hari terakhir, estimasikan berapa porsi makan siang besok yang perlu dimasak dapur.'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextData: {
            totalSantri: santriList.length,
            santriSample: santriList.slice(0, 10),
            sesiList,
            recentTapsCount: tapRecords.length,
            activeAlerts: peringatanList.filter(p => p.status === 'aktif')
          }
        })
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Maaf, saya tidak dapat merespons pesan Anda saat ini.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      console.error('Chat error:', e);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: '⚠️ Terjadi kesalahan saat menghubungkan ke layanan AI. Silakan coba beberapa saat lagi.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#CFAB8D] text-[#2B2824] flex items-center justify-center shadow font-black shrink-0">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-lg sm:text-2xl font-black text-[#2B2824] font-display uppercase tracking-tight truncate">
                SantriMeal <span className="text-[#CFAB8D]">AI Assistant</span>
              </h2>
              <span className="bg-[#CFAB8D]/20 text-[#2B2824] text-[9px] sm:text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#D9C4B0] font-bold shrink-0">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#635C55] mt-0.5 line-clamp-2 sm:line-clamp-none">
              Asisten AI Cerdas untuk Analisis Konsumsi Santri, Deteksi Risiko, dan Konsultasi Musyrif
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Cards */}
      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs font-bold text-[#2B5261] flex items-center space-x-1.5 uppercase tracking-widest font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#2B5261] shrink-0" />
          <span>CONTOH PERTANYAAN CEPAT (KLIK UNTUK MENGIRIM):</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-left bg-[#FFFFFF] hover:bg-[#ECEEDF] border border-[#D9C4B0] hover:border-[#CFAB8D] p-3 sm:p-3.5 rounded-2xl text-[11px] sm:text-xs text-[#2B2824] transition-all shadow hover:scale-[1.01] font-sans"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-[#FFFFFF] border border-[#D9C4B0] rounded-3xl p-4 sm:p-6 shadow-md min-h-[380px] sm:min-h-[440px] flex flex-col justify-between space-y-4">
        <div className="space-y-3 sm:space-y-4 max-h-[450px] sm:max-h-[500px] overflow-y-auto no-scrollbar pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 sm:space-x-3 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs shadow ${
                  msg.sender === 'user' ? 'bg-[#2B2824] text-[#ECEEDF]' : 'bg-[#CFAB8D] text-[#2B2824]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-3 sm:p-4 text-[11px] sm:text-xs leading-relaxed shadow ${
                  msg.sender === 'user'
                    ? 'bg-[#CFAB8D] text-[#2B2824] font-bold'
                    : 'bg-[#ECEEDF] border border-[#D9C4B0] text-[#2B2824] whitespace-pre-line font-mono'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[9px] sm:text-[10px] mt-1.5 text-right uppercase tracking-wider font-mono ${msg.sender === 'user' ? 'text-[#2B2824]/80' : 'text-[#635C55]'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#CFAB8D] text-[#2B2824] flex items-center justify-center font-bold shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#ECEEDF] border border-[#D9C4B0] rounded-2xl p-3 sm:p-4 text-[11px] sm:text-xs text-[#2B2824] font-mono flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#2B5261] shrink-0" />
                <span className="uppercase tracking-widest font-bold">SantriMeal AI sedang menganalisis data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 sm:pt-4 border-t border-[#D9C4B0]/60 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ketik pertanyaan atau minta analisis AI..."
            className="flex-1 bg-[#ECEEDF]/60 border border-[#D9C4B0] text-[#2B2824] px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-2xl text-[11px] sm:text-xs focus:outline-none focus:border-[#CFAB8D] font-mono min-h-[44px]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 sm:px-6 py-3 sm:py-3.5 bg-[#CFAB8D] hover:bg-[#c49a78] disabled:opacity-50 text-[#2B2824] font-black text-[11px] sm:text-xs uppercase tracking-widest rounded-2xl transition-all shadow flex items-center space-x-1.5 shrink-0 min-h-[44px]"
          >
            <span>Kirim</span>
            <Send className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
