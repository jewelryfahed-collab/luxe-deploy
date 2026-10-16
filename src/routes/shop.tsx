import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { METALS, categoriesQuery, productsQuery, usd } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Shop Fine Jewelry — Fahed Jewelry Manufacturing" },
      { name: "description", content: "Earrings, necklaces, bracelets and bridal pieces in 18K gold, platinum, silver and diamonds." },
      { property: "og:title", content: "Shop — Fahed Jewelry" },
      { property: "og:description", content: "Filter by metal, gemstone and price across our handcrafted collections." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const nav = useNavigate({ from: "/shop" });
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [metals, setMetals] = useState<string[]>([]);
  const [gem, setGem] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("new");

  const gems = useMemo(() => [...new Set(products.map((p) => p.gemstone).filter(Boolean))] as string[], [products]);
  const list = useMemo(() => {
    let l = products.filter(
      (p) =>
        (!category || p.categories?.slug === category) &&
        (!metals.length || metals.includes(p.metal)) &&
        (!gem || p.gemstone === gem) &&
        Number(p.price_usd) <= maxPrice &&
        (!inStock || p.stock > 0),
    );
    if (sort === "low") l = [...l].sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
    if (sort === "high") l = [...l].sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
    return l;
  }, [products, category, metals, gem, maxPrice, inStock, sort]);
  const active = categories.find((c) => c.slug === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <p className="eyebrow">The collection</p>
      <h1 className="mt-3 text-5xl sm:text-7xl">{active?.name ?? "All jewelry"}</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        <Chip on={!category} onClick={() => nav({ search: {} })}>All</Chip>
        {categories.map((c) => <Chip key={c.id} on={category === c.slug} onClick={() => nav({ search: { category: c.slug } })}>{c.name}</Chip>)}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="glass h-fit space-y-8 rounded-2xl p-6 lg:sticky lg:top-28">
          <p className="flex items-center gap-2 eyebrow"><SlidersHorizontal className="size-4" /> Refine</p>
          <div>
            <p className="mb-3 text-sm">Metal</p>
            <div className="flex flex-wrap gap-2">
              {METALS.map((m) => (
                <Chip key={m.id} on={metals.includes(m.id)} onClick={() => setMetals((x) => (x.includes(m.id) ? x.filter((y) => y !== m.id) : [...x, m.id]))}>
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} /> {m.label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm">Gemstone</p>
            <div className="flex flex-wrap gap-2">
              <Chip on={!gem} onClick={() => setGem("")}>Any</Chip>
              {gems.map((g) => <Chip key={g} on={gem === g} onClick={() => setGem(g)}>{g}</Chip>)}
            </div>
          </div>
          <div>
            <p className="mb-3 flex justify-between text-sm"><span>Max price</span><span className="text-gold">{usd(maxPrice)}</span></p>
            <Slider value={[maxPrice]} min={200} max={5000} step={50} onValueChange={(v) => setMaxPrice(v[0] ?? 5000)} />
          </div>
          <label className="flex items-center justify-between text-sm">In stock only <Switch checked={inStock} onCheckedChange={setInStock} /></label>
        </aside>
        <div>
          <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>{list.length} pieces</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border bg-card px-4 py-2 text-foreground">
              <option value="new">Newest</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3">
            {list.map((p) => <ProductCard key={p.id} p={p} tall />)}
          </div>
          {list.length === 0 && <p className="py-20 text-center text-muted-foreground">No pieces match these filters.</p>}
        </div>
      </div>
    </div>
  );
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition", on ? "border-gold bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}
