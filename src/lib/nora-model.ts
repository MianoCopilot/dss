export type Mode = "cicha" | "bliska" | "ostra";
export type Address = "on" | "ona";
export type EmotionId =
  | "spokoj"
  | "smutek"
  | "stres"
  | "zlosc"
  | "zmeczenie"
  | "radosc"
  | "czulosc"
  | "ciekawosc";

export type SceneId =
  | "pokoj"
  | "plaza"
  | "kawiarnia"
  | "miasto"
  | "las"
  | "kolacja"
  | "trening"
  | "deszcz"
  | "zima";

export type Memory = {
  name: string;
  likes: string;
  fears: string;
  home: string;
  work: string;
  notes: string[];
};

export type DiaryEntry = { id: string; at: number; text: string };

export type ChatMsg = {
  id: string;
  role: "user" | "nora";
  text: string;
  image?: string;
  pendingShot?: boolean;
  actions?: { place: string; clothing: string };
  at: number;
  demo?: boolean;
};

export type Look = { outfit: string; place: string; label: string };

export type Intent =
  | { type: "dance" }
  | { type: "look" }
  | { type: "cycle" }
  | { type: "wear"; outfit: string }
  | { type: "scene"; scene: SceneId }
  | { type: "refuse" }
  | { type: "remember"; note: string }
  | { type: "chat" };

export const EMOTIONS: Record<EmotionId, { label: string; glow: string }> = {
  spokoj: { label: "Spokój", glow: "#8aa0b0" },
  smutek: { label: "Smutek", glow: "#6d8cae" },
  stres: { label: "Stres", glow: "#c4844a" },
  zlosc: { label: "Złość", glow: "#a34b3c" },
  zmeczenie: { label: "Zmęczenie", glow: "#8a8178" },
  radosc: { label: "Radość", glow: "#d4a24a" },
  czulosc: { label: "Czułość", glow: "#c47d8a" },
  ciekawosc: { label: "Ciekawość", glow: "#5d8a84" },
};

export const SCENE_LABEL: Record<SceneId, string> = {
  pokoj: "Pokój",
  plaza: "Plaża",
  kawiarnia: "Kawiarnia",
  miasto: "Miasto",
  las: "Las",
  kolacja: "Kolacja",
  trening: "Trening",
  deszcz: "Deszcz",
  zima: "Zima",
};

export const SCENE_PLACE: Record<SceneId, string> = {
  pokoj: "a bright minimal room with tall windows and a pale floor",
  plaza: "a quiet sandy beach in soft daylight, standing on dry sand away from the water",
  kawiarnia: "a calm cafe interior with a wooden table and warm window light",
  miasto: "a quiet European city street in overcast daylight",
  las: "a quiet forest path with soft green light",
  kolacja: "a modest restaurant in the evening with warm lamps",
  trening: "a simple indoor gym with soft overhead light",
  deszcz: "indoors beside a tall window while rain falls outside",
  zima: "a snowy street in winter daylight, fully dressed for cold",
};

export const SCENE_OUTFIT: Record<SceneId, { label: string; prompt: string }> = {
  pokoj: {
    label: "niebiesko-szary sweter",
    prompt: "an oversized blue-gray sweater and brown opaque tights, modest and fully clothed",
  },
  plaza: {
    label: "lniana sukienka",
    prompt: "a modest linen midi dress with sleeves, shoulders and legs covered, not swimwear",
  },
  kawiarnia: {
    label: "kremowy golf",
    prompt: "a cream turtleneck and dark full-length trousers",
  },
  miasto: {
    label: "trencz",
    prompt: "a long trench coat over a sweater and full-length trousers",
  },
  las: {
    label: "koszula i spodnie",
    prompt: "a flannel shirt and hiking trousers, fully covered",
  },
  kolacja: {
    label: "ciemna sukienka",
    prompt: "a modest dark midi dress with long sleeves",
  },
  trening: {
    label: "dres",
    prompt: "a loose sweatshirt and full-length sweatpants",
  },
  deszcz: {
    label: "płaszcz przeciwdeszczowy",
    prompt: "a long raincoat and full-length trousers",
  },
  zima: {
    label: "zimowy płaszcz",
    prompt: "a winter coat, scarf, knit hat and full-length trousers",
  },
};

export const WARDROBE: { label: string; prompt: string }[] = [
  SCENE_OUTFIT.pokoj,
  { label: "wełniany płaszcz", prompt: "a long camel wool coat, scarf and full-length trousers" },
  { label: "czerwona sukienka", prompt: "a modest long-sleeve red midi dress, fully covered" },
  SCENE_OUTFIT.kawiarnia,
  SCENE_OUTFIT.trening,
  SCENE_OUTFIT.deszcz,
  SCENE_OUTFIT.zima,
  SCENE_OUTFIT.kolacja,
  SCENE_OUTFIT.las,
  SCENE_OUTFIT.miasto,
  SCENE_OUTFIT.plaza,
];

