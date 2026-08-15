import { createBrowserClient } from "@supabase/ssr";

// Utilisé dans les composants client ("use client"). Repose sur la clé anon
// + Row Level Security : un utilisateur ne peut jamais lire/écrire au-delà
// de ce que les policies SQL autorisent, même si ce code était manipulé.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
