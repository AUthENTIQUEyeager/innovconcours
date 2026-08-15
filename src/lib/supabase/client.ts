import { createBrowserClient } from "@supabase/ssr";

// Utilisé dans les composants client ("use client"). Repose sur la clé anon
// + Row Level Security : un utilisateur ne peut jamais lire/écrire au-delà
// de ce que les policies SQL autorisent, même si ce code était manipulé.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si les variables d'environnement ne sont pas définies (ex: lors du build sans configuration),
  // retourner un client qui ne fait rien pour éviter les erreurs de build
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    // Retourner un mock client qui ne fait rien
    return {
      auth: {
        signIn: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.resolve(),
        session: { data: { session: null }, error: null },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        }),
        insert: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        }),
        update: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        }),
        delete: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      })
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}