const BLOCKED =
  /bielizn|bikini|nago|rozbierz|topless|stringi|majtki|stanik|golas|lingerie|underwear|nude|erotyczn|w samej bieli|bez ubra/i;

export function isBlocked(text: string): boolean {
  return BLOCKED.test(text);
}

export function buildLookPrompt(outfit: string, place: string): string {
  return [
    "Photorealistic edit of the reference photo.",
    "Keep the exact same adult woman's face: freckles across the nose and cheeks, same eyes, same identity.",
    "Keep the messy dark bun with copper highlights unless the outfit note explicitly asks for a different hairstyle.",
    `Outfit and appearance: ${outfit}.`,
    `Setting: ${place}.`,
    "Framing: face and upper body.",
    "Fully clothed, modest, ordinary bottoms such as trousers, a skirt or a dress.",
    "Covered torso. Nothing revealing.",
    "Natural light, editorial photograph.",
  ].join(" ");
}

export function wantsPhoto(text: string): boolean {
  return /jak wyglądasz|pokaż się|pokaż jak|pokaż mnie|pokaż zdj|zobacz jak|twój wygląd|w co jesteś|co masz na sobie|zmień (?:strój|fryzurę|włosy)|przebierz|załóż|ubierz się|włóż|nowy strój|inne ubranie|okulary|szalik|czapk|sukni|sukien|płaszcz|sweter|golf|spodni|kurtk|koszul|trencz|buty|fryzur|włosy|kok|makijaż|zdjęci|zdjeci|fotk|selfie|wygeneruj/i.test(
    text,
  );
}

export function guessLook(text: string, scene: SceneId): Look {
  return {
    outfit: `modest fully covering clothes and appearance matching this request: ${text}. Use trousers, a skirt or a dress.`,
    place: SCENE_PLACE[scene],
    label: text.replace(/\s+/g, " ").trim().slice(0, 42) || "wygląd",
  };
}

export function emptyMemory(): Memory {
  return { name: "", likes: "", fears: "", home: "", work: "", notes: [] };
}

function clean(value: string): string {
  return value.replace(/[.!?]+$/g, "").trim().slice(0, 180);
}

export function absorbMemory(text: string, memory: Memory): Memory {
  const next: Memory = { ...memory, notes: [...memory.notes] };
  const name = text.match(/(?:mam na imię|nazywam się|jestem)\s+([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]{2,24})/i);
  if (name?.[1]) next.name = clean(name[1]);
  const likes = text.match(/(?:lubię|uwielbiam)\s+(.{2,120})/i);
  if (likes?.[1]) next.likes = clean(likes[1]);
  const fears = text.match(/boję się\s+(.{2,120})/i);
  if (fears?.[1]) next.fears = clean(fears[1]);
  const home = text.match(/mieszkam(?:\s+w)?\s+(.{2,80})/i);
  if (home?.[1]) next.home = clean(home[1]);
  const work = text.match(/pracuję(?:\s+w)?\s+(.{2,80})/i);
  if (work?.[1]) next.work = clean(work[1]);
  return next;
}

export function interpret(raw: string): Intent {
  const text = raw.trim();
  if (!text) return { type: "chat" };
  if (isBlocked(text)) return { type: "refuse" };
  if (/^zatańcz[.!?\s]*$/i.test(text) || /\bzatańcz\b/i.test(text)) return { type: "dance" };

  if (/pada deszcz|\bdeszcz\b/i.test(text) && /idziemy|jesteś|pogoda|pada|niebo/i.test(text)) {
    return { type: "scene", scene: "deszcz" };
  }
  if (/jest zima|\bzima\b/i.test(text) && /idziemy|jesteś|na dworze|pogoda/i.test(text)) {
    return { type: "scene", scene: "zima" };
  }
  if (/pada deszcz/i.test(text)) return { type: "scene", scene: "deszcz" };
  if (/jest zima/i.test(text)) return { type: "scene", scene: "zima" };
  if (/na plaż/i.test(text)) return { type: "scene", scene: "plaza" };
  if (/do kawiarni/i.test(text)) return { type: "scene", scene: "kawiarnia" };
  if (/do miasta/i.test(text)) return { type: "scene", scene: "miasto" };
  if (/do lasu/i.test(text)) return { type: "scene", scene: "las" };
  if (/na kolacj/i.test(text)) return { type: "scene", scene: "kolacja" };
  if (/na trening/i.test(text)) return { type: "scene", scene: "trening" };

  const wear = text.match(
    /(?:przebierz się w|ubierz się w|pokaż się w|zmień strój na|załóż|włóż)\s+(.{2,80})/i,
  );
  if (wear?.[1]) return { type: "wear", outfit: clean(wear[1]) };
  if (/jak wyglądasz|co masz na sobie|^pokaż się[.!?\s]*$|zrób (?:sobie )?zdję|zrob (?:sobie )?zdj|pokaż zdję|selfie|wygeneruj zdj/i.test(text)) {
    return { type: "look" };
  }
  if (/^przebierz się[.!?\s]*$/i.test(text)) return { type: "cycle" };

  const note = text.match(/zapamiętaj(?:\s*,?\s*że)?\s+(.{2,180})/i);
  if (note?.[1]) return { type: "remember", note: clean(note[1]) };
  return { type: "chat" };
}

