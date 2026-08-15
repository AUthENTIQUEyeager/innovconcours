"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Formation = {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
};

export default function InscriptionPage() {
  return (
    <Suspense fallback={null}>
      <InscriptionForm />
    </Suspense>
  );
}

function InscriptionForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();

  const [formations, setFormations] = useState<Formation[]>([]);
  const [formationId, setFormationId] = useState(params.get("formation") ?? "");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sexe, setSexe] = useState("");
  const [ville, setVille] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("formations")
      .select("id, nom, type_concours, prix")
      .eq("actif", true)
      .order("prix", { ascending: false })
      .then(({ data }: { data: Formation[] | null }) => setFormations(data ?? []));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!formationId) {
      setErreur("Choisissez une formation.");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le compte — le profil est créé automatiquement par le
      //    trigger SQL handle_new_user() à partir des metadata ci-dessous.
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: {
          data: { nom, prenom, sexe, ville, whatsapp },
        },
      });
      if (signUpError) throw signUpError;

      // 2. Se connecter immédiatement (nécessaire pour appeler l'API protégée
      //    juste après — selon la config Supabase, la confirmation email peut
      //    être requise avant que la session soit active).
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      if (signInError) throw signInError;

      // 3. Créer l'inscription + obtenir le lien de paiement FusionPay.
      //    Le prix n'est jamais envoyé depuis ce formulaire : la route API
      //    le relit elle-même en base à partir de formationId.
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId, telephone: whatsapp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Une erreur est survenue.");

      window.location.href = json.paymentUrl;
    } catch (err: any) {
      setErreur(err.message ?? "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <section className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl text-ink">S&apos;inscrire</h1>
        <p className="mt-2 text-sm text-ink/65">
          Déjà un compte ?{" "}
          <a href="/connexion" className="font-semibold text-gold-dark">
            Se connecter
          </a>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Ministère / concours">
            <select
              required
              value={formationId}
              onChange={(e) => setFormationId(e.target.value)}
              className="input"
            >
              <option value="">Choisir</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom} — {f.prix.toLocaleString("fr-FR")} F CFA
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom">
              <input required value={nom} onChange={(e) => setNom(e.target.value)} className="input" />
            </Field>
            <Field label="Prénom">
              <input required value={prenom} onChange={(e) => setPrenom(e.target.value)} className="input" />
            </Field>
          </div>

          <Field label="Sexe">
            <select required value={sexe} onChange={(e) => setSexe(e.target.value)} className="input">
              <option value="">Choisir</option>
              <option value="Feminin">Féminin</option>
              <option value="Masculin">Masculin</option>
            </select>
          </Field>

          <Field label="Ville">
            <input required value={ville} onChange={(e) => setVille(e.target.value)} className="input" />
          </Field>

          <Field label="Email">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </Field>

          <Field label="Numéro WhatsApp / Mobile Money">
            <input
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Le numéro qui servira au paiement"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Mot de passe">
              <input
                required
                type="password"
                minLength={8}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Confirmer">
              <input
                required
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {erreur && (
            <p className="rounded-md bg-seal/10 px-4 py-3 text-sm text-seal">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition hover:bg-ink-light disabled:opacity-50"
          >
            {loading ? "Préparation du paiement..." : "Continuer vers le paiement"}
          </button>
        </form>
      </section>
      <Footer />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
        {label}
      </span>
      {children}
    </label>
  );
}
