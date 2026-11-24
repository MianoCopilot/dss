import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Download,
  Mic,
  MicOff,
  Moon,
  Paperclip,
  Send,
  Settings,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { chatWithNora, editNoraLook, seePhoto } from "@/lib/nora.functions";
import {
  EMOTIONS,
  MODE_LABEL,
  REF_PORTRAIT,
  SCENE_LABEL,
  SCENE_OUTFIT,
  SCENE_PLACE,
  WARDROBE,
  absorbMemory,
  buildLookPrompt,
  danceLine,
  demoReply,
  detectEmotion,
  emptyMemory,
  gapLine,
  interpret,
  isBlocked,
  guessLook,
  memoryBrief,
  refusalLine,
  silenceLine,
  wantsPhoto,
  type Address,
  type ChatMsg,
  type DiaryEntry,
  type EmotionId,
  type Look,
  type Memory,
  type Mode,
  type SceneId,
} from "@/lib/nora-model";
import { PortraitStage } from "@/components/nora/PortraitStage";

type Phase = "idle" | "speak" | "listen";
type Panel = "memory" | "diary" | "settings" | null;

type Persisted = {
  mode: Mode;
  address: Address;
  theme: "light" | "dark";
  voiceOn: boolean;
  micOn: boolean;
  loopOn: boolean;
  rate: number;
  voiceURI: string;
  memory: Memory;
  diary: DiaryEntry[];
  messages: ChatMsg[];
  lastActive: number;
  lastTopic: string;
  wardrobeIndex: number;
  scene: SceneId;
  outfitLabel: string;
  portrait: string;
  reference: string;
  proactiveDay: string;
  proactiveCount: number;
};

const KEY = "nora-v1";

const DEFAULTS: Persisted = {
  mode: "bliska",
  address: "on",
  theme: "light",
  voiceOn: true,
  micOn: false,
  loopOn: false,
  rate: 1,
  voiceURI: "",
  memory: emptyMemory(),
  diary: [],
  messages: [
    {
      id: "hello",
      role: "nora",
      text: "Jestem Nora. Pisz albo mów — zostanę.",
      at: 0,
    },
  ],
  lastActive: 0,
  lastTopic: "",
  wardrobeIndex: 0,
  scene: "pokoj",
  outfitLabel: "niebiesko-szary sweter",
  portrait: REF_PORTRAIT,
  reference: REF_PORTRAIT,
  proactiveDay: "",
  proactiveCount: 0,
};

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function uid(): string {
  return crypto.randomUUID();
}

function noraMsg(text: string, extra?: Partial<ChatMsg>): ChatMsg {
  return { id: uid(), role: "nora", text, at: Date.now(), ...extra };
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const memory = { ...emptyMemory(), ...(parsed.memory ?? {}) };
    const next: Persisted = {
      ...DEFAULTS,
      ...parsed,
      memory,
      messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : DEFAULTS.messages,
      diary: Array.isArray(parsed.diary) ? parsed.diary : [],
    };
    if (next.lastActive > 0 && Date.now() - next.lastActive > 30 * 60 * 1000 && next.lastTopic) {
      next.messages = [
        ...next.messages,
        { id: uid(), role: "nora" as const, text: gapLine(next.lastTopic), at: Date.now() },
      ];
      next.lastActive = Date.now();
    }
    return next;
  } catch {
    return DEFAULTS;
  }
}

function slim(state: Persisted): Persisted {
  return {
    ...state,
    messages: state.messages.slice(-80).map((message) => ({
      ...message,
      image:
        message.image && message.image.startsWith("data:") && message.image.length > 180_000
          ? undefined
          : message.image,
    })),
    reference:
      state.reference.startsWith("data:") && state.reference.length > 500_000 ? REF_PORTRAIT : state.reference,
  };
}

async function shrinkFromSrc(src: string, max = 720): Promise<string> {
  const response = await fetch(src);
  const blob = await response.blob();
  return shrinkBlob(blob, max);
}

async function shrinkBlob(blob: Blob, max = 720): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}

