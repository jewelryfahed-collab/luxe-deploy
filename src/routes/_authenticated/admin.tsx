import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { METALS, categoriesQuery, metalLabel, productImage, usd, useIsAdmin, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Atelier Dashboard — Fahed Jewelry Manufacturing" },
      { name: "description", content: "Manage products, banners, promotions, orders and store settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Atelier Dashboard" },
      { property: "og:description", content: "Fahed Jewelry admin panel." },
    ],
  }),
  component: Admin,
});

type OrderStatus = Database["public"]["Enums"]["order_status"];
const STATUSES: { id: OrderStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "in_production", label: "In Production" },
  { id: "ready_for_delivery", label: "Ready for Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

async function uploadMedia(file: File, folder: string) {
  const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2;
  return data.signedUrl;
}

function Admin() {
  const { loading, admin, email } = useIsAdmin();
  if (loading) return <div className="h-[60vh]" />;
  if (!admin)
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <h1 className="text-4xl">Signed in as {email}</h1>
        <p className="mt-4 text-muted-foreground">This account doesn't have atelier access.</p>
        <Button variant="ghostGold" className="mt-8" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Atelier dashboard</p><h1 className="mt-2 text-5xl">Good day, artisan</h1></div>
        <Button variant="ghost" onClick={() => supabase.auth.signOut()}><LogOut /> Sign out</Button>
      </div>
      <Tabs defaultValue="orders" className="mt-10">
        <TabsList className="glass h-auto flex-wrap rounded-full p-1">
          {["orders", "products", "banners", "promotions", "settings"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-full px-5 capitalize data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="orders" className="mt-8"><OrdersBoard /></TabsContent>
        <TabsContent value="products" className="mt-8"><ProductsAdmin /></TabsContent>
        <TabsContent value="banners" className="mt-8"><BannersAdmin /></TabsContent>
        <TabsContent value="promotions" className="mt-8"><PromosAdmin /></TabsContent>
        <TabsContent value="settings" className="mt-8"><SettingsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- Orders ----------------
function OrdersBoard() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function move(id: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }
  return (
    <div className="grid gap-4 overflow-x-auto md:grid-cols-5">
      {STATUSES.map((s) => {
        const col = orders.filter((o) => o.status === s.id);
        return (
          <div key={s.id} className="min-w-60 rounded-2xl border bg-card/50 p-3">
            <p className="mb-3 flex justify-between px-1 text-xs uppercase tracking-[0.2em] text-muted-foreground"><span>{s.label}</span><span className="text-gold">{col.length}</span></p>
            <div className="space-y-3">
              {col.map((o) => (
                <div key={o.id} className="rounded-xl border bg-background p-3 text-sm">
                  <div className="flex justify-between"><span className="font-medium">{o.customer_name}</span><span className="text-gold">{usd(Number(o.total_usd))}</span></div>
                  <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()} · {o.governorate} · {o.fulfillment}</p>
                  <a href={`tel:${o.phone}`} className="text-xs text-gold">{o.phone}</a>
                  <ul className="mt-2 text-xs text-muted-foreground">
                    {(o.items as { name: string; qty: number; metal: string }[]).map((i, k) => <li key={k}>{i.qty}× {i.name} ({metalLabel(i.metal)})</li>)}
                  </ul>
                  <select value={o.status} onChange={(e) => move(o.id, e.target.value as OrderStatus)} className="mt-3 w-full rounded-md border bg-card px-2 py-1 text-xs">
                    {STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Products ----------------
type ProductForm = Partial<Database["public"]["Tables"]["products"]["Insert"]>;
function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => ((await supabase.from("products").select("*, categories(slug,name)").order("created_at", { ascending: false })).data ?? []) as Product[],
  });
  const [edit, setEdit] = useState<ProductForm | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!edit?.name || !edit.slug) return void toast.error("Name and slug are required");
    setBusy(true);
    const payload = { ...edit, price_usd: Number(edit.price_usd ?? 0), compare_at_usd: edit.compare_at_usd ? Number(edit.compare_at_usd) : null, stock: Number(edit.stock ?? 0) } as Database["public"]["Tables"]["products"]["Insert"];
    delete (payload as Record<string, unknown>)["categories"];
    const { error } = edit.id ? await supabase.from("products").update(payload).eq("id", edit.id) : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Product saved");
    setEdit(null);
    qc.invalidateQueries();
  }
  async function del(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    qc.invalidateQueries();
  }
  async function upload(file: File | undefined, field: "image_url" | "model_url") {
    if (!file) return;
    try {
      const url = await uploadMedia(file, field === "image_url" ? "products" : "models");
      setEdit((e) => ({ ...e, [field]: url }));
      toast.success(field === "model_url" ? "3D model uploaded — save the product to publish it" : "Uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-between"><p className="text-muted-foreground">{products.length} products</p><Button variant="luxe" onClick={() => setEdit({ metal: "18k_gold", is_active: true, stock: 1, model_kind: "diamond" })}><Plus /> New product</Button></div>
      <div className="overflow-hidden rounded-2xl border">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 border-b p-3 last:border-0">
            <img src={productImage(p)} alt="" className="size-14 rounded-lg object-cover" />
            <div className="flex-1"><p className="font-display text-lg">{p.name}</p><p className="text-xs text-muted-foreground">{p.categories?.name} · {metalLabel(p.metal)} · stock {p.stock}{p.model_url ? " · 3D model" : ""}</p></div>
            <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] uppercase", p.is_active ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground")}>{p.is_active ? "Live" : "Hidden"}</span>
            <span className="w-20 text-right text-gold">{usd(Number(p.price_usd))}</span>
            <Button size="icon" variant="ghost" onClick={() => setEdit(p)} aria-label="Edit"><Pencil /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)} aria-label="Delete"><Trash2 /></Button>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-background sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display text-3xl font-normal">{edit?.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Name"><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value, slug: edit.id ? (edit.slug ?? "") : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} /></F>
              <F label="Slug"><Input value={edit.slug ?? ""} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} /></F>
              <F label="Category">
                <select value={edit.category_id ?? ""} onChange={(e) => setEdit({ ...edit, category_id: e.target.value || null })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
                  <option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
              <F label="Metal">
                <select value={edit.metal ?? "18k_gold"} onChange={(e) => setEdit({ ...edit, metal: e.target.value as Product["metal"] })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
                  {METALS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </F>
              <F label="Gemstone"><Input value={edit.gemstone ?? ""} onChange={(e) => setEdit({ ...edit, gemstone: e.target.value || null })} /></F>
              <F label="Stock"><Input type="number" value={edit.stock ?? 0} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></F>
              <F label="Price (USD)"><Input type="number" value={edit.price_usd ?? ""} onChange={(e) => setEdit({ ...edit, price_usd: Number(e.target.value) })} /></F>
              <F label="Compare-at price"><Input type="number" value={edit.compare_at_usd ?? ""} onChange={(e) => setEdit({ ...edit, compare_at_usd: e.target.value ? Number(e.target.value) : null })} /></F>
              <div className="sm:col-span-2"><F label="Description"><Textarea value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></F></div>
              <F label="Product image">
                <UploadBtn accept="image/*" onFile={(f) => upload(f, "image_url")} label={edit.image_url ? "Replace image" : "Upload image"} />
                {edit.image_url && <img src={edit.image_url} alt="" className="mt-2 size-20 rounded-md object-cover" />}
              </F>
              <F label="3D model (.glb / .gltf)">
                <UploadBtn accept=".glb,.gltf,model/gltf-binary" onFile={(f) => upload(f, "model_url")} label={edit.model_url ? "Replace model" : "Upload model"} />
                {edit.model_url && <div className="mt-2 flex items-center gap-3 text-xs"><span className="text-gold">3D model attached</span><button type="button" className="text-muted-foreground underline" onClick={() => setEdit({ ...edit, model_url: null })}>Remove</button></div>}
                <p className="mt-1 text-[0.65rem] text-muted-foreground">Use a single .glb file (textures embedded), max 50 MB.</p>
              </F>
              <label className="flex items-center gap-3 text-sm"><Switch checked={!!edit.is_featured} onCheckedChange={(v) => setEdit({ ...edit, is_featured: v })} /> Featured</label>
              <label className="flex items-center gap-3 text-sm"><Switch checked={edit.is_active ?? true} onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /> Visible in store</label>
              <Button variant="luxe" size="xl" className="sm:col-span-2" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save product"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------- Banners ----------------
function BannersAdmin() {
  const qc = useQueryClient();
  const { data: banners = [] } = useQuery({ queryKey: ["admin-banners"], queryFn: async () => (await supabase.from("banners").select("*").order("sort_order")).data ?? [] });
  type B = Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
  const [edit, setEdit] = useState<B | null>(null);
  async function save() {
    if (!edit?.title) return void toast.error("Title is required");
    const { error } = edit.id ? await supabase.from("banners").update(edit).eq("id", edit.id) : await supabase.from("banners").insert(edit as Database["public"]["Tables"]["banners"]["Insert"]);
    if (error) return void toast.error(error.message);
    setEdit(null);
    qc.invalidateQueries();
    toast.success("Banner saved");
  }
  async function del(id: string) {
    await supabase.from("banners").delete().eq("id", id);
    qc.invalidateQueries();
  }
  return (
    <>
      <div className="mb-6 flex justify-end"><Button variant="luxe" onClick={() => setEdit({ is_active: true, sort_order: banners.length + 1 })}><Plus /> New banner</Button></div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="glass rounded-2xl p-5">
            <p className="eyebrow">{b.eyebrow}</p>
            <p className="mt-2 font-display text-2xl">{b.title}</p>
            <p className="text-sm text-muted-foreground">{b.subtitle}</p>
            {b.countdown_ends_at && <p className="mt-2 text-xs text-gold">Countdown to {new Date(b.countdown_ends_at).toLocaleString()}</p>}
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="ghostGold" onClick={() => setEdit(b)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => del(b.id)}>Delete</Button>
              {!b.is_active && <span className="ml-auto text-xs text-muted-foreground">Hidden</span>}
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="bg-background sm:max-w-xl">
          <DialogHeader><DialogTitle className="font-display text-3xl font-normal">Hero banner</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-4">
              <F label="Eyebrow"><Input value={edit.eyebrow ?? ""} onChange={(e) => setEdit({ ...edit, eyebrow: e.target.value })} /></F>
              <F label="Title"><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></F>
              <F label="Subtitle"><Textarea value={edit.subtitle ?? ""} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></F>
              <div className="grid grid-cols-2 gap-4">
                <F label="Button label"><Input value={edit.cta_label ?? ""} onChange={(e) => setEdit({ ...edit, cta_label: e.target.value })} /></F>
                <F label="Button link"><Input value={edit.cta_href ?? ""} onChange={(e) => setEdit({ ...edit, cta_href: e.target.value })} /></F>
              </div>
              <F label="Countdown ends (optional)"><Input type="datetime-local" value={edit.countdown_ends_at ? edit.countdown_ends_at.slice(0, 16) : ""} onChange={(e) => setEdit({ ...edit, countdown_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></F>
              <F label="Background image">
                <UploadBtn accept="image/*" label="Upload image" onFile={async (f) => { try { const url = await uploadMedia(f, "banners"); setEdit((x) => ({ ...x, image_url: url })); } catch (e) { toast.error((e as Error).message); } }} />
                {edit.image_url && <img src={edit.image_url} alt="" className="mt-2 h-20 rounded-md object-cover" />}
              </F>
              <label className="flex items-center gap-3 text-sm"><Switch checked={edit.is_active ?? true} onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /> Active</label>
              <Button variant="luxe" size="xl" onClick={save}>Save banner</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------- Promotions ----------------
function PromosAdmin() {
  const qc = useQueryClient();
  const { data: promos = [] } = useQuery({ queryKey: ["admin-promos"], queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ code: "", discount_type: "PERCENTAGE" as Database["public"]["Enums"]["discount_type"], value: 10, min_order_usd: 0, starts_at: "", ends_at: "" });
  async function create() {
    if (!f.code) return void toast.error("Enter a code");
    const { error } = await supabase.from("promotions").insert({
      code: f.code.toUpperCase(), discount_type: f.discount_type, value: f.value, min_order_usd: f.min_order_usd,
      starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
    });
    if (error) return void toast.error(error.message);
    setF({ ...f, code: "" });
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }
  async function toggle(id: string, is_active: boolean) {
    await supabase.from("promotions").update({ is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }
  async function del(id: string) {
    await supabase.from("promotions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-promos"] });
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <div className="glass h-fit space-y-4 rounded-2xl p-6">
        <p className="font-display text-2xl">New discount code</p>
        <F label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Type">
            <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value as typeof f.discount_type })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
              <option value="PERCENTAGE">Percentage %</option><option value="FIXED">Fixed $</option>
            </select>
          </F>
          <F label="Value"><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></F>
        </div>
        <F label="Minimum order (USD)"><Input type="number" value={f.min_order_usd} onChange={(e) => setF({ ...f, min_order_usd: Number(e.target.value) })} /></F>
        <F label="Starts"><Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} /></F>
        <F label="Ends"><Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} /></F>
        <Button variant="luxe" size="xl" className="w-full" onClick={create}>Create code</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border">
        {promos.map((p) => (
          <div key={p.id} className="flex items-center gap-4 border-b p-4 last:border-0">
            <span className="font-mono text-gold">{p.code}</span>
            <span className="text-sm">{p.discount_type === "PERCENTAGE" ? `${p.value}%` : usd(Number(p.value))} off</span>
            <span className="text-xs text-muted-foreground">min {usd(Number(p.min_order_usd))}{p.ends_at ? ` · until ${new Date(p.ends_at).toLocaleDateString()}` : ""}</span>
            <Switch className="ml-auto" checked={p.is_active} onCheckedChange={(v) => toggle(p.id, v)} />
            <Button size="icon" variant="ghost" onClick={() => del(p.id)} aria-label="Delete"><Trash2 /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Settings ----------------
function SettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()).data });
  const [s, setS] = useState<Database["public"]["Tables"]["site_settings"]["Row"] | null>(null);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return null;
  const fees = s.delivery_fees as Record<string, number>;
  async function save() {
    const { id, updated_at, ...rest } = s!;
    void updated_at;
    const { error } = await supabase.from("site_settings").update(rest).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="glass space-y-4 rounded-2xl p-6">
        <p className="font-display text-2xl">Business</p>
        <F label="Brand name"><Input value={s.brand_name} onChange={(e) => setS({ ...s, brand_name: e.target.value })} /></F>
        <F label="Address"><Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Phone 1"><Input value={s.phone_primary} onChange={(e) => setS({ ...s, phone_primary: e.target.value })} /></F>
          <F label="Phone 2"><Input value={s.phone_secondary} onChange={(e) => setS({ ...s, phone_secondary: e.target.value })} /></F>
        </div>
        <F label="WhatsApp number (digits)"><Input value={s.whatsapp} onChange={(e) => setS({ ...s, whatsapp: e.target.value })} /></F>
        <F label="Instagram URL"><Input value={s.instagram_url ?? ""} onChange={(e) => setS({ ...s, instagram_url: e.target.value || null })} /></F>
        <F label="Facebook URL"><Input value={s.facebook_url ?? ""} onChange={(e) => setS({ ...s, facebook_url: e.target.value || null })} /></F>
      </section>
      <section className="glass space-y-4 rounded-2xl p-6">
        <p className="font-display text-2xl">Delivery & currency</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(fees).map(([zone, fee]) => (
            <F key={zone} label={`${zone} (USD)`}><Input type="number" value={fee} onChange={(e) => setS({ ...s, delivery_fees: { ...fees, [zone]: Number(e.target.value) } })} /></F>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Display currency">
            <select value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
              <option value="USD">$ USD</option><option value="LBP">LBP</option>
            </select>
          </F>
          <F label="USD → LBP rate"><Input type="number" value={s.lbp_rate} onChange={(e) => setS({ ...s, lbp_rate: Number(e.target.value) })} /></F>
        </div>
        <label className="flex items-center gap-3 text-sm"><Switch checked={s.cod_enabled} onCheckedChange={(v) => setS({ ...s, cod_enabled: v })} /> Cash on delivery</label>
        <label className="flex items-center gap-3 text-sm"><Switch checked={s.pickup_enabled} onCheckedChange={(v) => setS({ ...s, pickup_enabled: v })} /> Store pickup</label>
      </section>
      <Button variant="luxe" size="xl" className="lg:col-span-2" onClick={save}>Save settings</Button>
      <p className="text-xs text-muted-foreground lg:col-span-2">Preview the store: <Link to="/" className="text-gold">open homepage</Link></p>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>{children}</div>;
}
function UploadBtn({ accept, onFile, label }: { accept: string; onFile: (f: File) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-gold hover:text-gold">
      <Upload className="size-4" /> {label}
      <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}
