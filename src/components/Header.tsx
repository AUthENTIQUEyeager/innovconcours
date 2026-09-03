import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Header() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Innov<span className="text-gold-dark">Concours</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Navigation links */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link href="/formations" className="text-ink/70 hover:text-ink">
              Formations
            </Link>
            <Link href="/resources" className="text-ink/70 hover:text-ink">
              Ressources
            </Link>
            <Link href="/sondages" className="text-ink/70 hover:text-ink">
              Sondages
            </Link>
            <Link href="/connexion" className="text-ink/70 hover:text-ink">
              Se connecter
            </Link>
          </nav>
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="text-ink/70 hover:text-ink"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className={[
                'rounded-full',
                'bg-ink',
                'px-4',
                'py-2',
                'text-paper',
                'transition',
                'hover:bg-ink-light'
              ].join(' ')}
            >
              S&apos;inscrire
            </Link>
            {/* Placeholder for user menu (to be implemented later) */}
            <div className="relative">
              <Button variant="outline" size="sm" className="text-ink/60 hover:text-ink">
                Utilisateur
              </Button>
              {/* Dropdown menu will go here */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}