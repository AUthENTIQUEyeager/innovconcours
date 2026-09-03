import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function StatistiquesPage() {
  const supabase = createServerSupabase();

  // Fetch statistics from Supabase
  const [formationsCount, resourcesCount, pollsCount, enrollmentsCount] = await Promise.all([
    supabase.from('formations').select('id', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('polls').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
  ]);

  const stats = {
    formationsDisponibles: formationsCount.count ?? 0,
    ressourcesDisponibles: resourcesCount.count ?? 0,
    sondagesPublies: pollsCount.count ?? 0,
    inscriptionsTotales: enrollmentsCount.count ?? 0,
  };

  return (
    <>
      <Header />
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Statistiques de la plateforme
          </h1>
          <p className="text-lg text-ink/60">
            Vue d'ensemble des données disponibles sur InnovConcours
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Formations disponibles
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.formationsDisponibles}
            </p>
            <p className="text-sm text-ink/50">
              Formations actives
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Ressources disponibles
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.ressourcesDisponibles}
            </p>
            <p className="text-sm text-ink/50">
              Ressources pédagogiques
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Sondages publiés
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.sondagesPublies}
            </p>
            <p className="text-sm text-ink/50">
              Sondages actifs
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-ink/10 shadow-sm">
            <h3 className="font-display text-lg text-ink mb-3">
              Inscriptions totales
            </h3>
            <p className="text-4xl font-bold text-gold-dark">
              {stats.inscriptionsTotales}
            </p>
            <p className="text-sm text-ink/50">
              Incriptions aux formations
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}