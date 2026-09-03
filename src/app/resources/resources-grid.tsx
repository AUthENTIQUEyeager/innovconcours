'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BiFile, BiImage } from 'react-icons/bi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';

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
}

interface ResourcesGridProps {
  resources: Resource[];
}

export default function ResourcesGrid({ resources }: ResourcesGridProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(search.toLowerCase()) ||
      (resource.description?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesType =
      typeFilter === 'all' || resource.type === typeFilter;

    const matchesCategory =
      !categoryFilter ||
      (resource.categories && resource.categories.id === categoryFilter);

    return matchesSearch && matchesType && matchesCategory;
  });

  const plural = filteredResources.length !== 1;

  if (filteredResources.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Ressources pédagogiques
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Rechercher une ressource..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm w-full sm:w-48"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input input-sm w-full sm:w-48"
              >
                <option value="all">Tous les types</option>
                <option value="image">Images</option>
                <option value="pdf">PDF</option>
              </select>
              {/* Category filter will be populated when categories are available */}
              <select
                value={categoryFilter ?? ''}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="input input-sm w-full sm:w-48"
              >
                <option value="">Toutes les catégories</option>
                {/* Options will be dynamically added if we had categories in props */}
                {/* For now, we leave it empty - in a real implementation we would pass categories */}
              </select>
            </div>
            <p className="text-sm text-ink/60">
              {filteredResources.length} ressource{plural ? 's' : ''} trouvée{plural ? 's' : ''}
            </p>
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <EmptyState
            title="Aucune ressource disponible"
            description="Aucune ressource ne correspond à vos critères de recherche."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>
    );
  }
}

interface ResourceCardProps {
  resource: Resource;
}

function ResourceCard({ resource }: ResourceCardProps) {
  const getIcon = () => {
    if (resource.type === 'image') {
      return <BiImage className="h-4 w-4" />;
    }
    return <BiFile className="h-4 w-4" />;
  };

  const getTypeLabel = () => {
    if (resource.type === 'image') {
      return 'Image';
    }
    return 'PDF';
  };

  const getFileUrl = () => {
    // In a real app, we would get the public URL from Supabase Storage
    // For now, we use a placeholder
    return `/storage/v1/object/public/resources/${resource.file_path}`;
  };

  return (
    <Link
      href={`/resources/${resource.type}/${resource.id}`}
      className="block hover:shadow-md transition-shadow duration-200"
    >
      <Card className="group">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gold/10 rounded-lg">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-ink mb-2">{resource.title}</h3>
            <p className="text-sm text-ink/50 mb-1">
              {getTypeLabel()} •
              {resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'Taille inconnue'}
            </p>
            {resource.description && (
              <p className="text-sm text-ink/50 line-clamp-2 mb-3">
                {resource.description}
              </p>
            )}
            <div className="flex items-baseline mb-3">
              <span className="font-mono text-sm text-ink/60">
                {new Date(resource.created_at).toLocaleDateString('fr-FR')}
              </span>
              {resource.categories && resource.categories.nom && (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
                  {resource.categories.icone ?? ''} {resource.categories.nom}
                </span>
              )}
            </div>
            {resource.formations && resource.formations.nom && (
              <div className="flex items-baseline">
                <span className="font-mono text-sm text-ink/60">
                  Formation : {resource.formations.nom}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}