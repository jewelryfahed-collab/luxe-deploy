import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryOptions } from "@tanstack/react-query";
import heroImg from "@/assets/hero.jpg";
import earringsImg from "@/assets/earrings.jpg";
import necklaceImg from "@/assets/necklace.jpg";
import braceletImg from "@/assets/bracelet.jpg";
import { getBannersFn, getCategoriesFn, getProductsFn, getSessionFn, getSettingsFn } from "./api.functions";
import type { Category, Lang, Metal, Product, SessionUser, SiteSettings } from "./types";

export type { Category, Product, SessionUser, SiteSettings } from "./types";
export type { Metal } from "./types";

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

export function currentLang(): Lang {
  if (typeof window === "undefined") return "en";
  const l = localStorage.getItem("fahed-lang");
  return l === "ar" || l === "fr" ? l : "en";
}

// ---------- Queries ----------
export const productsQuery = () =>
  queryOptions({
    queryKey: ["products", currentLang()],
    queryFn: () => getProductsFn({ data: currentLang() }) as Promise<Product[]>,
  });
export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories", currentLang()],
    queryFn: () => getCategoriesFn({ data: currentLang() }) as Promise<Category[]>,
  });
export const bannersQuery = queryOptions({
  queryKey: ["banners"],
  queryFn: () => getBannersFn(),
});
export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => getSettingsFn() as Promise<SiteSettings>,
});
export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => getSessionFn(),
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

export function deliveryFee(settings: SiteSettings | null | undefined, governorate: string, fulfillment: string) {
  if (fulfillment === "pickup") return 0;
  const fees = (settings?.delivery_fees ?? {}) as Record<string, number>;
  return Number(fees[governorate] ?? 5);
}

export function useSession() {
  const [state, setState] = useState<{ loading: boolean; user: SessionUser | null }>({ loading: true, user: null });
  useEffect(() => {
    let alive = true;
    getSessionFn().then((user) => alive && setState({ loading: false, user }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export function useIsAdmin() {
  const { loading, user } = useSession();
  return { loading, admin: user?.role === "admin", email: user?.email };
}
