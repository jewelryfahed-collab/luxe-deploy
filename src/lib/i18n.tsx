// EN / AR / FR UI translations with RTL support.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./types";

const dict = {
  en: {
    shop: "Shop", contact: "Contact", signIn: "Sign in", signOut: "Sign out", admin: "Atelier",
    cart: "Bag", checkout: "Checkout", addToBag: "Add to bag", viewAll: "View all",
    allJewelry: "All jewelry", pieces: "pieces", newest: "Newest", priceLow: "Price: low to high", priceHigh: "Price: high to low",
    mostLoved: "Most loved", welcomeBack: "Welcome back", createAccount: "Create your account",
    email: "Email", password: "Password", name: "Name", signUp: "Sign up",
    newHere: "New here? Create an account", haveAccount: "Already have an account? Sign in",
    placeOrder: "Place order", orderSummary: "Order summary", subtotal: "Subtotal", total: "Total",
    fullName: "Full name", phone: "Phone (WhatsApp)", governorate: "Governorate", address: "Address",
    notes: "Notes", delivery: "Courier delivery", pickup: "Atelier pickup",
    emptyBag: "Your bag is empty", discover: "Discover the collection", thankYou: "Thank you",
    search: "Search", language: "Language",
  },
  ar: {
    shop: "المتجر", contact: "اتصل بنا", signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", admin: "الأتيليه",
    cart: "الحقيبة", checkout: "إتمام الطلب", addToBag: "أضف إلى الحقيبة", viewAll: "عرض الكل",
    allJewelry: "كل المجوهرات", pieces: "قطعة", newest: "الأحدث", priceLow: "السعر: من الأقل", priceHigh: "السعر: من الأعلى",
    mostLoved: "الأكثر حباً", welcomeBack: "أهلاً بعودتك", createAccount: "أنشئ حسابك",
    email: "البريد الإلكتروني", password: "كلمة المرور", name: "الاسم", signUp: "إنشاء حساب",
    newHere: "جديد هنا؟ أنشئ حساباً", haveAccount: "لديك حساب؟ سجّل الدخول",
    placeOrder: "تأكيد الطلب", orderSummary: "ملخص الطلب", subtotal: "المجموع الفرعي", total: "الإجمالي",
    fullName: "الاسم الكامل", phone: "الهاتف (واتساب)", governorate: "المحافظة", address: "العنوان",
    notes: "ملاحظات", delivery: "توصيل", pickup: "استلام من الأتيليه",
    emptyBag: "حقيبتك فارغة", discover: "اكتشف المجموعة", thankYou: "شكراً لك",
    search: "بحث", language: "اللغة",
  },
  fr: {
    shop: "Boutique", contact: "Contact", signIn: "Se connecter", signOut: "Se déconnecter", admin: "Atelier",
    cart: "Panier", checkout: "Commander", addToBag: "Ajouter au panier", viewAll: "Tout voir",
    allJewelry: "Tous les bijoux", pieces: "pièces", newest: "Nouveautés", priceLow: "Prix croissant", priceHigh: "Prix décroissant",
    mostLoved: "Les plus aimés", welcomeBack: "Bon retour", createAccount: "Créez votre compte",
    email: "E-mail", password: "Mot de passe", name: "Nom", signUp: "S'inscrire",
    newHere: "Nouveau ? Créez un compte", haveAccount: "Déjà un compte ? Connectez-vous",
    placeOrder: "Passer la commande", orderSummary: "Résumé", subtotal: "Sous-total", total: "Total",
    fullName: "Nom complet", phone: "Téléphone (WhatsApp)", governorate: "Gouvernorat", address: "Adresse",
    notes: "Remarques", delivery: "Livraison", pickup: "Retrait à l'atelier",
    emptyBag: "Votre panier est vide", discover: "Découvrir la collection", thankYou: "Merci",
    search: "Rechercher", language: "Langue",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);
const KEY = "fahed-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "ar" || saved === "fr" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
  };
  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);
  const t = (k: TKey) => dict[lang][k] ?? dict.en[k];
  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside LanguageProvider");
  return c;
}
