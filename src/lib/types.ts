// Shared data shapes for the Fahed Jewelry store (D1-backed).

export type Metal = "18k_gold" | "rose_gold" | "white_gold" | "platinum" | "silver";
export type OrderStatus = "pending" | "in_production" | "ready_for_delivery" | "delivered" | "cancelled";
export type Lang = "en" | "ar" | "fr";

export interface Category {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  name_ar: string;
  name_fr: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  name_en: string;
  name_ar: string;
  name_fr: string;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  price_usd: number;
  compare_at_usd: number | null;
  image_url: string | null;
  gallery: string[];
  model_url: string | null;
  metal: Metal;
  gemstone: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  created_at: string;
  categories?: { slug: string; name: string } | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface SiteSettings {
  id: number;
  brand: string;
  address: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp: string;
  lbp_rate: number;
  delivery_fees: Record<string, number>;
}

export interface OrderItem {
  id: string;
  name: string;
  metal: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  governorate: string;
  district: string | null;
  address: string | null;
  notes: string | null;
  fulfillment: "delivery" | "pickup";
  payment_method: string;
  items: OrderItem[];
  subtotal_usd: number;
  discount_usd: number;
  delivery_usd: number;
  total_usd: number;
  promo_code: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "customer";
}
