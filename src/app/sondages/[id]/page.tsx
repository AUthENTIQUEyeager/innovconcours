'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

interface Poll {
  id: string;
  question: string;
  description?: string;
  status: string;
  created_at: string;
  poll_options: Array<{
    id: string;
    text: string;
    position: number;
  }>;
}

interface OptionVoteCount {
  option_id: string;
  vote_count: number;
}

export default function SondageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null); // option_id of user's vote
  const [voteCounts, setVoteCounts] = useState<OptionVoteCount[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const supabase = createClient();

  // Resolve the current user once
  useEffect(() => {
    const resolveUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      setCheckingAuth(false);
    };
    resolveUser();
  }, []);

  // Fetch poll and options
  useEffect(() => {
    const fetchPoll = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: pollError } = await supabase
          .from('polls')
          .select(`
            id,
            question,
            description,
            status,
            created_at,
            poll_options!poll_options_poll_id_fkey(id, text, position)
          `)
          .eq('id', id)
          .single();

        if (pollError) {
          throw pollError;
        }

        if (!data) {
          setError('Sondage non trouvé');
          setLoading(false);
          return;
        }

        setPoll(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching poll:', err);
        setError(err.message ?? 'Erreur lors du chargement du sondage');
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id]);

  // Fetch user's vote and vote counts
  useEffect(() => {
    const fetchVoteData = async () => {
      if (!poll) return;

      try {
        // Check if the current user has voted on this poll
        if (userId) {
          const { data: userData, error: userError } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', id)
            .eq('user_id', userId)
            .single();

          if (userError && userError.code !== 'PGRST116') { // PGRST116 means no rows returned
            console.error('Error checking user vote:', userError);
            // We'll continue without setting userVote
          } else if (userData) {
            setUserVote(userData.option_id);
            setHasVoted(true);
          }
        }

        // Get aggregate vote counts for each option (RPC: poll_votes' own RLS
        // only exposes each user's own row, so a direct select here would
        // undercount for everyone except admins)
        const { data: voteCountsData, error: voteCountsError } = await supabase
          .rpc('get_poll_results', { poll_id_param: id });

        if (voteCountsError) {
          throw voteCountsError;
        }

        setVoteCounts(voteCountsData ?? []);
        setTotalVotes((voteCountsData ?? []).reduce((sum: number, r: OptionVoteCount) => sum + r.vote_count, 0));
      } catch (err: any) {
        console.error('Error fetching vote data:', err);
        // We'll continue without vote data; the UI will show loading or empty state
      }
    };

    if (!checkingAuth) {
      fetchVoteData();
    }
  }, [poll, id, userId, checkingAuth]);

  // Handle voting
  const handleVote = async (optionId: string) => {
    if (!poll) return;
    if (hasVoted) return; // Already voted
    if (submitLoading) return;
    if (!userId) return; // Must be signed in

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: id,
          option_id: optionId,
          user_id: userId,
        });

      if (voteError) {
        throw voteError;
      }

      setUserVote(optionId);
      setHasVoted(true);
      setSubmitSuccess('Vote enregistré avec succès !');

      // Refresh vote counts
      const { data: voteCountsData, error: voteCountsError } = await supabase
        .rpc('get_poll_results', { poll_id_param: id });

      if (voteCountsError) {
        throw voteCountsError;
      }

      setVoteCounts(voteCountsData ?? []);
      setTotalVotes((voteCountsData ?? []).reduce((sum: number, r: OptionVoteCount) => sum + r.vote_count, 0));
    } catch (err: any) {
      console.error('Error voting:', err);
      setSubmitError(err.message ?? 'Erreur lors de l\'enregistrement du vote');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center py-12">
          <h2 className="text-2xl font-semibold text-ink mb-4">Chargement du sondage...</h2>
          <div className="flex space-x-3">
            <div className="h-4 w-4 border-2 border-ink rounded-full animate-spin"></div>
            <div className="h-4 w-4 border-2 border-ink rounded-full animate-spin"></div>
            <div className="h-4 w-4 border-2 border-ink rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <h2 className="text-xl font-bold text-seal mb-4">Erreur</h2>
          <p>{error}</p>
          <div className="mt-4">
            <Link
              href="/sondages"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour aux sondages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!poll) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <h2 className="text-xl font-bold text-seal mb-4">Sondage introuvable</h2>
          <p>Le sondage demandé n'existe pas ou n'est plus disponible.</p>
          <div className="mt-4">
            <Link
              href="/sondages"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour aux sondages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Check if poll is published
  if (poll.status !== 'published') {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <h2 className="text-xl font-bold text-seal mb-4">Sondage non disponible</h2>
          <p>Ce sondage n'est pas encore publié ou est fermé.</p>
          <div className="mt-4">
            <Link
              href="/sondages"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour aux sondages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const getOptionPercentage = (count: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="bg-white border border-ink/10 rounded-xl p-6">
        <div className="mb-6">
          <Link
            href="/sondages"
            className="inline-flex items-center px-3 py-1 text-sm text-ink/60 hover:text-ink"
          >
            ← Retour à la liste des sondages
          </Link>
          <h1 className="font-display text-2xl text-ink mb-2">{poll.question}</h1>
          {poll.description && (
            <p className="text-sm text-ink/50 mb-4">{poll.description}</p>
          )}
          <div className="flex items-baseline mb-4">
            <span className="font-mono text-sm text-ink/60">
              {new Date(poll.created_at).toLocaleDateString('fr-FR')}
            </span>
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
              Publié
            </span>
          </div>
        </div>

        {!userId && !checkingAuth ? (
          <div className="mb-6 rounded-md bg-ink/5 px-4 py-3 text-sm text-ink/70">
            <Link href="/connexion" className="font-medium text-gold-dark hover:underline">
              Connectez-vous
            </Link>{' '}
            pour participer à ce sondage.
          </div>
        ) : !hasVoted && !submitLoading ? (
          <div className="mb-6">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {poll.poll_options.map((option) => (
                <div key={option.id} className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 items-center justify-center shrink-0">
                    <input
                      type="radio"
                      name="option"
                      value={option.id}
                      checked={userVote === option.id}
                      onChange={(e) => setUserVote(e.target.value)}
                      className="h-4 w-4 accent-gold-dark"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-ink/50">{option.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (userVote) {
                      handleVote(userVote);
                    }
                  }}
                  disabled={!userVote || submitLoading}
                >
                  {submitLoading ? 'Enregistrement...' : 'Voter'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mb-6">
            {submitError && (
              <p className="mb-4 rounded-md bg-seal/10 px-4 py-3 text-sm text-seal">
                {submitError}
              </p>
            )}
            {submitSuccess && (
              <p className="mb-4 rounded-md bg-validated/10 px-4 py-3 text-sm text-validated">
                {submitSuccess}
              </p>
            )}
            {hasVoted && !submitLoading && (
              <div className="text-sm text-ink/60 mb-4">
                Vous avez déjà participé à ce sondage.
              </div>
            )}
          </div>
        )}

        {/* Results section */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-ink mb-4">Résultats</h2>
          {totalVotes === 0 ? (
            <p className="text-sm text-ink/50">Aucun vote enregistré pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {poll.poll_options.map((option) => {
                const count = voteCounts.find((vc) => vc.option_id === option.id)?.vote_count || 0;
                const percentage = getOptionPercentage(count);
                return (
                  <div key={option.id} className="flex items-baseline">
                    <div className="flex-1">
                      <span className="text-sm text-ink/50">{option.text}</span>
                    </div>
                    <div className="w-32">
                      <div className="bg-seal/10 rounded-full h-2.5">
                        <div
                          className="bg-gold-dark h-2.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-3 text-sm text-ink/60 w-16 text-right">
                      {count} votes ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/sondages"
            className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
          >
            Retour aux sondages
          </Link>
        </div>
      </div>
    </section>
  );
}