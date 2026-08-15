import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Client "identité" — respecte la session de l'utilisateur connecté et donc
// les policies RLS (utilisé dans les Server Components et routes protégées).
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
