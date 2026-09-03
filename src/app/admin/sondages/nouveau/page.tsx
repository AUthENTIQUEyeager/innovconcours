'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface Option {
  id: number; // temporary id for mapping
  text: string;
}

export default function NewSondagePage() {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { id: 1, text: '' },
    { id: 2, text: '' },
  ]);
  const [nextId, setNextId] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate
    if (!question.trim()) {
      setError('La question est obligatoire.');
      setLoading(false);
      return;
    }

    // Validate at least 2 options with non-empty text
    const nonEmptyOptions = options.filter((opt) => opt.text.trim() !== '');
    if (nonEmptyOptions.length < 2) {
      setError('Vous devez fournir au moins 2 options non vides.');
      setLoading(false);
      return;
    }

    try {
      // Call the server action to create the poll and options
      const response = await fetch('/api/admin/sondages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || null,
          options: nonEmptyOptions.map((opt) => opt.text.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du sondage');
      }

      setSuccess('Sondage créé avec succès !');
      // Reset form after a short delay
      setTimeout(() => {
        setQuestion('');
        setDescription('');
        setOptions([
          { id: 1, text: '' },
          { id: 2, text: '' },
        ]);
        setNextId(3);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating sondage:', err);
      setError(err.message ?? 'Une erreur est survenue lors de la création du sondage.');
    } finally {
      setLoading(false);
    }
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
          Nouveau sondage
        </h1>
        <p className="text-sm text-ink/60">
          Créez un nouveau sondage pour recueillir l'opinion des utilisateurs.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-seal/10 px-4 py-3 text-sm text-seal">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 rounded-md bg-validated/10 px-4 py-3 text-sm text-validated">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                </div>
                {options.length > 2 && (
                  <div className="flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(option.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                + Ajouter une option
              </Button>
            </div>
          </div>
          <p className="text-xs text-ink/60 mt-1">
            Vous devez fournir au moins 2 options.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer le sondage'}
          </Button>
        </div>
      </form>
    </section>
  );
}