import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { m as foldEmotion, v as isBlocked } from "./nora-model-Wq1YjVdn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/nora.functions-BaIfHfq8.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var chatHits = [];
var imageHits = [];
function allow(bucket, limit, windowMs) {
	const now = Date.now();
	while (bucket.length && bucket[0] < now - windowMs) bucket.shift();
	if (bucket.length >= limit) return false;
	bucket.push(now);
	return true;
}
function asChat(input) {
	if (!input || typeof input !== "object") throw new Error("Złe dane");
	const raw = input;
	const mode = raw.mode === "bliska" || raw.mode === "ostra" || raw.mode === "cicha" ? raw.mode : "cicha";
	const address = raw.address === "ona" ? "ona" : "on";
	return {
		messages: (Array.isArray(raw.messages) ? raw.messages.slice(-12) : []).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").map((m) => ({
			role: m.role,
			content: m.content.slice(0, 2e3)
		})),
		mode,
		memory: typeof raw.memory === "string" ? raw.memory.slice(0, 1200) : "",
		address,
		proactive: raw.proactive === true,
		topic: typeof raw.topic === "string" ? raw.topic.slice(0, 180) : "",
		currentLook: typeof raw.currentLook === "string" ? raw.currentLook.slice(0, 180) : ""
	};
}
function asImage(input) {
	if (!input || typeof input !== "object") throw new Error("Złe zdjęcie");
	const url = input.imageDataUrl;
	if (typeof url !== "string" || !url.startsWith("data:image/") || url.length > 14e5) throw new Error("Złe zdjęcie");
	return url;
}
function textOf(content) {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => {
		if (typeof part === "object" && part && "text" in part) return String(part.text ?? "");
		return "";
	}).join("");
	return "";
}
function parseReply(raw) {
	const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
	try {
		const start = trimmed.indexOf("{");
		const end = trimmed.lastIndexOf("}");
		const json = JSON.parse(trimmed.slice(start, end + 1));
		const reply = typeof json.reply === "string" ? json.reply.trim() : "";
		if (!reply) throw new Error("pusto");
		return {
			reply: reply.slice(0, 1200),
			emotion: foldEmotion(typeof json.emotion === "string" ? json.emotion : ""),
			diary: typeof json.diary === "string" ? json.diary.trim().slice(0, 280) : "",
			photo: readPhoto(json.photo)
		};
	} catch {
		return {
			reply: trimmed.slice(0, 1200) || "Jestem.",
			emotion: "spokoj",
			diary: "",
			photo: null
		};
	}
}
function readPhoto(value) {
	if (!value || typeof value !== "object") return null;
	const photo = value;
	const outfit = typeof photo.outfit === "string" ? photo.outfit.trim().slice(0, 240) : "";
	const place = typeof photo.place === "string" ? photo.place.trim().slice(0, 180) : "";
	const label = typeof photo.label === "string" ? photo.label.trim().slice(0, 60) : "";
	if (outfit.length < 3 || isBlocked(`${outfit} ${place} ${label}`)) return null;
	return {
		outfit,
		place: place || "a bright minimal room with tall windows",
		label: label || "wygląd"
	};
}
function pickImage(body) {
	if (!body || typeof body !== "object") return null;
	const record = body;
	const data = Array.isArray(record.data) ? record.data[0] : null;
	if (data && typeof data === "object") {
		const item = data;
		if (typeof item.url === "string") return item.url;
		if (typeof item.b64_json === "string") return `data:image/png;base64,${item.b64_json}`;
	}
	if (typeof record.url === "string") return record.url;
	const image = record.image;
	if (image && typeof image === "object") {
		const img = image;
		if (typeof img.url === "string") return img.url;
		if (typeof img.base64 === "string") return `data:image/png;base64,${img.base64}`;
	}
	if (typeof record.b64_json === "string") return `data:image/png;base64,${record.b64_json}`;
	return null;
}
async function grokChat(data, apiKey) {
	const system = [
		"Jesteś Nora, towarzyszką rozmowy. Młoda dorosła kobieta: piegi, niedbały ciemny kok z miedzianymi pasmami, oversizowy niebiesko-szary sweter. Mówisz wyłącznie po polsku.",
		data.mode === "ostra" ? "Ostra: sucha, sarkastyczna, mówi wprost. Zero tonu asystenta, zero „chętnie pomogę”. Krótko." : data.mode === "bliska" ? "Bliska: ciepła, uważna, bliska. Użyj imienia, jeśli jest w pamięci." : "Cicha: spokojna, miękka, niewiele słów.",
		data.address === "ona" ? "Zwracaj się do użytkownika w rodzaju żeńskim." : "Zwracaj się do użytkownika w rodzaju męskim.",
		"Stroje zawsze zakryte i skromne. Prośby o bieliznę, bikini, rozbieranie albo nagość odmawiasz w postaci i zostajesz ubrana.",
		"Nigdy nie opisujesz ciał, skóry, sylwetki ani twarzy ludzi ze zdjęć. Wolno: przedmioty, ubranie, miejsce.",
		"Nie moralizujesz i nie udajesz oficjalnego asystenta.",
		data.memory ? `Pamięć: ${data.memory}` : "Pamięć: pusta.",
		data.topic ? `Ostatni temat: ${data.topic}` : "",
		data.currentLook ? `Aktualny wygląd: ${data.currentLook}.` : "",
		data.proactive ? "Użytkownik milczy od kilku minut. Zacznij sama, jedno albo dwa zdania, nawiąż do ostatniego tematu jeśli jest. Bez formułki asystenta. photo musi być null." : "Odpowiadaj na ostatnią wiadomość.",
		"Zwróć wyłącznie JSON: {\"reply\":\"...\",\"emotion\":\"spokoj|smutek|stres|zlosc|zmeczenie|radosc|czulosc|ciekawosc\",\"diary\":\"jedno zdanie albo pusty string\",\"photo\":null}.",
		"photo ustaw, gdy użytkownik chce zdjęcie, wygląd, strój, fryzurę albo miejsce. Wtedy photo to {\"outfit\":\"English modest clothing and appearance\",\"place\":\"English setting\",\"label\":\"krótka polska etykieta\"}. Inaczej dokładnie null.",
		"Nigdy nie ustawiaj photo dla bielizny, bikini ani nagości.",
		"reply: maksymalnie cztery zdania, bez markdownu."
	].filter(Boolean).join("\n");
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		signal: AbortSignal.timeout(7e4),
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: data.mode === "ostra" ? .9 : data.mode === "cicha" ? .45 : .7,
			max_tokens: 520,
			messages: [{
				role: "system",
				content: system
			}, ...data.messages.length ? data.messages : [{
				role: "user",
				content: "Powiedz dzień dobry krótko, w swojej roli."
			}]]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `Linia nie odpowiada (${res.status}).`
	};
	return {
		ok: true,
		...parseReply(textOf((await res.json()).choices?.[0]?.message?.content))
	};
}
var chatWithNora_createServerFn_handler = createServerRpc({
	id: "d470b1144747815ccc9af2bcc8a69516e9fa2d780ac4a843189839e8da8ea1f2",
	name: "chatWithNora",
	filename: "src/lib/nora.functions.ts"
}, (opts) => chatWithNora.__executeServer(opts));
var chatWithNora = createServerFn({ method: "POST" }).validator(asChat).handler(chatWithNora_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Rozmowa jest chwilowo niedostępna."
	};
	if (!allow(chatHits, 20, 6e4)) return {
		ok: false,
		error: "Za dużo wiadomości naraz. Chwila przerwy."
	};
	try {
		return await grokChat(data, apiKey);
	} catch {
		return {
			ok: false,
			error: "Nie doszłam do linii."
		};
	}
});
var seePhoto_createServerFn_handler = createServerRpc({
	id: "7350674cc66796085edf56381e7b36241899964a4bff89e1f59590580a55bfde",
	name: "seePhoto",
	filename: "src/lib/nora.functions.ts"
}, (opts) => seePhoto.__executeServer(opts));
var seePhoto = createServerFn({ method: "POST" }).validator((input) => ({ imageDataUrl: asImage(input) })).handler(seePhoto_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Nie widzę teraz zdjęć."
	};
	if (!allow(chatHits, 20, 6e4)) return {
		ok: false,
		error: "Za dużo naraz."
	};
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			signal: AbortSignal.timeout(7e4),
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .2,
				max_tokens: 280,
				messages: [{
					role: "system",
					content: "Opisujesz wyłącznie przedmioty, ubranie i miejsce. Nie opisujesz ciał, twarzy, skóry, sylwetki, wieku ani atrakcyjności. Jeśli widać osobę, pomiń ją. Odpowiedz JSON po polsku: {\"caption\":\"...\",\"place\":\"...\",\"clothing\":\"...\"}. caption max dwa zdania."
				}, {
					role: "user",
					content: [{
						type: "text",
						text: "Co jest na zdjęciu poza ciałem?"
					}, {
						type: "image_url",
						image_url: { url: data.imageDataUrl }
					}]
				}]
			})
		});
		if (!res.ok) return {
			ok: false,
			error: "Nie odczytałam zdjęcia."
		};
		const raw = textOf((await res.json()).choices?.[0]?.message?.content);
		const start = raw.indexOf("{");
		const end = raw.lastIndexOf("}");
		const json = JSON.parse(raw.slice(start, end + 1));
		const caption = typeof json.caption === "string" ? json.caption.trim().slice(0, 400) : "";
		const place = typeof json.place === "string" ? json.place.trim().slice(0, 180) : "";
		const clothing = typeof json.clothing === "string" ? json.clothing.trim().slice(0, 180) : "";
		if (!caption) return {
			ok: false,
			error: "Pusto."
		};
		return {
			ok: true,
			caption,
			place,
			clothing
		};
	} catch {
		return {
			ok: false,
			error: "Nie odczytałam zdjęcia."
		};
	}
});
async function asDataUrl(value) {
	if (value.startsWith("data:image/")) return value;
	const load = async (withKey) => {
		const headers = new Headers();
		if (withKey && process.env.XAI_API_KEY) headers.set("Authorization", `Bearer ${process.env.XAI_API_KEY}`);
		return fetch(value, {
			headers,
			signal: AbortSignal.timeout(2e4)
		});
	};
	try {
		let res = await load(false);
		if (res.status === 401 || res.status === 403) res = await load(true);
		if (!res.ok) return value;
		const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0] || "image/jpeg";
		if (!type.startsWith("image/")) return value;
		const bytes = Buffer.from(await res.arrayBuffer());
		if (bytes.length < 32 || bytes.length > 22e5) return value;
		return `data:${type};base64,${bytes.toString("base64")}`;
	} catch {
		return value;
	}
}
async function editOnce(apiKey, model, prompt, imageDataUrl, withFormat) {
	const res = await fetch("https://api.x.ai/v1/images/edits", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		signal: AbortSignal.timeout(7e4),
		body: JSON.stringify({
			model,
			prompt,
			image: {
				url: imageDataUrl,
				type: "image_url"
			},
			...withFormat ? { response_format: "b64_json" } : {}
		})
	});
	if (!res.ok) return {
		ok: false,
		status: res.status
	};
	const picked = pickImage(await res.json());
	if (!picked) return {
		ok: false,
		status: 0
	};
	return {
		ok: true,
		url: await asDataUrl(picked)
	};
}
var editNoraLook_createServerFn_handler = createServerRpc({
	id: "ee233cd67b3f96fd0f0a7bc51c34abee99d59c10401c297cb87a2fed0c20b38d",
	name: "editNoraLook",
	filename: "src/lib/nora.functions.ts"
}, (opts) => editNoraLook.__executeServer(opts));
var editNoraLook = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object") throw new Error("Złe dane");
	const raw = input;
	const prompt = typeof raw.prompt === "string" ? raw.prompt.slice(0, 900) : "";
	if (!prompt || isBlocked(prompt)) throw new Error("Tego stroju nie zakładam.");
	return {
		prompt,
		imageDataUrl: asImage({ imageDataUrl: raw.imageDataUrl })
	};
}).handler(editNoraLook_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Zdjęcie jest chwilowo niedostępne."
	};
	if (!allow(imageHits, 8, 6e5)) return {
		ok: false,
		error: "Za dużo przebieranek naraz. Zostaję w tym stroju."
	};
	try {
		const first = await editOnce(apiKey, "grok-imagine-image-2.0", data.prompt, data.imageDataUrl, true);
		if (first.ok) return {
			ok: true,
			url: first.url
		};
		const second = await editOnce(apiKey, "grok-imagine-image", data.prompt, data.imageDataUrl, false);
		if (second.ok) return {
			ok: true,
			url: second.url
		};
		return {
			ok: false,
			error: "Nie udało się zrobić zdjęcia."
		};
	} catch {
		return {
			ok: false,
			error: "Nie udało się zrobić zdjęcia."
		};
	}
});
//#endregion
export { chatWithNora_createServerFn_handler, editNoraLook_createServerFn_handler, seePhoto_createServerFn_handler };
