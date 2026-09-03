import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import ResourcesGrid from './resources-grid';

export default async function ResourcesPage() {
  const supabase = createServerSupabase();

  // Fetch resources with related data
  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select(`
      id,
      title,
      description,
      type,
      file_path,
      file_size,
      mime_type,
      created_at,
      categories!resources_category_id_fkey(id, nom, icone),
      formations!resources_formation_id_fkey(id, nom, type_concours)
    `)
    .order('created_at', { ascending: false });

  if (resourcesError) {
    console.error('Error fetching resources:', resourcesError);
    // We'll still render but pass empty array and let client component handle error state
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <ResourcesGrid
        resources={resources ?? []}
      />
    </section>
  );
}