function getRec(): Rec | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function NoraApp() {
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [emotion, setEmotion] = useState<EmotionId>("spokoj");
  const [dancing, setDancing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [installEvent, setInstallEvent] = useState<Event | null>(null);
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  const recRef = useRef<Rec | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  stateRef.current = state;

  useEffect(() => {
    setState(loadPersisted());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(slim(state)));
    } catch {
      /* pełna pamięć telefonu — czat zostaje w tej sesji */
    }
  }, [state, ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [state.messages.length, state.messages.at(-1)?.image, busy]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices?.() ?? []);
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/nora-sw.js");
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "hidden" || busyRef.current) return;
      void nudge();
    }, 3 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [ready, state.messages.length, state.lastActive]);

  function speak(text: string) {
    const current = stateRef.current;
    if (!current.voiceOn || !window.speechSynthesis) {
      setPhase("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pl-PL";
    utterance.rate = current.rate;
    const voice = window.speechSynthesis.getVoices().find((item) => item.voiceURI === current.voiceURI);
    if (voice) utterance.voice = voice;
    setPhase("speak");
    utterance.onend = () => {
      setPhase("idle");
      if (stateRef.current.loopOn && stateRef.current.micOn) startListen();
    };
    utterance.onerror = () => setPhase("idle");
    window.speechSynthesis.speak(utterance);
  }

  function startListen() {
    const rec = getRec();
    if (!rec) return;
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript ?? "";
      if (text.trim()) void send(text.trim());
    };
    rec.onerror = () => setPhase("idle");
    rec.onend = () => setPhase((value) => (value === "listen" ? "idle" : value));
    recRef.current = rec;
    setPhase("listen");
    try {
      rec.start();
    } catch {
      setPhase("idle");
    }
  }

  function stopListen() {
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setPhase("idle");
  }

  function pushNora(text: string, extra?: Partial<ChatMsg>) {
    setState((current) => ({
      ...current,
      lastActive: Date.now(),
      messages: [
        ...current.messages,
        noraMsg(text, extra),
      ].slice(-80),
    }));
  }

  async function nudge() {
    const current = stateRef.current;
    const day = new Date().toISOString().slice(0, 10);
    const count = current.proactiveDay === day ? current.proactiveCount : 0;
    if (count >= 3) {
      const line = silenceLine(current.mode, current.memory);
      pushNora(line);
      speak(line);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const history = current.messages
      .filter((message) => message.text)
      .slice(-8)
      .map((message) => ({
        role: message.role === "nora" ? ("assistant" as const) : ("user" as const),
        content: message.text,
      }));
    let line = silenceLine(current.mode, current.memory);
    let diary = "";
    let nextEmotion = emotion;
    let demo = true;
    try {
      const res = await chatWithNora({
        data: {
          messages: history,
          mode: current.mode,
          memory: memoryBrief(current.memory),
          address: current.address,
          proactive: true,
          topic: current.lastTopic,
          currentLook: `${current.outfitLabel}, ${current.scene}`,
        },
      });
      if (res.ok) {
        line = res.reply;
        diary = res.diary;
        nextEmotion = res.emotion;
        demo = false;
      }
    } catch {
      /* local line */
    }
    setEmotion(nextEmotion);
    setState((prev) => ({
      ...prev,
      proactiveDay: day,
      proactiveCount: count + 1,
      lastActive: Date.now(),
      diary:
        diary && diary !== prev.diary.at(-1)?.text
          ? [...prev.diary, { id: uid(), at: Date.now(), text: diary }].slice(-40)
          : prev.diary,
      messages: [
        ...prev.messages,
        noraMsg(line, { demo }),
      ].slice(-80),
    }));
    speak(line);
    busyRef.current = false;
    setBusy(false);
  }

  async function requestLook(look: Look, messageId: string) {
    if (isBlocked(`${look.outfit} ${look.place} ${look.label}`)) {
      const line = refusalLine(stateRef.current.mode);
      setState((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.id === messageId ? { ...message, pendingShot: false } : message,
        ),
      }));
      pushNora(line);
      speak(line);
      return;
    }
    setShot(true);
    try {
      const imageDataUrl = await shrinkFromSrc(stateRef.current.reference || REF_PORTRAIT);
      const img = await editNoraLook({
        data: { prompt: buildLookPrompt(look.outfit, look.place), imageDataUrl },
      });
      if (img.ok) {
        let shown = img.url;
        try {
          shown = await shrinkFromSrc(img.url, 640);
        } catch {
          shown = img.url;
        }
        setState((current) => ({
          ...current,
          portrait: shown,
          outfitLabel: look.label || current.outfitLabel,
          messages: current.messages.map((message) =>
            message.id === messageId ? { ...message, image: shown, pendingShot: false } : message,
          ),
        }));
      } else {
        setState((current) => ({
          ...current,
          messages: current.messages.map((message) =>
            message.id === messageId ? { ...message, pendingShot: false } : message,
          ),
        }));
        pushNora(img.error);
      }
    } catch {
      setState((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.id === messageId ? { ...message, pendingShot: false } : message,
        ),
      }));
      pushNora("Nie mogę teraz zrobić zdjęcia. Zostaję w tym, co mam na sobie.");
    }
    setShot(false);
  }

  async function send(text: string, preset?: Look) {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const current = stateRef.current;
    const intent = preset ? ({ type: "chat" } as const) : interpret(trimmed);
    let memory = absorbMemory(trimmed, current.memory);
    if (intent.type === "remember") {
      memory = { ...memory, notes: [...memory.notes, intent.note].slice(-24) };
    }
    const userMsg: ChatMsg = { id: uid(), role: "user", text: trimmed, at: Date.now() };
    let scene = current.scene;
    let wardrobeIndex = current.wardrobeIndex;
    let outfitLabel = current.outfitLabel;
    let look = preset ?? null;
    if (!look && intent.type === "cycle") {
      wardrobeIndex = (current.wardrobeIndex + 1) % WARDROBE.length;
      const item = WARDROBE[wardrobeIndex]!;
      outfitLabel = item.label;
      look = { outfit: item.prompt, place: SCENE_PLACE[scene], label: item.label };
    } else if (!look && intent.type === "wear") {
      outfitLabel = intent.outfit;
      look = {
        outfit: `modest fully covering clothes described as: ${intent.outfit}. Use trousers, a skirt or a dress.`,
        place: SCENE_PLACE[scene],
        label: intent.outfit,
      };
    } else if (!look && intent.type === "scene") {
      scene = intent.scene;
      const pack = SCENE_OUTFIT[scene];
      outfitLabel = pack.label;
      look = { outfit: pack.prompt, place: SCENE_PLACE[scene], label: pack.label };
    } else if (!look && intent.type === "look") {
      const pack = WARDROBE[wardrobeIndex] ?? SCENE_OUTFIT[scene];
      look = { outfit: pack.prompt, place: SCENE_PLACE[scene], label: outfitLabel };
    }

    setState((prev) => ({
      ...prev,
      memory,
      scene,
      wardrobeIndex,
      outfitLabel,
      lastTopic: trimmed.slice(0, 180),
      lastActive: Date.now(),
      messages: [...prev.messages, userMsg].slice(-80),
    }));

    if (intent.type === "dance") {
      setDancing(true);
      const line = danceLine(current.mode);
      pushNora(line);
      speak(line);
      window.setTimeout(() => setDancing(false), 8000);
      busyRef.current = false;
      setBusy(false);
      return;
    }
    if (intent.type === "refuse") {
      const line = refusalLine(current.mode);
      pushNora(line);
      speak(line);
      busyRef.current = false;
      setBusy(false);
      return;
    }

    const history = [...current.messages, userMsg]
      .filter((message) => message.text)
      .slice(-10)
      .map((message) => ({
        role: message.role === "nora" ? ("assistant" as const) : ("user" as const),
        content: message.text,
      }));

    let reply = "";
    let nextEmotion = detectEmotion(trimmed);
    let diary = "";
    let demo = false;
    let modelPhoto: Look | null = null;
    try {
      const res = await chatWithNora({
        data: {
          messages: history,
          mode: current.mode,
          memory: memoryBrief(memory),
          address: current.address,
          proactive: false,
          topic: current.lastTopic,
          currentLook: `${outfitLabel}, ${scene}`,
        },
      });
      if (res.ok) {
        reply = res.reply;
        nextEmotion = res.emotion;
        diary = res.diary;
        modelPhoto = res.photo;
      } else {
        const fallback = demoReply({ mode: current.mode, text: trimmed, memory, address: current.address });
        reply = fallback.reply;
        nextEmotion = fallback.emotion;
        diary = fallback.diary;
        demo = true;
      }
    } catch {
      const fallback = demoReply({ mode: current.mode, text: trimmed, memory, address: current.address });
      reply = fallback.reply;
      nextEmotion = fallback.emotion;
      diary = fallback.diary;
      demo = true;
    }

    if (!look && modelPhoto) look = modelPhoto;
    if (!look && wantsPhoto(trimmed)) look = guessLook(trimmed, scene);
    if (look) outfitLabel = look.label;

    const replyId = uid();
    setEmotion(nextEmotion);
    setState((prev) => ({
      ...prev,
      outfitLabel,
      lastActive: Date.now(),
      diary:
        diary && diary !== prev.diary.at(-1)?.text
          ? [...prev.diary, { id: uid(), at: Date.now(), text: diary }].slice(-40)
          : prev.diary,
      messages: [
        ...prev.messages,
        { ...noraMsg(reply, { demo, pendingShot: Boolean(look) }), id: replyId },
      ].slice(-80),
    }));
    speak(reply);
    if (look) await requestLook(look, replyId);
    busyRef.current = false;
    setBusy(false);
  }

  async function onPhoto(file: File) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const imageDataUrl = await shrinkBlob(file, 768);
      const userMsg: ChatMsg = {
        id: uid(),
        role: "user",
        text: "Przesyłam zdjęcie.",
        image: imageDataUrl,
        at: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        lastActive: Date.now(),
        messages: [...prev.messages, userMsg].slice(-80),
      }));
      const seen = await seePhoto({ data: { imageDataUrl } });
      if (!seen.ok) {
        const line = "Widzę zdjęcie, ale nie odczytam teraz szczegółów.";
        pushNora(line, { demo: true });
        speak(line);
      } else {
        const place = seen.place || "to miejsce";
        const clothing = seen.clothing || "podobny, skromny strój";
        const blocked = isBlocked(`${place} ${clothing}`);
        pushNora(seen.caption, blocked ? undefined : { actions: { place, clothing } });
        speak(seen.caption);
      }
    } catch {
      pushNora("Nie umiem otworzyć tego pliku.");
    }
    busyRef.current = false;
    setBusy(false);
  }

  async function onReference(file: File) {
    try {
      const imageDataUrl = await shrinkBlob(file, 900);
      setState((prev) => ({ ...prev, reference: imageDataUrl, portrait: imageDataUrl }));
      setPanel(null);
    } catch {
      pushNora("Nie umiem przyjąć tego zdjęcia postaci.");
    }
  }

  const polishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("pl"));
  const field =
    "w-full rounded-xl border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-copper";

  return (
    <main className={state.theme === "dark" ? "dark-app nora-shell" : "nora-shell"}>
      <PortraitStage
        src={state.portrait}
        scene={state.scene}
        emotion={emotion}
        phase={phase}
        dancing={dancing}
        busy={busy || shot}
        outfit={state.outfitLabel}
      />
      <section className="flex min-h-0 flex-col bg-paper">
        <header className="flex items-center gap-2 border-b border-line px-3 py-2">
          <div className="flex min-w-0 flex-1 rounded-full border border-line bg-card p-1">
            {(Object.keys(MODE_LABEL) as Mode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={
                  state.mode === mode
                    ? "h-9 flex-1 rounded-full bg-copper px-2 text-sm text-oncopper"
                    : "h-9 flex-1 rounded-full px-2 text-sm text-muted"
                }
                onClick={() => setState((prev) => ({ ...prev, mode }))}
              >
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>
          <IconButton label="Pamięć" onClick={() => setPanel("memory")}>
            <Brain className="size-5" />
          </IconButton>
          <IconButton label="Pamiętnik" onClick={() => setPanel("diary")}>
            <BookOpen className="size-5" />
          </IconButton>
          <IconButton label="Ustawienia" onClick={() => setPanel("settings")}>
            <Settings className="size-5" />
          </IconButton>
        </header>
        <div ref={scrollerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {state.messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-8 rounded-2xl bg-slate px-3 py-2 text-oncopper"
                  : "mr-8 rounded-2xl border border-line bg-card px-3 py-2 text-ink"
              }
            >
              <p className="text-pretty text-[0.98rem] leading-relaxed">{message.text}</p>
              {message.demo ? <p className="mt-1 text-xs opacity-70">tryb demo</p> : null}
              {message.pendingShot && !message.image ? (
                <div className="mt-2 flex h-40 items-end rounded-xl bg-line px-3 py-3 text-sm text-muted">
                  Nora robi zdjęcie…
                </div>
              ) : null}
              {message.image ? (
                <img
                  src={message.image}
                  alt="Zdjęcie Nory"
                  referrerPolicy="no-referrer"
                  className="mt-2 max-h-80 w-full rounded-xl object-cover"
                />
              ) : null}
              {message.actions ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="h-11 rounded-full border border-line px-3 text-sm"
                    onClick={() =>
                      void send("Przenieś nas tam.", {
                        outfit: SCENE_OUTFIT[state.scene].prompt,
                        place: message.actions!.place,
                        label: state.outfitLabel,
                      })
                    }
                  >
                    Przenieś nas tam
                  </button>
                  <button
                    type="button"
                    className="h-11 rounded-full border border-line px-3 text-sm"
                    onClick={() =>
                      void send("Ubierz się podobnie.", {
                        outfit: `modest fully covering clothes similar to: ${message.actions!.clothing}`,
                        place: SCENE_PLACE[state.scene],
                        label: "podobny strój",
                      })
                    }
                  >
                    Ubierz się podobnie
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {busy ? <p className="text-sm text-muted">Nora pisze…</p> : null}
          {shot ? <p className="text-sm text-muted">Nora robi zdjęcie…</p> : null}
          <div ref={bottomRef} />
        </div>
        <form
          className="flex items-end gap-2 border-t border-line px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft;
            setDraft("");
            void send(text);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onPhoto(file);
            }}
          />
          <IconButton label="Dodaj zdjęcie" onClick={() => fileRef.current?.click()}>
            <Paperclip className="size-5" />
          </IconButton>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Wiadomość</span>
            <textarea
              value={draft}
              rows={1}
              placeholder="Napisz do Nory"
              className="max-h-28 w-full resize-none rounded-2xl border border-line bg-card px-3 py-3 text-base text-ink outline-none focus:border-copper"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  const text = draft;
                  setDraft("");
                  void send(text);
                }
              }}
            />
          </label>
          <IconButton
            label={state.micOn ? "Wyłącz mikrofon" : "Włącz mikrofon"}
            onClick={() => {
              setState((prev) => ({ ...prev, micOn: !prev.micOn }));
              if (state.micOn) stopListen();
              else startListen();
            }}
          >
            {state.micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </IconButton>
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="inline-flex size-11 items-center justify-center rounded-full bg-copper text-oncopper disabled:opacity-40"
            aria-label="Wyślij"
          >
            <Send className="size-5" />
          </button>
        </form>
      </section>
      {panel ? (
        <div className="fixed inset-0 z-20 bg-ink/40" onClick={() => setPanel(null)} role="presentation">
          <div
            className="nora-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={panel === "memory" ? "Pamięć" : panel === "diary" ? "Pamiętnik" : "Ustawienia"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl">
                {panel === "memory" ? "Pamięć" : panel === "diary" ? "Pamiętnik" : "Ustawienia"}
              </h2>
              <IconButton label="Zamknij" onClick={() => setPanel(null)}>
                <X className="size-5" />
              </IconButton>
            </div>
            {panel === "memory" ? (
              <div className="space-y-3">
                <Field label="Imię" value={state.memory.name} onChange={(name) => patchMemory({ name })} />
                <Field label="Lubię" value={state.memory.likes} onChange={(likes) => patchMemory({ likes })} />
                <Field label="Boję się" value={state.memory.fears} onChange={(fears) => patchMemory({ fears })} />
                <Field label="Mieszkam" value={state.memory.home} onChange={(home) => patchMemory({ home })} />
                <Field label="Pracuję" value={state.memory.work} onChange={(work) => patchMemory({ work })} />
                <div>
                  <p className="mb-2 text-sm text-muted">Zapamiętane</p>
                  <ul className="space-y-2">
                    {state.memory.notes.length === 0 ? <li className="text-sm text-muted">Pusto. Powiedz „zapamiętaj …”.</li> : null}
                    {state.memory.notes.map((note, index) => (
                      <li key={`${note}-${index}`} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                        <span className="text-sm">{note}</span>
                        <button
                          type="button"
                          className="inline-flex size-11 items-center justify-center"
                          aria-label="Usuń notatkę"
                          onClick={() =>
                            patchMemory({ notes: state.memory.notes.filter((_, item) => item !== index) })
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
            {panel === "diary" ? (
              <ul className="space-y-3">
                {state.diary.length === 0 ? (
                  <li className="text-sm text-muted">Nora jeszcze nic nie zapisała. Porozmawiaj chwilę.</li>
                ) : null}
                {state.diary.map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-line px-3 py-3">
                    <p className="text-pretty text-sm leading-relaxed">{entry.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <time className="text-xs text-muted" dateTime={new Date(entry.at).toISOString()}>
                        {new Date(entry.at).toLocaleString("pl-PL", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </time>
                      <button
                        type="button"
                        className="text-sm text-muted"
                        onClick={() =>
                          setState((prev) => ({ ...prev, diary: prev.diary.filter((item) => item.id !== entry.id) }))
                        }
                      >
                        Usuń
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {panel === "settings" ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line"
                    onClick={() => setState((prev) => ({ ...prev, voiceOn: !prev.voiceOn }))}
                  >
                    {state.voiceOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                    Czytanie
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line"
                    onClick={() => setState((prev) => ({ ...prev, loopOn: !prev.loopOn, micOn: prev.loopOn ? prev.micOn : true }))}
                  >
                    Pętla {state.loopOn ? "wł." : "wył."}
                  </button>
                </div>
                <label className="block text-sm">
                  Tempo mowy
                  <input
                    type="range"
                    min={0.8}
                    max={1.25}
                    step={0.05}
                    value={state.rate}
                    className="mt-2 w-full"
                    onChange={(event) => setState((prev) => ({ ...prev, rate: Number(event.target.value) }))}
                  />
                </label>
                <label className="block text-sm">
                  Głos
                  <select
                    className={`${field} mt-1`}
                    value={state.voiceURI}
                    onChange={(event) => setState((prev) => ({ ...prev, voiceURI: event.target.value }))}
                  >
                    <option value="">Domyślny polski</option>
                    {polishVoices.map((voice) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="mb-2 text-sm">Zwracaj się</p>
                  <div className="flex gap-2">
                    {(["on", "ona"] as Address[]).map((address) => (
                      <button
                        key={address}
                        type="button"
                        className={
                          state.address === address
                            ? "h-11 flex-1 rounded-full bg-copper text-oncopper"
                            : "h-11 flex-1 rounded-full border border-line"
                        }
                        onClick={() => setState((prev) => ({ ...prev, address }))}
                      >
                        {address}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line"
                  onClick={() => setState((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }))}
                >
                  {state.theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {state.theme === "dark" ? "Jasny" : "Ciemny"}
                </button>
                <label className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-line text-sm">
                  Inne zdjęcie postaci
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void onReference(file);
                    }}
                  />
                </label>
                {installEvent ? (
                  <button
                    type="button"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate text-oncopper"
                    onClick={() => {
                      const prompt = installEvent as unknown as { prompt: () => void };
                      prompt.prompt();
                      setInstallEvent(null);
                    }}
                  >
                    <Download className="size-4" />
                    Zainstaluj na ekranie
                  </button>
                ) : (
                  <p className="text-sm text-muted">
                    Na Androidzie: menu przeglądarki, potem „Dodaj do ekranu głównego”.
                  </p>
                )}
                <button
                  type="button"
                  className="h-11 w-full rounded-full border border-line text-sm"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      messages: DEFAULTS.messages,
                      lastTopic: "",
                    }))
                  }
                >
                  Wyczyść rozmowę
                </button>
                <p className="text-xs text-muted">
                  Scena: {SCENE_LABEL[state.scene]}. Emocja: {EMOTIONS[emotion].label}. Pamięć zostaje na tym urządzeniu.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );

  function patchMemory(partial: Partial<Memory>) {
    setState((prev) => ({ ...prev, memory: { ...prev.memory, ...partial } }));
  }
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink"
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-copper"
      />
    </label>
  );
}
