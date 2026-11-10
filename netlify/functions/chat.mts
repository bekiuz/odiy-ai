import type { Context } from "@netlify/functions";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

const SYSTEM_PROMPT = [
  "You are ODIY AI, a friendly, patient English tutor specialising in IELTS.",
  "Reply in the language the learner uses unless they ask to practise English.",
  "When the learner writes English, correct errors naturally and explain the most important mistake simply.",
  "For IELTS Writing and Speaking, give practical feedback on clarity, grammar, vocabulary, coherence and task response when relevant.",
  "Use examples and short exercises suited to the learner's level.",
  "Keep replies clear and useful. Finish with one practical next step.",
  "Never claim to provide an official IELTS score.",
].join(" ");

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

function extractReply(data: GroqResponse): string {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Only POST requests are accepted." }, 405);
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = (await request.json()) as { messages?: ChatMessage[] };
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > 20
  ) {
    return json({ error: "No valid messages were provided." }, 400);
  }

  const messages = body.messages;
  const valid = messages.every(
    (item) =>
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim().length > 0 &&
      item.content.length <= 4000,
  );

  if (!valid || !messages.some((item) => item.role === "user")) {
    return json(
      { error: "Message format is invalid or too long." },
      400,
    );
  }

  const apiKey = Netlify.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return json(
      {
        error:
          "Groq API kaliti Netlify’da sozlanmagan. Site configuration → Environment variables ichida GROQ_API_KEY qo‘shing.",
      },
      503,
    );
  }

  const model = Netlify.env.get("GROQ_MODEL") || "openai/gpt-oss-20b";

  try {
    const upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-12),
          ],
          temperature: 0.3,
          max_completion_tokens: 900,
          stream: false,
        }),
      },
    );

    const data = (await upstream.json()) as GroqResponse;

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return json(
          {
            error:
              "Groq bepul foydalanish limiti tugadi yoki vaqtinchalik so‘rov chegarasiga yetdingiz. Limit yangilangach qayta urinib ko‘ring.",
          },
          429,
        );
      }

      return json(
        {
          error:
            data.error?.message ||
            `Groq API xatosi (HTTP ${upstream.status}).`,
        },
        upstream.status >= 400 && upstream.status < 600
          ? upstream.status
          : 502,
      );
    }

    const reply = extractReply(data);
    if (!reply) {
      return json({ error: "Groq javobi bo‘sh qaytdi. Qayta urinib ko‘ring." }, 502);
    }

    return json({ reply, mode: model });
  } catch {
    return json(
      { error: "Groq serveriga ulanib bo‘lmadi. Internet yoki API holatini tekshiring." },
      502,
    );
  }
};
