import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { metalLabel, productImage, useCart, usd, type Product } from "@/lib/store";

export function ProductCard({ p, tall }: { p: Product; tall?: boolean }) {
  const { add } = useCart();
  const img = productImage(p);
  return (
    <div className="group relative">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block overflow-hidden rounded-xl border bg-card">
        <div className={tall ? "aspect-[3/4]" : "aspect-square"}>
          <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-[1.2s] group-hover:scale-110" />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="glass rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em]">{p.categories?.name}</span>
          {p.compare_at_usd && <span className="rounded-full bg-gold px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-primary-foreground">Sale</span>}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <Link to="/product/$slug" params={{ slug: p.slug }} className="font-display text-xl hover:text-gold">{p.name}</Link>
          <p className="text-xs text-muted-foreground">{metalLabel(p.metal)}{p.gemstone ? ` · ${p.gemstone}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-gold">{usd(Number(p.price_usd))}</p>
          {p.compare_at_usd && <p className="text-xs text-muted-foreground line-through">{usd(Number(p.compare_at_usd))}</p>}
        </div>
      </div>
      <button
        onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: Number(p.price_usd), image: img, metal: p.metal })}
        aria-label={`Add ${p.name} to bag`}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-gold text-primary-foreground opacity-0 transition group-hover:opacity-100 max-md:opacity-100"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
