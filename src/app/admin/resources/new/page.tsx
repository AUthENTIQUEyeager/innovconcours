'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import { BiFile, BiImage } from 'react-icons/bi';

interface FormState {
  type: 'image' | 'pdf' | '';
  title: string;
  description: string;
  categoryId: string | null;
  formationId: string | null;
  file: File | null;
  previewUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
}

export default function NewResourcePage() {
  const [form, setForm] = useState<FormState>({
    type: '',
    title: '',
    description: '',
    categoryId: null,
    formationId: null,
    file: null,
    previewUrl: null,
    fileSize: null,
    mimeType: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Catégories et formations réelles, récupérées depuis la base
  // (auparavant : options factices codées en dur, category_id/formation_id
  // envoyés n'étaient jamais de vrais UUID de la base).
  const [categories, setCategories] = useState<Array<{ id: string; nom: string }>>([]);
  const [formations, setFormations] = useState<Array<{ id: string; nom: string; type_concours: string }>>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchLookups = async () => {
      const [{ data: categoriesData }, { data: formationsData }] = await Promise.all([
        supabase.from('categories').select('id, nom').order('nom'),
        supabase.from('formations').select('id, nom, type_concours').eq('actif', true).order('nom'),
      ]);
      setCategories(categoriesData ?? []);
      setFormations(formationsData ?? []);
    };
    fetchLookups();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm(prev => ({ ...prev, file: null, previewUrl: null, fileSize: null, mimeType: null }));
      return;
    }

    // Validate file type based on selected type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if ((form.type === 'image' && !isImage) || (form.type === 'pdf' && !isPdf)) {
      setError(`Le fichier sélectionné n'est pas un ${form.type === 'image' ? 'image' : 'PDF'} valide.`);
      return;
    }

    // Validate file size
    const maxSizeInBytes = form.type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for PDF
    if (file.size > maxSizeInBytes) {
      setError(`Le fichier est trop volumineux. La taille maximale est ${form.type === 'image' ? '5 Mo' : '10 Mo'}.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setForm(prev => ({
      ...prev,
      file,
      previewUrl,
      fileSize: file.size,
      mimeType: file.type
    }));
    setError(null);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'image' | 'pdf' | '';
    setForm(prev => ({
      ...prev,
      type,
      file: null,
      previewUrl: null,
      fileSize: null,
      mimeType: null
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!form.type) {
        throw new Error('Veuillez sélectionner un type de ressource.');
      }
      if (!form.title.trim()) {
        throw new Error('Veuillez saisir un titre.');
      }
      if (!form.file) {
        throw new Error('Veuillez sélectionner un fichier.');
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error('Votre session a expiré, veuillez vous reconnecter.');
      }

      // Generate a unique file name
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = form.type === 'image' ?
        (form.mimeType === 'image/jpeg' ? 'jpg' :
         form.mimeType === 'image/png' ? 'png' :
         form.mimeType === 'image/gif' ? 'gif' : 'jpg') : // default to jpg for images
        'pdf';
      const fileName = `${timestamp}-${randomString}.${extension}`;
      const filePath = `${form.type === 'image' ? 'images' : 'pdf'}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, form.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert resource record
      const { error: dbError } = await supabase
        .from('resources')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          type: form.type,
          file_path: filePath,
          category_id: form.categoryId || null,
          formation_id: form.formationId || null,
          uploaded_by: userId,
          file_size: form.fileSize,
          mime_type: form.mimeType
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setSuccess('Ressource ajoutée avec succès !');
      // Reset form after a short delay
      setTimeout(() => {
        setForm({
          type: '',
          title: '',
          description: '',
          categoryId: null,
          formationId: null,
          file: null,
          previewUrl: null,
          fileSize: null,
          mimeType: null
        });
        // Revoke the object URL to free memory
        if (form.previewUrl) {
          URL.revokeObjectURL(form.previewUrl);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error creating resource:', err);
      setError(err.message ?? 'Une erreur est survenue lors de l\'ajout de la ressource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <Link
          href="/admin/resources"
          className="text-sm text-ink/60 hover:text-ink"
        >
          ← Retour à la liste des ressources
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink mb-2">
          Nouvelle ressource
        </h1>
        <p className="text-sm text-ink/60">
          Ajoutez une nouvelle ressource pédagogique (image ou PDF).
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Type de ressource *
          </span>
          <Select value={form.type} onChange={handleTypeChange}>
            <option value="">-- Sélectionner un type --</option>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
          </Select>
        </label>

        {form.type && (
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
              Fichier *
            </span>
            <div className="flex items-center gap-3 rounded-md border border-dashed border-ink/30 px-4 py-3">
              {form.type === 'image' ? <BiImage className="h-5 w-5 text-ink/40" /> : <BiFile className="h-5 w-5 text-ink/40" />}
              <input
                type="file"
                accept={form.type === 'image' ? 'image/*' : '.pdf'}
                onChange={handleFileChange}
                className="flex-1 text-sm text-ink/70 file:mr-3 file:rounded-md file:border-0 file:bg-ink/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-ink/20"
              />
            </div>
            {form.previewUrl && form.type === 'image' && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.previewUrl}
                  alt="Aperçu"
                  className="rounded max-w-xs h-auto"
                />
              </div>
            )}
            {form.fileSize && form.mimeType && (
              <p className="text-xs text-ink/60 mt-1">
                Taille : {(form.fileSize / 1024).toFixed(1)} Ko • Type : {form.mimeType}
              </p>
            )}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Titre *
          </span>
          <Input
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Entrez le titre de la ressource"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Description
          </span>
          <Textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Entrez une description détaillée (optionnel)"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Catégorie
          </span>
          <Select
            value={form.categoryId ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value || null }))}
          >
            <option value="">-- Aucune catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nom}</option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
            Formation associée
          </span>
          <Select
            value={form.formationId ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, formationId: e.target.value || null }))}
          >
            <option value="">-- Ressource générale (visible par tous les inscrits) --</option>
            {formations.map((f) => (
              <option key={f.id} value={f.id}>{f.nom} ({f.type_concours})</option>
            ))}
          </Select>
          <p className="text-xs text-ink/60 mt-1">
            Si une formation est sélectionnée, seuls les inscrits payants de cette formation verront la ressource.
          </p>
        </label>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Ajout en cours...' : 'Ajouter la ressource'}
          </Button>
        </div>
      </form>
    </section>
  );
}
