/**
 * Intégration FusionPay (Money Fusion) — https://docs.moneyfusion.net
 *
 * Point d'attention (voir README) : FusionPay n'autorise que les requêtes
 * provenant d'IP enregistrées dans leur dashboard. Une fonction serverless
 * Vercel n'a pas d'IP sortante fixe par défaut — ce module doit donc être
 * appelé depuis une IP statique (proxy, ou Vercel avec IP fixe configurée).
 *
 * Aucune signature n'est documentée sur les webhooks FusionPay. Par prudence,
 * on ne fait donc jamais confiance à un webhook seul : on revérifie toujours
 * le statut via `checkPaymentStatus` avant d'activer un accès (voir la route
 * webhook). C'est la seule façon fiable d'éviter qu'un tiers déclenche une
 * activation en simulant un appel vers /api/webhooks/fusionpay.
 */

const FUSIONPAY_API_URL = process.env.FUSIONPAY_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export type CreatePaymentInput = {
  montant: number;
  formationNom: string;
  nomComplet: string;
  telephone: string;
  enrollmentId: string;
};

export type CreatePaymentResult = {
  statut: boolean;
  token: string;
  message: string;
  url: string; // page de paiement FusionPay vers laquelle rediriger l'apprenant
};

export async function createPaymentLink(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const payload = {
    totalPrice: input.montant,
    article: [{ [input.formationNom]: input.montant }],
    numeroSend: input.telephone,
    nomclient: input.nomComplet,
    personal_Info: [{ enrollmentId: input.enrollmentId }],
    return_url: `${SITE_URL}/paiement/retour?enrollment=${input.enrollmentId}`,
    webhook_url: `${SITE_URL}/api/webhooks/fusionpay`,
  };

  const res = await fetch(FUSIONPAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`FusionPay a répondu ${res.status} lors de la création du lien`);
  }

  return res.json();
}

export type PaymentStatusResult = {
  statut: boolean;
  data: {
    tokenPay: string;
    numeroSend: string;
    nomclient: string;
    numeroTransaction: string;
    Montant: number;
    frais: number;
    statut: "pending" | "failure" | "no paid" | "paid";
    moyen: string;
    personal_Info: Array<{ enrollmentId: string }>;
    createdAt: string;
  };
  message: string;
};

/**
 * Revérifie l'état réel d'un paiement directement auprès de FusionPay.
 * À appeler systématiquement avant d'activer un accès, que ce soit depuis
 * le webhook ou depuis la page de retour — ne jamais activer sur la seule
 * base d'un event webhook ou d'un paramètre d'URL.
 */
export async function checkPaymentStatus(
  token: string
): Promise<PaymentStatusResult> {
  const res = await fetch(
    `https://www.pay.moneyfusion.net/paiementNotif/${token}`
  );
  if (!res.ok) {
    throw new Error(`FusionPay a répondu ${res.status} lors de la vérification`);
  }
  return res.json();
}
