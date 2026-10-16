// D1 data layer with an in-memory seeded fallback for local preview.
// In production on Cloudflare Workers, the D1 binding named "DB" is used;
// the user binds it in the Cloudflare dashboard (wrangler.jsonc declares it).

import { SEED_BANNERS, SEED_CATEGORIES, SEED_SETTINGS, buildSeedProducts } from "./seed";
import type { Banner, Category, Order, Product, SiteSettings } from "./types";

interface D1Prepared {
  bind(...args: unknown[]): {
    all<T>(): Promise<{ results: T[] }>;
    first<T>(): Promise<T | null>;
    run(): Promise<unknown>;
  };
}
interface D1Database {
  prepare(sql: string): D1Prepared;
  exec(sql: string): Promise<unknown>;
}

async function getD1(): Promise<D1Database | null> {
  try {
    const mod = (await import("cloudflare:workers")) as { env?: Record<string, unknown> };
    return (mod.env?.DB as D1Database | undefined) ?? null;
  } catch {
    return null;
  }
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  description_en TEXT,
  description_ar TEXT,
  description_fr TEXT,
  price_usd REAL NOT NULL DEFAULT 0,
  compare_at_usd REAL,
  image_url TEXT,
  gallery TEXT NOT NULL DEFAULT '[]',
  model_url TEXT,
  metal TEXT NOT NULL DEFAULT '18k_gold',
  gemstone TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_href TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  governorate TEXT NOT NULL,
  district TEXT,
  address TEXT,
  notes TEXT,
  fulfillment TEXT NOT NULL DEFAULT 'delivery',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  items TEXT NOT NULL DEFAULT '[]',
  subtotal_usd REAL NOT NULL DEFAULT 0,
  discount_usd REAL NOT NULL DEFAULT 0,
  delivery_usd REAL NOT NULL DEFAULT 0,
  total_usd REAL NOT NULL DEFAULT 0,
  promo_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, json TEXT NOT NULL);
`;

// ---------- In-memory fallback (dev preview without a D1 binding) ----------
interface MemoryStore {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: SiteSettings;
  orders: Order[];
  users: { id: string; email: string; name: string | null; password_hash: string; role: string; created_at: string }[];
}
let memory: MemoryStore | null = null;
function getMemory(): MemoryStore {
  if (!memory) {
    memory = {
      products: buildSeedProducts(),
      categories: SEED_CATEGORIES.map((c) => ({ ...c })),
      banners: SEED_BANNERS.map((b) => ({ ...b })),
      settings: { ...SEED_SETTINGS },
      orders: [],
      users: [],
    };
  }
  return memory;
}

let schemaEnsured = false;
export async function ensureSchema(db: D1Database) {
  if (schemaEnsured) return;
  for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await db.prepare(stmt).bind().run();
  }
  const row = await db.prepare("SELECT COUNT(*) AS n FROM products").bind().first<{ n: number }>();
  if (!row || row.n === 0) {
    const now = new Date().toISOString();
    for (const c of SEED_CATEGORIES) {
      await db.prepare(
        "INSERT OR IGNORE INTO categories (id, slug, name_en, name_ar, name_fr, description, image_url, sort_order) VALUES (?,?,?,?,?,?,?,?)",
      ).bind(c.id, c.slug, c.name_en, c.name_ar, c.name_fr, c.description, c.image_url, c.sort_order).run();
    }
    for (const p of buildSeedProducts()) {
      await db.prepare(
        `INSERT OR IGNORE INTO products (id, slug, category_id, name_en, name_ar, name_fr, description_en, price_usd, image_url, metal, gemstone, stock, is_active, is_featured, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(p.id, p.slug, p.category_id, p.name_en, p.name_ar, p.name_fr, p.description_en, p.price_usd, p.image_url, p.metal, p.gemstone, p.stock, 1, p.is_featured ? 1 : 0, now).run();
    }
    for (const b of SEED_BANNERS) {
      await db.prepare(
        "INSERT OR IGNORE INTO banners (id, title, subtitle, image_url, cta_label, cta_href, is_active, sort_order) VALUES (?,?,?,?,?,?,?,?)",
      ).bind(b.id, b.title, b.subtitle, b.image_url, b.cta_label, b.cta_href, 1, b.sort_order).run();
    }
    await db.prepare("INSERT OR IGNORE INTO settings (id, json) VALUES (1, ?)").bind(JSON.stringify(SEED_SETTINGS)).run();
  }
  schemaEnsured = true;
}

