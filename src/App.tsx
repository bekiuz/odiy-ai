import { useEffect, useState } from "react";
import { generateLocalAIReply } from "./local-ai";
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

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STORAGE_KEY = "odiy-ai-chat-history-v1";

function loadChats(): ChatSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((chat): chat is ChatSession =>
        !!chat &&
        typeof chat.id === "string" &&
        typeof chat.title === "string" &&
        Array.isArray(chat.messages) &&
        typeof chat.updatedAt === "number" &&
        chat.messages.every((message: unknown) =>
          !!message &&
          typeof message === "object" &&
          "role" in message &&
          "text" in message &&
          ((message as Message).role === "user" || (message as Message).role === "assistant") &&
          typeof (message as Message).text === "string"
        )
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function createChatId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user")?.text;
  if (!firstUserMessage) return "Yangi suhbat";
  return firstUserMessage.length > 32
    ? firstUserMessage.slice(0, 32).trimEnd() + "…"
    : firstUserMessage;
}

const suggestions = [
  "Menga yangi loyiha g‘oyasi ber",
  "Bugungi kunimni rejalashtir",
  "Nima qila olasan?",
];

const hearts = ["heart-a", "heart-b", "heart-c", "heart-d", "heart-e", "heart-f", "heart-g", "heart-h"];

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadChats()[0]?.id ?? null
  );
  const [prompt, setPrompt] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState("");

  const messages = chats.find((chat) => chat.id === activeChatId)?.messages ?? [];

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch {
      // Browser storage may be unavailable or full; the chat still works for this session.
    }
  }, [chats]);

  function saveChatMessages(chatId: string, nextMessages: Message[]) {
    setChats((current) => {
      const existing = current.find((chat) => chat.id === chatId);
      const updatedChat: ChatSession = {
        id: chatId,
        title: existing?.title ?? createChatTitle(nextMessages),
        messages: nextMessages,
        updatedAt: Date.now(),
      };
      return [updatedChat, ...current.filter((chat) => chat.id !== chatId)].slice(0, 40);
    });
  }

  function openChat(chatId: string) {
    setActiveChatId(chatId);
    setPrompt("");
    setSidebarOpen(false);
  }

  async function sendMessage(value = prompt) {
    const clean = value.trim();
    if (!clean || isLoading) return;

    const chatId = activeChatId ?? createChatId();
    const history = [...messages, { role: "user" as const, text: clean }];
    setActiveChatId(chatId);
    saveChatMessages(chatId, history);
    setPrompt("");
    setIsLoading(true);

    try {
      setAiProgress("AI modeli yuklanishga tayyorlanmoqda...");
      const memory = chats
        .filter((chat) => chat.id !== chatId)
        .slice(0, 3)
        .reverse()
        .flatMap((chat) => chat.messages.slice(-4))
        .slice(-12)
        .map((message) => ({
          role: message.role,
          content: message.text,
        }));
      const contextMessages = [
        ...memory,
        ...history.map((message) => ({
          role: message.role,
          content: message.text,
        })),
      ].slice(-20);

      const reply = await generateLocalAIReply(contextMessages, setAiProgress);

      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, { role: "assistant", text: reply }],
                updatedAt: Date.now(),
              }
            : chat
        )
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Noma’lum xatolik yuz berdi.";
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, { role: "assistant", text: message }],
                updatedAt: Date.now(),
              }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
      setAiProgress("");
    }
  }

  function startNewChat() {
    setActiveChatId(null);
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

        <div className="side-label history-label">OXIRGI SUHBATLAR</div>
        <div className="chat-history-list">
          {chats.length === 0 ? (
            <p className="empty-history">Hali suhbat yo‘q</p>
          ) : (
            chats.slice(0, 12).map((chat) => (
              <button
                className={`history-item ${activeChatId === chat.id ? "selected" : ""}`}
                key={chat.id}
                onClick={() => openChat(chat.id)}
                title={chat.title}
              >
                <MessageCircle size={14} />
                <span>{chat.title}</span>
              </button>
            ))
          )}
        </div>

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
              <span>Mehribon • sho‘x • e’tiborli</span>
            </div>
          </div>

          <div className="topbar-right">
            <span className="beta-pill"><span /> BRAUZER AI</span>
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
                    <p className="typing-text"><i /><i /><i /> {aiProgress || "ODIY AI javob tayyorlamoqda..."}</p>
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
            ODDIY AI — AI modeli brauzeringizda ishlaydi.
          </p>
        </div>
      </section>
    </main>
  );
}
