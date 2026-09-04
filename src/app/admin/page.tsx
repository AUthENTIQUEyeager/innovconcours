import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/connexion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nom, prenom')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return redirect('/');
  }

  const [
    { count: formationsCount },
    { count: resourcesCount },
    { count: pollsCount },
    { data: enrollmentsData },
    { data: formationsData },
  ] = await Promise.all([
    supabase.from('formations').select('id', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
    supabase.from('polls').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase
      .from('enrollments')
      .select('user_id, formation_id, statut, formations(nom)')
      .eq('statut', 'paye'),
    supabase.from('formations').select('id, nom').eq('actif', true),
  ]);

  // Nombre d'élèves distincts ayant au moins une inscription payée
  const paidEnrollments = enrollmentsData ?? [];
  const distinctStudents = new Set(paidEnrollments.map((e: any) => e.user_id)).size;

  // Répartition des inscrits payants par formation
  const countByFormation = new Map<string, number>();
  for (const e of paidEnrollments as any[]) {
    countByFormation.set(e.formation_id, (countByFormation.get(e.formation_id) ?? 0) + 1);
  }
  const formationBreakdown: Array<{ id: string; nom: string; count: number }> = (formationsData ?? []).map((f: any) => ({
    id: f.id,
    nom: f.nom,
    count: countByFormation.get(f.id) ?? 0,
  }));

  // Total des votes sur tous les sondages
  const { data: pollsWithVotes } = await supabase
    .from('polls')
    .select('poll_votes(id)');
  const totalVotes = (pollsWithVotes ?? []).reduce(
    (sum: number, p: any) => sum + (p.poll_votes?.length ?? 0),
    0
  );

  const stats = [
    { label: 'Élèves inscrits (payants)', value: distinctStudents },
    { label: 'Formations actives', value: formationsCount ?? 0 },
    { label: 'Ressources publiées', value: resourcesCount ?? 0 },
    { label: 'Sondages publiés', value: pollsCount ?? 0 },
    { label: 'Votes enregistrés', value: totalVotes },
  ];

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink mb-1">
          Administration
        </h1>
        <p className="text-sm text-ink/60">
          Bienvenue {profile.prenom} — vue d'ensemble de la plateforme.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-ink/10 bg-white p-5">
            <p className="text-3xl font-bold text-gold-dark mb-1">{stat.value}</p>
            <p className="text-xs text-ink/60">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Répartition par formation */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-ink mb-3">Inscrits par formation</h2>
        {formationBreakdown.length === 0 ? (
          <p className="text-sm text-ink/60">Aucune formation active pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3">Inscrits payants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {formationBreakdown.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3">{f.nom}</td>
                    <td className="px-4 py-3">{f.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sections de gestion */}
      <div>
        <h2 className="text-lg font-semibold text-ink mb-3">Gestion du contenu</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <h3 className="font-display text-lg text-ink mb-1">Sondages</h3>
            <p className="text-sm text-ink/60 mb-4">
              Créer des sondages, publier, fermer, et voir les résultats.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/sondages" className="text-sm font-medium text-gold-dark hover:underline">
                Voir la liste
              </Link>
              <Link href="/admin/sondages/nouveau" className="text-sm font-medium text-gold-dark hover:underline">
                + Nouveau sondage
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <h3 className="font-display text-lg text-ink mb-1">Ressources</h3>
            <p className="text-sm text-ink/60 mb-4">
              Publier des images et des PDF, généraux ou liés à une formation.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/resources" className="text-sm font-medium text-gold-dark hover:underline">
                Voir la liste
              </Link>
              <Link href="/admin/resources/new" className="text-sm font-medium text-gold-dark hover:underline">
                + Nouvelle ressource
              </Link>
            </div>
          </div>
        </div>
        <p className="text-xs text-ink/50 mt-4">
          Les formations se gèrent pour l'instant directement dans Supabase (Table Editor).
        </p>
      </div>
    </section>
  );
}
