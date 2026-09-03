import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import FormationCard from '@/components/FormationCard';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import FormationsList from './formations-list';

export default async function FormationsPage() {
  const supabase = createServerSupabase();

  // Fetch formations and categories
  const { data: formations, error: formationsError } = await supabase
    .from('formations')
    .select('id, nom, type_concours, prix, description, actif, categorie_id')
    .eq('actif', true)
    .order('nom');

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, nom, icone')
    .order('nom');

  if (formationsError || categoriesError) {
    console.error('Error fetching formations/categories:', formationsError, categoriesError);
    // We'll still render but pass empty arrays and let client component handle error state
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <FormationsList
        formations={formations ?? []}
        categories={categories ?? []}
      />
    </section>
  );
}