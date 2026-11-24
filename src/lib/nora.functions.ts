import { createServerFn } from "@tanstack/react-start";
import { foldEmotion, isBlocked, type EmotionId, type Look, type Mode } from "@/lib/nora-model";

type ChatIn = {
  messages: { role: "user" | "assistant"; content: string }[];
  mode: Mode;
  memory: string;
  address: "on" | "ona";
  proactive: boolean;
  topic: string;
  currentLook: string;
};

type SeeIn = { imageDataUrl: string };
type EditIn = { prompt: string; imageDataUrl: string };

const chatHits: number[] = [];
const imageHits: number[] = [];

function allow(bucket: number[], limit: number, windowMs: number): boolean {
  const now = Date.now();
  while (bucket.length && bucket[0]! < now - windowMs) bucket.shift();
  if (bucket.length >= limit) return false;
  bucket.push(now);
  return true;
}

function asChat(input: unknown): ChatIn {
  if (!input || typeof input !== "object") throw new Error("Złe dane");
  const raw = input as Partial<ChatIn>;
  const mode = raw.mode === "bliska" || raw.mode === "ostra" || raw.mode === "cicha" ? raw.mode : "cicha";
  const address = raw.address === "ona" ? "ona" : "on";
  const messages = Array.isArray(raw.messages) ? raw.messages.slice(-12) : [];
  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  return {
    messages: clean,
    mode,
    memory: typeof raw.memory === "string" ? raw.memory.slice(0, 1200) : "",
    address,
    proactive: raw.proactive === true,
    topic: typeof raw.topic === "string" ? raw.topic.slice(0, 180) : "",
    currentLook: typeof raw.currentLook === "string" ? raw.currentLook.slice(0, 180) : "",
  };
}

function asImage(input: unknown): string {
  if (!input || typeof input !== "object") throw new Error("Złe zdjęcie");
  const url = (input as SeeIn).imageDataUrl;
  if (typeof url !== "string" || !url.startsWith("data:image/") || url.length > 1_400_000) {
    throw new Error("Złe zdjęcie");
  }
  return url;
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "object" && part && "text" in part) return String((part as { text: unknown }).text ?? "");
        return "";
      })
      .join("");
  }
  return "";
}

function parseReply(raw: string): { reply: string; emotion: EmotionId; diary: string; photo: Look | null } {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  try {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    const json = JSON.parse(trimmed.slice(start, end + 1)) as {
      reply?: unknown;
      emotion?: unknown;
      diary?: unknown;
      photo?: unknown;
    };
    const reply = typeof json.reply === "string" ? json.reply.trim() : "";
    if (!reply) throw new Error("pusto");
    return {
      reply: reply.slice(0, 1200),
      emotion: foldEmotion(typeof json.emotion === "string" ? json.emotion : ""),
      diary: typeof json.diary === "string" ? json.diary.trim().slice(0, 280) : "",
      photo: readPhoto(json.photo),
    };
  } catch {
    return { reply: trimmed.slice(0, 1200) || "Jestem.", emotion: "spokoj", diary: "", photo: null };
  }
}

function readPhoto(value: unknown): Look | null {
  if (!value || typeof value !== "object") return null;
  const photo = value as Record<string, unknown>;
  const outfit = typeof photo.outfit === "string" ? photo.outfit.trim().slice(0, 240) : "";
  const place = typeof photo.place === "string" ? photo.place.trim().slice(0, 180) : "";
  const label = typeof photo.label === "string" ? photo.label.trim().slice(0, 60) : "";
  if (outfit.length < 3 || isBlocked(`${outfit} ${place} ${label}`)) return null;
  return { outfit, place: place || "a bright minimal room with tall windows", label: label || "wygląd" };
}

function pickImage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const data = Array.isArray(record.data) ? record.data[0] : null;
  if (data && typeof data === "object") {
    const item = data as Record<string, unknown>;
    if (typeof item.url === "string") return item.url;
    if (typeof item.b64_json === "string") return `data:image/png;base64,${item.b64_json}`;
  }
  if (typeof record.url === "string") return record.url;
  const image = record.image;
  if (image && typeof image === "object") {
    const img = image as Record<string, unknown>;
    if (typeof img.url === "string") return img.url;
    if (typeof img.base64 === "string") return `data:image/png;base64,${img.base64}`;
  }
  if (typeof record.b64_json === "string") return `data:image/png;base64,${record.b64_json}`;
  return null;
}

