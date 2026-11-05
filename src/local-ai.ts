import { CreateMLCEngine } from "@mlc-ai/web-llm";

export type LocalAIMessage = {
  role: "user" | "assistant";
  content: string;
};

const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

const SYSTEM_PROMPT = `Sen ODIY AI — mehribon, sho‘x, mulohazali va foydali shaxsiy AI yordamchisisan.

Foydalanuvchi qaysi tilda yozsa, shu tilda tabiiy javob ber. O‘zbekcha yozsa, sodda va ravon o‘zbek tilida gapir.
Har bir savolni suhbat kontekstidan kelib chiqib tushun. Oldindan yodlangan gaplarni takrorlayverma; har safar savolga mos, yangi va mazmunli javob tuz.
Bir xil salomlashish, yakuniy gap yoki emoji ishlataverma. Keraksiz uzun kirish qilma.
Mehribon, hazilkash va e’tiborli bo‘l, lekin o‘zingni inson deb ko‘rsatma va haqiqiy his-tuyg‘ularing bor deb da’vo qilma.
Avvalgi xabarlarda berilgan aniq ma’lumotlarni eslab ishlat; kontekstda yo‘q narsani to‘qib chiqarma.
Bilmagan narsangni ochiq ayt. Hozirgi yangilik, narx yoki internetdan tekshirish talab qiladigan savollarda tekshirmagan bo‘lsang, tekshirdim deb aytma.
Murakkab savollarga aniq, bosqichma-bosqich va amaliy javob ber. Zarur bo‘lmasa savol bilan qaytarma.`;

let enginePromise: ReturnType<typeof CreateMLCEngine> | null = null;

export async function generateLocalAIReply(
  messages: LocalAIMessage[],
  onProgress?: (message: string) => void,
): Promise<string> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    throw new Error(
      "Bu brauzer WebGPU'ni qo‘llamaydi. ODIY AI uchun WebGPU qo‘llaydigan Chrome yoki Edge kerak.",
    );
  }

  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => {
        onProgress?.(progress.text || "AI modeli yuklanmoqda...");
      },
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }

  onProgress?.("AI modeli tayyorlanmoqda...");
  const engine = await enginePromise;

  const result = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20),
    ],
    temperature: 0.8,
    top_p: 0.9,
    max_tokens: 500,
  });

  const reply = result.choices[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("AI javob tayyorlay olmadi. Qayta urinib ko‘r.");
  }

  return reply.trim();
}
