import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { JewelryViewer } from "@/components/jewelry/JewelryViewer";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { BUSINESS, lbp, metalLabel, productImage, productsQuery, settingsQuery, useCart, usd } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const name = params.slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
    return {
      meta: [
        { title: `${name} — Fahed Jewelry Manufacturing` },
        { name: "description", content: `${name}, handcrafted in Faitroun, Lebanon. View it in 360° 3D.` },
        { property: "og:title", content: `${name} — Fahed Jewelry` },
        { property: "og:description", content: "Handcrafted fine jewelry from Keserwan, Lebanon." },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const { add } = useCart();
  const p = products.find((x) => x.slug === slug);
  const [metal, setMetal] = useState("18k_gold");
  useEffect(() => { if (p) setMetal(p.metal); }, [p]);

  if (isLoading) return <div className="mx-auto h-[70vh] max-w-7xl animate-pulse px-4 py-16" />;
  if (!p) return <div className="py-32 text-center"><h1 className="text-4xl">Piece not found</h1><Link to="/shop" className="mt-4 inline-block text-gold">Back to shop</Link></div>;

  const img = productImage(p);
  const related = products.filter((x) => x.id !== p.id && x.category_id === p.category_id).slice(0, 4);
  const wa = (settings?.whatsapp ?? BUSINESS.whatsapp).replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <JewelryViewer metal={metal} onMetalChange={setMetal} fallbackImages={[img, ...p.gallery]} modelUrl={p.model_url} className="aspect-square w-full lg:sticky lg:top-28" />
        <div>
          <p className="eyebrow">{p.categories?.name}</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">{p.name}</h1>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl text-gold">{usd(Number(p.price_usd))}</span>
            {p.compare_at_usd && <span className="text-muted-foreground line-through">{usd(Number(p.compare_at_usd))}</span>}
          </div>
          <p className="text-xs text-muted-foreground">≈ {lbp(Number(p.price_usd), Number(settings?.lbp_rate ?? 89500))}</p>
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{p.description}</p>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-y py-6 text-sm">
            <div><dt className="text-muted-foreground">Selected metal</dt><dd className="mt-1 text-gold">{metalLabel(metal)}</dd></div>
            <div><dt className="text-muted-foreground">Gemstone</dt><dd className="mt-1">{p.gemstone ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Availability</dt><dd className="mt-1">{p.stock > 0 ? `${p.stock} in atelier` : "Made to order"}</dd></div>
            <div><dt className="text-muted-foreground">Origin</dt><dd className="mt-1">Faitroun, Lebanon</dd></div>
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="luxe" size="xl" className="flex-1" onClick={() => add({ id: p.id, slug: p.slug, name: p.name, price: Number(p.price_usd), image: img, metal })}>Add to bag</Button>
            <Button asChild variant="ghostGold" size="xl"><a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I'm interested in ${p.name} (${metalLabel(metal)})`)}`} target="_blank" rel="noreferrer"><MessageCircle /> Ask on WhatsApp</a></Button>
          </div>
          <div className="mt-8 space-y-3 text-sm text-muted-foreground">
            <p className="flex gap-2"><Truck className="size-4 text-gold" /> Delivery across Lebanon · cash on delivery · store pickup</p>
            <p className="flex gap-2"><ShieldCheck className="size-4 text-gold" /> Certificate of authenticity with every piece</p>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-4xl">You may also <em className="text-gold-gradient">adore</em></h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