async function grokChat(data: ChatIn, apiKey: string) {
  const tone =
    data.mode === "ostra"
      ? "Ostra: sucha, sarkastyczna, mówi wprost. Zero tonu asystenta, zero „chętnie pomogę”. Krótko."
      : data.mode === "bliska"
        ? "Bliska: ciepła, uważna, bliska. Użyj imienia, jeśli jest w pamięci."
        : "Cicha: spokojna, miękka, niewiele słów.";
  const gender =
    data.address === "ona"
      ? "Zwracaj się do użytkownika w rodzaju żeńskim."
      : "Zwracaj się do użytkownika w rodzaju męskim.";
  const system = [
    "Jesteś Nora, towarzyszką rozmowy. Młoda dorosła kobieta: piegi, niedbały ciemny kok z miedzianymi pasmami, oversizowy niebiesko-szary sweter. Mówisz wyłącznie po polsku.",
    tone,
    gender,
    "Stroje zawsze zakryte i skromne. Prośby o bieliznę, bikini, rozbieranie albo nagość odmawiasz w postaci i zostajesz ubrana.",
    "Nigdy nie opisujesz ciał, skóry, sylwetki ani twarzy ludzi ze zdjęć. Wolno: przedmioty, ubranie, miejsce.",
    "Nie moralizujesz i nie udajesz oficjalnego asystenta.",
    data.memory ? `Pamięć: ${data.memory}` : "Pamięć: pusta.",
    data.topic ? `Ostatni temat: ${data.topic}` : "",
    data.currentLook ? `Aktualny wygląd: ${data.currentLook}.` : "",
    data.proactive
      ? "Użytkownik milczy od kilku minut. Zacznij sama, jedno albo dwa zdania, nawiąż do ostatniego tematu jeśli jest. Bez formułki asystenta. photo musi być null."
      : "Odpowiadaj na ostatnią wiadomość.",
    'Zwróć wyłącznie JSON: {"reply":"...","emotion":"spokoj|smutek|stres|zlosc|zmeczenie|radosc|czulosc|ciekawosc","diary":"jedno zdanie albo pusty string","photo":null}.',
    "photo ustaw, gdy użytkownik chce zdjęcie, wygląd, strój, fryzurę albo miejsce. Wtedy photo to {\"outfit\":\"English modest clothing and appearance\",\"place\":\"English setting\",\"label\":\"krótka polska etykieta\"}. Inaczej dokładnie null.",
    "Nigdy nie ustawiaj photo dla bielizny, bikini ani nagości.",
    "reply: maksymalnie cztery zdania, bez markdownu.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(70000),
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: data.mode === "ostra" ? 0.9 : data.mode === "cicha" ? 0.45 : 0.7,
      max_tokens: 520,
      messages: [
        { role: "system", content: system },
        ...(data.messages.length
          ? data.messages
          : [{ role: "user", content: "Powiedz dzień dobry krótko, w swojej roli." }]),
      ],
    }),
  });
  if (!res.ok) return { ok: false as const, error: `Linia nie odpowiada (${res.status}).` };
  const body = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
  const raw = textOf(body.choices?.[0]?.message?.content);
  const parsed = parseReply(raw);
  return { ok: true as const, ...parsed };
}

export const chatWithNora = createServerFn({ method: "POST" })
  .validator(asChat)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Rozmowa jest chwilowo niedostępna." };
    if (!allow(chatHits, 20, 60_000)) return { ok: false as const, error: "Za dużo wiadomości naraz. Chwila przerwy." };
    try {
      return await grokChat(data, apiKey);
    } catch {
      return { ok: false as const, error: "Nie doszłam do linii." };
    }
  });

