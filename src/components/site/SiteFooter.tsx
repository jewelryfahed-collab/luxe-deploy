import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/fahed-logo.jpg.asset.json";
import { BUSINESS, settingsQuery } from "@/lib/store";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  const phones: string[] = [s?.phone_primary ?? BUSINESS.phones[0]!, s?.phone_secondary ?? BUSINESS.phones[1]!];
  const wa = (s?.whatsapp ?? BUSINESS.whatsapp).replace(/\D/g, "");
  return (
    <footer className="mt-24 border-t bg-espresso-glow">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={logo.url} alt="Fahed Jewelry Manufacturing" className="size-28 rounded-full object-cover shadow-gold ring-2 ring-gold/50" />
          <p className="mt-6 max-w-sm font-display text-2xl leading-snug">
            Fine jewelry, <em className="text-gold-gradient">forged by hand</em> in the mountains of Keserwan.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="eyebrow">Visit the atelier</p>
          <p className="flex gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" /> {s?.address ?? BUSINESS.address}</p>
          {phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex gap-2 text-muted-foreground hover:text-gold"><Phone className="size-4 text-gold" /> {p}</a>
          ))}
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex gap-2 text-muted-foreground hover:text-gold"><MessageCircle className="size-4 text-gold" /> WhatsApp us</a>
        </div>
        <div className="space-y-3 text-sm">
          <p className="eyebrow">Explore</p>
          <Link to="/shop" className="block text-muted-foreground hover:text-gold">All jewelry</Link>
          <Link to="/shop" search={{ category: "bridal" }} className="block text-muted-foreground hover:text-gold">Bridal</Link>
          <Link to="/shop" search={{ category: "custom" }} className="block text-muted-foreground hover:text-gold">Custom manufacturing</Link>
          <Link to="/contact" className="block text-muted-foreground hover:text-gold">Contact</Link>
          {s?.instagram_url && <a href={s.instagram_url} className="block text-muted-foreground hover:text-gold">Instagram</a>}
          {s?.facebook_url && <a href={s.facebook_url} className="block text-muted-foreground hover:text-gold">Facebook</a>}
        </div>
      </div>
      <div className="border-t py-6 text-center text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        © {new Date().getFullYear()} {s?.brand_name ?? BUSINESS.brand} · Delivery across Lebanon · Cash on delivery
      </div>
    </footer>
  );
}
