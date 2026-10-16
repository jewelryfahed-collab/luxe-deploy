import { lazy, Suspense, useEffect, useState } from "react";
import { Pause, Play, Sun, Rotate3d } from "lucide-react";
import { METALS } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const GemScene = lazy(() => import("./GemScene"));

function canUseWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    const lowSpec = (navigator.hardwareConcurrency ?? 8) <= 2;
    return !!gl && !lowSpec;
  } catch {
    return false;
  }
}

type Props = {
  metal: string;
  onMetalChange?: (m: string) => void;
  fallbackImages: string[];
  className?: string;
  compact?: boolean;
  modelUrl?: string | null | undefined;
};

export function JewelryViewer({ metal, onMetalChange, fallbackImages, className, compact, modelUrl }: Props) {
  const [mode, setMode] = useState<"loading" | "3d" | "static">("loading");
  const [light, setLight] = useState(1);
  const [auto, setAuto] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => setMode(canUseWebGL() ? "3d" : "static"), []);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-espresso shadow-deep", className)}>
      {mode === "3d" ? (
        <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-espresso-glow" />}>
          <div className="absolute inset-0">
            <GemScene metal={metal} light={light} autoRotate={auto} modelUrl={modelUrl} />
          </div>
        </Suspense>
      ) : (
        <div className="absolute inset-0">
          {fallbackImages[idx] && <img src={fallbackImages[idx]} alt="Product view" className="h-full w-full object-cover" />}
          {fallbackImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-2">
              {fallbackImages.map((_, i) => (
                <button key={i} aria-label={`View ${i + 1}`} onClick={() => setIdx(i)} className={cn("h-1.5 w-6 rounded-full bg-foreground/30", i === idx && "bg-gold")} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
        <span className="glass pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.25em] text-gold">
          <Rotate3d className="size-3.5" /> {mode === "static" ? "Gallery" : "360° Studio"}
        </span>
        {mode === "static" && (
          <button className="glass pointer-events-auto rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em]" onClick={() => setMode("3d")}>
            Try 3D
          </button>
        )}
      </div>

      {!compact && (
        <div className="absolute inset-x-3 bottom-3 glass flex flex-wrap items-center gap-3 rounded-xl p-3">
          <div className={cn("flex gap-1.5", modelUrl && mode === "3d" && "hidden")}>
            {METALS.map((m) => (
              <button
                key={m.id}
                title={m.label}
                aria-label={m.label}
                onClick={() => onMetalChange?.(m.id)}
                className={cn("size-7 rounded-full border-2 border-transparent transition", metal === m.id && "border-gold scale-110")}
                style={{ background: `radial-gradient(circle at 30% 30%, #fff, ${m.color} 45%, #00000066)` }}
              />
            ))}
          </div>
          {mode === "3d" && (
            <>
              <div className="flex min-w-32 flex-1 items-center gap-2 text-muted-foreground">
                <Sun className="size-4" />
                <Slider value={[light]} min={0.4} max={1.8} step={0.05} onValueChange={(v) => setLight(v[0] ?? 1)} />
              </div>
              <button onClick={() => setAuto((a) => !a)} className="rounded-full border p-2 text-gold" aria-label="Toggle rotation">
                {auto ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
