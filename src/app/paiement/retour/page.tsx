import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/fusionpay";

export default async function RetourPaiementPage({
  searchParams,
}: {
  searchParams: { enrollment?: string };
}) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const enrollmentId = searchParams.enrollment;
  if (!enrollmentId) redirect("/tableau-de-bord");

  const admin = createAdminSupabase();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, statut, fusionpay_token, user_id, formations(nom, prix)")
    .eq("id", enrollmentId)
    .single();

  // On ne révèle jamais le dossier d'un autre utilisateur, même par erreur d'URL.
  if (!enrollment || enrollment.user_id !== user.id) {
    redirect("/tableau-de-bord");
  }

  let statutAffiche = enrollment.statut;

  // Filet de sécurité : si le webhook n'est pas encore arrivé au moment où
  // l'apprenant revient sur le site, on revérifie nous-mêmes avant d'afficher
  // un statut. Le webhook reste la source principale ; ceci ne fait
  // qu'éviter un faux "en attente" pendant quelques secondes.
  if (statutAffiche === "en_attente" && enrollment.fusionpay_token) {
    try {
      const verification = await checkPaymentStatus(enrollment.fusionpay_token);
      if (verification?.data?.statut === "paid") {
        await admin.from("enrollments").update({ statut: "paye" }).eq("id", enrollment.id);
        statutAffiche = "paye";
      } else if (verification?.data?.statut === "failure") {
        await admin.from("enrollments").update({ statut: "echoue" }).eq("id", enrollment.id);
        statutAffiche = "echoue";
      }
    } catch {
      // Si FusionPay est momentanément injoignable, on affiche simplement
      // le statut actuel — le webhook confirmera dès qu'il arrivera.
    }
  }

  const formation = Array.isArray(enrollment.formations)
    ? enrollment.formations[0]
    : enrollment.formations;

  return (
    <>
      <Header />
      <section className="mx-auto max-w-md px-6 py-20 text-center">
        {statutAffiche === "paye" && (
          <>
            <div className="stamp-rotate mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-validated">
              <span className="font-display text-[10px] font-semibold uppercase text-validated">
                Validé
              </span>
            </div>
            <h1 className="mt-6 font-display text-2xl text-ink">Paiement confirmé</h1>
            <p className="mt-2 text-sm text-ink/65">
              Votre accès à la formation {formation?.nom} est activé.
            </p>
            <Link
              href="/tableau-de-bord"
              className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper"
            >
              Accéder à mon espace
            </Link>
          </>
        )}

        {statutAffiche === "en_attente" && (
          <>
            <h1 className="font-display text-2xl text-ink">Paiement en cours de vérification</h1>
            <p className="mt-2 text-sm text-ink/65">
              Cela prend généralement quelques instants. Rechargez cette page
              dans un moment, ou consultez votre tableau de bord.
            </p>
            <Link
              href="/tableau-de-bord"
              className="mt-8 inline-block rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
            >
              Voir mon tableau de bord
            </Link>
          </>
        )}

        {statutAffiche === "echoue" && (
          <>
            <h1 className="font-display text-2xl text-ink">Le paiement n&apos;a pas abouti</h1>
            <p className="mt-2 text-sm text-ink/65">
              Aucun montant n&apos;a été débité durablement. Vous pouvez réessayer.
            </p>
            <Link
              href="/tableau-de-bord"
              className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper"
            >
              Réessayer
            </Link>
          </>
        )}
      </section>
      <Footer />
    </>
  );
}
