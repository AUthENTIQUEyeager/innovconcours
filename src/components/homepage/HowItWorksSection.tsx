export default function HowItWorksSection() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Comment ça marche ?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
              01
            </div>
            <h3 className="font-display text-lg text-ink">Choisis ta formation</h3>
            <p className="text-sm text-ink/60 text-center">
              Parcours le catalogue et trouve le concours que tu prépares.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
              02
            </div>
            <h3 className="font-display text-lg text-ink">Prépare-toi</h3>
            <p className="text-sm text-ink/60 text-center">
              Étudie les cours, fais les quiz et entraîne-toi régulièrement.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
              03
            </div>
            <h3 className="font-display text-lg text-ink">Évalue ton niveau</h3>
            <p className="text-sm text-ink/60 text-center">
              Fais des simulations d'examen et suis ta progression grâce au
              tableau de bord.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}