// ---------- Row mapping ----------
interface ProductRow extends Omit<Product, "is_active" | "is_featured" | "gallery" | "categories" | "name" | "description"> {
  is_active: number;
  is_featured: number;
  gallery: string;
  cat_slug?: string | null;
  cat_name?: string | null;
}
function mapProduct(r: ProductRow): Product {
  return {
    ...r,
    name: r.name_en,
    description: r.description_en,
    gallery: safeParse<string[]>(r.gallery, []),
    is_active: !!r.is_active,
    is_featured: !!r.is_featured,
    categories: r.cat_slug ? { slug: r.cat_slug, name: r.cat_name ?? r.cat_slug } : null,
  };
}
function safeParse<T>(s: string | null | undefined, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function mapCategory(r: Category): Category {
  return { ...r, name: r.name_en };
}

// ---------- Public data API ----------
export async function listProducts(onlyActive = true): Promise<Product[]> {
  const db = await getD1();
  if (!db) {
    const m = getMemory();
    return m.products.filter((p) => !onlyActive || p.is_active);
  }
  await ensureSchema(db);
  const { results } = await db.prepare(
    `SELECT p.*, c.slug AS cat_slug, c.name_en AS cat_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${onlyActive ? "WHERE p.is_active = 1" : ""} ORDER BY p.created_at DESC`,
  ).bind().all<ProductRow>();
  return results.map(mapProduct);
}

export async function listCategories(): Promise<Category[]> {
  const db = await getD1();
  if (!db) return getMemory().categories;
  await ensureSchema(db);
  const { results } = await db.prepare("SELECT * FROM categories ORDER BY sort_order").bind().all<Category>();
  return results.map(mapCategory);
}

export async function listBanners(): Promise<Banner[]> {
  const db = await getD1();
  if (!db) return getMemory().banners.filter((b) => b.is_active);
  await ensureSchema(db);
  const { results } = await db.prepare("SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order").bind().all<Banner>();
  return results;
}

export async function getSettings(): Promise<SiteSettings> {
  const db = await getD1();
  if (!db) return getMemory().settings;
  await ensureSchema(db);
  const row = await db.prepare("SELECT json FROM settings WHERE id = 1").bind().first<{ json: string }>();
  return row ? { ...SEED_SETTINGS, ...safeParse<Partial<SiteSettings>>(row.json, {}) } as SiteSettings : SEED_SETTINGS;
}

export async function updateSettings(s: SiteSettings): Promise<void> {
  const db = await getD1();
  if (!db) {
    getMemory().settings = s;
    return;
  }
  await ensureSchema(db);
  await db.prepare("INSERT INTO settings (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json").bind(JSON.stringify(s)).run();
}

export async function upsertProduct(p: Product): Promise<void> {
  const db = await getD1();
  if (!db) {
    const m = getMemory();
    const i = m.products.findIndex((x) => x.id === p.id);
    if (i >= 0) m.products[i] = p;
    else m.products.unshift(p);
    return;
  }
  await ensureSchema(db);
  await db.prepare(
    `INSERT INTO products (id, slug, category_id, name_en, name_ar, name_fr, description_en, description_ar, description_fr, price_usd, compare_at_usd, image_url, gallery, model_url, metal, gemstone, stock, is_active, is_featured, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, category_id=excluded.category_id, name_en=excluded.name_en, name_ar=excluded.name_ar, name_fr=excluded.name_fr,
       description_en=excluded.description_en, description_ar=excluded.description_ar, description_fr=excluded.description_fr, price_usd=excluded.price_usd,
       compare_at_usd=excluded.compare_at_usd, image_url=excluded.image_url, gallery=excluded.gallery, model_url=excluded.model_url, metal=excluded.metal,
       gemstone=excluded.gemstone, stock=excluded.stock, is_active=excluded.is_active, is_featured=excluded.is_featured`,
  ).bind(
    p.id, p.slug, p.category_id, p.name_en, p.name_ar, p.name_fr, p.description_en, p.description_ar, p.description_fr,
    p.price_usd, p.compare_at_usd, p.image_url, JSON.stringify(p.gallery ?? []), p.model_url, p.metal, p.gemstone,
    p.stock, p.is_active ? 1 : 0, p.is_featured ? 1 : 0, p.created_at || new Date().toISOString(),
  ).run();
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getD1();
  if (!db) {
    const m = getMemory();
    m.products = m.products.filter((p) => p.id !== id);
    return;
  }
  await ensureSchema(db);
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

export async function createOrder(o: Order): Promise<void> {
  const db = await getD1();
  if (!db) {
    getMemory().orders.unshift(o);
    return;
  }
  await ensureSchema(db);
  await db.prepare(
    `INSERT INTO orders (id, user_id, customer_name, phone, governorate, district, address, notes, fulfillment, payment_method, items, subtotal_usd, discount_usd, delivery_usd, total_usd, promo_code, status, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(o.id, o.user_id, o.customer_name, o.phone, o.governorate, o.district, o.address, o.notes, o.fulfillment, o.payment_method, JSON.stringify(o.items), o.subtotal_usd, o.discount_usd, o.delivery_usd, o.total_usd, o.promo_code, o.status, o.created_at).run();
}

export async function listOrders(): Promise<Order[]> {
  const db = await getD1();
  if (!db) return getMemory().orders;
  await ensureSchema(db);
  const { results } = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC").bind().all<Order & { items: string }>();
  return results.map((r) => ({ ...r, items: safeParse(r.items as unknown as string, []) }));
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const db = await getD1();
  if (!db) {
    const o = getMemory().orders.find((x) => x.id === id);
    if (o) o.status = status as Order["status"];
    return;
  }
  await ensureSchema(db);
  await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, id).run();
}

// ---------- Users ----------
export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: string;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = await getD1();
  if (!db) return getMemory().users.find((u) => u.email === email.toLowerCase()) ?? null;
  await ensureSchema(db);
  return db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first<UserRow>();
}

export async function createUser(u: UserRow): Promise<void> {
  const db = await getD1();
  if (!db) {
    getMemory().users.push(u);
    return;
  }
  await ensureSchema(db);
  await db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)").bind(u.id, u.email, u.name, u.password_hash, u.role, u.created_at).run();
}
