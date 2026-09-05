import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";
import { createPaymentLink } from "@/lib/fusionpay";

const bodySchema = z.object({
  formationId: z.string().uuid(),
  telephone: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { formationId, telephone } = parsed.data;

  // 1. Identifier l'utilisateur connecté via sa session (cookies) — jamais
  //    faire confiance à un user_id envoyé dans le body.
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = createAdminSupabase();

  // 2. Le prix vient UNIQUEMENT de la base de données, jamais du client.
  //    Ça empêche quelqu'un de modifier le montant envoyé au formulaire.
  const { data: formation, error: formationError } = await admin
    .from("formations")
    .select("id, nom, prix, actif")
    .eq("id", formationId)
    .single();

  if (formationError || !formation || !formation.actif) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("nom, prenom")
    .eq("id", user.id)
    .single();

  // 3. Créer l'enrollment en base AVANT d'appeler FusionPay, statut "en_attente".
  const { data: enrollment, error: enrollmentError } = await admin
    .from("enrollments")
    .insert({
      user_id: user.id,
      formation_id: formation.id,
      statut: "en_attente",
    })
    .select("id")
    .single();

  if (enrollmentError || !enrollment) {
    return NextResponse.json(
      { error: "Impossible de créer l'inscription" },
      { status: 500 }
    );
  }

  // 4. Générer le lien de paiement FusionPay pour ce montant exact.
  //
  // MODE TEST TEMPORAIRE : si DISABLE_PAYMENT_TEMP=true est défini dans les
  // variables d'environnement, on saute complètement FusionPay et on marque
  // l'inscription comme payée directement, pour pouvoir tester le reste du
  // site (accès aux ressources/sondages réservés aux inscrits) sans avoir
  // FusionPay configuré. Désactivé par défaut — retire cette variable
  // d'environnement (ou remets-la à autre chose que "true") pour réactiver
  // le vrai paiement, sans repasser par du code.
  if (process.env.DISABLE_PAYMENT_TEMP === "true") {
    await admin
      .from("enrollments")
      .update({ statut: "paye" })
      .eq("id", enrollment.id);

    return NextResponse.json({
      paymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/paiement/retour?enrollment=${enrollment.id}`,
    });
  }

  try {
    const payment = await createPaymentLink({
      montant: formation.prix,
      formationNom: formation.nom,
      nomComplet: `${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim(),
      telephone,
      enrollmentId: enrollment.id,
    });

    await admin
      .from("enrollments")
      .update({ fusionpay_token: payment.token })
      .eq("id", enrollment.id);

    return NextResponse.json({ paymentUrl: payment.url });
  } catch (err) {
    // On garde l'enrollment en "en_attente" — l'apprenant peut réessayer,
    // rien n'est marqué payé tant que FusionPay ne l'a pas confirmé.
    return NextResponse.json(
      { error: "Le service de paiement est momentanément indisponible" },
      { status: 502 }
    );
  }
}