import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import heroImg from "@/assets/hero.jpg";
import earringsImg from "@/assets/earrings.jpg";
import necklaceImg from "@/assets/necklace.jpg";
import braceletImg from "@/assets/bracelet.jpg";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories?: { slug: string; name: string } | null;
};
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Banner = Database["public"]["Tables"]["banners"]["Row"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
export type Metal = Database["public"]["Enums"]["metal_type"];

/** Fallback business constants, used when settings haven't loaded. */
export const BUSINESS = {
  brand: "Fahed Jewelry Manufacturing",
  address: "Keserwan - Faitroun, Mount Lebanon, Lebanon",
  phones: ["+961 03 859 562", "+961 78 859 562"],
  whatsapp: "96103859562",
  governorates: ["Keserwan", "Greater Beirut", "Mount Lebanon", "North", "South", "Bekaa"],
};

export const METALS: { id: Metal; label: string; color: string }[] = [
  { id: "18k_gold", label: "18K Gold", color: "#E5C158" },
  { id: "rose_gold", label: "Rose Gold", color: "#E8A88E" },
  { id: "white_gold", label: "White Gold", color: "#E8E6E1" },
  { id: "platinum", label: "Platinum", color: "#D5D8DC" },
  { id: "silver", label: "Silver", color: "#C9CCD1" },
];
export const metalLabel = (m: string) => METALS.find((x) => x.id === m)?.label ?? m;

const CATEGORY_IMG: Record<string, string> = {
  earrings: earringsImg,
  necklaces: necklaceImg,
  bracelets: braceletImg,
};
export function productImage(p: Pick<Product, "image_url"> & { categories?: { slug: string } | null }) {
  return p.image_url || CATEGORY_IMG[p.categories?.slug ?? ""] || heroImg;
}
export function categoryImage(slug: string) {
  return CATEGORY_IMG[slug] || heroImg;
}

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const lbp = (n: number, rate: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n * rate)} LBP`;

// ---------- Queries ----------
export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(slug,name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Product[];
  },
});
export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    return data;
  },
});
export const bannersQuery = queryOptions({
  queryKey: ["banners"],
  queryFn: async () => {
    const { data, error } = await supabase.from("banners").select("*").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data;
  },
});
export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

// ---------- Cart ----------
export type CartItem = { id: string; slug: string; name: string; price: number; image: string; metal: string; qty: number };
type CartCtx = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, metal: string, qty: number) => void;
  remove: (id: string, metal: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};
const Ctx = createContext<CartCtx | null>(null);
const KEY = "fahed-bag";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.id === item.id && i.metal === item.metal);
      if (ex) return prev.map((i) => (i === ex ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { ...item, qty }];
    });
    setOpen(true);
  }, []);
  const setQty = useCallback((id: string, metal: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id && i.metal === metal ? { ...i, qty: Math.max(1, qty) } : i)));
  }, []);
  const remove = useCallback((id: string, metal: string) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.metal === metal)));
  }, []);
  const clear = useCallback(() => setItems([]), []);
  const value = useMemo(
    () => ({
      items, open, setOpen, add, setQty, remove, clear,
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      count: items.reduce((s, i) => s + i.qty, 0),
    }),
    [items, open, add, setQty, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export type PromoResult = { code: string; discount_usd: number } | null;
export async function validatePromo(code: string, subtotal: number): Promise<PromoResult> {
  const { data, error } = await supabase.rpc("validate_promo", { _code: code.trim(), _subtotal: subtotal });
  if (error || !data || data.length === 0) return null;
  const r = data[0]!;
  return { code: r.code, discount_usd: Number(r.discount_usd) };
}

export function deliveryFee(settings: SiteSettings | null | undefined, governorate: string, fulfillment: string) {
  if (fulfillment === "pickup") return 0;
  const fees = (settings?.delivery_fees ?? {}) as Record<string, number>;
  return Number(fees[governorate] ?? 5);
}

export function useIsAdmin() {
  const [state, setState] = useState<{ loading: boolean; admin: boolean; email?: string | undefined }>({ loading: true, admin: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return alive && setState({ loading: false, admin: false });
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (alive) setState({ loading: false, admin: !!roles?.some((r) => r.role === "admin"), email: data.user.email ?? undefined });
    })();
    return () => { alive = false; };
  }, []);
  return state;
}
