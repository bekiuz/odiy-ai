import { useState } from "react";
import {
  ArrowUp, Brain, Globe2, Heart, Menu, MessageCircle, Paperclip,
  Plus, Settings2, Sparkles, UserRound, X,
} from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Bugungi ishlarimni rejalashtir",
  "Menga yangi loyiha g‘oyasi ber",
  "Biror mavzuni sodda tushuntir",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(value = prompt) {
    const clean = value.trim();
    if (!clean || isLoading) return;

    const history = [...messages, { role: "user" as const, text: clean }];
    setMessages(history);
    setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI bilan bog‘lanib bo‘lmadi.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Noma’lum xatolik yuz berdi.";
      setMessages((current) => [
        ...current,
        { role: "assistant", text: `Xatolik: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Heart size={19} fill="currentColor" /></div>
          <div><strong>ODIY AI</strong><span>YOUR LITTLE AI SPACE</span></div>
          <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Yopish"><X size={18} /></button>
        </div>
        <button className="new-chat" onClick={() => setMessages([])}><Plus size={17} /> Yangi suhbat</button>
        <div className="side-label">MENING MAKONIM</div>
        <nav className="nav-list">
          <button className="nav-item active"><MessageCircle size={17} /> Suhbat</button>
          <button className="nav-item"><Brain size={17} /> Xotira <span className="soon">SOON</span></button>
          <button className="nav-item"><Globe2 size={17} /> Internet qidiruv <span className="soon">SOON</span></button>
          <button className="nav-item"><Settings2 size={17} /> Sozlamalar <span className="soon">SOON</span></button>
        </nav>
        <div className="sidebar-note"><Heart size={14} fill="currentColor" /> Kichik fikrlar, katta imkoniyatlar.</div>
        <div className="sidebar-bottom">
          <div className="profile"><div className="avatar"><UserRound size={17} /></div><div><b>Foydalanuvchi</b><span>Bepul reja</span></div><Settings2 size={17} className="profile-settings" /></div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish" />}
      <section className="main-panel">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Menyu"><Menu size={20} /></button>
          <div className="model-label"><span className="status-dot" /> ODIY AI <span className="model-version">PERSONAL ASSISTANT</span></div>
          <button className="icon-btn" aria-label="Yangi suhbat" onClick={() => setMessages([])}><Plus size={19} /></button>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="floating-heart heart-one">♥</div>
              <div className="floating-heart heart-two">✦</div>
              <div className="welcome-icon"><Heart size={29} fill="currentColor" /></div>
              <div className="eyebrow"><span /> SIZ UCHUN YARATILGAN SHAXSIY YORDAMCHI</div>
              <h1>Salom, <span className="headline-accent">xush kelibsiz.</span></h1>
              <p>Bu yerda fikrlaringizni bemalol yozishingiz mumkin. Men rejalashtirish, o‘rganish va yangi g‘oyalarni topishda yordam beraman.</p>
              <div className="suggestion-grid">
                {suggestions.map((item) => <button key={item} onClick={() => sendMessage(item)}><Sparkles size={15} />{item}</button>)}
              </div>
              <div className="welcome-foot"><Heart size={12} fill="currentColor" /> Har bir yaxshi g‘oya kichik qadamdan boshlanadi</div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={index}>
                  <div className="message-avatar">{message.role === "assistant" ? <Heart size={15} fill="currentColor" /> : <UserRound size={16} />}</div>
                  <div className="message-content"><span>{message.role === "assistant" ? "ODIY AI" : "SIZ"}</span><p>{message.text}</p></div>
                </div>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <div className="message-avatar"><Heart size={15} fill="currentColor" /></div>
                  <div className="message-content"><span>ODIY AI</span><p>Javob tayyorlayapman...</p></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <div className="composer">
            <button className="attach-btn" aria-label="Fayl biriktirish"><Paperclip size={19} /></button>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
              placeholder="Nima haqida gaplashamiz?"
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!prompt.trim() || isLoading} aria-label="Yuborish"><ArrowUp size={19} /></button>
          </div>
          <p className="disclaimer">ODIY AI hali sinov bosqichida. Muhim ma’lumotlarni tekshirib ko‘ring.</p>
        </div>
      </section>
    </main>
  );
}
