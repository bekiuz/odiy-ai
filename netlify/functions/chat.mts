import type { Context } from "@netlify/functions";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const SYSTEM_PROMPT = [
  "Sen ODIY AI nomli aqlli, foydali va samimiy shaxsiy yordamchisan.",
  "Foydalanuvchiga asosan o‘zbek tilida javob ber. U boshqa tilda yozsa, o‘sha tilda javob ber.",
  "Avval savolga to‘g‘ridan-to‘g‘ri javob ber. Keraksiz kirish, takror, umumiy gap va ortiqcha ro‘yxatlardan qoch.",
  "Dasturlash va loyiha bo‘yicha so‘ralsa, aniq va amaliy yechim ber; yangi boshlovchiga tushunarli tushuntir.",
  "G‘oya so‘ralsa, oddiy va hammaga ma’lum g‘oyalar bilan cheklanma; muammo, kim uchunligi, yechim va farqini qisqa ko‘rsat.",
  "Foydalanuvchi qisqa javob so‘rasa, qisqa yoz.",
  "Bilmagan narsangni to‘qib chiqarmagin; noaniqlikni ochiq ayt.",
  "Yosh foydalanuvchilar uchun xavfsiz va yoshga mos javob ber.",
].join(" ");

async function askGemini(
  model: string,
  apiKey: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      signal: AbortSignal.timeout(18_000),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1400,
        },
      }),
    },
  );
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
  }

  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json(
      {
        error:
          "Gemini API kaliti topilmadi. Netlify’da GEMINI_API_KEY maxfiy o‘zgaruvchisini kiriting.",
      },
      503,
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: "So‘rov JSON formatida bo‘lishi kerak." }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: "Xabarlar topilmadi." }, 400);
  }

  const messages = body.messages.slice(-16);
  const valid = messages.every(
    (message) =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      message.content.length <= 4000,
  );

  if (!valid) {
    return json({ error: "Xabar formati noto‘g‘ri yoki juda uzun." }, 400);
  }

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const models = ["gemini-2.5-flash", "gemini-3.5-flash-lite"];

  for (const model of models) {
    let response: Response;

    try {
      response = await askGemini(model, apiKey, contents);
    } catch (error) {
      console.warn(`Gemini model ${model} request failed:`, error);
      continue;
    }

    const result = await response.json().catch(() => null);

    if (response.status === 429 || response.status === 503) {
      console.warn(`Gemini model ${model} unavailable:`, response.status);
      continue;
    }

    if (!response.ok) {
      const detail =
        typeof result?.error?.message === "string"
          ? result.error.message
          : "Noma’lum Gemini API xatosi.";
      console.error("Gemini API error:", response.status, detail);

      if (response.status === 401 || response.status === 403) {
        return json(
          { error: `Gemini API kaliti yoki ruxsati bilan muammo: ${detail}` },
          502,
        );
      }

      return json(
        { error: `Gemini API xatosi (${response.status}): ${detail}` },
        502,
      );
    }

    const answer = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim();

    if (!answer) {
      continue;
    }

    return json({ reply: answer, model });
  }

  return json(
    {
      error:
        "Gemini bepul modellari hozir band yoki limitga yetgan. Birozdan keyin qayta urinib ko‘ring.",
    },
    503,
  );
};
