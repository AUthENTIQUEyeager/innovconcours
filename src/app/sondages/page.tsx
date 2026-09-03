import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/EmptyState';

interface PollWithOptions {
  id: string;
  question: string;
  description?: string;
  status: string;
  created_at: string;
  poll_options: Array<{ id: string }>;
}

export default async function SondagesPage() {
  const supabase = createServerSupabase();

  // Fetch published polls with options count
  const { data: polls, error: pollsError } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      description,
      status,
      created_at,
      poll_options!poll_options_poll_id_fkey(id)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (pollsError) {
    console.error('Error fetching polls:', pollsError);
    // We'll still render but pass empty array and let client component handle error state
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-ink mb-6">Sondages</h2>

      {polls && polls.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll: PollWithOptions) => (
            <div key={poll.id} className="border border-ink/10 rounded-xl p-6">
              <div className="flex items-baseline mb-3">
                <span className="font-mono text-sm text-ink/60">
                  {new Date(poll.created_at).toLocaleDateString('fr-FR')}
                </span>
                {poll.status === 'published' && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
                    Publié
                  </span>
                )}
                {poll.status === 'closed' && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-seal/20 text-seal">
                    Fermé
                  </span>
                )}
                {poll.status === 'draft' && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-ink/20 text-ink">
                    Brouillon
                  </span>
                )}
              </div>
              <h3 className="font-display text-lg text-ink mb-2">{poll.question}</h3>
              {poll.description && (
                <p className="text-sm text-ink/50 line-clamp-2 mb-4">{poll.description}</p>
              )}
              <div className="flex items-baseline mb-4">
                <span className="text-sm text-ink/60">
                  {poll.poll_options?.length ?? 0} option{
                    poll.poll_options?.length !== 1 ? 's' : ''
                  }
                </span>
              </div>
              <Link
                href={`/sondages/${poll.id}`}
                className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
              >
                Voir le sondage
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun sondage disponible" description="Aucun sondage publié n'est disponible pour le moment." />
      )}
    </section>
  );
}