import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

const statutLabels: Record<string, { label: string; className: string }> = {
  paye: { label: "Payé — accès actif", className: "text-validated" },
  en_attente: { label: "En attente de paiement", className: "text-gold-dark" },
  echoue: { label: "Paiement échoué", className: "text-seal" },
  annule: { label: "Annulé", className: "text-ink/40" },
};

type Enrollment = {
  id: string;
  statut: string;
  created_at: string;
  formations: { nom: string; prix: number } | { nom: string; prix: number }[] | null;
};

export default async function TableauDeBordPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nom, prenom, role")
    .eq("id", user.id)
    .single();

  // RLS (enrollments_select_own) garantit que seules les inscriptions de
  // l'utilisateur connecté sont retournées ici, même sans filtre explicite.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, statut, created_at, formations(nom, prix)")
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl text-ink">
          Bonjour {profile?.prenom ?? ""}
        </h1>
        {profileError && (
          <p className="mt-2 rounded-md bg-seal/10 px-4 py-3 text-sm text-seal">
            [Diagnostic temporaire] Erreur profil : {profileError.message} (code: {profileError.code}) — user.id: {user.id}
          </p>
        )}
        <p className="mt-2 text-sm text-ink/65">Vos formations et leur statut.</p>

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline"
          >
            → Accéder au panneau d'administration
          </Link>
        )}

        <div className="mt-8 divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
          {(enrollments ?? []).length === 0 && (
            <div className="p-8 text-center text-sm text-ink/60">
              Aucune inscription pour le moment.{" "}
              <Link href="/#formations" className="font-semibold text-gold-dark">
                Voir les formations
              </Link>
            </div>
          )}

          {(enrollments ?? []).map((e: Enrollment) => {
            const formation = Array.isArray(e.formations) ? e.formations[0] : e.formations;
            const statut = statutLabels[e.statut] ?? statutLabels.en_attente;
            return (
              <div key={e.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-display text-base text-ink">{formation?.nom}</p>
                  <p className="font-mono text-xs text-ink/45">
                    {new Date(e.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${statut.className}`}>
                  {statut.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}