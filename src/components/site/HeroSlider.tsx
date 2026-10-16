import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero.jpg";
import braceletImg from "@/assets/bracelet.jpg";
import type { Banner } from "@/lib/store";

const FALLBACKS = [heroImg, braceletImg];

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const ms = Math.max(0, new Date(to).getTime() - now);
  const parts = [
    ["Days", Math.floor(ms / 864e5)],
    ["Hrs", Math.floor(ms / 36e5) % 24],
    ["Min", Math.floor(ms / 6e4) % 60],
    ["Sec", Math.floor(ms / 1e3) % 60],
  ] as const;
  return (
    <div className="mt-8 flex gap-3">
      {parts.map(([l, v]) => (
        <div key={l} className="glass w-16 rounded-lg py-2 text-center">
          <p className="font-display text-2xl text-gold">{String(v).padStart(2, "0")}</p>
          <p className="text-[0.55rem] uppercase tracking-[0.25em] text-muted-foreground">{l}</p>
        </div>
      ))}
    </div>
  );
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const list = banners.length ? banners : [];
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 7000);
    return () => clearInterval(t);
  }, [list.length]);
  const b = list[i];

  return (
    <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.img
          key={b?.id ?? "fallback"}
          src={b?.image_url || FALLBACKS[i % FALLBACKS.length]}
          alt=""
          width={1600}
          height={1008}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-fade-down" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={b?.id ?? "x"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="eyebrow">{b?.eyebrow ?? "Exquisite Craftsmanship"}</p>
            <h1 className="mt-5 text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
              {(b?.title ?? "Unleash the shining beauty").split(" ").map((w, k, arr) =>
                k === arr.length - 1 ? <em key={k} className="text-gold-gradient italic">{w}</em> : <span key={k}>{w} </span>,
              )}
            </h1>
            {b?.subtitle && <p className="mt-6 max-w-md text-lg text-muted-foreground">{b.subtitle}</p>}
            {b?.countdown_ends_at && <Countdown to={b.countdown_ends_at} />}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild variant="luxe" size="xl">
                <a href={b?.cta_href ?? "/shop"}>{b?.cta_label ?? "Explore"} <ArrowUpRight /></a>
              </Button>
              <Button asChild variant="ghostGold" size="xl"><a href="/contact">Book a fitting</a></Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-10 right-6 flex gap-2 sm:right-12">
          {list.map((x, k) => (
            <button key={x.id} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={`h-[2px] transition-all ${k === i ? "w-14 bg-gold" : "w-6 bg-foreground/30"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
