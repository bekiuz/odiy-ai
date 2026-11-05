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
  "Sen ODIY AI nomli shaxsiy yordamchisan.",
  "Asosan o‘zbek tilida sodda, aniq va samimiy javob ber. Foydalanuvchi boshqa tilda yozsa, o‘sha tilda javob ber.",
  "Bilmagan narsangni to‘qib chiqarmagin; noaniqlikni ochiq ayt.",
  "Yosh foydalanuvchilar uchun xavfsiz va yoshga mos javob ber.",
].join(" ");

function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
  }

  // This key must be created and managed by the adult account owner.
  const apiKey = Netlify.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    return json(
      {
        error:
          "OpenRouter API kaliti topilmadi. Netlify’da OPENROUTER_API_KEY maxfiy o‘zgaruvchisini kiriting.",
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

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "ODIY AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: chatMessages,
          max_tokens: 1200,
        }),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        typeof result?.error?.message === "string"
          ? result.error.message
          : "OpenRouter’dan noma’lum xatolik qaytdi.";
      console.error("OpenRouter API error:", response.status, detail);

      if (response.status === 401 || response.status === 403) {
        return json(
          { error: `OpenRouter kalit/ruxsat xatosi (${response.status}): ${detail}` },
          502,
        );
      }

      if (response.status === 429) {
        return json(
          { error: "OpenRouter bepul so‘rov limiti tugadi. Limit yangilangach qayta urinib ko‘ring." },
          429,
        );
      }

      return json(
        { error: `OpenRouter API xatosi (${response.status}): ${detail}` },
        502,
      );
    }

    const answer = extractText(result?.choices?.[0]?.message?.content);
    if (!answer) {
      return json(
        { error: "Bepul model javob qaytarmadi. Birozdan keyin qayta urinib ko‘ring." },
        502,
      );
    }

    const usedModel =
      typeof result?.model === "string" ? result.model : "openrouter/free";

    return json({ reply: answer, model: usedModel });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return json(
        { error: "OpenRouter javobi kechikdi. Birozdan keyin qayta urinib ko‘ring." },
        504,
      );
    }

    console.error("OpenRouter chat function error:", error);
    return json(
      { error: "OpenRouter serveriga ulanishda xatolik yuz berdi." },
      500,
    );
  }
};
