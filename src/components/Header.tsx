import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Innov<span className="text-gold-dark">Concours</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/#formations" className="hidden text-ink/70 hover:text-ink sm:inline">
            Formations
          </Link>
          <Link href="/connexion" className="text-ink/70 hover:text-ink">
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-ink px-4 py-2 text-paper transition hover:bg-ink-light"
          >
            S&apos;inscrire
          </Link>
        </nav>
      </div>
    </header>
  );
}
