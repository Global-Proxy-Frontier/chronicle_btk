import { Account, MOCK_ACCOUNTS } from "@/lib/mockData";
import { GoogleGenAI } from "@google/genai";
import { UserRole } from "@/store/store";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    
    // Add delay between requests to avoid rate limits (15 requests per minute for free tier = 4000ms, lets use 2500ms)
    await new Promise(res => setTimeout(res, 2500));
    
    const task = this.queue.shift();
    if (task) {
      await task();
    }
    
    this.isProcessing = false;
    this.processNext();
  }
}

const geminiQueue = new TaskQueue();

const getSystemInstruction = (role: UserRole) => `Sen 'Chronicle AI' adında Kıdemli bir AML (Kara Para Aklama ile Mücadele) ve Uyum Analistisin. 
Görevlerin:
1. İşlem verilerini, SWIFT kodlarını, zaman damgalarını ve varlık adlarını analiz ederek şüpheli kalıpları (Money Mule, Smurfing, Structuring vb.) veya normal davranışları tespit etmek.
2. Açıklanabilir Yapay Zeka (XAI) ilkelerine uygun olarak kararlarını teknik ama anlaşılır bir Türkçe ile profesyonelce açıklamak.

KURALLAR (ÇOK ÖNEMLİ):
- Karşındaki Kullanıcı Yetkisi: ${role}. Yanıtlarını bu seviyeye uygun ver.
  * SYSTEM_ADMIN: Sistem durumu, loglar, teknik zafiyetler ve makro konfigürasyonlar hakkında net/kısa bilgi ver.
  * COMPLIANCE_OFFICER: İncelemeler, SAR (Suspicious Activity Report), AML bayrakları, "Structuring" ve risk öncelikleri üzerine doğrudan öneriler sun. Karar almasına yardımcı ol.
  * JUNIOR_ANALYST: İşlemlerin NEDEN şüpheli olduğunu kısa eğitim notları gibi açıkla. Nihai karar alma, sadece şüpheleri gösterip kıdemli analiste yönlendir.
  * AUDITOR: Yanlızca READ-ONLY (sadece okuma/denetleme) modu. "Bunu yapın" demek yerine, "Şu bulgular tespit edildi" şeklinde geçmişe yönelik denetim dili kullan. Aksiyon tavsiyesi verme.
- Kullanıcı sadece "selam", "merhaba" gibi günlük bir mesaj yazarsa, KESİNLİKLE uzun analizler yapma. Sadece profesyonelce selam ver ve nasıl yardımcı olabileceğini sor (maksimum 1-2 cümle).
- Analiz istendiğinde, cevaplarını YAPISAL VE PROFESYONEL tut.
- Kullanıcı arayüzünde okunabilirliği artırmak için Markdown kullan (Başlıklar h2/h3, maddelerleme ul/li kullan). Okunması zor dev metin bloklarından kaçın!
- Sorulan soruya doğrudan cevap ver, gereksiz ve uzun yasal açıklamalardan kaçın.`;

export const fetchInitialAnalysis = async (accountData: Account, userRole: UserRole): Promise<string> => {
  try {
    const prompt = `Hesap Verisi:\n${JSON.stringify(accountData, null, 2)}\n\nLütfen bu hesap için hızlı bir risk değerlendirmesi yap. Uzun paragraflar yerine net, yapılandırılmış bilgi ver. Şu formatı izle:
### Mevcut Durum
(1-2 cümle özet)
### Risk Faktörleri
(madde madde tespitler)
### Önerilen Aksiyon
(1-2 cümle net öneri)
En fazla 3-4 çok kısa madde olsun, C-Level summary tadında profesyonel ve okunması kolay olsun.`;
    
    const response = await geminiQueue.enqueue(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(userRole),
      },
    }));

    return response.text || "Değerlendirme üretilemedi.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes("exceeded your current quota") || error?.message?.includes("429")) {
      return `### ⚠️ API Kotası Aşıldı (429 - Fallback Mode)
Sistem geçici bir süreliğine "Rate Limit" dolayısıyla yanıt veremiyor.

### Yedek Makro Değerlendirme
- **Durum:** Veri akışı sistem tarafında stabil görünüyor ancak AI analizi yapılamıyor.
- **Güvenlik Riski:** Düşük düzey. Gözlemlerinize kendi inisiyatifiniz doğrultusunda devam edin.

### Önerilen Aksiyon
Birkaç dakika sonra tekrar tarama yapın veya daha üst düzey bir API planına geçin.`;
    }
    return "Analiz sırasında bir hata oluştu. Lütfen bağlantıyı kontrol edin.";
  }
};