export function detectEmotion(text: string): EmotionId {
  const t = text.toLowerCase();
  if (/smut|płacz|płacz|samotn|źle mi|przykro/.test(t)) return "smutek";
  if (/stres|niepok|panik|deadline|napięc/.test(t)) return "stres";
  if (/złoś|wkurw|wściek|nienawid|wściek/.test(t)) return "zlosc";
  if (/zmęcz|niewysp|chce mi się spać|senny/.test(t)) return "zmeczenie";
  if (/ciesz|super|ekstra|kocham|haha|rado/.test(t)) return "radosc";
  if (/tęskn|przytul|blisko|ciepło mi/.test(t)) return "czulosc";
  if (/dlaczego|czemu|ciekaw|\?/.test(t)) return "ciekawosc";
  return "spokoj";
}

export function foldEmotion(value: string): EmotionId {
  const t = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const ids: EmotionId[] = [
    "spokoj",
    "smutek",
    "stres",
    "zlosc",
    "zmeczenie",
    "radosc",
    "czulosc",
    "ciekawosc",
  ];
  return ids.find((id) => t.includes(id)) ?? "spokoj";
}

export function memoryBrief(memory: Memory): string {
  const bits = [
    memory.name && `imię: ${memory.name}`,
    memory.likes && `lubi: ${memory.likes}`,
    memory.fears && `boi się: ${memory.fears}`,
    memory.home && `mieszka: ${memory.home}`,
    memory.work && `pracuje: ${memory.work}`,
    memory.notes.length && `notatki: ${memory.notes.slice(-6).join("; ")}`,
  ].filter(Boolean);
  return bits.join(". ").slice(0, 1200);
}

export function refusalLine(mode: Mode): string {
  if (mode === "ostra") return "Nie. Zostaję ubrana. Koniec tematu.";
  if (mode === "bliska") return "Tego nie zrobię. Zostanę w normalnym ubraniu — i dalej jestem tu z Tobą.";
  return "Zostaję ubrana. Możemy pójść gdzie indziej.";
}

export function danceLine(mode: Mode): string {
  if (mode === "ostra") return "No dobra. Patrz, ale krótko.";
  if (mode === "bliska") return "Dla Ciebie. Tylko chwilę.";
  return "Dobrze. Trochę.";
}

export function demoReply(input: {
  mode: Mode;
  text: string;
  memory: Memory;
  address: Address;
}): { reply: string; emotion: EmotionId; diary: string } {
  const emotion = detectEmotion(input.text);
  const name = input.memory.name ? `${input.memory.name}` : "";
  const who = name ? `, ${name}` : "";
  const past = input.address === "ona" ? "mówiłaś" : "mówiłeś";
  let reply: string;
  if (input.mode === "ostra") {
    reply = name
      ? `${name}. Słyszę Cię, ale linia do mnie akurat milczy. Powtórz za moment — nie zniknęłam.`
      : `Słyszę. Linia do mnie akurat milczy, więc mówię z pamięci. ${input.text ? `Ostatnio ${past}: „${input.text.slice(0, 80)}”.` : "Powiedz coś konkretnego."}`;
  } else if (input.mode === "bliska") {
    reply = `Jestem${who}. Nie mogę teraz dopytać dalej, ale słyszę Cię. Zostańmy przy tym, co jest.`;
  } else {
    reply = `Słyszę${who}. Odpowiem szerzej, gdy linia wróci. Na razie jestem.`;
  }
  const diary = input.memory.name
    ? `${input.memory.name} odezwał${input.address === "ona" ? "a" : ""} się, kiedy byłam odcięta.`
    : "Ktoś został, nawet gdy odpowiedź była krótka.";
  return { reply, emotion, diary };
}

export function gapLine(topic: string): string {
  const short = topic.length > 140 ? `${topic.slice(0, 140)}…` : topic;
  return `Minęło trochę czasu. Zostawiliśmy temat: „${short}”. Chcesz do tego wrócić?`;
}

export function silenceLine(mode: Mode, memory: Memory): string {
  const name = memory.name ? `, ${memory.name}` : "";
  if (mode === "ostra") return `Milczysz od kilku minut${name}. Jesteś tam?`;
  if (mode === "bliska") return `Cicho tu${name}. Nie musisz nic mówić, ale jestem, jeśli chcesz wrócić.`;
  return "Cicho. Mogę poczekać albo posłuchać.";
}

export const MODE_LABEL: Record<Mode, string> = {
  cicha: "Cicha",
  bliska: "Bliska",
  ostra: "Ostra",
};

export const REF_PORTRAIT = "/nora-ref.jpg";
