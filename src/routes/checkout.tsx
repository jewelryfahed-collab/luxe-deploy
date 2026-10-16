import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BUSINESS, deliveryFee, lbp, metalLabel, settingsQuery, useCart, usd, validatePromo, type PromoResult } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Fahed Jewelry Manufacturing" },
      { name: "description", content: "Secure checkout with delivery across Lebanon, cash on delivery or store pickup." },
      { property: "og:title", content: "Checkout — Fahed Jewelry" },
      { property: "og:description", content: "Complete your order for delivery across Lebanon." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^(\+?961)?\s?0?\d{1,2}[\s-]?\d{3}[\s-]?\d{3}$/, "Enter a valid Lebanese phone number"),
  governorate: z.string().min(1),
  district: z.string().trim().max(100).optional(),
  address: z.string().trim().max(400).optional(),
  notes: z.string().trim().max(500).optional(),
});

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const [form, setForm] = useState({ customer_name: "", phone: "", governorate: "Keserwan", district: "", address: "", notes: "" });
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<PromoResult>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const fee = deliveryFee(settings, form.governorate, fulfillment);
  const discount = promo?.discount_usd ?? 0;
  const total = Math.max(0, subtotal - discount) + fee;
  const rate = Number(settings?.lbp_rate ?? 89500);
  const governorates = Object.keys((settings?.delivery_fees as Record<string, number>) ?? {}).length
    ? Object.keys(settings!.delivery_fees as Record<string, number>)
    : BUSINESS.governorates;

  async function applyPromo() {
    const r = await validatePromo(code, subtotal);
    setPromo(r);
    r ? toast.success(`${r.code} applied — you save ${usd(r.discount_usd)}`) : toast.error("This code is invalid or not eligible");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
    if (fulfillment === "delivery" && !form.address.trim()) return void toast.error("Please add a delivery address");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const id = crypto.randomUUID();
    const { error } = await supabase.from("orders").insert({
      id,
      user_id: u.user?.id ?? null,
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      governorate: parsed.data.governorate,
      district: parsed.data.district || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      fulfillment,
      payment_method: fulfillment === "pickup" ? "pay_at_store" : "cod",
      items: items.map((i) => ({ id: i.id, name: i.name, metal: i.metal, qty: i.qty, price: i.price })),
      subtotal_usd: subtotal,
      discount_usd: discount,
      delivery_usd: fee,
      total_usd: total,
      promo_code: promo?.code ?? null,
    });
    setBusy(false);
    if (error) return void toast.error("We couldn't place your order. Please try again.");
    clear();
    setDone(id.slice(0, 8).toUpperCase());
  }

  if (done)
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <CheckCircle2 className="mx-auto size-14 text-gold" />
        <h1 className="mt-6 text-5xl">Thank you</h1>
        <p className="mt-4 text-muted-foreground">Order <span className="text-gold">#{done}</span> is received. Our atelier will call you to confirm within a few hours.</p>
        <Button asChild variant="luxe" size="xl" className="mt-10"><Link to="/shop">Continue browsing</Link></Button>
      </div>
    );

  if (!items.length)
    return (
      <div className="py-32 text-center"><h1 className="text-4xl">Your bag is empty</h1><Link to="/shop" className="mt-4 inline-block text-gold">Discover the collection</Link></div>
    );

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1fr_420px]">
      <div className="space-y-10">
        <div><p className="eyebrow">Checkout</p><h1 className="mt-3 text-5xl">Delivery details</h1></div>
        <div className="grid grid-cols-2 gap-3">
          {(["delivery", "pickup"] as const).map((f) => (
            <button type="button" key={f} onClick={() => setFulfillment(f)} className={cn("rounded-xl border p-5 text-left transition", fulfillment === f && "border-gold bg-gold/10")}>
              <p className="font-display text-xl">{f === "delivery" ? "Courier delivery" : "Atelier pickup"}</p>
              <p className="text-xs text-muted-foreground">{f === "delivery" ? "Cash on delivery across Lebanon" : "Faitroun, Keserwan · free"}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name"><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></Field>
          <Field label="Phone (WhatsApp)"><Input placeholder="+961 03 123 456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          {fulfillment === "delivery" && (
            <>
              <Field label="Governorate">
                <select value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className="h-9 w-full rounded-md border bg-transparent px-3 text-sm">
                  {governorates.map((g) => <option key={g} value={g} className="bg-card">{g} — {usd(deliveryFee(settings, g, "delivery"))}</option>)}
                </select>
              </Field>
              <Field label="District / Town"><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Address"><Input placeholder="Building, street, floor" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
            </>
          )}
          <div className="sm:col-span-2"><Field label="Notes (sizing, engraving, delivery time)"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
      </div>

      <aside className="glass h-fit space-y-5 rounded-2xl p-6 lg:sticky lg:top-28">
        <p className="font-display text-2xl">Order summary</p>
        {items.map((i) => (
          <div key={i.id + i.metal} className="flex gap-3 text-sm">
            <img src={i.image} alt="" className="size-14 rounded-md object-cover" />
            <div className="flex-1"><p>{i.name} × {i.qty}</p><p className="text-xs text-muted-foreground">{metalLabel(i.metal)}</p></div>
            <span>{usd(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Button type="button" variant="ghostGold" onClick={applyPromo} disabled={!code}>Apply</Button>
        </div>
        <div className="space-y-2 border-t pt-4 text-sm">
          <Row l="Subtotal" r={usd(subtotal)} />
          {discount > 0 && <Row l={`Discount (${promo?.code})`} r={`− ${usd(discount)}`} gold />}
          <Row l={fulfillment === "pickup" ? "Pickup" : `Delivery · ${form.governorate}`} r={fee ? usd(fee) : "Free"} />
          <div className="flex justify-between border-t pt-3 font-display text-2xl"><span>Total</span><span className="text-gold">{usd(total)}</span></div>
          <p className="text-right text-xs text-muted-foreground">≈ {lbp(total, rate)}</p>
        </div>
        <Button type="submit" variant="luxe" size="xl" className="w-full" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>
        <p className="text-center text-xs text-muted-foreground">Questions? Call {settings?.phone_primary ?? BUSINESS.phones[0]}</p>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</Label>{children}</div>;
}
function Row({ l, r, gold }: { l: string; r: string; gold?: boolean }) {
  return <div className={cn("flex justify-between", gold ? "text-gold" : "text-muted-foreground")}><span>{l}</span><span>{r}</span></div>;
}