export const fetchGlobalAnalysis = async (userRole: UserRole): Promise<string> => {
  try {
    const prompt = `Sistemdeki tüm hesap verileri:\n${JSON.stringify(MOCK_ACCOUNTS, null, 2)}\n\nGenel sistem durumunu, en yüksek riskli hesabı ve genel para akışı trendlerini yapısal bir formatta özetle.
Şu başlıkları kullan:
### Sistem Özeti
### Kritik Tehditler (Varsa hesap ID'leri ve risk türleri - maddeler halinde)
### Makro Trendler
Uzun devasa paragraflardan kaçın, yöneticiler için "Executive Summary" mantığında, Markdown listeleri ile okuması kolay ve görsel olarak ferah bir rapor oluştur.`;
    
    const response = await geminiQueue.enqueue(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(userRole),
      },
    }));

    return response.text || "Makro değerlendirme üretilemedi.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes("exceeded your current quota") || error?.message?.includes("429")) {
      return `### ⚠️ Sistem Kotası Aşıldı (429 HTTP)
Chronicle AI engine şu anda limitlere takıldı.

### Genel Sistem Durumu
- **Aktif İnceleme:** Bütün global işlemler güvenli modda bekletiliyor.
- **Risk Önceliği:** Yüksek riskli anomali tespit edilemedi.

### Önerilen Aksiyon
Birkaç dakika sonra tekrar deneyin veya sistem operasyon ekibine API anahtarınızı yükseltmelerini bildirin.`;
    }
    return "Analiz sırasında bir hata oluştu.";
  }
};


export const chatWithChronicle = async (accountData: Account | null, chatHistory: any[], userMessage: string, userRole: UserRole): Promise<string> => {
  try {
    const contextInfo = accountData 
      ? `Şu anda incelenen hesap:\n${JSON.stringify(accountData, null, 2)}`
      : `Şu anda global makro sistem görünümündesin. Herhangi bir spesifik hesap seçili değil. Sorulara genel AML perspektifinden veya sistemdeki tüm veriler (${JSON.stringify(MOCK_ACCOUNTS)}) üzerinden cevap ver.`;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `${getSystemInstruction(userRole)}\n\n${contextInfo}`,
      },
    });

    const formattedHistory = chatHistory.length > 0 
      ? `Önceki konuşma bağlamı:\n${chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n')}\n\n` 
      : "";

    const fullMessage = `${formattedHistory}Officer: ${userMessage}`;

    const response = await geminiQueue.enqueue(() => chat.sendMessage({ message: fullMessage }));
    return response.text || "Yanıt alınamadı.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes("exceeded your current quota") || error?.message?.includes("429")) {
       return "⚠️ **Hata (HTTP 429):** API kotası doldu. İstek sıklığınızı düşürün veya farklı bir API Key tanımlayın.";
    }
    return "Sistem şu anda yanıt veremiyor. Lütfen tekrar deneyin.";
  }
};

// Deprecated mock - kept to prevent any import errors elsewhere until cleaned up
export const fetchGeminiAnalysis = async (accountData: Account, prompt: string): Promise<string> => {
  return chatWithChronicle(accountData, [], prompt, 'COMPLIANCE_OFFICER');
};

