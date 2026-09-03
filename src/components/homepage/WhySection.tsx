export default function WhySection() {
  return (
    <section className="py-12 bg-paper">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Pourquoi choisir InnovConcours ?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center space-y-4">
            <div className="flex h-10 w-10 items-center justify-center mx-auto bg-gold/10 rounded-full">
              📚
            </div>
            <h3 className="font-display text-lg text-ink">Apprends</h3>
            <p className="text-sm text-ink/60">
              Accède à des contenus conçus spécifiquement pour la préparation
              aux concours administratifs au Burkina Faso.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="flex h-10 w-10 items-center justify-center mx-auto bg-gold/10 rounded-full">
              ✏️
            </div>
            <h3 className="font-display text-lg text-ink">Entraîne-toi</h3>
            <p className="text-sm text-ink/60">
              Teste tes connaissances avec des quiz interactifs et des
              exercices corrigés.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="flex h-10 w-10 items-center justify-center mx-auto bg-gold/10 rounded-full">
              🎯
            </div>
            <h3 className="font-display text-lg text-ink">Simule</h3>
            <p className="text-sm text-ink/60">
              Mets-toi dans les conditions d'un véritable examen avec des
              simulations chronométrées.
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="flex h-10 w-10 items-center justify-center mx-auto bg-gold/10 rounded-full">
              📈
            </div>
            <h3 className="font-display text-lg text-ink">Progresse</h3>
            <p className="text-sm text-ink/60">
              Suis tes performances, identifie tes points faibles et
              améliore ton score jour après jour.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}