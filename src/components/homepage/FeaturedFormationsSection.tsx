import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Formation {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
  actif: boolean;
}

interface FeaturedFormationsSectionProps {
  formations: Formation[];
}

export default function FeaturedFormationsSection({
  formations
}: FeaturedFormationsSectionProps) {
  // Take up to 4 formations
  const featured = formations.slice(0, 4);

  if (featured.length === 0) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Formations disponibles
          </h2>
          <p className="text-center text-ink/60">
            Aucune formation disponible pour le moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Formations en vedette
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((formation) => (
            <Link
              key={formation.id}
              href={`/formations/${formation.id}`}
              className="group"
            >
              <div className="bg-white border border-ink/10 rounded-xl p-6 hover:border-gold/60 transition-colors duration-200">
                <div className="mb-4">
                  {/* Icon based on type_concours - using emojis for now */}
                  <div className="flex h-10 w-10 items-center justify-center bg-gold/10 rounded-lg mb-2">
                    {formation.type_concours === 'Professionnel' ? '💼' : '📚'}
                  </div>
                </div>
                <h3 className="font-display text-lg text-ink mb-2">
                  {formation.nom}
                </h3>
                <p className="text-sm text-ink/50 mb-3 line-clamp-2">
                  {formation.description || `Formation pour le ${formation.nom}`}
                </p>
                <div className="flex items-baseline mb-4">
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
                <Button
                  className="w-full rounded-full bg-gold-dark text-paper px-4 py-2 text-sm font-medium hover:bg-gold/90"
                >
                  Voir la formation
                </Button>
              </div>
            </Link>
          ))}
        </div>
        {formations.length > 4 && (
          <div className="mt-6 text-center">
            <Link
              href="/formations"
              className="text-sm font-medium text-gold-dark hover:text-ink"
            >
              Voir toutes les formations ({formations.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}