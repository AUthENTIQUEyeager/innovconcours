import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';

interface Category {
  id: string;
  nom: string;
  icone?: string;
}

export default async function CategoriesSection() {
  const supabase = createServerSupabase();

  // Try to fetch categories from a hypothetical categories table
  // If the table doesn't exist, we'll show a placeholder
  let categories: Category[] = [];
  let error: Error | null = null;

  try {
    const { data, err } = await supabase
      .from('categories')
      .select('id, nom, icone')
      .order('nom');

    if (err) throw err;
    categories = (data ?? []) as Category[];
    error = err;
  } catch (e) {
    // Likely the table doesn't exist yet
    error = e as Error;
  }

  if (error) {
    // Table doesn't exist or other error
    return (
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Catégories de concours
          </h2>
          <p className="text-center text-ink/60">
            Les catégories de concours seront bientôt disponibles.
            Cette section sera mise à jour lorsque les catégories seront
            ajoutées à la base de données.
          </p>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-semibold text-ink mb-6">
            Catégories de concours
          </h2>
          <p className="text-center text-ink/60">
            Aucune catégorie disponible pour le moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-paper">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Choisis ton domaine de préparation
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/formations?category=${cat.id}`} // We'll implement filtering later
              className="bg-white border border-ink/10 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-gold/60 transition-colors duration-200"
            >
              {cat.icone && (
                <div className="flex h-10 w-10 items-center justify-center bg-gold/10 rounded-full">
                  {cat.icone}
                </div>
              )}
              <h3 className="font-display text-lg text-ink">{cat.nom}</h3>
              <p className="text-xs text-ink/50 text-center">
                Formations disponibles
                {/* TODO: count formations per category */}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}