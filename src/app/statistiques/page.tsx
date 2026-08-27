'use client';

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function StatistiquesPage() {
  const [stats, setStats] = useState({
    scoreMoyen: 78,
    serieEnCours: 5,
    questionsRepondues: 240,
    joursActifs: 23,
    tauxReussite: 82,
    progressionHebdo: 12
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching stats from Supabase
    // In a real app, this would be an actual Supabase query
    setTimeout(() => {
      setStats({
        scoreMoyen: 78,
        serieEnCours: 5,
        questionsRepondues: 240,
        joursActifs: 23,
        tauxReussite: 82,
        progressionHebdo: 12
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink mb-4">Chargement des statistiques...</h2>
            <p className="text-lg text-ink/60">
              Préparation de votre tableau de bord personnalisé
            </p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Vos statistiques détaillées
          </h1>
          <p className="text-lg text-ink/60">
            Suivez vos progrès et identifiez vos points d'amélioration
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
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
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Taux de réussite
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.tauxReussite}%
            </p>
            <p className="text-sm text-ink/50">
              Aux questions d'entraînement
            </p>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Progression hebdomadaire
          </h2>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-ink">Cette semaine</span>
              <span className="text-sm text-ink/60">{stats.progressionHebdo}% d'amélioration</span>
            </div>
            <div className="w-full bg-ink/10 rounded-full h-2.5 mb-4">
              <div
                className={`h-full bg-gold-dark rounded-full transition-all duration-500 w-${stats.progressionHebdo}%`}
              ></div>
            </div>
            <p className="text-sm text-ink/60">
              Vous avez répondu {stats.questionsRepondues * 0.12} questions cette semaine,
              ce qui représente une augmentation de {stats.progressionHebdo}% par rapport
              à la semaine dernière.
            </p>
          </div>
        </div>

        {/* Activity Calendar */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Calendrier d'activité
          </h2>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Days of week header */}
              <div className="text-xs font-medium text-ink/60">Lu</div>
              <div className="text-xs font-medium text-ink/60">Ma</div>
              <div className="text-xs font-medium text-ink/60">Me</div>
              <div className="text-xs font-medium text-ink/60">Je</div>
              <div className="text-xs font-medium text-ink/60">Ve</div>
              <div className="text-xs font-medium text-ink/60">Sa</div>
              <div className="text-xs font-medium text-ink/60">Di</div>

              {/* Calendar days - simplified mock data */}
              {[...Array(28)].map((_, index) => (
                <div key={index} className={`aspect-square rounded bg-${index % 7 === 0 || index % 7 === 6 ? 'ink/10' : ' ink/5'} hover:bg-ink/10 transition-colors`}
                  title={`Jour ${index + 1}: ${index % 7 === 0 || index % 7 === 6 ? 'Repos' : 'Session d entraînement'} `}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-ink/60 text-center">
              {stats.joursActifs} jours actifs sur les 30 derniers jours
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Recommandations personnalisées
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-ink/10 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 items-center justify-center bg-gold/20 rounded-lg">
                  <span className="text-gold-dark">📊</span>
                </div>
                <div>
                  <h3 className="font-display text-lg text-ink mb-1">
                    Renforcez vos faibles scores
                  </h3>
                  <p className="text-sm text-ink/60">
                    Vos scores en mathématiques sont en retrait de 15 points par rapport
                    à votre moyenne. Concentrez-vous sur les exercices de résolution
                    de problèmes cette semaine.
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
        </div>
      </section>
      <Footer />
    </>
  );
}