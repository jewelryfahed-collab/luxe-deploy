import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInFn, signUpFn } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";
import logo from "@/assets/fahed-logo.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Fahed Jewelry Manufacturing" },
      { name: "description", content: "Sign in to your Fahed Jewelry account." },
      { property: "og:title", content: "Sign in — Fahed Jewelry" },
      { property: "og:description", content: "Access your account and the atelier dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { t } = useI18n();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const session =
        mode === "in"
          ? await signInFn({ data: { email, password } })
          : await signUpFn({ data: { email, password, name } });
      toast.success(t("welcomeBack"));
      nav({ to: session.role === "admin" ? "/admin" : "/shop" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <img src={logo.url} alt="Fahed Jewelry" className="mx-auto size-20 rounded-full object-cover ring-1 ring-gold/40" />
      <h1 className="mt-6 text-center text-4xl">{mode === "in" ? t("welcomeBack") : t("createAccount")}</h1>
      <form onSubmit={submit} className="glass mt-8 space-y-4 rounded-2xl p-6">
        {mode === "up" && <Input required placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />}
        <Input type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={8} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" variant="luxe" size="xl" className="w-full" disabled={busy}>
          {mode === "in" ? t("signIn") : t("signUp")}
        </Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-sm text-muted-foreground hover:text-gold">
          {mode === "in" ? t("newHere") : t("haveAccount")}
        </button>
      </form>
    </div>
  );
}
