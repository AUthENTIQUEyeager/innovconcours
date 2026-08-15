import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

type Formation = {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
};

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: formations } = await supabase
    .from("formations")
    .select("id, nom, type_concours, prix, description")
    .eq("actif", true)
    .order("prix", { ascending: false }) as { data: { id: string; nom: string; type_concours: string; prix: number; description?: string }[] | null };

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-gold-dark">
            Préparation aux concours administratifs
          </p>
          <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Votre dossier,{" "}
            <span className="italic text-ink-light">validé</span> à l&apos;instant.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
            Choisissez votre ministère, payez par Mobile Money, et accédez
            immédiatement à votre formation — sans attendre qu&apos;un
            agent vérifie votre paiement à la main.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/inscription"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-light"
            >
              Commencer mon inscription
            </Link>
            <Link
              href="/#formations"
              className="text-sm font-semibold text-ink/70 underline decoration-gold decoration-2 underline-offset-4 hover:text-ink"
            >
              Voir les formations
            </Link>
          </div>
        </div>

        {/* Signature : le "dossier" tamponné — représente la validation immédiate */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rotate-1 rounded-sm border border-ink/15 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(18,33,59,0.25)]">
            <div className="flex items-center justify-between border-b border-dashed border-ink/20 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink/50">
                Dossier n° IC-2026-00427
              </span>
              <span className="font-mono text-[10px] text-ink/50">MEF</span>
            </div>
            <div className="space-y-2 py-5">
              <div className="h-2.5 w-3/4 rounded bg-ink/10" />
              <div className="h-2.5 w-1/2 rounded bg-ink/10" />
              <div className="h-2.5 w-2/3 rounded bg-ink/10" />
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-ink/20 pt-4">
              <span className="font-mono text-[11px] text-ink/60">30 000 F CFA</span>
              <span className="font-mono text-[11px] text-validated">payé</span>
            </div>
          </div>
          <div className="animate-stamp stamp-rotate absolute -right-4 top-1/3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-seal/80 text-center">
            <span className="font-display text-xs font-semibold uppercase leading-tight tracking-wide text-seal">
              Validé
            </span>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="border-y border-ink/10 bg-white/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl text-ink">Comment ça marche</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Choisissez votre ministère",
                d: "Sélectionnez le concours et le ministère concernés — le tarif s'affiche immédiatement.",
              },
              {
                n: "02",
                t: "Payez par Mobile Money",
                d: "Orange Money ou Moov Money, via un lien de paiement sécurisé — aucune manipulation USSD à retenir par cœur.",
              },
              {
                n: "03",
                t: "Accédez à votre espace",
                d: "Dès le paiement confirmé, votre compte est activé automatiquement. Pas d'attente, pas de vérification manuelle.",
              },
            ].map((step) => (
              <div key={step.n}>
                <span className="font-mono text-sm text-gold-dark">{step.n}</span>
                <h3 className="mt-2 font-display text-lg text-ink">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMATIONS */}
      <section id="formations" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-2xl text-ink">Formations disponibles</h2>
        <p className="mt-2 max-w-lg text-sm text-ink/65">
          Un tarif par ministère, affiché sans surprise avant l&apos;inscription.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(formations ?? []).map((f: Formation) => (
            <div
              key={f.id}
              className="flex flex-col justify-between rounded-lg border border-ink/10 bg-white p-5 transition hover:border-gold/60 hover:shadow-md"
            >
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  {f.type_concours}
                </span>
                <h3 className="mt-1 font-display text-lg text-ink">{f.nom}</h3>
                {f.description && (
                  <p className="mt-1 text-xs leading-relaxed text-ink/55">
                    {f.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-ink">
                  {f.prix.toLocaleString("fr-FR")} F CFA
                </span>
                <Link
                  href={`/inscription?formation=${f.id}`}
                  className="text-xs font-semibold text-gold-dark hover:text-ink"
                >
                  Choisir →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
