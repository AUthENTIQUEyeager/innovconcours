import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

type Formation = {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
};

type UserStats = {
  scoreMoyen: number;
  serieEnCours: number;
  questionsRepondues: number;
};

export default async function HomePage() {
  const supabase = createServerSupabase();

  // Get formations
  const { data: formations } = await supabase
    .from("formations")
    .select("id, nom, type_concours, prix, description")
    .eq("actif", true)
    .order("prix", { ascending: false }) as { data: Formation[] | null };

  // Get user stats (placeholder - would come from actual user data in real implementation)
  const stats: UserStats = {
    scoreMoyen: 78,
    serieEnCours: 5,
    questionsRepondues: 240
  };

  return (
    <>
      <Header />

      {/* Personal greeting */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-ink mb-2">
          Bonjour, Utilisateur !
        </h1>
        <p className="text-lg text-ink/60">
          Prêt à vous entraîner pour vos concours administratifs ?
        </p>
      </section>

      {/* Quick access to matières */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Sélectionnez une matière
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(formations ?? []).map((formation) => (
            <Link
              key={formation.id}
              href={`/questions/${formation.id}`}
              className="bg-white rounded-xl p-6 border border-ink/10 hover:border-gold/60 shadow-sm transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-gold/10 rounded-lg mb-4">
                {/* Matiere icon based on type */}
                <span className="text-2xl text-gold-dark">
                  {formation.type_concours === "Professionnel" ? "💼" : "📚"}
                </span>
              </div>
              <h3 className="font-display text-lg text-ink mb-2">
                {formation.nom}
              </h3>
              <p className="text-sm text-ink/50 mb-4 line-clamp-2">
                {formation.description || `Formation pour le ${formation.nom}`}
              </p>

              {/* Progress indicator placeholder */}
              <div className="w-full h-2 bg-ink/10 rounded-full mb-3">
                <div
                  className="h-full bg-gold-dark rounded-full transition-all duration-500 w-65"
                ></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-ink/60">65% maîtrisé</span>
                <span className="font-semibold text-gold-dark">S'entraîner →</span>
              </div>
            </Link>
          ))}

          {/* Add a button to see all formations if there are many */}
          {(formations ?? []).length > 3 && (
            <Link
              href="/#formations"
              className="col-span-3 mt-8 text-center text-sm font-medium text-gold-dark hover:text-ink"
            >
              Voir toutes les formations
            </Link>
          )}
        </div>
      </section>

      {/* Personal statistics */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Votre progression
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Score moyen
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.scoreMoyen}%
            </p>
            <p className="text-sm text-ink/50">
              Sur vos dernières sessions
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Série en cours
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.serieEnCours} jours
            </p>
            <p className="text-sm text-ink/50">
              Sans manquer un jour
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Questions répondues
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.questionsRepondues}
            </p>
            <p className="text-sm text-ink/50">
              Au total
            </p>
          </div>
        </div>
      </section>

      {/* Test/Exam simulation section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Tests blancs
        </h2>
        <p className="text-sm text-ink/60 mb-6">
          Simulez les conditions réelles du concours avec des chronométrages
          et une évaluation complète de vos performances.
        </p>
        <Link
          href="/tests"
          className="inline-flex items-center px-6 py-3 bg-ink text-paper rounded-full hover:bg-ink-light transition-shadow"
        >
          Commencer un test blanc
          <span className="ml-3">→</span>
        </Link>
      </section>

      {/* Recent activity / recommendations */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Recommandations pour vous
        </h2>
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                <span className="text-gold-dark">📝</span>
              </div>
              <div>
                <h3 className="font-display text-lg text-ink mb-1">
                  Révisez les bases du MEF
                </h3>
                <p className="text-sm text-ink/60">
                  Vous avez eu des difficultés récemment sur les questions de
                  comptabilité publique. Une révision ciblée pourrait améliorer
                  votre score de 15 points.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                <span className="text-gold-dark">⏱️</span>
              </div>
              <div>
                <h3 className="font-display text-lg text-ink mb-1">
                  Améliorez votre rapidité
                </h3>
                <p className="text-sm text-ink/60">
                  Votre temps moyen par question est de 45 secondes. Essayez de
                  le réduire à 35 secondes pour être plus à l'aise lors des
                  épreuves chronométrées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}