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

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
  }

  // Gemini free-tier key. Do not use the OpenAI key for this free setup.
  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json(
      { error: "Gemini API kaliti topilmadi. Netlify’da GEMINI_API_KEY ni qo‘shing." },
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

  const messages = body.messages.slice(-20);
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

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {
        method: "POST",
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: [
                "Sen ODIY AI nomli shaxsiy yordamchisan.",
                "Asosan o‘zbek tilida sodda, aniq va samimiy javob ber. Foydalanuvchi boshqa tilda yozsa, o‘sha tilda javob ber.",
                "Bilmagan narsangni to‘qib chiqarmagin; noaniqlikni ochiq ayt.",
                "Yosh foydalanuvchilar uchun xavfsiz va yoshga mos javob ber.",
              ].join(" "),
            }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1200,
          },
        }),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        typeof result?.error?.message === "string"
          ? result.error.message
          : "Noma’lum Gemini API xatosi.";
      console.error("Gemini API error:", response.status, detail);

      if (response.status === 429 || response.status === 503) {
        return json(
          { error: "Gemini bepul limitiga yoki vaqtinchalik yuklama chegarasiga yetildi. Birozdan keyin qayta urinib ko‘ring." },
          503,
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
      return json(
        { error: "AI javob qaytara olmadi. Qayta urinib ko‘ring." },
        502,
      );
    }

    return json({ reply: answer, model: "gemini-2.5-flash-lite" });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return json(
        { error: "AI javobi kechikdi. Birozdan keyin qayta urinib ko‘ring." },
        504,
      );
    }

    console.error("Gemini chat function error:", error);
    return json(
      { error: "Gemini serveriga ulanishda xatolik yuz berdi." },
      500,
    );
  }
};
