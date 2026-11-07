import { useEffect, useState } from "react";
import {
  ArrowRight, AudioLines, BookOpen, BookText, Brain,
  Check, CheckCircle2, ChevronDown, ChevronRight, Clock3,
  Flame, GraduationCap, Headphones, Heart, Home, Lightbulb,
  Menu, Mic, MicOff, Play, RotateCcw, Search, Sparkles, Star,
  Trophy, Volume2, X
} from "lucide-react";

type Section = "home" | "lessons" | "vocabulary" | "grammar" | "listening" | "speaking" | "tests" | "ielts" | "progress";
type Character = "reya" | "mika" | "yuki";
type Progress = { name: string; completed: string[]; xp: number; streak: number; words: number; level: string };

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;

const STORAGE_KEY = "odiy-english-progress-v1";
const initialProgress: Progress = { name: "O‘quvchi", completed: [], xp: 245, streak: 7, words: 36, level: "A2 — Elementary" };

const modules: Array<{ id: Section; title: string; subtitle: string; icon: typeof BookOpen; color: string; count: string }> = [
  { id: "vocabulary", title: "Lug‘at", subtitle: "Yangi so‘zlar va iboralar", icon: BookText, color: "pink", count: "6 ta so‘z" },
  { id: "grammar", title: "Grammatika", subtitle: "Qoidalar va mashqlar", icon: Brain, color: "mint", count: "1 ta mavzu" },
  { id: "speaking", title: "Speaking", subtitle: "Gapirish va talaffuz", icon: Mic, color: "blue", count: "4 mashq" },
  { id: "listening", title: "Listening", subtitle: "Tinglab tushunish", icon: Headphones, color: "orange", count: "1 audio" },
  { id: "tests", title: "Testlar", subtitle: "Bilimingizni tekshiring", icon: CheckCircle2, color: "violet", count: "5 savol" },
  { id: "ielts", title: "IELTS", subtitle: "Imtihonga tayyorgarlik", icon: GraduationCap, color: "gold", count: "4 skill" },
];

const lessonCards = [
  { id: "greetings", level: "A1", title: "Greetings & Introductions", subtitle: "Salomlashish va tanishish", duration: "12 daqiqa", tag: "Boshlang‘ich", icon: "👋" },
  { id: "present", level: "A2", title: "Present Simple", subtitle: "Kundalik odatlar haqida gapirish", duration: "18 daqiqa", tag: "Grammatika", icon: "🧩" },
  { id: "travel", level: "A2", title: "Travel & Directions", subtitle: "Sayohat va yo‘l so‘rash", duration: "15 daqiqa", tag: "Lug‘at", icon: "🧭" },
  { id: "past", level: "B1", title: "Past Simple", subtitle: "O‘tgan voqealarni aytib berish", duration: "20 daqiqa", tag: "Grammatika", icon: "⏳" },
];

const vocabulary = [
  { word: "Curious", phonetic: "/ˈkjʊəriəs/", translation: "Qiziquvchan", example: "I'm curious about new cultures.", note: "B2 • Adjective" },
  { word: "Improve", phonetic: "/ɪmˈpruːv/", translation: "Yaxshilamoq", example: "I want to improve my English.", note: "A2 • Verb" },
  { word: "Opportunity", phonetic: "/ˌɒpəˈtjuːnəti/", translation: "Imkoniyat", example: "This course is a great opportunity.", note: "B1 • Noun" },
  { word: "Confident", phonetic: "/ˈkɒnfɪdənt/", translation: "O‘ziga ishongan", example: "She feels confident when speaking.", note: "B1 • Adjective" },
  { word: "Achieve", phonetic: "/əˈtʃiːv/", translation: "Erishmoq", example: "You can achieve your goals step by step.", note: "B1 • Verb" },
  { word: "Consistent", phonetic: "/kənˈsɪstənt/", translation: "Muntazam, izchil", example: "Consistent practice makes a difference.", note: "B2 • Adjective" },
];

const grammarQuestions = [
  { question: "She ___ to school every day.", options: ["go", "goes", "going"], correct: 1, explain: "He / She / It bilan Present Simple’da fe’lga -s yoki -es qo‘shiladi." },
  { question: "They ___ football on Sundays.", options: ["plays", "playing", "play"], correct: 2, explain: "They bilan fe’lning oddiy shakli ishlatiladi: play." },
  { question: "___ he work here?", options: ["Do", "Does", "Is"], correct: 1, explain: "He / She / It uchun savolda Does ishlatiladi, asosiy fe’l oddiy shaklda qoladi." },
  { question: "My brother doesn't ___ coffee.", options: ["likes", "like", "liking"], correct: 1, explain: "Doesn't dan keyin fe’lning boshlang‘ich shakli keladi: like." },
];

const testQuestions = [
  { question: "Choose the correct sentence.", options: ["He go to work.", "He goes to work.", "He going to work."], correct: 1, explain: "He bilan Present Simple’da goes ishlatiladi." },
  { question: "What is the opposite of “expensive”?", options: ["Cheap", "Rich", "Large"], correct: 0, explain: "Expensive — qimmat, cheap — arzon." },
  { question: "I have lived here ___ 2020.", options: ["for", "since", "during"], correct: 1, explain: "Since aniq boshlanish vaqtini bildiradi." },
  { question: "Choose the correct past form of “buy”.", options: ["Buyed", "Bought", "Buying"], correct: 1, explain: "Buy fe’lining Past Simple shakli bought." },
  { question: "“Although” means…", options: ["Shuning uchun", "Garchi", "Chunki"], correct: 1, explain: "Although — garchi, ... bo‘lsa-da." },
];

