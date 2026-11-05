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

function makeLocalReply(message: string): string {
  const text = message
    .toLocaleLowerCase("uz-UZ")
    .replace(/[!?.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(salom|assalomu alaykum|alaykum assalom|hello|hi|hey|qalesan|qalaysan|nima gap)(\s|$)/.test(text)) {
    return "Salom! ❤️ ODIY AI’ga xush kelibsan! Bugun nima haqida gaplashamiz? Loyiha, o‘qish, dasturlash yoki yangi g‘oyalar bo‘yicha yordam berishga tayyorman.";
  }

  if (text.includes("nima qila ol") || text.includes("yordam bera ol")) {
    return "Men hozir sinov rejimidagi ODIY AI yordamchisiman. Hozircha salomlashish, loyiha g‘oyasi, oddiy reja va boshlang‘ich savollarga tayyor javoblar bera olaman. To‘liq generativ AI hali ulanmagan.";
  }

  if (text.includes("loyiha") && (text.includes("g‘oya") || text.includes("idea") || text.includes("ber"))) {
    return "💡 **G‘oya: Mahalla Yordam**\n\nMahalladagi kichik xizmatlarni bir joyga jamlaydigan sodda platforma.\n\n• Muammo: odamlar yaqin atrofdagi ishonchli ustalar va xizmatlarni topishga qiynaladi.\n• Yechim: xizmat turi, hudud va aloqa ma’lumoti bo‘yicha qidiruv.\n• Birinchi versiya: oddiy katalog, xizmat qo‘shish formasi va aloqa tugmasi.\n\nAvval bitta mahallada sinab ko‘rish mumkin.";
  }

  if (text.includes("rejalashtir") || text.includes("reja tuz")) {
    return "🌷 Kichik kunlik reja:\n\n1. Eng muhim bitta vazifani tanla.\n2. Uni 25 daqiqalik kichik bosqichlarga bo‘l.\n3. 5 daqiqa tanaffus qil.\n4. Qolgan ishlarni muhimligiga qarab bajar.\n5. Kun oxirida nimalar bitganini belgilab chiq.\n\nBugun bitta muhim ishni yakunlashning o‘zi yaxshi natija.";
  }

  if (text.includes("rahmat")) {
    return "Arzimaydi! ❤️ Yana savoling bo‘lsa, yozaver.";
  }

  return "Xabaringni oldim! ❤️ Hozir ODIY AI’ning oddiy sinov rejimi ishlayapti: salomlashish, ayrim tayyor savollar va sodda rejalarga javob bera olaman. To‘liq, erkin AI javoblari uchun mos AI xizmati hali ulanmagan.";
}

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return json({ error: "Faqat POST so‘rovi qabul qilinadi." }, 405);
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
    (item) =>
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim().length > 0 &&
      item.content.length <= 4000,
  );

  if (!valid) {
    return json({ error: "Xabar formati noto‘g‘ri yoki juda uzun." }, 400);
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((item) => item.role === "user");

  if (!lastUserMessage) {
    return json({ error: "Foydalanuvchi xabari topilmadi." }, 400);
  }

  return json({
    reply: makeLocalReply(lastUserMessage.content),
    mode: "local-demo",
  });
};
