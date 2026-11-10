interface Env {
  AI: Ai;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT =
  "You are ODIY AI, a friendly and practical English tutor specialising in IELTS. Reply in the language the learner uses unless they ask otherwise. Correct English naturally, explain mistakes simply, give IELTS-aware feedback for Reading, Listening, Writing and Speaking, and finish with one practical next step. Never claim to provide an official IELTS score.";

const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const ALLOWED_ORIGINS = new Set([
  "https://bekiuz.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function cors(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://bekiuz.github.io";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors(origin),
    },
  });
}

function getReply(result: any): string {
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.output === "string") return result.output.trim();

  const content = result?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405, origin);
    }

    if (!env.AI) {
      return json(
        {
          error:
            "Cloudflare Workers AI binding topilmadi. Settings → Bindings ichida AI nomli binding qo‘shing.",
        },
        503,
        origin,
      );
    }

    let body: { messages?: ChatMessage[] };
    try {
      body = (await request.json()) as { messages?: ChatMessage[] };
    } catch {
      return json(
        { error: "So‘rov JSON formatida bo‘lishi kerak." },
        400,
        origin,
      );
    }

    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      body.messages.length > 20
    ) {
      return json({ error: "Xabarlar ro‘yxati noto‘g‘ri." }, 400, origin);
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
        { error: "Xabar formati noto‘g‘ri yoki foydalanuvchi xabari yo‘q." },
        400,
        origin,
      );
    }

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.slice(-12).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    ];

    try {
      const result = await env.AI.run(MODEL, {
        messages: chatMessages,
        max_tokens: 900,
        temperature: 0.3,
        chat_template_kwargs: {
          enable_thinking: false,
        },
      });

      const reply = getReply(result);

      if (!reply) {
        return json(
          { error: "Gemma 4 javobi bo‘sh qaytdi." },
          502,
          origin,
        );
      }

      return json({ reply, mode: MODEL }, 200, origin);
    } catch (error) {
      return json(
        {
          error:
            "Cloudflare AI xatosi: " +
            (error instanceof Error ? error.message : "Noma’lum xato."),
        },
        502,
        origin,
      );
    }
  },
};