const readingText = "Many people believe that learning a language requires several hours every day. However, research and experience suggest that short, regular practice can be more effective. When learners review a few words, read a short story, and speak for five minutes each day, they build a strong habit. The key is consistency, not perfection. Making mistakes is a natural part of learning, and every mistake gives you a chance to improve.";
const readingQuestions = [
  { question: "What is the main idea of the text?", options: ["Study only once a week", "Regular short practice is useful", "Never make mistakes"], correct: 1 },
  { question: "According to the text, mistakes are…", options: ["A natural part of learning", "A reason to stop", "Always bad"], correct: 0 },
  { question: "What matters most?", options: ["Perfection", "Consistency", "Expensive books"], correct: 1 },
];

const listeningScript = "Hi! My name is Alex. I usually wake up at seven o'clock. I have breakfast, then I walk to the bus stop. I work in a small bookshop near the city centre. In the evening, I like reading and learning new words.";
const speakingPrompts = [
  "Introduce yourself and talk about your daily routine.",
  "Describe a place you would like to visit.",
  "Talk about a skill you want to learn and explain why.",
  "Describe a memorable day in your life.",
];

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProgress;
    const value = JSON.parse(raw) as Partial<Progress>;
    return {
      ...initialProgress,
      ...value,
      completed: Array.isArray(value.completed) ? value.completed : [],
    };
  } catch {
    return initialProgress;
  }
}

function speakEnglish(text: string) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
  return true;
}

