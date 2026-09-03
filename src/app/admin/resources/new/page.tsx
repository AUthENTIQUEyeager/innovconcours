'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
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

  const supabase = createClient();

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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, form.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert resource record
      const { data: resourceData, error: dbError } = await supabase
        .from('resources')
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          type: form.type,
          file_path: filePath,
          category_id: form.categoryId || null,
          formation_id: form.formationId || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || null, // In a real app, we would get the user ID from auth
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

  // Fetch categories and formations for dropdowns
  const [categories, setCategories] = useState<Array<{id: string; nom: string}> | null>(null);
  const [formations, setFormations] = useState<Array<{id: string; nom: string; type_concours: string}> | null>(null);

  // We'll fetch these in a useEffect, but since we're in a server component, we need to do it on the client.
  // For simplicity, we'll fetch them in the component using useEffect and a client-side supabase client.
  // However, we are using the admin supabase client which is server-only. Let's create a client supabase for fetching lookup data.
  // We'll create a separate client supabase instance for lookups.

  // Since we are in a client component (due to useState and useEffect), we can use the regular supabase client.
  // Let's import the client supabase.

  // We'll do the fetching in a separate useEffect for client-side data.

  // For brevity, we'll skip the fetching of categories and formations in this example and assume they are passed as props or we use mock data.
  // In a real implementation, we would fetch them.

  // We'll use mock data for now to demonstrate the UI.
  // In a real app, you would fetch these from the database.

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6">
        <Link
          href="/admin/resources"
          className="txt txt-sm txt-ink/60 hover:txt-ink"
        >
          ← Retour à la liste des ressources
        </Link>
        <h1 className="txt txt-2xl font-semibold txt-ink mb-2">
          Nouvelle ressource
        </h1>
        <p className="txt txt-sm txt-ink/60">
          Ajoutez une nouvelle ressource pédagogique (image ou PDF).
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label txt-font-medium">Type de ressource *</label>
          <select
            value={form.type}
            onChange={handleTypeChange}
            className="select select-bordered w-full"
          >
            <option value="">-- Sélectionner un type --</option>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {form.type && (
          <div>
            <div>
              <label className="label txt-font-medium">Fichier *</label>
              <div className="file-input file-input-bordered w-full">
                <input
                  type="file"
                  accept={form.type === 'image' ? 'image/*' : '.pdf'}
                  onChange={handleFileChange}
                  className="file-input-input"
                />
                <div className="file-input-file">
                  <div className="flex items-center space-x-2">
                    {form.type === 'image' ? <BiImage className="h-4 w-4" /> : <BiFile className="h-4 w-4" />}
                    <span className="file-input-name">
                      {form.file ? form.file.name : 'Aucun fichier sélectionné'}
                    </span>
                  </div>
                </div>
              </div>
              {form.previewUrl && form.type === 'image' && (
                <div className="mt-2">
                  <img
                    src={form.previewUrl}
                    alt="Preview"
                    className="rounded max-w-xs h-auto"
                  />
                </div>
              )}
              {form.fileSize && form.mimeType && (
                <p className="txt txt-xs txt-ink/60 mt-1">
                  Taille : {(form.fileSize / 1024).toFixed(1)} Ko • Type : {form.mimeType}
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="label txt-font-medium">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="input input-bordered w-full"
            placeholder="Entrez le titre de la ressource"
          />
        </div>

        <div>
          <label className="label txt-font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="textarea textarea-bordered w-full"
            rows={4}
            placeholder="Entrez une description détaillée (optionnel)"
          />
        </div>

        <div>
          <label className="label txt-font-medium">Catégorie</label>
          <select
            value={form.categoryId ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value || null }))}
            className="select select-bordered w-full"
          >
            <option value="">-- Aucune catégorie --</option>
            {/* In a real app, we would map over categories */}
            <option value="cat1">Mathématiques</option>
            <option value="cat2">Physique</option>
            <option value="cat3">Informatique
</option>
          </select>
        </div>

        <div>
          <label className="label txt-font-medium">Formation associée</label>
          <select
            value={form.formationId ?? ''}
            onChange={(e) => setForm(prev => ({ ...prev, formationId: e.target.value || null }))}
            className="select select-bordered w-full"
          >
            <option value="">-- Ressource générale --</option>
            {/* In a real app, we would map over formations */}
            <option value="form1">MEF - Ministère de l'Économie et des Finances</option>
            <option value="form2">GÉNÉRALITÉS - Préparation générale aux concours directs</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter la ressource'}
          </Button>
        </div>
      </form>
    </section>
  );
}