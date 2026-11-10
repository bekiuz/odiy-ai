const SYSTEM_PROMPT =
  "You are ODIY AI, a friendly and practical English tutor specialising in IELTS. Reply in the language the learner uses unless they ask otherwise. Correct English naturally, explain mistakes simply, give IELTS-aware feedback for Reading, Listening, Writing and Speaking, and finish with one practical next step. Never claim to provide an official IELTS score.";

const ALLOWED_ORIGINS = new Set([
  "https://bekiuz.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function cors(origin) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://bekiuz.github.io";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors(origin),
      });
    }

    if (request.method !== "POST") {
      return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return json(
        { error: "Gemini API kaliti Worker’da sozlanmagan." },
        503,
        origin
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(
        { error: "So‘rov JSON formatida bo‘lishi kerak." },
        400,
        origin
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
        item.content.length <= 4000
    );

    if (!valid || !messages.some((item) => item.role === "user")) {
      return json(
        { error: "Xabar formati noto‘g‘ri yoki foydalanuvchi xabari yo‘q." },
        400,
        origin
      );
    }

    // A plain-text transcript is a supported Interactions API input format.
    const transcript = messages
      .slice(-12)
      .map((item) =>
        item.role === "assistant"
          ? "ODIY AI: " + item.content
          : "Student: " + item.content
      )
      .join("\n\n");

    try {
      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            system_instruction: SYSTEM_PROMPT,
            input:
              "Continue this tutoring conversation. Answer the latest student message.\n\n" +
              transcript,
            store: false,
          }),
        }
      );

      const result = await upstream.json();

      if (!upstream.ok) {
        const message =
          result.error?.message ||
          "Gemini API so‘rovni qabul qilmadi (HTTP " +
            upstream.status +
            ").";
        return json({ error: message }, upstream.status, origin);
      }

      const reply = (result.steps || [])
        .filter((step) => step.type === "model_output")
        .flatMap((step) => step.content || [])
        .filter((part) => part.type === "text")
        .map((part) => part.text || "")
        .join("")
        .trim();

      if (!reply) {
        return json({ error: "Gemini javobi bo‘sh qaytdi." }, 502, origin);
      }

      return json({ reply, mode: "gemini-3.8-flash" }, 200, origin);
    } catch {
      return json(
        { error: "Gemini serveriga ulanib bo‘lmadi." },
        502,
        origin
      );
    }
  },
};
