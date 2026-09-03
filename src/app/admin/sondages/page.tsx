import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { DeleteSondageButton } from './DeleteSondageButton';

interface PollRow {
  id: string;
  question: string;
  description?: string;
  status: string;
  created_at: string;
  closed_at?: string;
  poll_options: Array<{ id: string; text: string; position: number }>;
  poll_votes: Array<{ id: string }>;
}

export default async function AdminSondagesPage() {
  'use server';

  const supabase = createServerSupabase();

  // Check if the user is an admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/connexion');
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile || profile.role !== 'admin') {
    return redirect('/');
  }

  // Fetch all polls with option count and vote count for admin
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      description,
      status,
      created_at,
      closed_at,
      poll_options!poll_options_poll_id_fkey(id),
      poll_votes!poll_votes_poll_id_fkey(id)
    `)
    .order('created_at', { ascending: false });

  if (pollsError) {
    console.error('Error fetching polls:', pollsError);
    // We'll still render but pass empty array and let client component handle error state
  }

  async function publishPoll(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabase = createAdminSupabase();
    try {
      const { error: updateError } = await supabase
        .from('polls')
        .update({ status: 'published' })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Error publishing poll:', err);
    }
    // Redirect to refresh
    return redirect('/admin/sondages');
  }

  async function closePoll(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabase = createAdminSupabase();
    try {
      const { error: updateError } = await supabase
        .from('polls')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Error closing poll:', err);
    }
    return redirect('/admin/sondages');
  }

  async function deletePoll(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    const supabase = createAdminSupabase();
    try {
      // Delete the poll (cascade will delete options and votes)
      const { error: deleteError } = await supabase
        .from('polls')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      console.error('Error deleting poll:', err);
    }
    return redirect('/admin/sondages');
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <Link
          href="/admin/sondages/nouveau"
          className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
        >
          Nouveau sondage
        </Link>
        <h2 className="text-2xl font-semibold text-ink mb-4">Gestion des sondages</h2>
      </div>

      {polls && polls.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Créé le</th>
                <th className="px-4 py-3">Options</th>
                <th className="px-4 py-3">Votes</th>
                <th className="px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {polls.map((poll: PollRow) => {
                const optionCount = poll.poll_options?.length ?? 0;
                const voteCount = poll.poll_votes?.length ?? 0;
                return (
                  <tr key={poll.id}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="font-medium">{poll.question}</div>
                        {poll.description && (
                          <div className="text-sm text-ink/50 line-clamp-2">{poll.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {poll.status === 'published' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
                          Publié
                        </span>
                      )}
                      {poll.status === 'closed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-seal/20 text-seal">
                          Fermé
                        </span>
                      )}
                      {poll.status === 'draft' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-ink/20 text-ink">
                          Brouillon
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(poll.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">{optionCount}</td>
                    <td className="px-4 py-3">{voteCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {/* Edit button */}
                        <Link href={`/admin/sondages/${poll.id}/edit`}>
                          <Button type="button" variant="outline" size="sm">
                            Modifier
                          </Button>
                        </Link>
                        {/* Publish button (draft only) */}
                        {poll.status === 'draft' && (
                          <form action={publishPoll} method="POST">
                            <input type="hidden" name="id" value={poll.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Publier
                            </Button>
                          </form>
                        )}
                        {/* Close button (published only — an already-closed poll has nothing left to close) */}
                        {poll.status === 'published' && (
                          <form action={closePoll} method="POST">
                            <input type="hidden" name="id" value={poll.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Fermer
                            </Button>
                          </form>
                        )}
                        {/* Delete button */}
                        <form action={deletePoll} method="POST">
                          <input type="hidden" name="id" value={poll.id} />
                          <DeleteSondageButton />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md bg-ink/5 px-4 py-3 text-sm text-ink/70">
          Aucun sondage disponible. Commencez par ajouter un nouveau sondage.
        </div>
      )}
    </section>
  );
}