'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';

interface EnrollmentStatusProps {
  formationId: string;
}

export default function EnrollmentStatus({ formationId }: EnrollmentStatusProps) {
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEnrollment = async () => {
      setLoading(true);
      setError(null);
      try {
        // We need to get the current user's session from Supabase auth.
        // Since we are in a client component, we can use the Supabase client.
        // We'll import createClient from '@/lib/supabase/client'.
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setEnrollment(null);
          setLoading(false);
          return;
        }

        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('id, statut')
          .eq('formation_id', formationId)
          .eq('user_id', user.id)
          .single();

        if (enrollmentError && enrollmentError.code !== 'PGRST116') {
          // PGRST116 means no rows returned (which is fine)
          throw enrollmentError;
        }

        setEnrollment(enrollmentData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error checking enrollment:', err);
        setError(err.message ?? 'Une erreur est survenue.');
        setLoading(false);
      }
    };

    checkEnrollment();
  }, [formationId]);

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <SkeletonLoader className="w-24 h-8" />
        <SkeletonLoader className="w-24 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <p className="text-sm text-seal">{error}</p>
        <ButtonVariant onClick={() => setError(null)} size="sm">Réessayer</ButtonVariant>
      </div>
    );
  }

  // If the user has an enrollment (any status), show buttons to access content.
  // For now, we link to the existing quiz and test pages.
  // In the future, we might have a dedicated formation content page.
  if (enrollment) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/questions/${formationId}`}
          className="flex-1 rounded-full bg-gold-dark text-paper px-4 py-2 text-sm font-medium text-center hover:bg-gold/90"
        >
          Commencer le quiz
        </Link>
        <Link
          href={`/tests/${formationId}`}
          className="flex-1 rounded-full border border-gold-dark text-gold-dark px-4 py-2 text-sm font-medium text-center hover:bg-gold/10"
        >
          Faire une simulation
        </Link>
      </div>
    );
  }

  // If the user is not enrolled, show a button to subscribe (which will pre-select the formation in the inscription form)
  return (
    <Link
      href={`/inscription?formation=${formationId}`}
      className="w-full rounded-full bg-gold-dark text-paper px-4 py-2 text-sm font-medium text-center hover:bg-gold/90"
    >
      S'inscrire à cette formation
    </Link>
  );
}

// Simple button variant for retry
function ButtonVariant({
  onClick,
  children,
  size = 'md',
}: {
  onClick: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-3',
  }[size];

  return (
    <button
      onClick={onClick}
      className={`rounded-full bg-gold-dark text-paper ${sizeClass} hover:bg-gold/90 transition-colors duration-200`}
    >
      {children}
    </button>
  );
}