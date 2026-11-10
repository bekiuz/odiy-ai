import type { Context } from "@netlify/functions";

type ChatMessage = { role: "user" | "assistant"; content: string };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

function localFeedback(messages: ChatMessage[]) {
  const last = [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
  const lower = last.toLowerCase();
  if (!last) return "Share a sentence, paragraph, or IELTS question and I’ll coach you through it.";
  if (lower.includes("essay") || lower.includes("writing") || last.length > 120) {
    return "Here’s a focused review framework:\n\n1. **Task response:** make your position explicit in the introduction and answer every part of the prompt.\n2. **Coherence:** begin each body paragraph with one clear topic sentence, then develop it with an explanation and example.\n3. **Lexical resource:** replace repeated general words with precise academic language, but avoid memorised phrases.\n4. **Next step:** revise one paragraph and add a specific example after your main claim.";
  }
  if (/\b(is|are|was|were|have|has|do|does)\b/i.test(last)) {
    return "Your meaning is clear. To make this more natural, check subject–verb agreement and article use. Try reading the sentence aloud, then add one precise detail or linking word. If you share the exact sentence, I can mark the correction directly.";
  }
  return "Good start. I’d make your idea more precise by adding a reason or example. For IELTS, aim for one clear claim, one explanation, and one relevant example. Want to share a longer answer for detailed feedback?";
}

async function modelFeedback(messages: ChatMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const base = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are ODIY AI, a concise and encouraging English tutor specialising in IELTS. Give actionable feedback in English. Correct errors with a short explanation, mention IELTS criteria only when relevant, and finish with one next step. Never claim to provide an official IELTS score." },
        ...messages.slice(-12),
      ],
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || null;
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") return json({ error: "Only POST requests are accepted." }, 405);
  let body: { messages?: ChatMessage[] };
  try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return json({ error: "No messages were provided." }, 400);
  const messages = body.messages.slice(-20);
  const valid = messages.every((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string" && item.content.trim().length > 0 && item.content.length <= 4000);
  if (!valid) return json({ error: "Message format is invalid or too long." }, 400);
  let reply = await modelFeedback(messages).catch(() => null);
  if (!reply) reply = localFeedback(messages);
  return json({ reply, mode: process.env.OPENAI_API_KEY ? "model" : "local-fallback" });
};
