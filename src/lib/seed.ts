// Seed catalog: categories, gold collection products, banners and settings.
// Used to initialise D1 on first run and as the in-memory fallback in dev.

import type { Banner, Category, Product, SiteSettings } from "./types";

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-necklaces", slug: "necklaces", name: "Necklaces", name_en: "Necklaces", name_ar: "قلائد", name_fr: "Colliers", description: "Chains, pendants and lariats", image_url: "/products/double-pearl-necklace.jpg", sort_order: 1 },
  { id: "cat-bracelets", slug: "bracelets", name: "Bracelets", name_en: "Bracelets", name_ar: "أساور", name_fr: "Bracelets", description: "Bangles, cuffs and charm bracelets", image_url: "/products/charm-bead-bracelets.jpg", sort_order: 2 },
  { id: "cat-rings", slug: "rings", name: "Rings", name_en: "Rings", name_ar: "خواتم", name_fr: "Bagues", description: "Statement and dainty rings", image_url: "/products/dainty-pearl-flower-rings.jpg", sort_order: 3 },
  { id: "cat-mens", slug: "mens", name: "Men's", name_en: "Men's", name_ar: "رجالي", name_fr: "Homme", description: "Leather and gold for him", image_url: "/products/mens-leather-gold-bar-bracelet.jpg", sort_order: 4 },
  { id: "cat-religious", slug: "religious", name: "Religious", name_en: "Religious", name_ar: "دينية", name_fr: "Religieux", description: "Crosses, saints and blessings", image_url: "/products/saint-cross-leather-bracelet.jpg", sort_order: 5 },
  { id: "cat-baby", slug: "baby-kids", name: "Baby & Kids", name_en: "Baby & Kids", name_ar: "أطفال", name_fr: "Bébé & Enfants", description: "Pins and gifts for little ones", image_url: "/products/blue-stone-baby-pins.jpg", sort_order: 6 },
];

type SeedProduct = Pick<Product, "slug" | "name_en" | "name_ar" | "name_fr" | "description_en" | "price_usd" | "image_url" | "metal" | "gemstone" | "is_featured"> & { category: string };

const P = (p: SeedProduct): SeedProduct => p;

