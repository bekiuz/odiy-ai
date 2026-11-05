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

async function askGemini(
  model: string,
  apiKey: string,
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "Sen ODIY AI nomli foydali shaxsiy yordamchisan. Foydalanuvchiga asosan o‘zbek tilida, sodda, aniq va samimiy javob ber. Bilmagan narsangni to‘qib chiqarmagin.",
          }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 1200,
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
      { error: "AI hozir sozlanmagan. Netlify’da GEMINI_API_KEY kalitini kiriting." },
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

  // Each model gets at most 10 seconds, keeping the entire request below
  // Netlify's synchronous function execution limit.
  const models = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ];
  let timedOut = false;

  for (const model of models) {
    let response: Response;

    try {
      response = await askGemini(model, apiKey, contents);
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        timedOut = true;
        console.warn(`Gemini model ${model} timed out after 10 seconds.`);
        continue;
      }
      console.error(`Gemini request failed for ${model}:`, error);
      continue;
    }

    const result = await response.json().catch(() => null);

    if (response.status === 503) {
      console.warn(`Gemini model ${model} is temporarily overloaded.`);
      continue;
    }

    if (!response.ok) {
      const detail =
        typeof result?.error?.message === "string"
          ? result.error.message
          : "Noma’lum Gemini API xatosi.";
      console.error("Gemini API error:", response.status, detail);
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

    return json({ reply: answer, model });
  }

  if (timedOut) {
    return json(
      {
        error:
          "Gemini modellari vaqtida javob bermadi. So‘rov xavfsiz to‘xtatildi; birozdan keyin qayta urinib ko‘ring.",
      },
      504,
    );
  }

  return json(
    {
      error:
        "Hozir Gemini modellari band. Bir nechta zaxira model tekshirildi. Birozdan keyin qayta urinib ko‘ring.",
    },
    503,
  );
};
