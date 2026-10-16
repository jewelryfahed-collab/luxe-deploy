import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import logo from "@/assets/fahed-logo.jpg.asset.json";
import { BUSINESS, categoriesQuery, categoryImage, productImage, productsQuery, settingsQuery, useCart, usd } from "@/lib/store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [mega, setMega] = useState(false);
  const phones: string[] = [settings?.phone_primary ?? BUSINESS.phones[0]!, settings?.phone_secondary ?? BUSINESS.phones[1]!];

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b bg-background/95 text-[0.68rem] tracking-[0.2em] uppercase text-muted-foreground">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between overflow-hidden px-4">
          <span className="truncate">Handcrafted in Faitroun · Keserwan</span>
          <span className="hidden items-center gap-4 sm:flex">
            {phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-gold">
                <Phone className="size-3" /> {p}
              </a>
            ))}
          </span>
        </div>
      </div>
      <div className="glass border-x-0 border-t-0" onMouseLeave={() => setMega(false)}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <MobileNav categories={categories} />
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="Fahed Jewelry" className="size-16 rounded-full object-cover shadow-gold ring-2 ring-gold/50" />
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-2xl tracking-wide">Fahed</span>
              <span className="eyebrow text-[0.55rem]">Jewelry Manufacturing</span>
            </span>
          </Link>
          <nav className="ml-6 hidden items-center gap-7 text-[0.72rem] uppercase tracking-[0.2em] md:flex">
            <button onMouseEnter={() => setMega(true)} onClick={() => setMega((m) => !m)} className="uppercase tracking-[0.2em] hover:text-gold">Collections</button>
            <Link to="/shop" search={{ category: "bridal" }} className="hover:text-gold">Bridal</Link>
            <Link to="/shop" search={{ category: "custom" }} className="hover:text-gold">Bespoke</Link>
            <Link to="/contact" className="hover:text-gold">Atelier</Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <SearchBox />
            <Link to="/admin" aria-label="Account" className="rounded-full p-2 hover:text-gold"><User className="size-5" /></Link>
            <button onClick={() => setOpen(true)} aria-label="Shopping bag" className="relative rounded-full p-2 hover:text-gold">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-gold text-[0.6rem] font-bold text-primary-foreground">{count}</span>
              )}
            </button>
          </div>
        </div>
        {mega && (
          <div className="hidden border-t md:block">
            <div className="mx-auto grid max-w-7xl grid-cols-6 gap-4 px-4 py-6">
              {categories.map((c) => (
                <Link key={c.id} to="/shop" search={{ category: c.slug }} onClick={() => setMega(false)} className="group">
                  <div className="aspect-[4/5] overflow-hidden rounded-lg">
                    <img src={c.image_url || categoryImage(c.slug)} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  </div>
                  <p className="mt-2 font-display text-lg group-hover:text-gold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileNav({ categories }: { categories: { id: string; slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="p-2 md:hidden" aria-label="Menu"><Menu className="size-5" /></SheetTrigger>
      <SheetContent side="left" className="bg-background">
        <p className="eyebrow mt-6">Collections</p>
        <div className="mt-4 flex flex-col gap-4">
          {categories.map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} onClick={() => setOpen(false)} className="font-display text-2xl">{c.name}</Link>
          ))}
          <Link to="/contact" onClick={() => setOpen(false)} className="font-display text-2xl">Atelier & Contact</Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data: products = [] } = useQuery({ ...productsQuery, enabled: open });
  const nav = useNavigate();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.filter((p) => p.is_featured).slice(0, 4);
    return products.filter((p) => [p.name, p.gemstone, p.categories?.name, p.metal].join(" ").toLowerCase().includes(s)).slice(0, 6);
  }, [q, products]);

  if (!open) return <button onClick={() => setOpen(true)} aria-label="Search" className="rounded-full p-2 hover:text-gold"><Search className="size-5" /></button>;
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-screen bg-background/80 backdrop-blur-md" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-20 max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
        <div className="glass flex items-center gap-3 rounded-full px-5">
          <Search className="size-5 text-gold" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); if (e.key === "Enter" && results[0]) { nav({ to: "/product/$slug", params: { slug: results[0].slug } }); setOpen(false); } }}
            placeholder="Search diamonds, gold, silver…"
            className="h-14 flex-1 bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground"
          />
          <button onClick={() => setOpen(false)} aria-label="Close search"><X className="size-5" /></button>
        </div>
        <p className="eyebrow mt-6 mb-3">{q ? "Results" : "Featured"}</p>
        <div className="grid gap-2">
          {results.map((p) => (
            <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} onClick={() => setOpen(false)} className="glass flex items-center gap-4 rounded-xl p-2 hover:border-gold/50">
              <img src={productImage(p)} alt="" className="size-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-display text-lg">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.categories?.name} · {p.gemstone ?? "Pure metal"}</p>
              </div>
              <span className="pr-3 text-gold">{usd(Number(p.price_usd))}</span>
            </Link>
          ))}
          {q && results.length === 0 && <p className="text-muted-foreground">No pieces match "{q}".</p>}
        </div>
      </div>
    </div>
  );
}
