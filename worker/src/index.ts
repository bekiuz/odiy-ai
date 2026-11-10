interface Env { GEMINI_API_KEY: string }
type ChatMessage = { role: "user" | "assistant"; content: string };
const SYSTEM_PROMPT = "You are ODIY AI, a friendly and practical English tutor specialising in IELTS. Reply in the language the learner uses unless they ask otherwise. Correct English naturally, explain mistakes simply, give IELTS-aware feedback for Reading, Listening, Writing and Speaking, and finish with one practical next step. Never claim to provide an official IELTS score.";

function cors(origin: string | null) {
  const allowed = new Set(["https://bekiuz.github.io", "http://localhost:5173", "http://127.0.0.1:5173"]);
  const allowOrigin = origin && allowed.has(origin) ? origin : "https://bekiuz.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(origin) } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "POST") return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405, origin);
    if (!env.GEMINI_API_KEY) return json({ error: "Gemini API kaliti Worker’da sozlanmagan." }, 503, origin);

    let body: { messages?: ChatMessage[] };
    try { body = await request.json() as { messages?: ChatMessage[] }; }
    catch { return json({ error: "So‘rov JSON formatida bo‘lishi kerak." }, 400, origin); }

    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 20) {
      return json({ error: "Xabarlar ro‘yxati noto‘g‘ri." }, 400, origin);
    }
    const messages = body.messages;
    const valid = messages.every((item) =>
      item && (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" && item.content.trim().length > 0 && item.content.length <= 4000
    );
    if (!valid) return json({ error: "Xabar formati noto‘g‘ri yoki juda uzun." }, 400, origin);

    const contents = messages.slice(-12).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    }));
    try {
      const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.35, maxOutputTokens: 1200 },
        }),
      });
      const result = await upstream.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        error?: { message?: string };
      };
      if (!upstream.ok) {
        return json({ error: upstream.status === 429 ? "Gemini bepul foydalanish limiti vaqtincha tugadi. Keyinroq urinib ko‘ring." : "Gemini xizmatida xatolik yuz berdi. Keyinroq urinib ko‘ring." }, upstream.status === 429 ? 429 : 502, origin);
      }
      const reply = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
      if (!reply) return json({ error: "Gemini javobi bo‘sh qaytdi." }, 502, origin);
      return json({ reply, mode: "gemini" }, 200, origin);
    } catch {
      return json({ error: "Gemini serveriga ulanib bo‘lmadi." }, 502, origin);
    }
  },
};