export const SEED_PRODUCTS: SeedProduct[] = [
  P({ slug: "double-pearl-necklace", category: "necklaces", name_en: "Double Pearl Strand Necklace", name_ar: "قلادة لؤلؤ مزدوجة", name_fr: "Collier double rang de perles", description_en: "Two strands of lustrous freshwater pearls finished with an 18K gold clasp.", price_usd: 420, image_url: "/products/double-pearl-necklace.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: true }),
  P({ slug: "initial-letter-pendants", category: "necklaces", name_en: "Initial Letter Pendant", name_ar: "قلادة حرف أولي", name_fr: "Pendentif lettre initiale", description_en: "A polished 18K gold initial on a fine chain — choose your letter.", price_usd: 180, image_url: "/products/initial-letter-pendants.jpg", metal: "18k_gold", gemstone: null, is_featured: true }),
  P({ slug: "custom-name-necklace", category: "necklaces", name_en: "Custom Name Necklace", name_ar: "قلادة اسم مخصصة", name_fr: "Collier prénom personnalisé", description_en: "Your name hand-cut in flowing script, cast in 18K gold.", price_usd: 260, image_url: "/products/custom-name-necklace.jpg", metal: "18k_gold", gemstone: null, is_featured: true }),
  P({ slug: "heart-onyx-necklace", category: "necklaces", name_en: "Heart & Onyx Pendant Necklace", name_ar: "قلادة قلب وعقيق أسود", name_fr: "Collier cœur et onyx", description_en: "A gold heart paired with deep black onyx on a delicate chain.", price_usd: 210, image_url: "/products/heart-onyx-necklace.jpg", metal: "18k_gold", gemstone: "Onyx", is_featured: false }),
  P({ slug: "pearl-drop-lariat", category: "necklaces", name_en: "Pearl Drop Lariat", name_ar: "قلادة لؤلؤة متدلية", name_fr: "Collier cravate perle", description_en: "A single pearl suspended from a sliding gold lariat chain.", price_usd: 195, image_url: "/products/pearl-drop-lariat.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: false }),
  P({ slug: "three-pearl-necklace", category: "necklaces", name_en: "Three Pearl Necklace", name_ar: "قلادة ثلاث لآلئ", name_fr: "Collier trois perles", description_en: "Three matched pearls on a fine 18K gold chain.", price_usd: 240, image_url: "/products/three-pearl-necklace.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: false }),
  P({ slug: "sparkle-bead-lariat-set", category: "necklaces", name_en: "Sparkle Bead Lariat Set", name_ar: "طقم قلادة خرز لامع", name_fr: "Parure collier perles facettées", description_en: "Faceted gold beads on a lariat with matching bracelet.", price_usd: 340, image_url: "/products/sparkle-bead-lariat-set.jpg", metal: "18k_gold", gemstone: null, is_featured: true }),
  P({ slug: "tricolor-bead-necklaces", category: "necklaces", name_en: "Tri-Color Bead Necklace", name_ar: "قلادة خرز ثلاثية الألوان", name_fr: "Collier perles tricolores", description_en: "Yellow, rose and white gold beads in a playful strand.", price_usd: 230, image_url: "/products/tricolor-bead-necklaces.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "butterfly-bead-necklace", category: "necklaces", name_en: "Butterfly Bead Necklace", name_ar: "قلادة فراشة وخرز", name_fr: "Collier papillon et perles", description_en: "A gold butterfly charm among polished beads.", price_usd: 205, image_url: "/products/butterfly-bead-necklace.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "black-bead-rosary-necklace", category: "necklaces", name_en: "Black Bead Rosary Necklace", name_ar: "قلادة مسبحة خرز أسود", name_fr: "Collier chapelet perles noires", description_en: "Black beads with gold accents in a rosary silhouette.", price_usd: 190, image_url: "/products/black-bead-rosary-necklace.jpg", metal: "18k_gold", gemstone: "Onyx", is_featured: false }),
  P({ slug: "heart-initial-pearl-lariat", category: "necklaces", name_en: "Heart Initial Pearl Lariat", name_ar: "قلادة قلب بحرف ولؤلؤ", name_fr: "Collier cœur initiale et perle", description_en: "A heart, an initial and a pearl — your story on one chain.", price_usd: 225, image_url: "/products/heart-initial-pearl-lariat.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: false }),
  P({ slug: "black-bead-bar-lariat", category: "necklaces", name_en: "Black Bead Bar Lariat", name_ar: "قلادة خرز أسود مع قضيب", name_fr: "Collier barrette perles noires", description_en: "A sleek gold bar drops through black beads.", price_usd: 185, image_url: "/products/black-bead-bar-lariat.jpg", metal: "18k_gold", gemstone: "Onyx", is_featured: false }),
  P({ slug: "pearl-station-bracelet", category: "bracelets", name_en: "Pearl Station Bracelet", name_ar: "سوار لؤلؤ متباعد", name_fr: "Bracelet stations de perles", description_en: "Pearls stationed along a fine 18K gold chain.", price_usd: 160, image_url: "/products/pearl-station-bracelet.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: true }),
  P({ slug: "symbol-chain-bracelets", category: "bracelets", name_en: "Symbol Chain Bracelet", name_ar: "سوار سلسلة برموز", name_fr: "Bracelet chaîne à symboles", description_en: "Tiny gold symbols on a dainty chain — stack them your way.", price_usd: 140, image_url: "/products/symbol-chain-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "charm-bead-bracelets", category: "bracelets", name_en: "Charm Bead Bracelet", name_ar: "سوار خرز مع تعليقات", name_fr: "Bracelet perles à breloques", description_en: "Gold beads and charms on a stretch strand.", price_usd: 150, image_url: "/products/charm-bead-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "black-bead-charm-bracelets", category: "bracelets", name_en: "Black Bead Charm Bracelet", name_ar: "سوار خرز أسود مع تعليقات", name_fr: "Bracelet perles noires à breloques", description_en: "Matte black beads with gold charms.", price_usd: 135, image_url: "/products/black-bead-charm-bracelets.jpg", metal: "18k_gold", gemstone: "Onyx", is_featured: false }),
  P({ slug: "initial-cord-bracelets", category: "bracelets", name_en: "Initial Cord Bracelet", name_ar: "سوار خيط بحرف", name_fr: "Bracelet cordon initiale", description_en: "A gold initial on an adjustable cord.", price_usd: 95, image_url: "/products/initial-cord-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "initial-circle-cord-bracelets", category: "bracelets", name_en: "Initial Circle Cord Bracelet", name_ar: "سوار خيط بدائرة وحرف", name_fr: "Bracelet cordon cercle initiale", description_en: "An initial inside a polished gold circle on cord.", price_usd: 105, image_url: "/products/initial-circle-cord-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "tri-gold-leather-cuff", category: "bracelets", name_en: "Tri-Gold Leather Cuff", name_ar: "سوار جلد بثلاثة ألوان ذهب", name_fr: "Manchette cuir trois ors", description_en: "Yellow, rose and white gold bars on braided leather.", price_usd: 175, image_url: "/products/tri-gold-leather-cuff.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "dainty-pearl-flower-rings", category: "rings", name_en: "Dainty Pearl Flower Ring", name_ar: "خاتم زهرة لؤلؤ رقيق", name_fr: "Bague fleur de perle délicate", description_en: "A pearl blossom on a slim 18K gold band.", price_usd: 145, image_url: "/products/dainty-pearl-flower-rings.jpg", metal: "18k_gold", gemstone: "Pearl", is_featured: true }),
  P({ slug: "mens-leather-gold-bar-bracelet", category: "mens", name_en: "Men's Leather & Gold Bar Bracelet", name_ar: "سوار رجالي جلد مع قضيب ذهب", name_fr: "Bracelet homme cuir et barrette or", description_en: "Braided black leather with a solid 18K gold bar.", price_usd: 220, image_url: "/products/mens-leather-gold-bar-bracelet.jpg", metal: "18k_gold", gemstone: null, is_featured: true }),
  P({ slug: "mens-greek-key-leather-bracelet", category: "mens", name_en: "Men's Greek Key Leather Bracelet", name_ar: "سوار رجالي جلد بنقشة يونانية", name_fr: "Bracelet homme cuir méandre grec", description_en: "A Greek-key gold plate on woven leather.", price_usd: 210, image_url: "/products/mens-greek-key-leather-bracelet.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "anchor-helm-silicone-bracelet", category: "mens", name_en: "Anchor & Helm Sport Bracelet", name_ar: "سوار رياضي بمرساة ودفة", name_fr: "Bracelet sport ancre et gouvernail", description_en: "A gold anchor and helm on a durable sport band.", price_usd: 120, image_url: "/products/anchor-helm-silicone-bracelet.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "saint-cross-leather-bracelet", category: "religious", name_en: "Saint Cross Leather Bracelet", name_ar: "سوار جلد بصليب", name_fr: "Bracelet cuir croix", description_en: "A gold cross on hand-braided leather.", price_usd: 130, image_url: "/products/saint-cross-leather-bracelet.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "cross-plate-leather-bracelets", category: "religious", name_en: "Cross Plate Leather Bracelet", name_ar: "سوار جلد بلوحة صليب", name_fr: "Bracelet cuir plaque croix", description_en: "An engraved gold cross plate on leather.", price_usd: 150, image_url: "/products/cross-plate-leather-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "saint-charbel-leather-bracelets", category: "religious", name_en: "Saint Charbel Leather Bracelet", name_ar: "سوار جلد مار شربل", name_fr: "Bracelet cuir Saint Charbel", description_en: "A Saint Charbel medallion in gold on braided leather.", price_usd: 155, image_url: "/products/saint-charbel-leather-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: true }),
  P({ slug: "saint-medallion-cord-bracelets", category: "religious", name_en: "Saint Medallion Cord Bracelet", name_ar: "سوار خيط بميدالية قديس", name_fr: "Bracelet cordon médaille de saint", description_en: "A gold saint medallion on an adjustable cord.", price_usd: 110, image_url: "/products/saint-medallion-cord-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "filigree-cross-cord-bracelets", category: "religious", name_en: "Filigree Cross Cord Bracelet", name_ar: "سوار خيط بصليب مفرغ", name_fr: "Bracelet cordon croix filigrane", description_en: "An openwork gold cross on a fine cord.", price_usd: 115, image_url: "/products/filigree-cross-cord-bracelets.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
  P({ slug: "blue-stone-baby-pins", category: "baby-kids", name_en: "Blue Stone Baby Pin", name_ar: "دبوس طفل بحجر أزرق", name_fr: "Épingle bébé pierre bleue", description_en: "A protective blue-stone pin in 18K gold for newborns.", price_usd: 90, image_url: "/products/blue-stone-baby-pins.jpg", metal: "18k_gold", gemstone: "Blue stone", is_featured: false }),
  P({ slug: "madonna-baby-pin", category: "baby-kids", name_en: "Madonna Baby Pin", name_ar: "دبوس طفل السيدة العذراء", name_fr: "Épingle bébé Madone", description_en: "A gold Madonna pin — a traditional blessing for babies.", price_usd: 95, image_url: "/products/madonna-baby-pin.jpg", metal: "18k_gold", gemstone: null, is_featured: false }),
];

export function buildSeedProducts(): Product[] {
  const now = new Date().toISOString();
  return SEED_PRODUCTS.map((p, i) => {
    const cat = SEED_CATEGORIES.find((c) => c.slug === p.category)!;
    return {
      id: `prod-${p.slug}`,
      slug: p.slug,
      name: p.name_en,
      name_en: p.name_en,
      name_ar: p.name_ar,
      name_fr: p.name_fr,
      description: p.description_en,
      description_en: p.description_en,
      description_ar: null,
      description_fr: null,
      price_usd: p.price_usd,
      compare_at_usd: null,
      image_url: p.image_url,
      gallery: [],
      model_url: null,
      metal: p.metal,
      gemstone: p.gemstone,
      stock: 5,
      is_active: true,
      is_featured: p.is_featured,
      category_id: cat.id,
      created_at: now,
      categories: { slug: cat.slug, name: cat.name },
    } satisfies Product;
  });
}

export const SEED_BANNERS: Banner[] = [
  { id: "ban-1", title: "The Gold Edit", subtitle: "Handcrafted in Faitroun, Lebanon", image_url: "/products/sparkle-bead-lariat-set.jpg", cta_label: "Shop the collection", cta_href: "/shop", is_active: true, sort_order: 1 },
  { id: "ban-2", title: "Pearls, Perfected", subtitle: "Freshwater pearls set in 18K gold", image_url: "/products/double-pearl-necklace.jpg", cta_label: "Discover pearls", cta_href: "/shop?category=necklaces", is_active: true, sort_order: 2 },
];

export const SEED_SETTINGS: SiteSettings = {
  id: 1,
  brand: "Fahed Jewelry Manufacturing",
  address: "Keserwan - Faitroun, Mount Lebanon, Lebanon",
  phone_primary: "+961 03 859 562",
  phone_secondary: "+961 78 859 562",
  whatsapp: "96103859562",
  lbp_rate: 89500,
  delivery_fees: { Keserwan: 3, "Greater Beirut": 4, "Mount Lebanon": 5, North: 6, South: 6, Bekaa: 7 },
};

export const ADMIN_EMAIL = "fahedgeorges12@gmail.com";
export const ADMIN_PASSWORD = "sisisi1+AS";
