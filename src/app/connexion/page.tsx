"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ConnexionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    setLoading(false);
    if (error) {
      setErreur("Numéro/email ou mot de passe incorrect.");
      return;
    }
    router.push("/tableau-de-bord");
    router.refresh();
  }

  return (
    <>
      <Header />
      <section className="mx-auto max-w-sm px-6 py-16">
        <h1 className="font-display text-3xl text-ink">Se connecter</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
              Mot de passe
            </span>
            <input
              required
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="input"
            />
          </label>

          {erreur && (
            <p className="rounded-md bg-seal/10 px-4 py-3 text-sm text-seal">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-light disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
      <Footer />
    </>
  );
}
