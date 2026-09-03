'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import FormationCard from '@/components/FormationCard';
import { Button } from '@/components/ui/Button';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

interface Formation {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
  actif: boolean;
  categorie_id?: string | null;
}

interface Category {
  id: string;
  nom: string;
  icone?: string | null;
}

interface FormationsListProps {
  formations: Formation[];
  categories: Category[];
}

export default function FormationsList({
  formations,
  categories
}: FormationsListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter formations based on search and category
  const filteredFormations = useCallback(() => {
    return formations.filter((f) => {
      const matchesSearch = f.nom.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || f.categorie_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [formations, search, selectedCategory]);

  // We don't need to refetch data in this component because data is passed as props from server.
  // However, we keep loading and error states for UI consistency (though they will be false/null).
  // We can simulate a loading state on mount if we want, but since data is already fetched, we can set loading to false.
  useEffect(() => {
    // In a real scenario with refetch, we would set loading here.
    // Since we are using server data, we can set loading to false immediately.
    setLoading(false);
  }, [formations, categories]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Toutes les formations
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonLoader key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-2xl font-semibold text-ink mb-6">
          Toutes les formations
        </h2>
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <p>{error}</p>
          <ButtonVariant onClick={() => setError(null)}>Réessayer</ButtonVariant>
        </div>
      </div>
    );
  }

  const filtered = filteredFormations();

  return (
    <div className="mx-auto max-w-4xl px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Toutes les formations
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm w-full sm:w-48"
            />
            {categories.length > 0 && (
              <select
                value={selectedCategory ?? ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="input input-sm w-full sm:w-48"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-sm text-ink/60">
            {filtered.length} formation{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune formation disponible"
          description="Aucune formation ne correspond à vos critères de recherche."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation}
              showCategory={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Simple button variant for retry
function ButtonVariant({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-gold-dark text-paper px-4 py-2 text-sm font-medium hover:bg-gold/90 transition-colors duration-200"
    >
      {children}
    </button>
  );
}