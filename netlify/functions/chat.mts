import type { Context } from "@netlify/functions";

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
  }

  // External AI provider calls are disabled pending a provider whose terms
  // permit this app's intended audience.
  return json(
    {
      error:
        "ODIY AI chat xizmati vaqtincha demo holatida. Mos AI provayderi tanlangach qayta yoqiladi.",
    },
    503,
  );
};
