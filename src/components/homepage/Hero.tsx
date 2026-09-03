import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="py-16 bg-paper">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center space-y-6">
          <h1 className="font-display text-4xl font-bold text-ink">
            Prépare ton concours.
          </h1>
          <p className="text-lg text-ink/60 max-w-xl mx-auto">
            InnovConcours est la plateforme dédiée à la préparation aux concours
            administratifs au Burkina Faso. Apprends, t'entraîne, simule et
            progresse avec des ressources conçues pour ton succès.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/formations"
              className={[
                'rounded-full',
                'bg-gold-dark',
                'px-4',
                'py-2',
                'text-paper',
                'font-medium',
                'transition',
                'hover:bg-gold/90'
              ].join(' ')}
            >
              Découvrir les formations
            </Link>
            <Link
              href="/inscription"
              className={[
                'rounded-full',
                'border',
                'border-ink',
                'px-4',
                'py-2',
                'text-ink',
                'font-medium',
                'transition',
                'hover:bg-ink/5'
              ].join(' ')}
            >
              Créer mon compte
            </Link>
            <Link
              href="/connexion"
              className={[
                'rounded-full',
                'bg-ink',
                'px-4',
                'py-2',
                'text-paper',
                'font-medium',
                'transition',
                'hover:bg-ink-light'
              ].join(' ')}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}