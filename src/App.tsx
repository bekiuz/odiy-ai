import { useState } from "react";
import {
  ArrowUp,
  Bot,
  Brain,
  Globe2,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Bugungi ishlarimni rejalashtir",
  "Menga yangi loyiha g‘oyasi ber",
  "Shu mavzuni sodda tushuntir",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function sendMessage(value = prompt) {
    const clean = value.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      {
        role: "assistant",
        text: "Men ODIY AI’man. Hozircha interfeys tayyorlanmoqda. Keyingi bosqichda AI modelini ulab, haqiqiy javoblarni ishlatamiz.",
      },
    ]);
    setPrompt("");
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <div><strong>ODIY AI</strong><span>PERSONAL ASSISTANT</span></div>
          <button className="icon-btn mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Yopish"><X size={18} /></button>
        </div>
        <button className="new-chat" onClick={() => setMessages([])}><Plus size={17} /> Yangi suhbat</button>
        <div className="side-label">YORDAMCHI</div>
        <nav className="nav-list">
          <button className="nav-item active"><MessageCircle size={17} /> Suhbat</button>
          <button className="nav-item"><Brain size={17} /> Xotira <span className="soon">SOON</span></button>
          <button className="nav-item"><Globe2 size={17} /> Internet qidiruv <span className="soon">SOON</span></button>
          <button className="nav-item"><Settings2 size={17} /> Sozlamalar <span className="soon">SOON</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile"><div className="avatar"><UserRound size={17} /></div><div><b>Foydalanuvchi</b><span>Bepul reja</span></div><Settings2 size={17} className="profile-settings" /></div>
        </div>
      </aside>

      {sidebarOpen && <button className="backdrop" onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish" />}
      <section className="main-panel">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Menyu"><Menu size={20} /></button>
          <div className="model-label"><span className="status-dot" /> ODIY AI <span className="model-version">ASSISTANT</span></div>
          <button className="icon-btn" aria-label="Yangi suhbat" onClick={() => setMessages([])}><Plus size={19} /></button>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon"><Bot size={30} /></div>
              <div className="eyebrow"><span /> SIZNING SHAXSIY AI YORDAMCHINGIZ</div>
              <h1>Salom! Men <span>ODIY AI</span>.</h1>
              <p>Fikrlaringizni tartibga solish, savollarga javob topish va kundalik vazifalaringizda yordam berish uchun shu yerdaman.</p>
              <div className="suggestion-grid">
                {suggestions.map((item) => <button key={item} onClick={() => sendMessage(item)}><Sparkles size={15} />{item}</button>)}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={index}>
                  <div className="message-avatar">{message.role === "assistant" ? <Sparkles size={16} /> : <UserRound size={16} />}</div>
                  <div className="message-content"><span>{message.role === "assistant" ? "ODIY AI" : "SIZ"}</span><p>{message.text}</p></div>
                </div>
              ))}
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
              placeholder="ODIY AI’dan biror narsa so‘rang..."
              rows={1}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!prompt.trim()} aria-label="Yuborish"><ArrowUp size={19} /></button>
          </div>
          <p className="disclaimer">ODIY AI xato qilishi mumkin. Muhim ma’lumotlarni tekshirib ko‘ring.</p>
        </div>
      </section>
    </main>
  );
}