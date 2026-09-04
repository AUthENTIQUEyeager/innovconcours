'use client';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BiFile, BiImage } from 'react-icons/bi';

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

export default function ResourceDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const { type, id } = params;

  const supabase = createClient();
  const [resource, setResource] = useState<Resource | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResource = async () => {
      setLoading(true);
      setError(null);
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
            formations!resources_formation_id_fkey(id, nom, type_concours)
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setResource(data);

        // Le bucket est privé (accès réservé aux inscrits) : il faut une URL
        // signée, une URL publique ne fonctionnerait pas.
        const { data: signedData, error: signedError } = await supabase.storage
          .from('resources')
          .createSignedUrl(data.file_path, 60 * 60); // valide 1h

        if (signedError) {
          throw signedError;
        }

        setFileUrl(signedData.signedUrl);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching resource:', err);
        setError(err.message ?? 'Une erreur est survenue lors du chargement de la ressource.');
        setLoading(false);
      }
    };

    fetchResource();
  }, [id, supabase]);

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center py-12">
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Chargement de la ressource...
          </h2>
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
              href="/resources"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour aux ressources
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!resource) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="bg-seal/10 rounded-xl p-6 text-seal">
          <h2 className="text-xl font-bold text-seal mb-4">Ressource introuvable</h2>
          <p>La ressourse demandée n'existe pas ou n'est plus disponible.</p>
          <div className="mt-4">
            <Link
              href="/resources"
              className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
            >
              Retour aux ressources
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const getIcon = () => {
    if (resource.type === 'image') {
      return <BiImage className="h-5 w-5" />;
    }
    return <BiFile className="h-5 w-5" />;
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="bg-white border border-ink/10 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
          <div>
            <h1 className="font-display text-2xl text-ink mb-2">{resource.title}</h1>
            <p className="text-sm text-ink/50 mb-1">
              {resource.type === 'image' ? 'Image' : 'PDF'} •
              {resource.file_size ? `${(resource.file_size / 1024).toFixed(1)} KB` : 'Taille inconnue'} •
              {new Date(resource.created_at).toLocaleDateString('fr-FR')}
            </p>
            {resource.description && (
              <p className="text-base text-ink/60 mb-4">{resource.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mb-4">
              {resource.categories && resource.categories.nom && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
                  {resource.categories.icone ?? ''} {resource.categories.nom}
                </span>
              )}
              {resource.formations && resource.formations.nom && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
                  📚 {resource.formations.nom} ({resource.formations.type_concours === 'Professionnel' ? 'Professionnel' : 'Direct'})
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-center">
              {!fileUrl ? (
                <p className="text-sm text-ink/50">Préparation du fichier...</p>
              ) : resource.type === 'image' ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl}
                    alt={resource.title}
                    className="rounded-lg shadow-md max-w-full h-auto"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <BiFile className="h-12 w-12 text-seal" />
                  </div>
                  <p className="text-sm text-ink/60">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-gold-dark hover:text-ink">
                      Télécharger le PDF
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Link
            href="/resources"
            className="inline-flex items-center px-4 py-2 bg-gold-dark text-paper rounded-full hover:bg-gold/90"
          >
            Retour aux ressources
          </Link>
        </div>
      </div>
    </section>
  );
}