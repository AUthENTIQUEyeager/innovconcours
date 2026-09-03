import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function CTASection() {
  return (
    <section className="py-16 bg-gold/5">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-3xl font-bold text-ink text-center mb-6">
          Prêt à commencer ta préparation ?
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/formations"
            className={[
              'rounded-full',
              'bg-gold-dark',
              'px-8',
              'py-3',
              'text-paper',
              'font-medium',
              'transition',
              'hover:bg-gold/90'
            ].join(' ')}
          >
            Voir les formations
          </Link>
          <Link
            href="/inscription"
            className={[
              'rounded-full',
              'border',
              'border-gold-dark',
              'px-8',
              'py-3',
              'text-gold-dark',
              'font-medium',
              'transition',
              'hover:bg-gold/10'
            ].join(' ')}
          >
            Créer mon compte
          </Link>
        </div>
      </div>
    </section>
  );
}