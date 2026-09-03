import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Formation {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
  actif: boolean;
  categorie_id?: string | null;
}

interface FormationCardProps {
  formation: Formation;
  showCategory?: boolean;
}

export default function FormationCard({
  formation,
  showCategory = false
}: FormationCardProps) {
  const icon =
    formation.type_concours === 'Professionnel' ? '💼' : formation.type_concours === 'Direct' ? '📚' : '📘';

  return (
    <Card className="hover:border-gold/60 transition-colors duration-200 group">
      <Link
        href={`/formations/${formation.id}`}
        className="block"
      >
        <div className="flex h-10 w-10 items-center justify-center bg-gold/10 rounded-lg mb-3">
          {icon}
        </div>
        <h3 className="font-display text-lg text-ink mb-2">
          {formation.nom}
        </h3>
        {showCategory && formation.categorie_id && (
          <div className="flex items-center gap-2 mb-3 text-xs text-ink/50">
            {/* TODO: display category name from relation; for now show placeholder */}
            <span>Catégorie : </span>
            <Badge variant="secondary">À définir</Badge>
          </div>
        )}
        {formation.description && (
          <p className="text-sm text-ink/50 mb-4 line-clamp-3">
            {formation.description}
          </p>
        )}
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
      </Link>
    </Card>
  );
}