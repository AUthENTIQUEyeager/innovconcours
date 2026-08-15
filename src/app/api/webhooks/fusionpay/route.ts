import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/fusionpay";

/**
 * Webhook FusionPay — reçoit un POST à chaque changement d'état d'une
 * transaction (payin.session.pending / completed / cancelled).
 *
 * RÈGLE DE SÉCURITÉ : la documentation FusionPay ne prévoit pas de signature
 * sur ces notifications. On ne fait donc JAMAIS confiance au contenu du
 * payload pour décider d'activer un accès payant — n'importe qui connaissant
 * l'URL pourrait sinon poster un faux "completed". À la place :
 *   1. On lit uniquement le `tokenPay` reçu.
 *   2. On rappelle FusionPay nous-mêmes via checkPaymentStatus(tokenPay).
 *   3. On agit seulement sur la réponse de CET appel, pas sur le payload reçu.
 *
 * IDEMPOTENCE : FusionPay peut envoyer plusieurs notifications pour la même
 * transaction (plusieurs "pending", puis "completed"). On vérifie donc le
 * statut actuel en base avant d'écrire, pour ne jamais traiter deux fois.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tokenPay = body?.tokenPay;

  if (!tokenPay) {
    return NextResponse.json({ error: "tokenPay manquant" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, statut")
    .eq("fusionpay_token", tokenPay)
    .single();

  if (!enrollment) {
    // Notification pour un token qu'on ne connaît pas — on log et on répond
    // 200 pour que FusionPay ne retente pas indéfiniment, mais on n'écrit rien.
    return NextResponse.json({ received: true });
  }

  // Déjà traité comme payé : notification redondante, on ignore proprement.
  if (enrollment.statut === "paye") {
    return NextResponse.json({ received: true });
  }

  // Revérification indépendante auprès de FusionPay — c'est ÇA la source de vérité,
  // pas le payload du webhook.
  const verification = await checkPaymentStatus(tokenPay);
  const statutReel = verification?.data?.statut;

  await admin.from("payments").insert({
    enrollment_id: enrollment.id,
    event: body?.event ?? "unknown",
    montant: verification?.data?.Montant,
    frais: verification?.data?.frais,
    moyen: verification?.data?.moyen,
    numero_transaction: verification?.data?.numeroTransaction,
    raw_payload: body,
  });

  if (statutReel === "paid") {
    await admin
      .from("enrollments")
      .update({ statut: "paye", updated_at: new Date().toISOString() })
      .eq("id", enrollment.id);
  } else if (statutReel === "failure") {
    await admin
      .from("enrollments")
      .update({ statut: "echoue", updated_at: new Date().toISOString() })
      .eq("id", enrollment.id);
  }
  // "pending" / "no paid" : on a journalisé l'événement, mais on ne change
  // pas encore le statut de l'enrollment — on attend une confirmation nette.

  return NextResponse.json({ received: true });
}
