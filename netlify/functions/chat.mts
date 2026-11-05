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

const SYSTEM_INSTRUCTIONS = [
  "Sen ODIY AI nomli shaxsiy AI yordamchisisan.",
  "Asosan o‘zbek tilida, sodda, aniq va samimiy javob ber. Foydalanuvchi boshqa tilda yozsa, o‘sha tilda javob ber.",
  "Bilmagan narsangni to‘qib chiqarmagin; noaniqlikni ochiq ayt.",
  "Yosh foydalanuvchilar uchun xavfsiz va yoshga mos javob ber.",
  "O‘ziga zarar yetkazish, zo‘ravonlik, jinsiy mazmun yoki xavfli xatti-harakatlarni batafsil tasvirlama va bunday ishlarni bajarish bo‘yicha ko‘rsatma bermagin.",
  "Xavfli so‘rov bo‘lsa, muloyim rad et va xavfsizroq yo‘lni taklif qil.",
].join(" ");

function extractOutputText(result: {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  return (result.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) =>
      (item.content ?? [])
        .filter((part) => part.type === "output_text")
        .map((part) => part.text ?? ""),
    )
    .join("\n")
    .trim();
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
  }

  const apiKey = Netlify.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json(
      {
        error:
          "OpenAI API hali ulanmagan. Netlify’da OPENAI_API_KEY maxfiy o‘zgaruvchisini qo‘shing.",
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

  const input = [
    { role: "developer", content: SYSTEM_INSTRUCTIONS },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(25_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-6-astra",
        instructions: SYSTEM_INSTRUCTIONS,
        input,
        max_output_tokens: 1200,
        store: false,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        typeof result?.error?.message === "string"
          ? result.error.message
          : "OpenAI API’dan noma’lum xatolik qaytdi.";
      console.error("OpenAI API error:", response.status, detail);

      if (response.status === 401) {
        return json(
          { error: "OpenAI API kaliti noto‘g‘ri yoki bekor qilingan. Netlify’dagi OPENAI_API_KEY ni tekshiring." },
          502,
        );
      }

      if (response.status === 429) {
        return json(
          { error: "OpenAI API limiti yoki billing balansi yetarli emas. API billing sozlamalarini tekshiring." },
          429,
        );
      }

      return json(
        { error: `OpenAI API xatosi (${response.status}): ${detail}` },
        502,
      );
    }

    const answer = extractOutputText(result ?? {});
    if (!answer) {
      return json(
        { error: "OpenAI javob qaytarmadi. Birozdan keyin qayta urinib ko‘ring." },
        502,
      );
    }

    return json({ reply: answer, model: "gpt-6-astra" });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return json(
        { error: "OpenAI javobi juda kechikdi. Birozdan keyin qayta urinib ko‘ring." },
        504,
      );
    }

    console.error("OpenAI chat function error:", error);
    return json(
      { error: "OpenAI serveriga ulanishda xatolik yuz berdi." },
      500,
    );
  }
};
