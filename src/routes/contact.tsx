import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageCircle, Phone, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS, settingsQuery, usd } from "@/lib/store";
import earringsImg from "@/assets/earrings.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Atelier & Contact — Fahed Jewelry Manufacturing" },
      { name: "description", content: "Visit our atelier in Keserwan - Faitroun, Lebanon, or call +961 03 859 562." },
      { property: "og:title", content: "Contact Fahed Jewelry" },
      { property: "og:description", content: "Our atelier in Faitroun, Keserwan — phone, WhatsApp and delivery zones." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: s } = useQuery(settingsQuery);
  const phones: string[] = [s?.phone_primary ?? BUSINESS.phones[0]!, s?.phone_secondary ?? BUSINESS.phones[1]!];
  const wa = (s?.whatsapp ?? BUSINESS.whatsapp).replace(/\D/g, "");
  const fees = (s?.delivery_fees ?? {}) as Record<string, number>;
  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-2">
      <div>
        <p className="eyebrow">The atelier</p>
        <h1 className="mt-3 text-5xl sm:text-7xl">Visit us in <em className="text-gold-gradient">Faitroun</em></h1>
        <div className="mt-10 space-y-5">
          <p className="flex gap-3 text-lg"><MapPin className="mt-1 size-5 text-gold" /> {s?.address ?? BUSINESS.address}</p>
          {phones.map((p) => <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex gap-3 text-lg hover:text-gold"><Phone className="mt-1 size-5 text-gold" /> {p}</a>)}
        </div>
        <Button asChild variant="luxe" size="xl" className="mt-10"><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle /> Message on WhatsApp</a></Button>
        <div className="glass mt-12 rounded-2xl p-6">
          <p className="flex items-center gap-2 eyebrow"><Truck className="size-4" /> Delivery zones</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(fees).map(([z, f]) => <div key={z} className="flex justify-between border-b pb-2"><span>{z}</span><span className="text-gold">{usd(Number(f))}</span></div>)}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Cash on delivery available · Free pickup from the atelier</p>
        </div>
      </div>
      <img src={earringsImg} alt="Gold earrings on travertine" className="h-full max-h-[760px] w-full rounded-2xl object-cover" />
    </div>
  );
}
