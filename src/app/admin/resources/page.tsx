'use server';

import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { BiFile, BiImage, BiTrash } from 'react-icons/bi';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'image' | 'pdf';
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  categories?: {
    id: string;
    nom: string;
    icone?: string;
  } | null;
  formations?: {
    id: string;
    nom: string;
    type_concours: string;
  } | null;
  uploaded_by?: string; // We'll get the user's name from profiles if needed
}

export default async function AdminResourcesPage() {
  const supabase = createServerSupabase();
  let resources: Resource[] = [];
  let error: string | null = null;

  try {
    const { data, error: fetchError } = await supabase
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
        formations!resources_formation_id_fkey(id, nom, type_concours),
        profiles!resources_uploaded_by_fkey(nom, prenom)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    resources = (data as any[] || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      file_path: item.file_path,
      file_size: item.file_size,
      mime_type: item.mime_type,
      created_at: item.created_at,
      categories: item.categories ? {
        id: item.categories.id,
        nom: item.categories.nom,
        icone: item.categories.icone
      } : null,
      formations: item.formations ? {
        id: item.formations.id,
        nom: item.formations.nom,
        type_concours: item.formations.type_concours
      } : null,
      uploaded_by: item.profiles ? `${item.profiles.prenom} ${item.profiles.nom}` : undefined
    }));
  } catch (err: any) {
    error = err.message ?? 'Une erreur est survenue lors du chargement des ressources.';
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Gestion des ressources
          </h2>
          <Link
            href="/admin/resources/new"
            className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
          >
            Nouvelle ressource
          </Link>
        </div>
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <p>{error}</p>
          <Link
            href="/admin/resources"
            className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
          >
            Réessayer
          </Link>
        </div>
      </section>
    );
  }

  async function deleteResource(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabase = createServerSupabase();
    try {
      // Get resource to know file path
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resources')
        .remove([resource.file_path]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw dbError;
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      // In a server action, we can't easily show UI error; we'll just log.
      // The redirect will still happen.
    }
    // Redirect to the same page to refresh
    redirect('/admin/resources');
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Gestion des ressources
        </h2>
        <Link
          href="/admin/resources/new"
          className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
        >
          Nouvelle ressource
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-md bg-ink/5 px-4 py-3 text-sm text-ink/70">
          Aucune ressource disponible. Commencez par ajouter une nouvelle ressource.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Formation</th>
                <th className="px-4 py-3">Taille</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className="px-4 py-3">{resource.title}</td>
                  <td className="px-4 py-3">
                    {resource.type === 'image' ? (
                      <BiImage className="h-4 w-4 text-gold-dark" />
                    ) : (
                      <BiFile className="h-4 w-4 text-seal" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {resource.categories ? resource.categories.nom : 'Aucune'}
                  </td>
                  <td className="px-4 py-3">
                    {resource.formations ? resource.formations.nom : 'Générale'}
                  </td>
                  <td className="px-4 py-3">
                    {resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'Inconnue'}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteResource} method="POST">
                      <input type="hidden" name="id" value={resource.id} />
                      <Button type="submit" variant="danger" size="sm">
                        <BiTrash className="h-4 w-4" /> Supprimer
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}