import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, CheckCircle2, Gem, Lock, MessageCircle, ShieldCheck, Store, Tag, Truck, X } from "lucide-react";
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
      { name: "robots", content: "noindex" },
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

const MEMORY_KEY = "fahed-checkout-v1";
const control =
  "h-12 w-full rounded-xl border border-white/10 bg-card/40 px-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20 aria-[invalid=true]:border-destructive";

type Done = { id: string; total: number; name: string; fulfillment: "delivery" | "pickup" };

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const [form, setForm] = useState({ customer_name: "", phone: "", governorate: "Keserwan", district: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<PromoResult>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [remembered, setRemembered] = useState(false);

  // Remember the customer's details on this device so a returning buyer doesn't retype them.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch { /* storage unavailable */ }
    setRemembered(true);
  }, []);
  useEffect(() => {
    if (!remembered) return;
    try {
      const { customer_name, phone, governorate, district, address } = form;
      localStorage.setItem(MEMORY_KEY, JSON.stringify({ customer_name, phone, governorate, district, address }));
    } catch { /* storage unavailable */ }
  }, [form, remembered]);

  const fee = deliveryFee(settings, form.governorate, fulfillment);
  const discount = promo?.discount_usd ?? 0;
  const total = Math.max(0, subtotal - discount) + fee;
  const rate = Number(settings?.lbp_rate ?? 89500);
  const governorates = Object.keys((settings?.delivery_fees as Record<string, number>) ?? {}).length
    ? Object.keys(settings!.delivery_fees as Record<string, number>)
    : BUSINESS.governorates;
  const phone = settings?.phone_primary ?? BUSINESS.phones[0];
  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function applyPromo() {
    const r = await validatePromo(code, subtotal);
    setPromo(r);
    r ? toast.success(`${r.code} applied — you save ${usd(r.discount_usd)}`) : toast.error("This code is invalid or not eligible");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    const next: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) next[String(i.path[0])] ||= i.message;
    if (fulfillment === "delivery" && !form.address.trim()) next.address = "Please add a delivery address";
    if (Object.keys(next).length || !parsed.success) {
      setErrors(next);
      toast.error(Object.values(next)[0] ?? "Please check the form");
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
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
    setDone({ id: id.slice(0, 8).toUpperCase(), total, name: parsed.data.customer_name.split(" ")[0], fulfillment });
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    const wa = (settings?.whatsapp ?? "").replace(/\D/g, "");
    const msg = encodeURIComponent(`Hello Fahed Jewelry, I just placed order #${done.id} (${usd(done.total)}).`);
    return (
      <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-64 max-w-md rounded-full bg-gold/10 blur-3xl" />
        <div className="relative">
          <span className="mx-auto grid size-20 place-items-center rounded-full border border-gold/40 bg-gold/10"><CheckCircle2 className="size-10 text-gold" /></span>
          <p className="eyebrow mt-8">Order confirmed</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">Thank you, {done.name}</h1>
          <p className="mx-auto mt-5 max-w-md text-muted-foreground">
            Order <span className="text-gold">#{done.id}</span> is with our atelier. We'll call you within a few hours to confirm
            {done.fulfillment === "delivery" ? " delivery." : " your pickup time."}
          </p>
          <div className="glass mx-auto mt-10 flex max-w-sm items-center justify-between rounded-2xl px-6 py-5 text-left">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{done.fulfillment === "delivery" ? "Pay on delivery" : "Pay at atelier"}</span>
            <span className="font-display text-3xl text-gold">{usd(done.total)}</span>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {wa && (
              <Button asChild variant="ghostGold" size="xl">
                <a href={`https://wa.me/${wa}?text=${msg}`} target="_blank" rel="noreferrer"><MessageCircle /> Message us on WhatsApp</a>
              </Button>
            )}
            <Button asChild variant="luxe" size="xl"><Link to="/shop">Continue browsing</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length)
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <Gem className="mx-auto size-10 text-gold" />
        <h1 className="mt-6 text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">Pieces you love will wait for you here.</p>
        <Button asChild variant="luxe" size="xl" className="mt-8"><Link to="/shop">Discover the collection</Link></Button>
      </div>
    );

  const pickupOn = settings?.pickup_enabled !== false;
  const codOn = settings?.cod_enabled !== false;
  const options = (["delivery", "pickup"] as const).filter((f) => (f === "pickup" ? pickupOn : codOn || !pickupOn));

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-7xl px-4 pb-32 pt-12 sm:pt-16 lg:pb-20">
      <nav aria-label="Progress" className="mb-10 flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em]">
        <span className="flex items-center gap-2 text-muted-foreground"><Check className="size-3.5 text-gold" /> Bag</span>
        <span className="h-px w-8 bg-gold/40" />
        <span className="flex items-center gap-2 text-gold"><span className="grid size-5 place-items-center rounded-full border border-gold text-[0.6rem]">2</span> Details</span>
        <span className="h-px w-8 bg-white/10" />
        <span className="flex items-center gap-2 text-muted-foreground/60"><span className="grid size-5 place-items-center rounded-full border border-white/15 text-[0.6rem]">3</span> Confirmed</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:gap-14">
        <div className="space-y-8">
          <div>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Almost yours</h1>
            <p className="mt-3 text-sm text-muted-foreground">No card needed. Pay in cash when your piece arrives, or at the atelier.</p>
          </div>

          <Section n={1} title="How would you like to receive it?">
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((f) => {
                const active = fulfillment === f;
                const Icon = f === "delivery" ? Truck : Store;
                return (
                  <button
                    type="button" key={f} onClick={() => setFulfillment(f)} aria-pressed={active}
                    className={cn("group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-card/30 p-5 text-left transition hover:border-gold/50", active && "border-gold bg-gold/10 shadow-[0_0_40px_-12px] shadow-gold/40")}
                  >
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-muted-foreground transition", active && "border-gold/50 bg-gold/15 text-gold")}><Icon className="size-5" /></span>
                    <span>
                      <span className="block font-display text-xl">{f === "delivery" ? "Courier delivery" : "Atelier pickup"}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{f === "delivery" ? "Cash on delivery across Lebanon" : "Faitroun, Keserwan · free"}</span>
                    </span>
                    {active && <Check className="absolute right-4 top-4 size-4 text-gold" />}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section n={2} title="Your details">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="name" label="Full name" error={errors.customer_name}>
                <Input id="name" autoComplete="name" className={control} aria-invalid={!!errors.customer_name} value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
              </Field>
              <Field id="phone" label="Phone (WhatsApp)" error={errors.phone}>
                <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+961 03 123 456" className={control} aria-invalid={!!errors.phone} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              {fulfillment === "delivery" && (
                <>
                  <Field id="gov" label="Governorate">
                    <select id="gov" value={form.governorate} onChange={(e) => set("governorate", e.target.value)} className={control}>
                      {governorates.map((g) => <option key={g} value={g} className="bg-card">{g} — {usd(deliveryFee(settings, g, "delivery"))}</option>)}
                    </select>
                  </Field>
                  <Field id="district" label="District / Town">
                    <Input id="district" autoComplete="address-level2" className={control} value={form.district} onChange={(e) => set("district", e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="address" label="Address" error={errors.address}>
                      <Input id="address" autoComplete="street-address" placeholder="Building, street, floor" className={control} aria-invalid={!!errors.address} value={form.address} onChange={(e) => set("address", e.target.value)} />
                    </Field>
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <Field id="notes" label="Notes (sizing, engraving, delivery time)">
                  <Textarea id="notes" rows={3} className={cn(control, "h-auto py-3")} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>
            </div>
          </Section>

          <Section n={3} title="Payment">
            <div className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-5">
              <span className="grid size-11 place-items-center rounded-full bg-gold/15 text-gold"><Lock className="size-5" /></span>
              <div>
                <p className="font-display text-xl">{fulfillment === "pickup" ? "Pay at the atelier" : "Cash on delivery"}</p>
                <p className="text-xs text-muted-foreground">Nothing is charged online. You pay when you hold your piece.</p>
              </div>
            </div>
          </Section>
        </div>

        <aside className="glass h-fit space-y-6 rounded-3xl border border-white/10 p-6 sm:p-7 lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-2xl">Order summary</p>
            <span className="text-xs text-muted-foreground">{items.reduce((n, i) => n + i.qty, 0)} items</span>
          </div>
          <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.id + i.metal} className="flex items-center gap-4 text-sm">
                <div className="relative">
                  <img src={i.image} alt="" className="size-16 rounded-xl border border-white/10 object-cover" />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold text-[0.65rem] font-medium text-primary-foreground">{i.qty}</span>
                </div>
                <div className="flex-1"><p className="font-display text-lg leading-tight">{i.name}</p><p className="text-xs text-muted-foreground">{metalLabel(i.metal)}</p></div>
                <span>{usd(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          {promo ? (
            <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-gold"><Tag className="size-4" /> {promo.code} applied</span>
              <button type="button" aria-label="Remove code" onClick={() => { setPromo(null); setCode(""); }} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="Promo code" className={cn(control, "h-11")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <Button type="button" variant="ghostGold" className="h-11" onClick={applyPromo} disabled={!code}>Apply</Button>
            </div>
          )}

          <div className="space-y-2.5 border-t border-white/10 pt-5 text-sm">
            <Row l="Subtotal" r={usd(subtotal)} />
            {discount > 0 && <Row l={`Discount (${promo?.code})`} r={`− ${usd(discount)}`} gold />}
            <Row l={fulfillment === "pickup" ? "Pickup" : `Delivery · ${form.governorate}`} r={fee ? usd(fee) : "Free"} />
            <div className="flex items-baseline justify-between border-t border-white/10 pt-4 font-display text-3xl"><span>Total</span><span className="text-gold">{usd(total)}</span></div>
            <p className="text-right text-xs text-muted-foreground">≈ {lbp(total, rate)}</p>
          </div>

          <Button type="submit" variant="luxe" size="xl" className="hidden w-full lg:inline-flex" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>

          <ul className="grid gap-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-gold" /> Handcrafted & hallmarked in Keserwan</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-gold" /> Insured courier across Lebanon</li>
          </ul>
          <p className="text-center text-xs text-muted-foreground">Questions? Call <a href={`tel:${phone}`} className="text-gold">{phone}</a></p>
        </aside>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="leading-tight"><p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Total</p><p className="font-display text-2xl text-gold">{usd(total)}</p></div>
          <Button type="submit" variant="luxe" size="xl" className="flex-1" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>
        </div>
      </div>
    </form>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card/20 p-5 sm:p-8">
      <h2 className="mb-6 flex items-center gap-3 font-display text-2xl">
        <span className="grid size-7 place-items-center rounded-full border border-gold/50 font-sans text-xs text-gold">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function Row({ l, r, gold }: { l: string; r: string; gold?: boolean }) {
  return <div className={cn("flex justify-between", gold ? "text-gold" : "text-muted-foreground")}><span>{l}</span><span>{r}</span></div>;
            }
                  
