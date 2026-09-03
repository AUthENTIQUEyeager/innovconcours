import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import EnrollmentStatus from './EnrollmentStatus';

export default async function FormationDetailPage({
  params,
}: {
  params: { formationId: string };
}) {
  const supabase = createServerSupabase();
  const { formationId } = params;

  // Fetch the formation
  const { data: formation, error: formationError } = await supabase
    .from('formations')
    .select('id, nom, type_concours, prix, description, actif, categorie_id')
    .eq('id', formationId)
    .single();

  if (formationError || !formation) {
    // Formation not found or error
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-ink mb-6">
          Formation introuvable
        </h1>
        <p className="text-lg text-ink/60">
          La formation demandée n'existe pas ou n'est plus disponible.
        </p>
        <Link
          href="/formations"
          className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
        >
          Retour aux formations
        </Link>
      </section>
    );
  }

  if (!formation.actif) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-ink mb-6">
          Formation indisponible
        </h1>
        <p className="text-lg text-ink/60">
          Cette formation n'est actuellement pas disponible.
        </p>
        <Link
          href="/formations"
          className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
        >
          Retour aux formations
        </Link>
      </section>
    );
  }

  const icon =
    formation.type_concours === 'Professionnel' ? '💼' : formation.type_concours === 'Direct' ? '📚' : '📘';

  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-white border border-ink/10 rounded-xl p-6">
          <div className="flex h-12 w-12 items-center justify-center bg-gold/10 rounded-lg mb-4">
            {icon}
          </div>
          <h1 className="font-display text-2xl text-ink mb-2">
            {formation.nom}
          </h1>
          <p className="text-sm text-ink/50 mb-2">
            {formation.type_concours === 'Professionnel' ? 'Formation Professionnelle' : 'Formation Directe'}
          </p>
          {formation.description && (
            <p className="text-base text-ink/60 mb-4">
              {formation.description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-baseline">
              <span className="font-mono text-sm text-ink/60">
                {formation.prix.toLocaleString('fr-FR')} F CFA
              </span>
              {formation.actif ? (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-validated/20 text-validated">
                  Actif
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-seal/20 text-seal">
                  Inactif
                </span>
              )}
            </div>
            <div className="flex sm:mt-0 mt-4 items-center gap-4">
              <EnrollmentStatus formationId={formationId} />
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder for future content (modules, cours, quiz, test, resources) */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Contenu de la formation
        </h2>
        <div className="bg-white border border-ink/10 rounded-xl p-6">
          <p className="text-center text-ink/60 py-8">
            Le contenu de cette formation (cours, quiz, simulations, ressources) sera bientôt disponible.
          </p>
          <div className="text-center">
            <Link
              href="/formations"
              className="text-sm font-medium text-gold-dark hover:text-ink"
            >
              Retour aux formations
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}