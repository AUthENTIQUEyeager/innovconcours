import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Client "identité" — respecte la session de l'utilisateur connecté et donc
// les policies RLS (utilisé dans les Server Components et routes protégées).
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = cookies();

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
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
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
      }) as any
    };
  }

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

// Client "admin" — clé service_role, CONTOURNE Row Level Security.
// À utiliser UNIQUEMENT côté serveur (routes /api), jamais exposé au navigateur,
// et uniquement pour les écritures qui doivent être protégées de toute
// manipulation client : création d'enrollment (prix fixé côté serveur),
// écriture des paiements confirmés par FusionPay.
export function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Si les variables d'environnement ne sont pas définies (ex: lors du build sans configuration),
  // retourner un client qui ne fait rien pour éviter les erreurs de build
  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseUrl.includes('placeholder') || supabaseServiceRoleKey.includes('placeholder')) {
    // Retourner un mock client qui ne fait rien
    return {
      auth: {
        signIn: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.resolve(),
        session: { data: { session: null }, error: null },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
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
      }) as any
    };
  }

  return createBaseClient(
    supabaseUrl!,
    supabaseServiceRoleKey!,
    { auth: { persistSession: false } }
  );
}