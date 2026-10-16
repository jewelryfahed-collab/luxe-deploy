import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider, settingsQuery } from "@/lib/store";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartSheet } from "@/components/site/CartSheet";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4">
      <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative max-w-md text-center">
        <p className="font-display text-8xl text-gold/80">404</p>
        <p className="eyebrow mt-2">Not found</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">This piece is not in our vault</h1>
        <p className="mt-4 text-sm text-muted-foreground">The page you're looking for has moved or never existed.</p>
        <Link to="/" className="mt-8 inline-flex rounded-full border border-gold/60 px-7 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-primary-foreground">Return home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something slipped</p>
        <h1 className="mt-4 text-4xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please try again — your bag is safe.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-gold px-7 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90">Try again</button>
          <Link to="/" className="rounded-full border border-white/15 px-7 py-3 text-xs uppercase tracking-[0.2em] transition hover:border-gold hover:text-gold">Home</Link>
        </div>
      </div>
    </div>
  );
}

const SITE = "Fahed Jewelry Manufacturing";
const DESCRIPTION = "Luxury fine jewelry handcrafted in Keserwan - Faitroun, Lebanon.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: SITE },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#0b0a09" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          name: SITE,
          description: DESCRIPTION,
          address: { "@type": "PostalAddress", addressLocality: "Faitroun, Keserwan", addressCountry: "LB" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-gold/30">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Thin gold bar across the top while a page is loading. */
function NavProgress() {
  const loading = useRouterState({ select: (s) => s.isLoading });
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div className={`h-full bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-500 ${loading ? "w-full opacity-100" : "w-0 opacity-0"}`} />
    </div>
  );
}

/** Everything that needs the query client lives below the provider. */
function Chrome() {
  const { data: settings } = useQuery(settingsQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0 });
  }, [pathname]);

  const wa = (settings?.whatsapp ?? "").replace(/\D/g, "");
  const showWhatsApp = !!wa && !pathname.startsWith("/admin") && !pathname.startsWith("/checkout");

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-full focus:bg-gold focus:px-5 focus:py-2 focus:text-sm focus:text-primary-foreground">Skip to content</a>
      <NavProgress />
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        <Outlet />
      </main>
      <SiteFooter />
      <CartSheet />
      {showWhatsApp && (
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid size-13 place-items-center rounded-full border border-gold/50 bg-background/80 p-3.5 text-gold shadow-[0_8px_30px_-8px] shadow-gold/40 backdrop-blur-xl transition hover:scale-105 hover:bg-gold hover:text-primary-foreground"
        >
          <MessageCircle className="size-6" />
        </a>
      )}
      <Toaster />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Chrome />
      </CartProvider>
    </QueryClientProvider>
  );
}
