import { useState } from "react";
import {
  ArrowUp,
  Brain,
  Globe2,
  Heart,
  Menu,
  MessageCircle,
  Plus,
  Settings2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Menga yangi loyiha g‘oyasi ber",
  "Bugungi kunimni rejalashtir",
  "Nima qila olasan?",
];

const hearts = ["heart-a", "heart-b", "heart-c", "heart-d", "heart-e", "heart-f", "heart-g", "heart-h"];

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

      const rawResponse = await response.text();
      let data: { reply?: string; error?: string };

      try {
        data = JSON.parse(rawResponse) as { reply?: string; error?: string };
      } catch {
        throw new Error(`Server javobi noto‘g‘ri formatda (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.error || `So‘rov bajarilmadi (HTTP ${response.status}).`);
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Javob matni topilmadi.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply as string },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Noma’lum xatolik yuz berdi.";
      setMessages((current) => [
        ...current,
        { role: "assistant", text: message },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setPrompt("");
    setSidebarOpen(false);
  }

  return (
    <main className="app-shell">
      <div className="heart-wallpaper" aria-hidden="true">
        {hearts.map((heart) => <span className={heart} key={heart}>♥</span>)}
      </div>

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Heart size={20} fill="currentColor" />
            <span className="brand-spark">✦</span>
          </div>
          <div className="brand-copy">
            <strong>ODIY AI</strong>
            <span>YOUR LITTLE UNIVERSE</span>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          <Plus size={17} />
          <span>Yangi suhbat</span>
        </button>

        <div className="side-label">MENING MAKONIM</div>
        <nav className="nav-list">
          <button className="nav-item active">
            <MessageCircle size={17} />
            <span>Suhbat</span>
            <span className="nav-active-dot" />
          </button>
          <button className="nav-item" disabled>
            <Brain size={17} />
            <span>Xotira</span>
            <span className="soon">TEZ KUNDA</span>
          </button>
          <button className="nav-item" disabled>
            <Globe2 size={17} />
            <span>Internet qidiruv</span>
            <span className="soon">TEZ KUNDA</span>
          </button>
          <button className="nav-item" disabled>
            <Settings2 size={17} />
            <span>Sozlamalar</span>
            <span className="soon">TEZ KUNDA</span>
          </button>
        </nav>

        <div className="sidebar-love-card">
          <div className="sidebar-love-icon"><Heart size={14} fill="currentColor" /></div>
          <div>
            <strong>Yaxshi kayfiyat</strong>
            <span>Har bir fikr qadrlidir.</span>
          </div>
          <span className="sidebar-love-star">✦</span>
        </div>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar"><UserRound size={17} /></div>
            <div className="profile-copy">
              <b>Foydalanuvchi</b>
              <span>Shaxsiy makon</span>
            </div>
            <Heart className="profile-heart" size={16} fill="currentColor" />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Menyuni yopish"
        />
      )}

      <section className="main-panel">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menyu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-brand">
            <div className="topbar-heart"><Heart size={15} fill="currentColor" /></div>
            <div>
              <strong>ODIY AI</strong>
              <span>Sen uchun kichik yordamchi</span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="beta-pill"><span /> SINOV VERSIYASI</span>
            <button
              className="icon-btn new-chat-icon"
              aria-label="Yangi suhbat"
              onClick={startNewChat}
            >
              <Plus size={19} />
            </button>
          </div>
        </header>

        <div className="conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-decor decor-left">♡</div>
              <div className="welcome-decor decor-right">✦</div>
              <div className="welcome-decor decor-small">♥</div>

              <div className="welcome-emblem">
                <div className="emblem-glow" />
                <Heart size={34} fill="currentColor" />
                <span>✦</span>
              </div>

              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span className="eyebrow-heart">♥</span>
                SENGA ATALGAN SHAXSIY MAKON
                <span className="eyebrow-heart">♥</span>
                <span className="eyebrow-line" />
              </div>

              <h1>
                Salom, <span className="headline-accent">xush kelibsan!</span>
              </h1>

              <p className="welcome-description">
                Fikrlaringni yoz, rejalaringni tuz va yangi imkoniyatlarni kashf et.
                ODIY AI sening kichik raqamli makoning.
              </p>

              <div className="welcome-divider">
                <span />
                <Heart size={13} fill="currentColor" />
                <span />
              </div>

              <div className="suggestion-heading">BUGUN NIMADAN BOSHLAYMIZ?</div>
              <div className="suggestion-grid">
                {suggestions.map((item, index) => (
                  <button key={item} onClick={() => sendMessage(item)}>
                    <span className={`suggestion-icon suggestion-icon-${index + 1}`}>
                      <Sparkles size={17} />
                    </span>
                    <span>{item}</span>
                    <ArrowUp className="suggestion-arrow" size={15} />
                  </button>
                ))}
              </div>

              <div className="welcome-foot">
                <span className="foot-heart">♥</span>
                <span>Har bir yaxshi g‘oya kichik qadamdan boshlanadi.</span>
                <span className="foot-heart">♥</span>
              </div>
            </div>
          ) : (
            <div className="messages">
              <div className="conversation-date">BUGUNGI SUHBAT</div>
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={index}>
                  {message.role === "assistant" && (
                    <div className="message-avatar assistant-avatar">
                      <Heart size={15} fill="currentColor" />
                    </div>
                  )}
                  <div className="message-content">
                    <span>{message.role === "assistant" ? "ODIY AI" : "SIZ"}</span>
                    <p>{message.text}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="message-avatar user-avatar">
                      <UserRound size={16} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <div className="message-avatar assistant-avatar">
                    <Heart size={15} fill="currentColor" />
                  </div>
                  <div className="message-content">
                    <span>ODIY AI</span>
                    <p className="typing-text"><i /><i /><i /> Javob tayyorlanmoqda</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrap">
          <div className="composer">
            <div className="composer-heart"><Heart size={17} /></div>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Xabaringni shu yerga yoz..."
              rows={1}
              aria-label="Xabar yozish"
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!prompt.trim() || isLoading}
              aria-label="Yuborish"
            >
              <ArrowUp size={19} />
            </button>
          </div>
          <p className="disclaimer">
            <Heart size={10} fill="currentColor" />
            ODIY AI — hozircha sinovdagi oddiy yordamchi.
          </p>
        </div>
      </section>
    </main>
  );
}
