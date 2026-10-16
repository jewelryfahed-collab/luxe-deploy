-- Fahed Jewelry — initial D1 schema (idempotent, safe to re-run).
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
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
