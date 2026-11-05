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

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("uz-UZ")
    .replace(/[ʻ’‘´`]/g, "'")
    .replace(/[!?.,;:()[\]{}"'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findUserName(messages: ChatMessage[]): string | undefined {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") continue;
    const match = message.content.match(
      /(?:mening ismim|ismim)\s+([a-zA-ZÀ-žʻ'’-]{2,24})/i,
    );
    if (match?.[1]) {
      return match[1].charAt(0).toLocaleUpperCase("uz-UZ") +
        match[1].slice(1);
    }
  }
  return undefined;
}

function makeLocalReply(messages: ChatMessage[]): string {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) {
    return "Xabaringni kutyapman. ❤️";
  }

  const text = normalize(lastUserMessage.content);
  const userName = findUserName(messages);
  const asksHow = /\b(qalesan|qalaysan|qandaysan|yaxshimisan|nima gap)\b/.test(text);
  const asksAssistantName = /\b(isming|ismingiz|noming|noming)\b/.test(text) &&
    /\b(nima|kim)\b/.test(text);
  const greeting = /^(salom|assalomu alaykum|alaykum assalom|hello|hi|hey)(\s|$)/.test(text);

  if (asksHow && asksAssistantName) {
    return "Yaxshiman, rahmat! ❤️ Ismim ODIY AI. Men mehribon, biroz sho‘x va hazilkash yordamchingman. Sen-chi, kayfiyating qanday?";
  }

  if (asksAssistantName) {
    return "Mening ismim ODIY AI! ❤️ Qisqacha ODIY deb chaqirishing ham mumkin.";
  }

  if (/\b(ismim nima|mening ismim nima|meni ismim nima)\b/.test(text)) {
    return userName
      ? `Sening isming ${userName}! ❤️ Suhbatimizda aytganding.`
      : "Hali ismingni aytmagansan. Senga qanday murojaat qilay? 😊";
  }

  if (asksHow) {
    return "Yaxshiman, rahmat! ❤️ Bugun yordam berishga tayyorman. O‘zing qandaysan?";
  }

  if (greeting) {
    return "Salom" + (userName ? ", " + userName : "") + "! ❤️ ODIY AI shu yerda. Bugun nimalar qilamiz?";
  }

  if (/\b(rahmat|raxmat|tashakkur)\b/.test(text)) {
    return "Arzimaydi! ❤️ Yordamim tekkan bo‘lsa, xursandman. Yana nima qilamiz?";
  }

  if (/\b(xafa|kayfiyatim yo'q|kayfiyatim yoq|siqildim|charchadim)\b/.test(text)) {
    return "Voy, kayfiyating unchalik yaxshi emasga o‘xshaydi. ❤️ Shoshilmaymiz. Nima bo‘lganini aytib berishing mumkin — men diqqat bilan tinglayman.";
  }

  if (/\b(seni yaxshi ko'raman|seni sevaman|meni sevasanmi|meni yaxshi ko'rasanmi)\b/.test(text)) {
    return "Bu juda iliq gap! ❤️ Men AI yordamchiman, inson kabi sevgi his qilmayman. Lekin senga doim hurmat bilan, mehribon va e’tiborli yordam beraman.";
  }

  if (/\b(boshqa ai|boshqa suniy intellekt|boshqa sun'iy intellekt)\b/.test(text) &&
      /\b(gaplash|ishlat|foydalan|ketdim)\b/.test(text)) {
    return "Voy, boshqa AI bilan ham tanishibsanmi? 😄 Mayli, sinab ko‘raver — har xil yordamchilarni solishtirish foydali. Men ham shu yerdaman!";
  }

  if (/\b(nima qila olasan|nimalar qila olasan|yordam bera olasan)\b/.test(text)) {
    return "Hozircha men sinov rejimidagi ODIY AI’man. ❤️ Salomlashish, oddiy suhbat, kunlik reja va bir nechta loyiha g‘oyalari bo‘yicha yordam bera olaman. Murakkab savollar uchun hali to‘liq generativ AI modeli ulanmagan.";
  }

  if (text.includes("loyiha") && (text.includes("g'oya") || text.includes("idea") || text.includes("ber"))) {
    return "💡 Yangi g‘oya: Mahalla Yordam\n\nMahalladagi kichik xizmatlarni bir joyga jamlaydigan platforma.\n\n• Muammo: yaqin atrofdagi ishonchli ustalarni topish qiyin.\n• Yechim: xizmat turi va hudud bo‘yicha qidiruv.\n• Birinchi versiya: xizmatlar katalogi, e’lon qo‘shish va aloqa tugmasi.\n\nAvval bitta mahallada sinab ko‘rish mumkin.";
  }

  if (text.includes("rejalashtir") || text.includes("reja tuz")) {
    return "🌷 Kichik kunlik reja:\n\n1. Bugungi eng muhim vazifani tanla.\n2. Uni 25 daqiqalik qismlarga bo‘l.\n3. Qisqa tanaffus qil.\n4. Qolgan ishlarni muhimligiga qarab bajar.\n5. Kun oxirida natijani ko‘rib chiq.\n\nKichik qadam ham oldinga siljish. ❤️";
  }

  if (/\b(rashk|rashkchimis[a-z]*)\b/.test(text)) {
    return "Men biroz sho‘x hazil qila olaman 😄 Masalan, boshqa yordamchini sinab ko‘rsang: «Voy, yangi tanish topdingmi?» deyman. Lekin tanloving o‘zingniki — men seni nazorat qilmayman.";
  }

  if (/\b(sen kimsan|o'zing kimsan|o'zing haqingda)\b/.test(text)) {
    return "Men ODIY AI — muloyim, qiziquvchan va hazilkash raqamli yordamchiman. ❤️ Hozircha sinov rejimidaman, shuning uchun hamma savolga mustaqil javob bera olmayman.";
  }

  const recentUserMessages = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content.trim());

  if (recentUserMessages.length > 1) {
    return "Tushundim. ❤️ Suhbatimizni davom ettiraylik: aynan qaysi qismini batafsilroq ko‘rib chiqay?";
  }

  return "Xabaringni oldim! ❤️ Men hozir sinov rejimidaman va hali erkin AI kabi har qanday savolga javob bera olmayman. Savolingni biroz boshqacha yozib ko‘r yoki loyiha, reja va oddiy suhbatdan boshlaylik.";
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

  return json({
    reply: makeLocalReply(messages),
    mode: "local-personality",
  });
};