function AnimeTutor({ character, compact = false, onChange }: { character: Character; compact?: boolean; onChange?: (value: Character) => void }) {
  const details = {
    reya: { name: "Reya", hair: "#27153f", hair2: "#7040a9", eyes: "#87d6ff", accent: "#b889ff", greeting: "Hey! Bugun birga inglizcha gaplashamizmi?" },
    mika: { name: "Mika", hair: "#6b2449", hair2: "#d46b9a", eyes: "#8de5d0", accent: "#ff8ab7", greeting: "Hi! Let’s make English fun!" },
    yuki: { name: "Yuki", hair: "#55566f", hair2: "#c6d0ee", eyes: "#82cfff", accent: "#9dbfff", greeting: "Hello! Ready for a new lesson?" },
  }[character];
  return (
    <div className={"tutor-scene " + (compact ? "tutor-compact" : "")}>
      <div className="tutor-aura" />
      <div className="tutor-spark spark-one">✦</div>
      <div className="tutor-spark spark-two">♡</div>
      {character === "reya" ? (
        <video
          className="anime-video"
          src={import.meta.env.BASE_URL + "mascot-loop.webm"}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label="Reya anime ustozining aylanuvchi videosi"
        />
      ) : (
      <svg className="anime-figure" viewBox="0 0 300 390" role="img" aria-label={details.name + " 3D anime English tutor"}>
        <defs>
          <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop stopColor={details.hair2}/><stop offset=".55" stopColor={details.hair}/><stop offset="1" stopColor="#100d20"/></linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe8dc"/><stop offset=".65" stopColor="#f2bda9"/><stop offset="1" stopColor="#c98582"/></linearGradient>
          <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#554078"/><stop offset=".55" stopColor="#26213e"/><stop offset="1" stopColor="#151328"/></linearGradient>
          <radialGradient id="shine"><stop stopColor="#fff" stopOpacity=".9"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
          <filter id="drop"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <ellipse cx="150" cy="365" rx="92" ry="13" fill="#080514" opacity=".45" filter="url(#drop)"/>
        <path d="M55 390 Q55 313 93 294 L124 278 L176 278 L213 295 Q253 322 251 390Z" fill="url(#coat)" stroke="#8c6fbd" strokeOpacity=".7" strokeWidth="2"/>
        <path d="M119 283 L150 330 L180 283 L166 269 L135 269Z" fill="#fff0ec"/>
        <path d="M139 292 L150 328 L162 292 L151 300Z" fill={details.accent}/>
        <path d="M91 326 Q75 350 84 390 L55 390 Q55 337 91 326Z" fill="#171327"/>
        <path d="M209 326 Q228 351 216 390 L249 390 Q246 338 209 326Z" fill="#171327"/>
        <path d="M120 245 L119 284 Q149 310 182 284 L180 246Z" fill="url(#skin)"/>
        <ellipse cx="91" cy="175" rx="18" ry="28" fill="#eeb7a7"/>
        <ellipse cx="209" cy="175" rx="18" ry="28" fill="#d99791"/>
        <path d="M80 128 Q82 49 151 46 Q222 47 222 132 L215 217 Q202 260 150 268 Q98 260 84 217Z" fill="url(#skin)" stroke="#d69b92" strokeWidth="1.5"/>
        <path d="M80 160 Q53 67 125 33 Q198 0 231 75 Q245 112 224 178 L211 129 Q203 89 168 83 Q128 100 92 92Z" fill="url(#hair)" stroke={details.hair2} strokeWidth="3"/>
        <path d="M84 138 Q72 197 97 258 Q63 250 53 209 Q38 149 69 102Z" fill="url(#hair)"/>
        <path d="M217 132 Q232 187 204 262 Q245 247 253 199 Q261 149 231 105Z" fill="url(#hair)"/>
        <path d="M84 111 Q111 43 160 55 Q192 40 220 104 Q187 88 162 111 Q128 87 84 126Z" fill="url(#hair)"/>
        <path d="M112 66 Q127 102 121 147 Q108 129 103 116Z" fill={details.hair2} opacity=".8"/>
        <path d="M146 52 Q161 92 148 139 Q136 116 137 80Z" fill={details.hair2} opacity=".65"/>
        <path d="M178 55 Q197 91 189 129 Q177 115 172 88Z" fill={details.hair2} opacity=".55"/>
        <path d="M93 139 Q117 115 143 135 Q125 149 103 145Z" fill="#251a35"/>
        <path d="M159 135 Q189 115 207 139 Q184 148 163 145Z" fill="#251a35"/>
        <ellipse cx="122" cy="165" rx="18" ry="15" fill="#fff"/>
        <ellipse cx="181" cy="165" rx="18" ry="15" fill="#fff"/>
        <ellipse cx="124" cy="169" rx="10" ry="13" fill={details.eyes}/>
        <ellipse cx="180" cy="169" rx="10" ry="13" fill={details.eyes}/>
        <ellipse cx="125" cy="171" rx="5" ry="8" fill="#242039"/>
        <ellipse cx="180" cy="171" rx="5" ry="8" fill="#242039"/>
        <circle cx="128" cy="164" r="4" fill="#fff"/>
        <circle cx="184" cy="164" r="4" fill="#fff"/>
        <path d="M104 145 Q122 135 139 144" fill="none" stroke="#3d2941" strokeWidth="5" strokeLinecap="round"/>
        <path d="M164 144 Q183 134 199 145" fill="none" stroke="#3d2941" strokeWidth="5" strokeLinecap="round"/>
        <path d="M149 178 Q144 190 151 191" fill="none" stroke="#d28f89" strokeWidth="2" strokeLinecap="round"/>
        <path d="M132 211 Q151 225 171 209 Q155 235 137 218Z" fill="#a94762"/>
        <path d="M135 210 Q152 216 169 209" fill="none" stroke="#fff0ec" strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="106" cy="197" rx="15" ry="7" fill="#ff91a9" opacity=".28"/>
        <ellipse cx="196" cy="197" rx="15" ry="7" fill="#ff91a9" opacity=".28"/>
        <path d="M84 121 Q94 75 126 62" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="6" strokeLinecap="round"/>
        <path d="M201 91 Q222 119 220 154" fill="none" stroke={details.accent} strokeOpacity=".7" strokeWidth="4" strokeLinecap="round"/>
        <path d="M142 259 Q150 267 159 259 L157 279 Q150 286 143 278Z" fill="#2b1b32"/>
        <path d="M145 267 L155 267 L150 276Z" fill={details.accent}/>
        <path d="M116 292 L150 340 L184 292" fill="none" stroke="#9c88c6" strokeWidth="2" opacity=".5"/>
        <circle cx="201" cy="105" r="9" fill={details.accent} stroke="#fff" strokeOpacity=".65" strokeWidth="2"/>
        <path d="M68 145 Q55 168 71 196" fill="none" stroke={details.accent} strokeWidth="5" strokeLinecap="round"/>
        <path d="M229 145 Q245 168 229 196" fill="none" stroke={details.accent} strokeWidth="5" strokeLinecap="round"/>
      </svg>
      )}
      <div className="tutor-speech">
        <span className="speech-dot" />
        <strong>{details.name}</strong>
        <p>{details.greeting}</p>
      </div>
      {onChange && (
        <div className="character-picker">
          {(["reya", "mika", "yuki"] as Character[]).map((item) => (
            <button key={item} className={character === item ? "active" : ""} onClick={() => onChange(item)}>
              {item === "reya" ? "Reya" : item === "mika" ? "Mika" : "Yuki"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, color = "purple" }: { value: number; color?: string }) {
  return <div className="progress-track"><span className={"progress-fill " + color} style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>;
}

export default function App() {
  const [section, setSection] = useState<Section>("home");
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [character, setCharacter] = useState<Character>("reya");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarAnswer, setGrammarAnswer] = useState<number | null>(null);
  const [testIndex, setTestIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testFinished, setTestFinished] = useState(false);
  const [readingAnswers, setReadingAnswers] = useState<number[]>([]);
  const [listeningAnswer, setListeningAnswer] = useState<number | null>(null);
  const [spokenText, setSpokenText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<RecognitionLike | null>(null);
  const [activeLesson, setActiveLesson] = useState("present");
  const [lessonDone, setLessonDone] = useState(false);
  const [ieltsTab, setIeltsTab] = useState<"reading" | "listening" | "writing" | "speaking">("reading");
  const [writingText, setWritingText] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const complete = (id: string, xp = 20) => {
    setProgress((old) => ({
      ...old,
      completed: old.completed.includes(id) ? old.completed : [...old.completed, id],
      xp: old.completed.includes(id) ? old.xp : old.xp + xp,
    }));
  };

  const changeSection = (value: Section) => {
    setSection(value);
    setSidebarOpen(false);
    setSearchText("");
    setLessonDone(false);
    if (value === "tests") {
      setTestIndex(0);
      setTestAnswers([]);
      setTestFinished(false);
    }
  };

  const navItems: Array<{ id: Section; label: string; icon: typeof Home }> = [
    { id: "home", label: "Bosh sahifa", icon: Home },
    { id: "lessons", label: "Darslar", icon: BookOpen },
    { id: "vocabulary", label: "Lug‘at", icon: BookText },
    { id: "grammar", label: "Grammatika", icon: Brain },
    { id: "listening", label: "Listening", icon: Headphones },
    { id: "speaking", label: "Speaking", icon: Mic },
    { id: "tests", label: "Testlar", icon: CheckCircle2 },
    { id: "ielts", label: "IELTS", icon: GraduationCap },
    { id: "progress", label: "Natijalar", icon: Trophy },
  ];

  const startRecognition = () => {
    const targetWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = targetWindow.SpeechRecognition || targetWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setSpokenText("Bu brauzer ovoz tanishni qo‘llamaydi. Chrome’da qayta urinib ko‘ring yoki javobingizni yozing.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((item) => item[0].transcript).join(" ");
      setSpokenText(transcript);
    };
    recognition.onerror = (event) => {
      setSpokenText("Mikrofon xatosi: " + (event.error || "noma’lum xato"));
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    try {
      setRecognition(recognition);
      recognition.start();
      setIsRecording(true);
      setSpokenText("Listening... Speak in English.");
    } catch {
      setSpokenText("Mikrofonni ishga tushirib bo‘lmadi. Brauzer ruxsatini tekshiring.");
      setIsRecording(false);
    }
  };

  const stopRecognition = () => {
    recognition?.stop();
    setIsRecording(false);
  };

  const titleMap: Record<Section, string> = {
    home: "Bosh sahifa", lessons: "Barcha darslar", vocabulary: "Lug‘at mashqi",
    grammar: "Grammatika", listening: "Listening", speaking: "Speaking",
    tests: "Bilimni sinash", ielts: "IELTS tayyorgarlik", progress: "Mening natijalarim",
  };

  const filteredLessons = lessonCards.filter((lesson) => (lesson.title + " " + lesson.subtitle + " " + lesson.level).toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="english-app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <aside className={"sidebar " + (sidebarOpen ? "sidebar-open" : "")}>
        <div className="brand-lockup">
          <div className="brand-icon"><Sparkles size={21} /></div>
          <div><strong>ODIY</strong><em>English</em></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>
        <button className="sidebar-start" onClick={() => changeSection("home")}><Home size={17} /> Bosh sahifa</button>
        <div className="sidebar-caption">O‘RGANISH</div>
        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={section === item.id ? "selected" : ""} onClick={() => changeSection(item.id)}><Icon size={17} /><span>{item.label}</span>{section === item.id && <i />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-streak"><Flame size={18} fill="#ff9d56" /><div><strong>{progress.streak} kunlik seriya</strong><span>Davom et! Zo‘r ketyapsan.</span></div></div>
          <div className="side-profile"><div className="profile-avatar">B</div><div><strong>{progress.name}</strong><span>{progress.level}</span></div><ChevronDown size={16} /></div>
          <small>ODIY English • 1.0.0</small>
        </div>
      </aside>
      {sidebarOpen && <button className="mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>ODIY English</span><ChevronRight size={14} /><strong>{titleMap[section]}</strong></div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={16} /><input value={searchText} onChange={(event) => { setSearchText(event.target.value); if (section !== "lessons") setSection("lessons"); }} placeholder="Dars qidirish..." /></div>
            <div className="top-stat"><Flame size={16} fill="#ff9b4a" /><strong>{progress.streak}</strong></div>
            <div className="top-stat"><Star size={16} fill="#ffd15a" color="#ffd15a" /><strong>{progress.xp} XP</strong></div>
            <button className="profile-mini" onClick={() => changeSection("progress")}>B</button>
          </div>
        </header>

        <section className="page-content">
          {section === "home" && (
            <>
              <div className="welcome-grid">
                <div className="welcome-copy">
                  <span className="eyebrow"><span /> YOUR ENGLISH JOURNEY</span>
                  <h1>Har kuni ozgina,<br /><span>katta natija.</span></h1>
                  <p>Ingliz tilini zerikmasdan, bosqichma-bosqich o‘rgan. ODIY sen bilan har qadamda.</p>
                  <div className="welcome-buttons"><button className="primary-button" onClick={() => changeSection("lessons")}>Darsni boshlash <ArrowRight size={17} /></button><button className="soft-button" onClick={() => changeSection("ielts")}>IELTS tayyorgarlik</button></div>
                  <div className="welcome-metrics"><div><strong>{progress.words}</strong><span>o‘rganilgan so‘z</span></div><div><strong>{progress.completed.length}</strong><span>tugallangan dars</span></div><div><strong>{progress.streak}</strong><span>kunlik seriya</span></div></div>
                </div>
                <div className="tutor-card">
                  <div className="tutor-card-label"><span className="online-dot" /> YOUR AI STUDY BUDDY</div>
                  <AnimeTutor character={character} onChange={setCharacter} />
                  <div className="tutor-card-bottom"><span><Sparkles size={14} /> {character === "reya" ? "Reya" : character === "mika" ? "Mika" : "Yuki"} bilan mashq qil</span><button onClick={() => changeSection("speaking")}>Gaplashish <ArrowRight size={14} /></button></div>
                </div>
              </div>

              <div className="section-heading"><div><span className="eyebrow">LEARNING PATH</span><h2>Qayerdan boshlaymiz?</h2></div><button className="text-link" onClick={() => changeSection("lessons")}>Barcha darslar <ArrowRight size={15} /></button></div>
              <div className="module-grid">
                {modules.map((item) => {
                  const Icon = item.icon;
                  return <button key={item.id} className={"module-card " + item.color} onClick={() => changeSection(item.id)}><div className="module-icon"><Icon size={22} /></div><div className="module-arrow"><ArrowUpRightIcon /></div><strong>{item.title}</strong><span>{item.subtitle}</span><small>{item.count}</small></button>;
                })}
              </div>

              <div className="lower-grid">
                <div className="panel lesson-panel">
                  <div className="panel-heading"><div><span className="eyebrow">CONTINUE LEARNING</span><h3>Davom ettirish</h3></div><button className="icon-button" onClick={() => changeSection("lessons")}><ArrowRight size={17} /></button></div>
                  <div className="continue-lesson"><div className="lesson-emoji">🧩</div><div className="lesson-detail"><small>A2 • GRAMMAR</small><strong>Present Simple Tense</strong><span>Oddiy hozirgi zamon</span><ProgressBar value={progress.completed.includes("present") ? 100 : 48} /></div><button className="round-play" onClick={() => { setActiveLesson("present"); changeSection("lessons"); }}><Play size={16} fill="currentColor" /></button></div>
                </div>
                <div className="panel daily-panel"><div className="panel-heading"><div><span className="eyebrow">WORD OF THE DAY</span><h3>Bugungi so‘z</h3></div><div className="daily-spark"><Lightbulb size={19} /></div></div><div className="daily-word">Resilient</div><div className="phonetic">/rɪˈzɪliənt/ • adjective</div><p>Qiyinchilikdan keyin yana tiklana oladigan, bardoshli.</p><button className="listen-word" onClick={() => speakEnglish("Resilient. She is a resilient person.")}><Volume2 size={15} /> Talaffuzini eshitish</button></div>
              </div>
            </>
          )}

          {section === "lessons" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">YOUR LEARNING PATH</span><h1>O‘rganishni <span>boshlaymiz.</span></h1><p>Darajangga mos darsni tanla. Har bir dars kichik mashqlar va yakuniy testdan iborat.</p></div>
              <div className="level-strip"><div><span>HOZIRGI DARAJA</span><strong>{progress.level}</strong></div><div><span>KEYINGI MAQSAD</span><strong>B1 — Intermediate</strong></div><div><span>JAMI XP</span><strong>{progress.xp} XP</strong></div></div>
              <div className="lesson-list">
                {filteredLessons.map((lesson, index) => <div className="lesson-row" key={lesson.id}><div className="lesson-row-icon">{lesson.icon}</div><div className="lesson-row-content"><div className="lesson-meta"><span>{lesson.level}</span><span>{lesson.tag}</span><span><Clock3 size={12} /> {lesson.duration}</span></div><strong>{lesson.title}</strong><p>{lesson.subtitle}</p></div><div className="lesson-row-status">{progress.completed.includes(lesson.id) ? <span className="completed-label"><Check size={13} /> Tugallangan</span> : <span>{index + 1}-dars</span>}<button className="primary-button small" onClick={() => { setActiveLesson(lesson.id); setLessonDone(false); }}>{progress.completed.includes(lesson.id) ? "Takrorlash" : "Boshlash"} <ArrowRight size={14} /></button></div></div>)}
                {filteredLessons.length === 0 && <div className="empty-state">Bu so‘z bo‘yicha dars topilmadi. Boshqa nom bilan qidirib ko‘r.</div>}
              </div>
              {lessonDone && <div className="success-banner"><CheckCircle2 /> Dars tugadi! +20 XP qo‘shildi.</div>}
              <div className="lesson-detail-panel">
                <div className="lesson-detail-top"><div className="lesson-emoji large">📘</div><div><span className="eyebrow">SELECTED LESSON</span><h3>{lessonCards.find((item) => item.id === activeLesson)?.title || "Present Simple"}</h3><p>Qoidani o‘rgan, misollarni ko‘r va mashqni bajar.</p></div></div>
                <div className="lesson-content-box"><h4>Present Simple — oddiy hozirgi zamon</h4><p>Present Simple odatlar, kundalik ishlar va doimiy holatlar haqida gapirganda ishlatiladi.</p><div className="example-list"><div><b>I / You / We / They</b><span>work, play, study</span><em>I study English every day.</em></div><div><b>He / She / It</b><span>works, plays, studies</span><em>She studies English every day.</em></div></div><div className="lesson-tip"><Lightbulb size={17} /> He, She, It bilan darak gapda fe’lga odatda -s yoki -es qo‘shiladi.</div></div>
                <button className="primary-button" onClick={() => { complete(activeLesson); setLessonDone(true); }}>Darsni tugatish <Check size={16} /></button>
              </div>
            </div>
          )}

          {section === "vocabulary" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">BUILD YOUR WORD POWER</span><h1>So‘z boyligingni <span>oshir.</span></h1><p>So‘zni eslab qol, talaffuzini tingla va uni gapda ishlat.</p></div>
              <div className="vocab-layout">
                <div className="vocab-card-wrap"><div className="flashcard" onClick={() => setShowTranslation(!showTranslation)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setShowTranslation(!showTranslation); }}><div className="flashcard-top"><span>{vocabulary[wordIndex].note}</span><span>{wordIndex + 1} / {vocabulary.length}</span></div><div className="flashcard-word">{showTranslation ? vocabulary[wordIndex].translation : vocabulary[wordIndex].word}</div><div className="flashcard-phonetic">{showTranslation ? "Tarjimasi" : vocabulary[wordIndex].phonetic}</div><div className="flashcard-example">{showTranslation ? vocabulary[wordIndex].example : "Kartani ochish uchun bosing"}</div><span className="flip-hint"><RotateCcw size={14} /> {showTranslation ? "Asl so‘zga qaytish" : "Tarjimani ko‘rish"}</span></div><div className="flashcard-actions"><button className="soft-button" onClick={() => speakEnglish(vocabulary[wordIndex].word)}><Volume2 size={16} /> Talaffuz</button><button className="primary-button" onClick={() => { setWordIndex((wordIndex + 1) % vocabulary.length); setShowTranslation(false); setProgress((old) => ({ ...old, words: old.words + 1, xp: old.xp + 3 })); }}>Keyingi so‘z <ArrowRight size={16} /></button></div></div>
                <div className="panel vocab-side"><span className="eyebrow">TODAY'S WORD SET</span><h3>Bugungi 6 ta so‘z</h3><p>Har bir so‘zni talaffuzi va misoli bilan o‘rgan.</p>{vocabulary.map((item, index) => <button className={"word-list-item " + (index === wordIndex ? "current" : "")} key={item.word} onClick={() => { setWordIndex(index); setShowTranslation(false); }}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.word}</b><small>{item.translation}</small><ChevronRight size={15} /></button>)}</div>
              </div>
            </div>
          )}

          {section === "grammar" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">GRAMMAR MADE SIMPLE</span><h1>Grammatikani <span>oson o‘rgan.</span></h1><p>Qoidani o‘qi, misollarni solishtir va qisqa mashqda bilimni mustahkamla.</p></div>
              <div className="grammar-layout"><div className="panel grammar-theory"><div className="grammar-badge">A2 • TENSES</div><h2>Present Simple</h2><p>Bu zamon odatlar, jadval va o‘zgarmas faktlar uchun ishlatiladi.</p><div className="formula-box"><span>Darak</span><strong>Subject + V1 (he/she/it + s)</strong></div><div className="formula-box"><span>Inkor</span><strong>Subject + do/does + not + V1</strong></div><div className="formula-box"><span>Savol</span><strong>Do/Does + subject + V1?</strong></div><h4>Misollar</h4><ul className="grammar-examples"><li><b>I work</b> from home. <span>Men uydan ishlayman.</span></li><li><b>She works</b> from home. <span>U uydan ishlaydi.</span></li><li><b>Do you work</b> here? <span>Siz shu yerda ishlaysizmi?</span></li><li><b>He doesn't work</b> here. <span>U bu yerda ishlamaydi.</span></li></ul><div className="lesson-tip"><Lightbulb size={17} /> Does ishlatilganda asosiy fe’lga -s qo‘shilmaydi.</div></div><div className="panel grammar-quiz"><span className="eyebrow">QUICK PRACTICE • {grammarIndex + 1}/{grammarQuestions.length}</span><h3>To‘g‘ri javobni tanla</h3><div className="quiz-question">{grammarQuestions[grammarIndex].question}</div><div className="answer-options">{grammarQuestions[grammarIndex].options.map((option, index) => <button key={option} className={grammarAnswer === index ? (index === grammarQuestions[grammarIndex].correct ? "correct" : "wrong") : ""} onClick={() => setGrammarAnswer(index)}>{String.fromCharCode(65 + index)} <span>{option}</span>{grammarAnswer === index && (index === grammarQuestions[grammarIndex].correct ? <Check size={17} /> : <X size={17} />)}</button>)}</div>{grammarAnswer !== null && <div className="explain-box">{grammarAnswer === grammarQuestions[grammarIndex].correct ? "Ajoyib! To‘g‘ri javob." : "Bu safar xato. "}{grammarQuestions[grammarIndex].explain}</div>}<button className="primary-button full" disabled={grammarAnswer === null} onClick={() => { setGrammarAnswer(null); if (grammarIndex === grammarQuestions.length - 1) { setGrammarIndex(0); complete("grammar-present"); } else setGrammarIndex(grammarIndex + 1); }}>Keyingi savol <ArrowRight size={15} /></button></div></div>
            </div>
          )}

          {section === "listening" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">TRAIN YOUR EAR</span><h1>Tingla va <span>tushun.</span></h1><p>Audio matnni eshit, asosiy fikrlarni ajrat va savollarga javob ber.</p></div>
              <div className="panel listening-panel"><div className="audio-art"><div className="audio-orb"><Headphones size={34} /></div><div className="sound-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="audio-info"><span className="eyebrow">A2 • EVERYDAY ENGLISH</span><h2>A day in Alex's life</h2><p>Alexning kundalik hayoti haqida qisqa audio.</p><button className="primary-button" onClick={() => speakEnglish(listeningScript)}><Play size={16} fill="currentColor" /> Audioni tinglash</button><button className="soft-button" onClick={() => window.speechSynthesis?.cancel()}><X size={15} /> To‘xtatish</button></div></div>
              <div className="panel listening-task"><span className="eyebrow">LISTENING CHECK</span><h3>Alex qayerda ishlaydi?</h3><div className="answer-options horizontal">{["In a school", "In a bookshop", "In a hospital"].map((option, index) => <button className={listeningAnswer === index ? (index === 1 ? "correct" : "wrong") : ""} key={option} onClick={() => setListeningAnswer(index)}>{option}</button>)}</div>{listeningAnswer !== null && <div className="explain-box">{listeningAnswer === 1 ? "To‘g‘ri! Alex kichik kitob do‘konida ishlaydi." : "Qayta tinglab ko‘r. Alex “I work in a small bookshop” deydi."}</div>}<div className="transcript-box"><button onClick={() => setShowTranslation(!showTranslation)}><ChevronDown size={15} /> {showTranslation ? "Transcriptni yashirish" : "Transcriptni ko‘rish"}</button>{showTranslation && <p>{listeningScript}</p>}</div></div>
            </div>
          )}

          {section === "speaking" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">SPEAK WITH CONFIDENCE</span><h1>Ovozingni <span>mashq qil.</span></h1><p>Berilgan mavzuda inglizcha gapir. Brauzer ovozingni matnga aylantiradi.</p></div>
              <div className="speaking-layout"><div className="panel speaking-card"><div className="speaking-character"><AnimeTutor character={character} compact /></div><span className="eyebrow">TODAY'S SPEAKING TOPIC</span><h2>{speakingPrompts[progress.completed.length % speakingPrompts.length]}</h2><p>1 daqiqa davomida gapirishga harakat qil. Xatolardan qo‘rqma — mashq qilish muhim.</p><div className="record-controls"><button className={isRecording ? "record-button recording" : "record-button"} onClick={isRecording ? stopRecognition : startRecognition}>{isRecording ? <MicOff size={19} /> : <Mic size={19} />}{isRecording ? "To‘xtatish" : "Gapirishni boshlash"}</button><span>{isRecording ? "Ovoz tinglanmoqda..." : "Mikrofon ruxsati so‘ralishi mumkin"}</span></div></div><div className="panel transcript-panel"><span className="eyebrow">YOUR SPEECH</span><h3>Tanilgan matn</h3><div className="transcript-output">{spokenText || "Mikrofon tugmasini bosib inglizcha gapiring. Tanilgan so‘zlar shu yerda ko‘rinadi."}</div><div className="transcript-actions"><button className="soft-button" onClick={() => setSpokenText("")}><RotateCcw size={15} /> Tozalash</button><button className="primary-button" disabled={!spokenText.trim() || spokenText.startsWith("Mikrofon") || spokenText.startsWith("Bu brauzer")} onClick={() => { complete("speaking-" + progress.completed.length, 15); setSpokenText(spokenText + "\n\nODIY: Mashq uchun rahmat! Keyingi safar gaplaringni yanada ravon qilishga harakat qil."); }}>Mashqni saqlash <Check size={15} /></button></div><div className="lesson-tip"><Lightbulb size={16} /> Bu brauzer nutqni matnga aylantiradi. IELTS Speaking uchun rasmiy Band Score bermaydi.</div></div></div>
            </div>
          )}

          {section === "tests" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">CHECK YOUR KNOWLEDGE</span><h1>Bilimingni <span>sinab ko‘r.</span></h1><p>5 ta savol. Har bir javobdan keyin izoh ko‘rasan.</p></div>
              <div className="panel test-panel">{!testFinished ? <><div className="test-progress-top"><span>ENGLISH LEVEL CHECK</span><strong>{testIndex + 1} / {testQuestions.length}</strong></div><ProgressBar value={(testIndex / testQuestions.length) * 100} /><h2>{testQuestions[testIndex].question}</h2><div className="answer-options">{testQuestions[testIndex].options.map((option, index) => <button key={option} className={testAnswers[testIndex] === index ? "chosen" : ""} onClick={() => setTestAnswers((old) => { const next = [...old]; next[testIndex] = index; return next; })}>{String.fromCharCode(65 + index)} <span>{option}</span>{testAnswers[testIndex] === index && <Check size={16} />}</button>)}</div><div className="test-footer"><span>{testAnswers.filter((item) => item !== undefined).length} ta javob belgilandi</span><button className="primary-button" disabled={testAnswers[testIndex] === undefined} onClick={() => { if (testIndex === testQuestions.length - 1) { setTestFinished(true); const score = testAnswers.reduce((sum, answer, index) => sum + (answer === testQuestions[index].correct ? 1 : 0), 0); complete("general-test-" + Date.now(), score * 10); } else setTestIndex(testIndex + 1); }}>{testIndex === testQuestions.length - 1 ? "Natijani ko‘rish" : "Keyingi savol"} <ArrowRight size={15} /></button></div></> : <div className="test-result"><div className="result-trophy"><Trophy size={36} /></div><span className="eyebrow">TEST COMPLETED</span><h2>Test yakunlandi!</h2><strong>{testAnswers.reduce((sum, answer, index) => sum + (answer === testQuestions[index].correct ? 1 : 0), 0)} / {testQuestions.length}</strong><p>To‘g‘ri javoblar soni. Har bir xatodan yangi narsa o‘rganish mumkin.</p><div className="result-review">{testQuestions.map((item, index) => <div key={item.question}><span>{testAnswers[index] === item.correct ? <Check color="#5cd5a2" /> : <X color="#ff819a" />}</span><div><b>{item.question}</b><small>To‘g‘ri javob: {item.options[item.correct]}</small><em>{item.explain}</em></div></div>)}</div><button className="primary-button" onClick={() => { setTestIndex(0); setTestAnswers([]); setTestFinished(false); }}>Qayta ishlash <RotateCcw size={15} /></button></div>}</div>
            </div>
          )}

          {section === "ielts" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">IELTS PREPARATION HUB</span><h1>IELTS maqsadingga <span>yaqinlash.</span></h1><p>To‘rt ko‘nikma bo‘yicha mashqlar, strategiyalar va sinov topshiriqlari.</p></div>
              <div className="ielts-hero"><div><span className="eyebrow">YOUR TARGET BAND</span><h2>Band <span>7.0</span></h2><p>Reja asosida muntazam tayyorlan.</p></div><div className="ielts-ring"><strong>0.0</strong><span>practice score</span></div></div>
              <div className="ielts-tabs">{(["reading", "listening", "writing", "speaking"] as const).map((item) => <button className={ieltsTab === item ? "active" : ""} key={item} onClick={() => setIeltsTab(item)}>{item === "reading" ? <BookOpen /> : item === "listening" ? <Headphones /> : item === "writing" ? <BookText /> : <Mic />}{item}</button>)}</div>
              <div className="panel ielts-task">
                {ieltsTab === "reading" && <><span className="eyebrow">IELTS READING • PRACTICE</span><h3>Why short breaks improve learning</h3><p>Read the passage and answer the questions. In a full IELTS test, Reading includes several passages and a strict time limit.</p><div className="reading-passage">{readingText}</div>{readingQuestions.map((q, index) => <div className="ielts-question" key={q.question}><b>{index + 1}. {q.question}</b><div className="answer-options compact-options">{q.options.map((option, optionIndex) => <button className={readingAnswers[index] === optionIndex ? "chosen" : ""} key={option} onClick={() => setReadingAnswers((old) => { const next = [...old]; next[index] = optionIndex; return next; })}>{option}</button>)}</div></div>)}<button className="primary-button" onClick={() => { const score = readingAnswers.reduce((sum, answer, index) => sum + (answer === readingQuestions[index].correct ? 1 : 0), 0); complete("ielts-reading-" + Date.now(), score * 10); }}>Reading mashqini tugatish <Check size={15} /></button></>}
                {ieltsTab === "listening" && <><span className="eyebrow">IELTS LISTENING • PRACTICE</span><h3>Everyday conversation</h3><p>Matnni audio orqali tingla va asosiy ma’lumotlarni yozib ol. Bu namuna to‘liq IELTS testi emas.</p><div className="audio-mini"><AudioLines size={23} /><div><b>Practice audio</b><small>2 daqiqalik tinglash mashqi</small></div><button className="round-play" onClick={() => speakEnglish(listeningScript)}><Play size={14} fill="currentColor" /></button></div><button className="soft-button" onClick={() => window.speechSynthesis?.cancel()}>Audio to‘xtatish</button><div className="ielts-question"><b>Alex qaysi transportdan foydalanadi?</b><div className="answer-options compact-options">{["Car", "Bus", "Train"].map((option, index) => <button className={listeningAnswer === index ? "chosen" : ""} key={option} onClick={() => setListeningAnswer(index)}>{option}</button>)}</div>{listeningAnswer !== null && <div className="explain-box">{listeningAnswer === 1 ? "To‘g‘ri: “I walk to the bus stop.”" : "Yana bir bor tingla: Alex bekatgacha piyoda yuradi va avtobusga chiqadi."}</div>}</div></>}
                {ieltsTab === "writing" && <><span className="eyebrow">IELTS WRITING • TASK 2</span><h3>Essay practice</h3><p>Some people believe that online learning is more effective than traditional classroom learning. To what extent do you agree or disagree?</p><div className="writing-guidance"><b>Maslahat</b><span>Fikr bildir, ikki asosiy dalil keltir va xulosada pozitsiyangni takrorla. Tavsiya etilgan hajm: 250+ so‘z.</span></div><textarea className="essay-input" value={writingText} onChange={(event) => setWritingText(event.target.value)} placeholder="Write your essay here..." /><div className="essay-footer"><span>{writingText.trim() ? writingText.trim().split(/\s+/).length : 0} words</span><button className="primary-button" onClick={() => { complete("ielts-writing-" + Date.now(), 15); }}>Draftni saqlash <Check size={15} /></button></div><div className="lesson-tip"><Lightbulb size={16} /> Hozircha avtomatik Band Score yo‘q. Bu mashq yozgan matningni saqlash uchun.</div></>}
                {ieltsTab === "speaking" && <><span className="eyebrow">IELTS SPEAKING • PART 2</span><h3>Describe a skill you learned</h3><p>You should say what the skill is, when you learned it, how you learned it, and explain why it is useful.</p><div className="speaking-timer"><Clock3 size={18} /> 1 minute to prepare • 1–2 minutes to speak</div><button className="record-button" onClick={isRecording ? stopRecognition : startRecognition}>{isRecording ? <MicOff size={18} /> : <Mic size={18} />}{isRecording ? "Stop recording" : "Start speaking"}</button><div className="transcript-output">{spokenText || "Your recognised speech will appear here."}</div><div className="lesson-tip"><Lightbulb size={16} /> Bu mashqda javobingni mashq qilasan. Rasmiy IELTS band bahosi berilmaydi.</div></>}
              </div>
            </div>
          )}

          {section === "progress" && (
            <div className="section-view">
              <div className="page-intro"><span className="eyebrow">YOUR ACHIEVEMENTS</span><h1>Natijalaring <span>o‘smoqda.</span></h1><p>O‘rganish jarayoningni kuzat va keyingi maqsadni belgilab ol.</p></div>
              <div className="stats-grid"><div className="panel stat-card"><Flame color="#ff9d56" /><strong>{progress.streak}</strong><span>Kunlik seriya</span></div><div className="panel stat-card"><Star color="#ffd15a" /><strong>{progress.xp}</strong><span>To‘plangan XP</span></div><div className="panel stat-card"><BookText color="#e29bff" /><strong>{progress.words}</strong><span>O‘rganilgan so‘z</span></div><div className="panel stat-card"><Trophy color="#80d8c3" /><strong>{progress.completed.length}</strong><span>Tugallangan dars</span></div></div>
              <div className="panel progress-detail"><span className="eyebrow">CURRENT LEVEL</span><h2>{progress.level}</h2><p>Keyingi darajaga o‘tish uchun har kuni kichik mashqlarni bajaring.</p><ProgressBar value={Math.min(100, (progress.xp % 500) / 5)} /><div className="progress-line-labels"><span>{progress.xp % 500} / 500 XP</span><span>B1 — Intermediate</span></div></div>
              <div className="panel profile-settings"><div><span className="eyebrow">PROFILE</span><h3>Ismingni o‘zgartir</h3><p>Darslar sahifasida ko‘rinadigan ism.</p></div><input value={progress.name} onChange={(event) => setProgress((old) => ({ ...old, name: event.target.value.slice(0, 24) }))} placeholder="Isming" /></div>
              <div className="panel reset-panel"><div><strong>O‘quv natijalarini tozalash</strong><p>Bu amal faqat shu brauzerda saqlangan XP va tugallangan darslarni o‘chiradi.</p></div><button className="soft-button danger" onClick={() => { setProgress(initialProgress); localStorage.removeItem(STORAGE_KEY); }}>Tozalash <RotateCcw size={14} /></button></div>
            </div>
          )}
        </section>
        <footer className="page-footer"><span>© 2026 ODIY English</span><span>Learn a little every day <Heart size={11} fill="currentColor" /></span><span>Made for curious minds</span></footer>
      </main>
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={16} />;
}