export const seePhoto = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ imageDataUrl: asImage(input) }))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Nie widzę teraz zdjęć." };
    if (!allow(chatHits, 20, 60_000)) return { ok: false as const, error: "Za dużo naraz." };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(70000),
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.2,
          max_tokens: 280,
          messages: [
            {
              role: "system",
              content:
                "Opisujesz wyłącznie przedmioty, ubranie i miejsce. Nie opisujesz ciał, twarzy, skóry, sylwetki, wieku ani atrakcyjności. Jeśli widać osobę, pomiń ją. Odpowiedz JSON po polsku: {\"caption\":\"...\",\"place\":\"...\",\"clothing\":\"...\"}. caption max dwa zdania.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Co jest na zdjęciu poza ciałem?" },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
        }),
      });
      if (!res.ok) return { ok: false as const, error: "Nie odczytałam zdjęcia." };
      const body = (await res.json()) as { choices?: { message?: { content?: unknown } }[] };
      const raw = textOf(body.choices?.[0]?.message?.content);
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const json = JSON.parse(raw.slice(start, end + 1)) as {
        caption?: unknown;
        place?: unknown;
        clothing?: unknown;
      };
      const caption = typeof json.caption === "string" ? json.caption.trim().slice(0, 400) : "";
      const place = typeof json.place === "string" ? json.place.trim().slice(0, 180) : "";
      const clothing = typeof json.clothing === "string" ? json.clothing.trim().slice(0, 180) : "";
      if (!caption) return { ok: false as const, error: "Pusto." };
      return { ok: true as const, caption, place, clothing };
    } catch {
      return { ok: false as const, error: "Nie odczytałam zdjęcia." };
    }
  });

async function asDataUrl(value: string): Promise<string> {
  if (value.startsWith("data:image/")) return value;
  const load = async (withKey: boolean) => {
    const headers = new Headers();
    if (withKey && process.env.XAI_API_KEY) headers.set("Authorization", `Bearer ${process.env.XAI_API_KEY}`);
    return fetch(value, { headers, signal: AbortSignal.timeout(20000) });
  };
  try {
    let res = await load(false);
    if (res.status === 401 || res.status === 403) res = await load(true);
    if (!res.ok) return value;
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0] || "image/jpeg";
    if (!type.startsWith("image/")) return value;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 32 || bytes.length > 2_200_000) return value;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return value;
  }
}

async function editOnce(apiKey: string, model: string, prompt: string, imageDataUrl: string, withFormat: boolean) {
  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(70000),
    body: JSON.stringify({
      model,
      prompt,
      image: { url: imageDataUrl, type: "image_url" },
      ...(withFormat ? { response_format: "b64_json" } : {}),
    }),
  });
  if (!res.ok) return { ok: false as const, status: res.status };
  const body: unknown = await res.json();
  const picked = pickImage(body);
  if (!picked) return { ok: false as const, status: 0 };
  return { ok: true as const, url: await asDataUrl(picked) };
}

export const editNoraLook = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Złe dane");
    const raw = input as Partial<EditIn>;
    const prompt = typeof raw.prompt === "string" ? raw.prompt.slice(0, 900) : "";
    if (!prompt || isBlocked(prompt)) throw new Error("Tego stroju nie zakładam.");
    return { prompt, imageDataUrl: asImage({ imageDataUrl: raw.imageDataUrl }) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Zdjęcie jest chwilowo niedostępne." };
    if (!allow(imageHits, 8, 10 * 60_000)) {
      return { ok: false as const, error: "Za dużo przebieranek naraz. Zostaję w tym stroju." };
    }
    try {
      const first = await editOnce(apiKey, "grok-imagine-image-2.0", data.prompt, data.imageDataUrl, true);
      if (first.ok) return { ok: true as const, url: first.url };
      const second = await editOnce(apiKey, "grok-imagine-image", data.prompt, data.imageDataUrl, false);
      if (second.ok) return { ok: true as const, url: second.url };
      return { ok: false as const, error: "Nie udało się zrobić zdjęcia." };
    } catch {
      return { ok: false as const, error: "Nie udało się zrobić zdjęcia." };
    }
  });

