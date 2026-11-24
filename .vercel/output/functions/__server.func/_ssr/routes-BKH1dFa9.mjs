import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { S as wantsPhoto, _ as interpret, a as SCENE_OUTFIT, b as refusalLine, c as absorbMemory, d as demoReply, f as detectEmotion, g as guessLook, h as gapLine, i as SCENE_LABEL, l as buildLookPrompt, n as MODE_LABEL, o as SCENE_PLACE, p as emptyMemory, r as REF_PORTRAIT, s as WARDROBE, t as EMOTIONS, u as danceLine, v as isBlocked, x as silenceLine, y as memoryBrief } from "./nora-model-Wq1YjVdn.mjs";
import { a as Trash2, c as Send, d as Mic, f as MicOff, h as BookOpen, l as Paperclip, m as Brain, n as VolumeX, o as Sun, p as Download, r as Volume2, s as Settings, t as X, u as Moon } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BKH1dFa9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var chatWithNora = createServerFn({ method: "POST" }).validator(asChat).handler(createSsrRpc("d470b1144747815ccc9af2bcc8a69516e9fa2d780ac4a843189839e8da8ea1f2"));
var seePhoto = createServerFn({ method: "POST" }).validator((input) => ({ imageDataUrl: asImage(input) })).handler(createSsrRpc("7350674cc66796085edf56381e7b36241899964a4bff89e1f59590580a55bfde"));
var editNoraLook = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object") throw new Error("Złe dane");
	const raw = input;
	const prompt = typeof raw.prompt === "string" ? raw.prompt.slice(0, 900) : "";
	if (!prompt || isBlocked(prompt)) throw new Error("Tego stroju nie zakładam.");
	return {
		prompt,
		imageDataUrl: asImage({ imageDataUrl: raw.imageDataUrl })
	};
}).handler(createSsrRpc("ee233cd67b3f96fd0f0a7bc51c34abee99d59c10401c297cb87a2fed0c20b38d"));
function PortraitStage({ src, scene, emotion, phase, dancing, busy, outfit }) {
	const [tilt, setTilt] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [broken, setBroken] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setBroken(false);
	}, [src]);
	const shown = broken ? "/nora-ref.jpg" : src;
	const glow = phase === "speak" ? "#e2b15a" : phase === "listen" ? "#7ea2c4" : EMOTIONS[emotion].glow;
	const phaseLabel = phase === "speak" ? "mówi" : phase === "listen" ? "słucha" : dancing ? "tańczy" : EMOTIONS[emotion].label;
	(0, import_react.useEffect)(() => {
		const onMove = (event) => {
			const x = (event.clientX / window.innerWidth - .5) * 2;
			const y = (event.clientY / window.innerHeight - .5) * 2;
			setTilt({
				x,
				y
			});
		};
		const onOrient = (event) => {
			const x = Math.max(-1, Math.min(1, (event.gamma ?? 0) / 28));
			const y = Math.max(-1, Math.min(1, ((event.beta ?? 40) - 40) / 35));
			setTilt({
				x,
				y
			});
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("deviceorientation", onOrient);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("deviceorientation", onOrient);
		};
	}, []);
	const cls = [
		"nora-stage",
		"nora-breathe",
		phase === "speak" && !dancing ? "nora-speak" : "",
		phase === "listen" && !dancing ? "nora-listen" : "",
		dancing ? "nora-dance" : ""
	].filter(Boolean).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cls,
		style: {
			["--px"]: String(tilt.x),
			["--py"]: String(tilt.y)
		},
		"aria-label": "Portret Nory",
		onClick: () => {
			const orientation = DeviceOrientationEvent;
			if (typeof orientation.requestPermission === "function") orientation.requestPermission();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "nora-layer nora-layer-bg",
				src: shown,
				alt: "",
				referrerPolicy: "no-referrer",
				onError: () => setBroken(true)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "nora-layer nora-layer-body",
				src: shown,
				alt: "Nora",
				referrerPolicy: "no-referrer",
				onError: () => setBroken(true)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: "nora-layer nora-layer-head",
				src: shown,
				alt: "",
				referrerPolicy: "no-referrer",
				onError: () => setBroken(true)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `nora-wash wash-${scene}` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "nora-glow",
				style: { background: glow }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "nora-vignette" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "nora-blink" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "nora-stage-ui",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl leading-none text-oncopper text-balance",
					children: "Nora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-oncopper",
					children: phaseLabel
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3 text-oncopper",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide uppercase text-oncopper",
						children: SCENE_LABEL[scene]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: outfit
					})] }), busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm",
						children: "Chwilę…"
					}) : null]
				})]
			})
		]
	});
}
var KEY = "nora-v1";
var DEFAULTS = {
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
	messages: [{
		id: "hello",
		role: "nora",
		text: "Jestem Nora. Pisz albo mów — zostanę.",
		at: 0
	}],
	lastActive: 0,
	lastTopic: "",
	wardrobeIndex: 0,
	scene: "pokoj",
	outfitLabel: "niebiesko-szary sweter",
	portrait: REF_PORTRAIT,
	reference: REF_PORTRAIT,
	proactiveDay: "",
	proactiveCount: 0
};
function uid() {
	return crypto.randomUUID();
}
function noraMsg(text, extra) {
	return {
		id: uid(),
		role: "nora",
		text,
		at: Date.now(),
		...extra
	};
}
function loadPersisted() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return DEFAULTS;
		const parsed = JSON.parse(raw);
		const memory = {
			...emptyMemory(),
			...parsed.memory ?? {}
		};
		const next = {
			...DEFAULTS,
			...parsed,
			memory,
			messages: Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : DEFAULTS.messages,
			diary: Array.isArray(parsed.diary) ? parsed.diary : []
		};
		if (next.lastActive > 0 && Date.now() - next.lastActive > 18e5 && next.lastTopic) {
			next.messages = [...next.messages, {
				id: uid(),
				role: "nora",
				text: gapLine(next.lastTopic),
				at: Date.now()
			}];
			next.lastActive = Date.now();
		}
		return next;
	} catch {
		return DEFAULTS;
	}
}
function slim(state) {
	return {
		...state,
		messages: state.messages.slice(-80).map((message) => ({
			...message,
			image: message.image && message.image.startsWith("data:") && message.image.length > 18e4 ? void 0 : message.image
		})),
		reference: state.reference.startsWith("data:") && state.reference.length > 5e5 ? REF_PORTRAIT : state.reference
	};
}
async function shrinkFromSrc(src, max = 720) {
	return shrinkBlob(await (await fetch(src)).blob(), max);
}
async function shrinkBlob(blob, max = 720) {
	const bitmap = await createImageBitmap(blob);
	const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", .72);
}
function getRec() {
	const w = window;
	const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
	return Ctor ? new Ctor() : null;
}
function NoraApp() {
	const [state, setState] = (0, import_react.useState)(DEFAULTS);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [emotion, setEmotion] = (0, import_react.useState)("spokoj");
	const [dancing, setDancing] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [shot, setShot] = (0, import_react.useState)(false);
	const [panel, setPanel] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [voices, setVoices] = (0, import_react.useState)([]);
	const [installEvent, setInstallEvent] = (0, import_react.useState)(null);
	const stateRef = (0, import_react.useRef)(state);
	const busyRef = (0, import_react.useRef)(false);
	const recRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const scrollerRef = (0, import_react.useRef)(null);
	const bottomRef = (0, import_react.useRef)(null);
	stateRef.current = state;
	(0, import_react.useEffect)(() => {
		setState(loadPersisted());
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(slim(state)));
		} catch {}
	}, [state, ready]);
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [
		state.messages.length,
		state.messages.at(-1)?.image,
		busy
	]);
	(0, import_react.useEffect)(() => {
		const load = () => setVoices(window.speechSynthesis?.getVoices?.() ?? []);
		load();
		window.speechSynthesis?.addEventListener("voiceschanged", load);
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
	}, []);
	(0, import_react.useEffect)(() => {
		const onPrompt = (event) => {
			event.preventDefault();
			setInstallEvent(event);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		return () => window.removeEventListener("beforeinstallprompt", onPrompt);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!("serviceWorker" in navigator)) return;
		navigator.serviceWorker.register("/nora-sw.js");
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		const timer = window.setTimeout(() => {
			if (document.visibilityState === "hidden" || busyRef.current) return;
			nudge();
		}, 18e4);
		return () => window.clearTimeout(timer);
	}, [
		ready,
		state.messages.length,
		state.lastActive
	]);
	function speak(text) {
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
			if (text.trim()) send(text.trim());
		};
		rec.onerror = () => setPhase("idle");
		rec.onend = () => setPhase((value) => value === "listen" ? "idle" : value);
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
		} catch {}
		setPhase("idle");
	}
	function pushNora(text, extra) {
		setState((current) => ({
			...current,
			lastActive: Date.now(),
			messages: [...current.messages, noraMsg(text, extra)].slice(-80)
		}));
	}
	async function nudge() {
		const current = stateRef.current;
		const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		const count = current.proactiveDay === day ? current.proactiveCount : 0;
		if (count >= 3) {
			const line = silenceLine(current.mode, current.memory);
			pushNora(line);
			speak(line);
			return;
		}
		busyRef.current = true;
		setBusy(true);
		const history = current.messages.filter((message) => message.text).slice(-8).map((message) => ({
			role: message.role === "nora" ? "assistant" : "user",
			content: message.text
		}));
		let line = silenceLine(current.mode, current.memory);
		let diary = "";
		let nextEmotion = emotion;
		let demo = true;
		try {
			const res = await chatWithNora({ data: {
				messages: history,
				mode: current.mode,
				memory: memoryBrief(current.memory),
				address: current.address,
				proactive: true,
				topic: current.lastTopic,
				currentLook: `${current.outfitLabel}, ${current.scene}`
			} });
			if (res.ok) {
				line = res.reply;
				diary = res.diary;
				nextEmotion = res.emotion;
				demo = false;
			}
		} catch {}
		setEmotion(nextEmotion);
		setState((prev) => ({
			...prev,
			proactiveDay: day,
			proactiveCount: count + 1,
			lastActive: Date.now(),
			diary: diary && diary !== prev.diary.at(-1)?.text ? [...prev.diary, {
				id: uid(),
				at: Date.now(),
				text: diary
			}].slice(-40) : prev.diary,
			messages: [...prev.messages, noraMsg(line, { demo })].slice(-80)
		}));
		speak(line);
		busyRef.current = false;
		setBusy(false);
	}
	async function requestLook(look, messageId) {
		if (isBlocked(`${look.outfit} ${look.place} ${look.label}`)) {
			const line = refusalLine(stateRef.current.mode);
			setState((current) => ({
				...current,
				messages: current.messages.map((message) => message.id === messageId ? {
					...message,
					pendingShot: false
				} : message)
			}));
			pushNora(line);
			speak(line);
			return;
		}
		setShot(true);
		try {
			const imageDataUrl = await shrinkFromSrc(stateRef.current.reference || "/nora-ref.jpg");
			const img = await editNoraLook({ data: {
				prompt: buildLookPrompt(look.outfit, look.place),
				imageDataUrl
			} });
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
					messages: current.messages.map((message) => message.id === messageId ? {
						...message,
						image: shown,
						pendingShot: false
					} : message)
				}));
			} else {
				setState((current) => ({
					...current,
					messages: current.messages.map((message) => message.id === messageId ? {
						...message,
						pendingShot: false
					} : message)
				}));
				pushNora(img.error);
			}
		} catch {
			setState((current) => ({
				...current,
				messages: current.messages.map((message) => message.id === messageId ? {
					...message,
					pendingShot: false
				} : message)
			}));
			pushNora("Nie mogę teraz zrobić zdjęcia. Zostaję w tym, co mam na sobie.");
		}
		setShot(false);
	}
	async function send(text, preset) {
		const trimmed = text.trim();
		if (!trimmed || busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		const current = stateRef.current;
		const intent = preset ? { type: "chat" } : interpret(trimmed);
		let memory = absorbMemory(trimmed, current.memory);
		if (intent.type === "remember") memory = {
			...memory,
			notes: [...memory.notes, intent.note].slice(-24)
		};
		const userMsg = {
			id: uid(),
			role: "user",
			text: trimmed,
			at: Date.now()
		};
		let scene = current.scene;
		let wardrobeIndex = current.wardrobeIndex;
		let outfitLabel = current.outfitLabel;
		let look = preset ?? null;
		if (!look && intent.type === "cycle") {
			wardrobeIndex = (current.wardrobeIndex + 1) % WARDROBE.length;
			const item = WARDROBE[wardrobeIndex];
			outfitLabel = item.label;
			look = {
				outfit: item.prompt,
				place: SCENE_PLACE[scene],
				label: item.label
			};
		} else if (!look && intent.type === "wear") {
			outfitLabel = intent.outfit;
			look = {
				outfit: `modest fully covering clothes described as: ${intent.outfit}. Use trousers, a skirt or a dress.`,
				place: SCENE_PLACE[scene],
				label: intent.outfit
			};
		} else if (!look && intent.type === "scene") {
			scene = intent.scene;
			const pack = SCENE_OUTFIT[scene];
			outfitLabel = pack.label;
			look = {
				outfit: pack.prompt,
				place: SCENE_PLACE[scene],
				label: pack.label
			};
		} else if (!look && intent.type === "look") look = {
			outfit: (WARDROBE[wardrobeIndex] ?? SCENE_OUTFIT[scene]).prompt,
			place: SCENE_PLACE[scene],
			label: outfitLabel
		};
		setState((prev) => ({
			...prev,
			memory,
			scene,
			wardrobeIndex,
			outfitLabel,
			lastTopic: trimmed.slice(0, 180),
			lastActive: Date.now(),
			messages: [...prev.messages, userMsg].slice(-80)
		}));
		if (intent.type === "dance") {
			setDancing(true);
			const line = danceLine(current.mode);
			pushNora(line);
			speak(line);
			window.setTimeout(() => setDancing(false), 8e3);
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
		const history = [...current.messages, userMsg].filter((message) => message.text).slice(-10).map((message) => ({
			role: message.role === "nora" ? "assistant" : "user",
			content: message.text
		}));
		let reply = "";
		let nextEmotion = detectEmotion(trimmed);
		let diary = "";
		let demo = false;
		let modelPhoto = null;
		try {
			const res = await chatWithNora({ data: {
				messages: history,
				mode: current.mode,
				memory: memoryBrief(memory),
				address: current.address,
				proactive: false,
				topic: current.lastTopic,
				currentLook: `${outfitLabel}, ${scene}`
			} });
			if (res.ok) {
				reply = res.reply;
				nextEmotion = res.emotion;
				diary = res.diary;
				modelPhoto = res.photo;
			} else {
				const fallback = demoReply({
					mode: current.mode,
					text: trimmed,
					memory,
					address: current.address
				});
				reply = fallback.reply;
				nextEmotion = fallback.emotion;
				diary = fallback.diary;
				demo = true;
			}
		} catch {
			const fallback = demoReply({
				mode: current.mode,
				text: trimmed,
				memory,
				address: current.address
			});
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
			diary: diary && diary !== prev.diary.at(-1)?.text ? [...prev.diary, {
				id: uid(),
				at: Date.now(),
				text: diary
			}].slice(-40) : prev.diary,
			messages: [...prev.messages, {
				...noraMsg(reply, {
					demo,
					pendingShot: Boolean(look)
				}),
				id: replyId
			}].slice(-80)
		}));
		speak(reply);
		if (look) await requestLook(look, replyId);
		busyRef.current = false;
		setBusy(false);
	}
	async function onPhoto(file) {
		if (busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		try {
			const imageDataUrl = await shrinkBlob(file, 768);
			const userMsg = {
				id: uid(),
				role: "user",
				text: "Przesyłam zdjęcie.",
				image: imageDataUrl,
				at: Date.now()
			};
			setState((prev) => ({
				...prev,
				lastActive: Date.now(),
				messages: [...prev.messages, userMsg].slice(-80)
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
				pushNora(seen.caption, blocked ? void 0 : { actions: {
					place,
					clothing
				} });
				speak(seen.caption);
			}
		} catch {
			pushNora("Nie umiem otworzyć tego pliku.");
		}
		busyRef.current = false;
		setBusy(false);
	}
	async function onReference(file) {
		try {
			const imageDataUrl = await shrinkBlob(file, 900);
			setState((prev) => ({
				...prev,
				reference: imageDataUrl,
				portrait: imageDataUrl
			}));
			setPanel(null);
		} catch {
			pushNora("Nie umiem przyjąć tego zdjęcia postaci.");
		}
	}
	const polishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("pl"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: state.theme === "dark" ? "dark-app nora-shell" : "nora-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PortraitStage, {
				src: state.portrait,
				scene: state.scene,
				emotion,
				phase,
				dancing,
				busy: busy || shot,
				outfit: state.outfitLabel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex min-h-0 flex-col bg-paper",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center gap-2 border-b border-line px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-w-0 flex-1 rounded-full border border-line bg-card p-1",
								children: Object.keys(MODE_LABEL).map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: state.mode === mode ? "h-9 flex-1 rounded-full bg-copper px-2 text-sm text-oncopper" : "h-9 flex-1 rounded-full px-2 text-sm text-muted",
									onClick: () => setState((prev) => ({
										...prev,
										mode
									})),
									children: MODE_LABEL[mode]
								}, mode))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Pamięć",
								onClick: () => setPanel("memory"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brain, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Pamiętnik",
								onClick: () => setPanel("diary"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Ustawienia",
								onClick: () => setPanel("settings"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: scrollerRef,
						className: "min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3",
						children: [
							state.messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: message.role === "user" ? "ml-8 rounded-2xl bg-slate px-3 py-2 text-oncopper" : "mr-8 rounded-2xl border border-line bg-card px-3 py-2 text-ink",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-pretty text-[0.98rem] leading-relaxed",
										children: message.text
									}),
									message.demo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs opacity-70",
										children: "tryb demo"
									}) : null,
									message.pendingShot && !message.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 flex h-40 items-end rounded-xl bg-line px-3 py-3 text-sm text-muted",
										children: "Nora robi zdjęcie…"
									}) : null,
									message.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: message.image,
										alt: "Zdjęcie Nory",
										referrerPolicy: "no-referrer",
										className: "mt-2 max-h-80 w-full rounded-xl object-cover"
									}) : null,
									message.actions ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-11 rounded-full border border-line px-3 text-sm",
											onClick: () => void send("Przenieś nas tam.", {
												outfit: SCENE_OUTFIT[state.scene].prompt,
												place: message.actions.place,
												label: state.outfitLabel
											}),
											children: "Przenieś nas tam"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "h-11 rounded-full border border-line px-3 text-sm",
											onClick: () => void send("Ubierz się podobnie.", {
												outfit: `modest fully covering clothes similar to: ${message.actions.clothing}`,
												place: SCENE_PLACE[state.scene],
												label: "podobny strój"
											}),
											children: "Ubierz się podobnie"
										})]
									}) : null
								]
							}, message.id)),
							busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Nora pisze…"
							}) : null,
							shot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Nora robi zdjęcie…"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex items-end gap-2 border-t border-line px-3 py-2",
						onSubmit: (event) => {
							event.preventDefault();
							const text = draft;
							setDraft("");
							send(text);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: "image/*",
								className: "hidden",
								onChange: (event) => {
									const file = event.target.files?.[0];
									event.target.value = "";
									if (file) onPhoto(file);
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Dodaj zdjęcie",
								onClick: () => fileRef.current?.click(),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "sr-only",
									children: "Wiadomość"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: draft,
									rows: 1,
									placeholder: "Napisz do Nory",
									className: "max-h-28 w-full resize-none rounded-2xl border border-line bg-card px-3 py-3 text-base text-ink outline-none focus:border-copper",
									onChange: (event) => setDraft(event.target.value),
									onKeyDown: (event) => {
										if (event.key === "Enter" && !event.shiftKey) {
											event.preventDefault();
											const text = draft;
											setDraft("");
											send(text);
										}
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: state.micOn ? "Wyłącz mikrofon" : "Włącz mikrofon",
								onClick: () => {
									setState((prev) => ({
										...prev,
										micOn: !prev.micOn
									}));
									if (state.micOn) stopListen();
									else startListen();
								},
								children: state.micOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: busy || !draft.trim(),
								className: "inline-flex size-11 items-center justify-center rounded-full bg-copper text-oncopper disabled:opacity-40",
								"aria-label": "Wyślij",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-5" })
							})
						]
					})
				]
			}),
			panel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-20 bg-ink/40",
				onClick: () => setPanel(null),
				role: "presentation",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "nora-sheet",
					role: "dialog",
					"aria-modal": "true",
					"aria-label": panel === "memory" ? "Pamięć" : panel === "diary" ? "Pamiętnik" : "Ustawienia",
					onClick: (event) => event.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl",
								children: panel === "memory" ? "Pamięć" : panel === "diary" ? "Pamiętnik" : "Ustawienia"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
								label: "Zamknij",
								onClick: () => setPanel(null),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
							})]
						}),
						panel === "memory" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Imię",
									value: state.memory.name,
									onChange: (name) => patchMemory({ name })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Lubię",
									value: state.memory.likes,
									onChange: (likes) => patchMemory({ likes })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Boję się",
									value: state.memory.fears,
									onChange: (fears) => patchMemory({ fears })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Mieszkam",
									value: state.memory.home,
									onChange: (home) => patchMemory({ home })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "Pracuję",
									value: state.memory.work,
									onChange: (work) => patchMemory({ work })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-sm text-muted",
									children: "Zapamiętane"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "space-y-2",
									children: [state.memory.notes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-sm text-muted",
										children: "Pusto. Powiedz „zapamiętaj …”."
									}) : null, state.memory.notes.map((note, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm",
											children: note
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "inline-flex size-11 items-center justify-center",
											"aria-label": "Usuń notatkę",
											onClick: () => patchMemory({ notes: state.memory.notes.filter((_, item) => item !== index) }),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
										})]
									}, `${note}-${index}`))]
								})] })
							]
						}) : null,
						panel === "diary" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "space-y-3",
							children: [state.diary.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted",
								children: "Nora jeszcze nic nie zapisała. Porozmawiaj chwilę."
							}) : null, state.diary.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-xl border border-line px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-pretty text-sm leading-relaxed",
									children: entry.text
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
										className: "text-xs text-muted",
										dateTime: new Date(entry.at).toISOString(),
										children: new Date(entry.at).toLocaleString("pl-PL", {
											hour: "2-digit",
											minute: "2-digit",
											day: "numeric",
											month: "short"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-sm text-muted",
										onClick: () => setState((prev) => ({
											...prev,
											diary: prev.diary.filter((item) => item.id !== entry.id)
										})),
										children: "Usuń"
									})]
								})]
							}, entry.id))]
						}) : null,
						panel === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line",
										onClick: () => setState((prev) => ({
											...prev,
											voiceOn: !prev.voiceOn
										})),
										children: [state.voiceOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }), "Czytanie"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line",
										onClick: () => setState((prev) => ({
											...prev,
											loopOn: !prev.loopOn,
											micOn: prev.loopOn ? prev.micOn : true
										})),
										children: ["Pętla ", state.loopOn ? "wł." : "wył."]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm",
									children: ["Tempo mowy", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "range",
										min: .8,
										max: 1.25,
										step: .05,
										value: state.rate,
										className: "mt-2 w-full",
										onChange: (event) => setState((prev) => ({
											...prev,
											rate: Number(event.target.value)
										}))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm",
									children: ["Głos", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: `w-full rounded-xl border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-copper mt-1`,
										value: state.voiceURI,
										onChange: (event) => setState((prev) => ({
											...prev,
											voiceURI: event.target.value
										})),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Domyślny polski"
										}), polishVoices.map((voice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: voice.voiceURI,
											children: voice.name
										}, voice.voiceURI))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-2 text-sm",
									children: "Zwracaj się"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2",
									children: ["on", "ona"].map((address) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: state.address === address ? "h-11 flex-1 rounded-full bg-copper text-oncopper" : "h-11 flex-1 rounded-full border border-line",
										onClick: () => setState((prev) => ({
											...prev,
											address
										})),
										children: address
									}, address))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line",
									onClick: () => setState((prev) => ({
										...prev,
										theme: prev.theme === "dark" ? "light" : "dark"
									})),
									children: [state.theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }), state.theme === "dark" ? "Jasny" : "Ciemny"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex h-11 cursor-pointer items-center justify-center rounded-full border border-line text-sm",
									children: ["Inne zdjęcie postaci", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/*",
										className: "hidden",
										onChange: (event) => {
											const file = event.target.files?.[0];
											event.target.value = "";
											if (file) onReference(file);
										}
									})]
								}),
								installEvent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate text-oncopper",
									onClick: () => {
										installEvent.prompt();
										setInstallEvent(null);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Zainstaluj na ekranie"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Na Androidzie: menu przeglądarki, potem „Dodaj do ekranu głównego”."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "h-11 w-full rounded-full border border-line text-sm",
									onClick: () => setState((prev) => ({
										...prev,
										messages: DEFAULTS.messages,
										lastTopic: ""
									})),
									children: "Wyczyść rozmowę"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted",
									children: [
										"Scena: ",
										SCENE_LABEL[state.scene],
										". Emocja: ",
										EMOTIONS[emotion].label,
										". Pamięć zostaje na tym urządzeniu."
									]
								})
							]
						}) : null
					]
				})
			}) : null
		]
	});
	function patchMemory(partial) {
		setState((prev) => ({
			...prev,
			memory: {
				...prev.memory,
				...partial
			}
		}));
	}
}
function IconButton({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		title: label,
		onClick,
		className: "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink",
		children
	});
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (event) => onChange(event.target.value),
			className: "mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-copper"
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoraApp, {});
}
//#endregion
export { Home as component };
