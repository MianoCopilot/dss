import { useEffect, useState } from "react";
import { EMOTIONS, SCENE_LABEL, type EmotionId, type SceneId } from "@/lib/nora-model";

type Phase = "idle" | "speak" | "listen";

type Props = {
  src: string;
  scene: SceneId;
  emotion: EmotionId;
  phase: Phase;
  dancing: boolean;
  busy: boolean;
  outfit: string;
};

export function PortraitStage({ src, scene, emotion, phase, dancing, busy, outfit }: Props) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const shown = broken ? "/nora-ref.jpg" : src;
  const glow = phase === "speak" ? "#e2b15a" : phase === "listen" ? "#7ea2c4" : EMOTIONS[emotion].glow;
  const phaseLabel = phase === "speak" ? "mówi" : phase === "listen" ? "słucha" : dancing ? "tańczy" : EMOTIONS[emotion].label;

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setTilt({ x, y });
    };
    const onOrient = (event: DeviceOrientationEvent) => {
      const x = Math.max(-1, Math.min(1, (event.gamma ?? 0) / 28));
      const y = Math.max(-1, Math.min(1, ((event.beta ?? 40) - 40) / 35));
      setTilt({ x, y });
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
    dancing ? "nora-dance" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={cls}
      style={{ ["--px" as string]: String(tilt.x), ["--py" as string]: String(tilt.y) }}
      aria-label="Portret Nory"
      onClick={() => {
        const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
        if (typeof orientation.requestPermission === "function") void orientation.requestPermission();
      }}
    >
      <img className="nora-layer nora-layer-bg" src={shown} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      <img className="nora-layer nora-layer-body" src={shown} alt="Nora" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      <img className="nora-layer nora-layer-head" src={shown} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      <div className={`nora-wash wash-${scene}`} />
      <div className="nora-glow" style={{ background: glow }} />
      <div className="nora-vignette" />
      <div className="nora-blink" />
      <div className="nora-stage-ui">
        <div>
          <p className="font-display text-3xl leading-none text-oncopper text-balance">Nora</p>
          <p className="mt-1 text-sm text-oncopper">{phaseLabel}</p>
        </div>
        <div className="flex items-end justify-between gap-3 text-oncopper">
          <div>
            <p className="text-xs tracking-wide uppercase text-oncopper">{SCENE_LABEL[scene]}</p>
            <p className="text-sm">{outfit}</p>
          </div>
          {busy ? <p className="text-sm">Chwilę…</p> : null}
        </div>
      </div>
    </section>
  );
}
