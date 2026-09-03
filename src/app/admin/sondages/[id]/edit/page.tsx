'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createClient } from '@/lib/supabase/client';

interface Option {
  id: number; // temporary id for mapping
  text: string;
}

export default function EditSondagePage() {
  const { id: pollIdParam } = useParams<{ id: string }>();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [nextId, setNextId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVotes, setHasVotes] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch the poll and its options on mount and when pollId changes
  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollIdParam) return;

      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: pollData, error: pollError } = await supabase
          .from('polls')
          .select(`
            id,
            question,
            description,
            status,
            created_at,
            closed_at
          `)
          .eq('id', pollIdParam)
          .single();

        if (pollError) {
          throw pollError;
        }

        if (!pollData) {
          setError('Sondage non trouvé');
          setLoading(false);
          return;
        }

        // Check if the user is authorized (admin) - we'll do this in the server actions, but we can also check here
        // For now, we'll just fetch the data and let the server actions handle authorization

        setQuestion(pollData.question ?? '');
        setDescription(pollData.description ?? '');

        // Fetch options
        const { data: optionsData, error: optionsError } = await supabase
          .from('poll_options')
          .select('id, text')
          .eq('poll_id', pollIdParam)
          .order('position', { ascending: true });

        if (optionsError) {
          throw optionsError;
        }

        const mappedOptions: Option[] = optionsData.map((opt: any, index: number) => ({
          id: index + 1, // temporary id
          text: opt.text,
        }));

        setOptions(mappedOptions);
        setNextId(mappedOptions.length + 1);

        // Fetch vote count
        const { count, error: votesError } = await supabase
          .from('poll_votes')
          .select('id', { count: 'exact', head: true })
          .eq('poll_id', pollIdParam);

        if (votesError) {
          throw votesError;
        }

        setVoteCount(count ?? 0);
        setHasVotes((count ?? 0) > 0);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching poll for edit:', err);
        setError(err.message ?? 'Erreur lors du chargement du sondage');
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollIdParam]);

  // Handle submitting the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // First, update the poll question and description
      const updateResponse = await fetch(`/api/admin/sondages?id=${pollIdParam}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || null,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du sondage');
      }

      // If there are no votes, we can update the options
      if (!hasVotes) {
        const optionsResponse = await fetch(`/api/admin/sondages?id=${pollIdParam}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            options: options.map((opt) => opt.text.trim())
          })
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json();
          throw new Error(errorData.error || 'Erreur lors de la mise à jour des options');
        }
      }

      setSubmitSuccess('Sondage mis à jour avec succès !');
      // Reset form after a short delay
      setTimeout(() => {
        setSubmitSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating sondage:', err);
      setSubmitError(err.message ?? 'Une erreur est survenue lors de la mise à jour du sondage');
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
              href="/admin/sondages"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour à la liste des sondages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!pollIdParam) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <h2 className="text-xl font-bold text-seal mb-4">Sondage non spécifié</h2>
          <p>L'identifiant du sondage est manquant.</p>
          <div className="mt-4">
            <Link
              href="/admin/sondages"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour à la liste des sondages
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const handleAddOption = () => {
    setOptions([...options, { id: nextId, text: '' }]);
    setNextId(nextId + 1);
  };

  const handleRemoveOption = (id: number) => {
    if (options.length <= 2) {
      // Cannot remove if less than or equal to 2 options (we need at least 2)
      return;
    }
    setOptions(options.filter((opt) => opt.id !== id));
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <Link
          href="/admin/sondages"
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Retour à la liste des sondages
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink mb-2">
          Modifier le sondage
        </h1>
        <p className="text-sm text-ink/60">
          Modifiez les détails du sondage ici.
        </p>
      </div>

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

      <form id="edit-sondage-form" onSubmit={handleSubmit} className="space-y-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Question *
          </span>
          <Input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Entrez la question du sondage"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Description
          </span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Entrez une description détaillée (optionnel)"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Options *
          </span>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-2.5">
                  <span className="text-sm text-ink/60">Option {index + 1}</span>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = { ...option, text: e.target.value };
                      setOptions(newOptions);
                    }}
                    placeholder="Entrez le texte de l'option"
                    disabled={hasVotes}
                  />
                </div>
                {options.length > 2 && (
                  <div className="flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                      disabled={hasVotes}
                    >
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption} disabled={hasVotes}>
                + Ajouter une option
              </Button>
            </div>
          </div>
          {hasVotes && (
            <p className="text-xs text-ink/60 mt-1">
              Les options ne peuvent pas être modifiées après que des votes ont été enregistrés
              ({voteCount} vote{voteCount > 1 ? 's' : ''}).
            </p>
          )}
          {!hasVotes && (
            <p className="text-xs text-ink/60 mt-1">
              Vous devez fournir au moins 2 options.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitLoading}>
            {submitLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </section>
  );
}
