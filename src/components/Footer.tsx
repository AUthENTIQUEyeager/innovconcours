export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-ink/60">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <p className="font-display text-base text-ink/80">
            Innov<span className="text-gold-dark">Concours</span>
          </p>
          <p>© {new Date().getFullYear()} InnovConcours. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
