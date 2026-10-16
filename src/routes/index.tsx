import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, Gem, Hammer, Truck } from "lucide-react";
import { useState } from "react";
import { HeroSlider } from "@/components/site/HeroSlider";
import { ProductCard } from "@/components/site/ProductCard";
import { JewelryViewer } from "@/components/jewelry/JewelryViewer";
import { Button } from "@/components/ui/button";
import { bannersQuery, categoriesQuery, categoryImage, productsQuery } from "@/lib/store";
import heroImg from "@/assets/hero.jpg";
import necklaceImg from "@/assets/necklace.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fahed Jewelry Manufacturing — Fine Jewelry from Faitroun, Lebanon" },
      { name: "description", content: "Handcrafted 18K gold, platinum, silver and diamond jewelry from Keserwan. Explore bridal and bespoke pieces in 3D." },
      { property: "og:title", content: "Fahed Jewelry Manufacturing" },
      { property: "og:description", content: "Luxury fine jewelry handcrafted in Keserwan - Faitroun, Lebanon." },
    ],
  }),
  component: Home,
});

const fade = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } };

function Home() {
  const { data: banners = [] } = useQuery(bannersQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [metal, setMetal] = useState("18k_gold");
  const featured = products.filter((p) => p.is_featured);

  return (
    <>
      <HeroSlider banners={banners} />

      <div className="overflow-hidden border-y py-4">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap font-display text-2xl italic text-muted-foreground">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["18K Gold", "Platinum", "Conflict-free Diamonds", "Bespoke Bridal", "Made in Faitroun", "Cash on Delivery"].map((t) => (
              <span key={t + k} className="flex items-center gap-12">{t}<Gem className="size-4 text-gold" /></span>
            )),
          )}
        </div>
      </div>

      {/* Categories — editorial masonry */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <motion.div {...fade} className="mb-12 flex items-end justify-between gap-6">
          <h2 className="text-4xl sm:text-6xl">New <em className="text-gold-gradient">jewellery</em> collections</h2>
          <Link to="/shop" className="eyebrow hidden items-center gap-2 sm:flex">View all <ArrowUpRight className="size-4" /></Link>
        </motion.div>
        <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {categories.map((c, k) => (
            <motion.div key={c.id} {...fade} transition={{ ...fade.transition, delay: k * 0.06 }}>
              <Link to="/shop" search={{ category: c.slug }} className="group relative block overflow-hidden rounded-xl border">
                <img src={c.image_url || categoryImage(c.slug)} alt={c.name} loading="lazy" className={`w-full object-cover transition duration-[1.4s] group-hover:scale-110 ${k % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent" />
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                  <div>
                    <p className="font-display text-2xl sm:text-3xl">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full border border-gold/50 text-gold transition group-hover:bg-gold group-hover:text-primary-foreground"><ArrowUpRight className="size-4" /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3D studio */}
      <section className="bg-espresso-glow border-y">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 lg:grid-cols-2">
          <motion.div {...fade}>
            <p className="eyebrow">The 360° Studio</p>
            <h2 className="mt-4 text-4xl sm:text-6xl">Glamour that <em className="text-gold-gradient">steals the show</em></h2>
            <p className="mt-6 max-w-md text-muted-foreground">Rotate, zoom and relight our signature solitaire. Switch between 18K gold, rose gold, white gold and platinum — see the diamond catch the light before it ever leaves our atelier.</p>
            <Button asChild variant="luxe" size="xl" className="mt-10"><Link to="/product/$slug" params={{ slug: "aurelia-solitaire" }}>Discover Aurelia <ArrowUpRight /></Link></Button>
          </motion.div>
          <JewelryViewer metal={metal} onMetalChange={setMetal} fallbackImages={[heroImg]} className="aspect-square w-full" />
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <motion.div {...fade} className="mb-12 text-center">
          <p className="eyebrow">Most loved</p>
          <h2 className="mt-3 text-4xl sm:text-6xl">Infinite <em className="text-gold-gradient">sparkle</em></h2>
        </motion.div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} p={p} tall />)}
        </div>
      </section>

      {/* Bespoke split */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
          <img src={necklaceImg} alt="Emerald pendant" loading="lazy" className="h-full max-h-[620px] w-full object-cover" />
          <div className="flex flex-col justify-center p-10 sm:p-16">
            <p className="eyebrow">Custom manufacturing</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Personalised jewellery, <em className="text-gold-gradient">designed for you</em></h2>
            <p className="mt-6 text-muted-foreground">From sketch to CAD to the final polish, every bespoke commission is cast and set by our master jewelers in Faitroun.</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[[Gem, "Certified stones"], [Hammer, "Hand-finished"], [Truck, "All-Lebanon delivery"]].map(([Icon, t]) => {
                const I = Icon as typeof Gem;
                return <div key={t as string}><I className="size-6 text-gold" /><p className="mt-2 text-sm">{t as string}</p></div>;
              })}
            </div>
            <Button asChild variant="ghostGold" size="xl" className="mt-10 self-start"><Link to="/contact">Start a commission</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
