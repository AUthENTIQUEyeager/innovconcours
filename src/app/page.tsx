import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import Hero from '@/components/homepage/Hero';
import CategoriesSection from '@/components/homepage/CategoriesSection';
import FeaturedFormationsSection from '@/components/homepage/FeaturedFormationsSection';
import WhySection from '@/components/homepage/WhySection';
import HowItWorksSection from '@/components/homepage/HowItWorksSection';
import CTASection from '@/components/homepage/CTASection';

export default async function HomePage() {
  const supabase = createServerSupabase();

  // Fetch active formations
  const { data: formations, error } = await supabase
    .from('formations')
    .select('id, nom, type_concours, prix, description, actif')
    .eq('actif', true)
    .order('prix', { ascending: false });

  if (error) {
    console.error('Error fetching formations:', error);
    // We'll still render the page but formations sections will handle empty state
  }

  return (
    <>
      <Hero />
      {/* We'll pass formations as props to sections that need them */}
      <CategoriesSection />
      <FeaturedFormationsSection formations={formations ?? []} />
      <WhySection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}