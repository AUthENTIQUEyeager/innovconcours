import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

type FormationStat = {
  formationId: string;
  formationNom: string;
  scoreMoyen: number;
  questionsRepondues: number;
  derniereActivite: string; // ISO date
};

type TimeSeriesData = {
  date: string; // YYYY-MM-DD
  score: number;
  questions: number;
};

export default async function StatistiquesPage() {
  const supabase = createServerSupabase();

  // Get user (assuming logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login if not authenticated
    // In a real app, we would use redirect from next/navigation
    // For simplicity, we'll show a message
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink mb-4">
              Veuillez vous connecter
            </h2>
            <p className="text-lg text-ink/60">
              Accédez à vos statistiques après connexion
            </p>
            <Link
              href="/connexion"
              className="mt-6 inline-flex items-center px-4 py-2 bg-ink text-paper rounded-full hover:bg-ink-light"
            >
              Se connecter
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("nom, prenom")
    .eq("id", user.id)
    .single();

  // Mock statistics data - in real implementation, replace with actual queries
  const formationStats: FormationStat[] = [
    {
      formationId: "mef",
      formationNom: "MEF",
      scoreMoyen: 78,
      questionsRepondues: 120,
      derniereActivite: "2026-08-20",
    },
    {
      formationId: "matm",
      formationNom: "MATM",
      scoreMoyen: 65,
      questionsRepondues: 80,
      derniereActivite: "2026-08-18",
    },
    {
      formationId: "mica",
      formationNom: "MICA",
      scoreMoyen: 82,
      questionsRepondues: 60,
      derniereActivite: "2026-08-22",
    },
    {
      formationId: "mfptps",
      formationNom: "MFPTPS",
      scoreMoyen: 70,
      questionsRepondues: 50,
      derniereActivite: "2026-08-19",
    },
  ];

  const timeSeriesData: TimeSeriesData[] = [
    { date: "2026-08-01", score: 60, questions: 10 },
    { date: "2026-08-03", score: 65, questions: 15 },
    { date: "2026-08-05", score: 70, questions: 20 },
    { date: "2026-08-07", score: 68, questions: 12 },
    { date: "2026-08-10", score: 72, questions: 18 },
    { date: "2026-08-12", score: 75, questions: 22 },
    { date: "2026-08-15", score: 73, questions: 16 },
    { date: "2026-08-18", score: 77, questions: 20 },
    { date: "2026-08-20", score: 78, questions: 25 },
    { date: "2026-08-22", score: 80, questions: 30 },
  ];

  // Calculate overall stats
  const overallScore =
    formationStats.reduce((sum, stat) => sum + stat.scoreMoyen, 0) /
    formationStats.length;
  const totalQuestions = formationStats.reduce(
    (sum, stat) => sum + stat.questionsRepondues,
    0
  );
  const daysActive = 23; // mock

  return (
    <>
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Bonjour {profile?.prenom ?? "Utilisateur"} !
          </h1>
          <p className="text-lg text-ink/60">
            Vos statistiques de préparation aux concours
          </p>
        </div>

        {/* Overall Stats Cards */}
        <div className="mb-10 grid gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Score moyen global
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {overallScore.toFixed(1)}%
            </p>
            <p className="text-sm text-ink/50">
              Sur toutes les formations
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Questions répondues
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {totalQuestions}
            </p>
            <p className="text-sm text-ink/50">
              Au total
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Jours d'activité
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {daysActive}
            </p>
            <p className="text-sm text-ink/50">
              Régularité
            </p>
          </div>
        </div>

        {/* Performance by Formation */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Performance par formation
          </h2>
          <div className="space-y-4">
            {formationStats.map((stat) => (
              <div
                key={stat.formationId}
                className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start mb-4">
                  <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg mr-4">
                    <span className="text-gold-dark">
                      {stat.formationNom === "MEF"
                        ? "💼"
                        : stat.formationNom === "MATM"
                        ? "🏛️"
                        : stat.formationNom === "MICA"
                        ? "🏭"
                        : stat.formationNom === "MFPTPS"
                        ? "👔"
                        : "📚"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink mb-1">
                      {stat.formationNom}
                    </h3>
                    <p className="text-sm text-ink/50">
                      Dernière activité : {
                        new Date(stat.derniereActivite).toLocaleDateString(
                          "fr-FR"
                        )
                      }
                    </p>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink/60">Score moyen</span>
                    <span className="font-medium text-ink">
                      {stat.scoreMoyen}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-ink/10 rounded-full">
                    <div
                      className={`h-full bg-gold-dark rounded-full transition-all duration-500 w-${stat.scoreMoyen}%`}
                    ></div>
                  </div>
                </div>

                {/* Stats Details */}
                <div className="text-sm text-ink/60 space-y-1">
                  <div className="flex">
                    <span className="w-20">Questions :</span>
                    <span>{stat.questionsRepondues}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20">Niveau :</span>
                    <span className="
                     ${stat.scoreMoyen >= 80
                       ? "text-validated"
                       : stat.scoreMoyen >= 60
                       ? "text-gold-dark"
                       : "text-seal"}
                    ">
                      {stat.scoreMoyen >= 80
                        ? "Excellent"
                        : stat.scoreMoyen >= 60
                        ? "Satisfaisant"
                        : "À améliorer"}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <Link
                    href={`/questions?formation=${stat.formationId}`}
                    className="w-full text-center px-4 py-2 bg-ink text-paper rounded-full hover:bg-ink-light transition"
                  >
                    S'entraîner sur {stat.formationNom}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Progress Over Time */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Évolution de votre score
          </h2>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            {/* In a real app, we would render a chart here using a library like Recharts or Chart.js */}
            <div className="h-96 bg-ink/5 rounded-lg border border-ink/20 flex items-center justify-center">
              <p className="text-ink/50 text-center">
                [Graphique d'évolution du score sur le temps]\n
                Affichage de votre progression quotidienne\n
                avec moyenne mobile et objectifs
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="text-sm text-ink/60">
                Score de départ :
                <span className="font-medium text-ink">60%</span>
              </div>
              <div className="text-sm text-ink/60">
                Score actuel :
                <span className="font-medium text-gold-dark">
                  {overallScore.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-ink/60">
                Objectif :
                <span className="font-medium text-gold-dark">85%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Points forts et axes d'amélioration
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
              <h3 className="font-display text-lg text-validated mb-4">
                Points forts
              </h3>
              <p className="text-sm text-ink/60 mb-2">
                Vous excellez particulièrement dans :
              </p>
              <ul className="list-disc list-inside text-sm text-ink/50 space-y-1">
                <li>
                  Gestion budgétaire (MEF) - 85% de réussite
                </li>
                <li>
                  Règlementation des marchés publics - 82% de réussite
                </li>
                <li>
                  Comptabilité publique avancée - 80% de réussite
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
              <h3 className="font-display text-lg text-seal mb-4">
                Axes d'amélioration
              </h3>
              <p className="text-sm text-ink/60 mb-2">
                Concentrez vos efforts sur :
              </p>
              <ul className="list-disc list-inside text-sm text-ink/50 space-y-1">
                <li>
                  Droit fiscal avancé (MEF) - 55% de réussite
                </li>
                <li>
                  Procédures de passation des marchés (MATM) - 58% de réussite
                </li>
                <li>
                  Normes environnementales (MICA) - 60% de réussite
                </li>
              </ul>
              <div className="mt-4">
                <Link
                  href="/questions?formation=mef"
                  className="w-full text-center px-4 py-2 bg-seal text-paper rounded-full hover:bg-seal-light"
                >
                  Réviser les points faibles du MEF
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Recommandations personnalisées
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                  <span className="text-gold-dark">📅</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-ink mb-1">
                    Planifiez vos révisions
                  </h3>
                  <p className="text-sm text-ink/60">
                    Étudiez 45 minutes par jour, 5 jours par semaine, pour
                    maintenir votre progression et atteindre vos objectifs.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                  <span className="text-gold-dark">🎯</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-ink mb-1">
                    Simulez régulièrement les épreuves
                  </h3>
                  <p className="text-sm text-ink/60">
                    Faire un test blanc toutes les deux semaines vous aidera
                    à gérer le stress et à identifier vos lacunes avant le
                    jour J.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                  <span className="text-gold-dark">💬</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-ink mb-1">
                    Rejoignez les groupes d'étude
                  </h3>
                  <p className="text-sm text-ink/60">
                    L'apprentissage collaboratif permet de partager des
                    astuces et de rester motivé tout au long de votre
                    préparation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
      <Footer />
    </>
  );
}