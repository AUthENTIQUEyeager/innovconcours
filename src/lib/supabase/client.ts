import { createBrowserClient } from "@supabase/ssr";

// Types for our mock data
type MockFormation = {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
};

type MockProfile = {
  id: string;
  nom: string;
  prenom: string;
};

// Utilisé dans les composants client ("use client"). Repose sur la clé anon
// + Row Level Security : un utilisateur ne peut jamais lire/écrire au-delà
// de ce que les policies SQL autorisent, même si ce code était manipulé.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si les variables d'environnement ne sont pas définies (ex: lors du build sans configuration),
  // retourner un client mock pour éviter les erreurs de build et permettre de voir le frontend
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    // Retourner un mock client avec des données d'exemple
    return {
      auth: {
        signIn: () => Promise.reject(new Error('Supabase not configured')),
        signUp: () => Promise.reject(new Error('Supabase not configured')),
        signOut: () => Promise.resolve(),
        session: { data: { session: null }, error: null },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
      },
      from: (table: string) => {
        // Retourner un objet query builder mock selon la table
        if (table === 'formations') {
          // Typed mock for formations table
          return {
            select: (columns: string) => {
              return {
                eq: (column: string, value: any) => {
                  return {
                    order: (column: string, options: { ascending: boolean }) => {
                      return {
                        then: (callback: (result: { data: MockFormation[] | null }) => void) => {
                          // Retourner des données d'exemple pour les formations
                          const mockData: MockFormation[] = [
                            { id: '1', nom: 'Formation JavaScript', type_concours: 'Développement Web', prix: 50000 },
                            { id: '2', nom: 'Formation Python', type_concours: 'Data Science', prix: 75000 },
                            { id: '3', nom: 'Formation DevOps', type_concours: 'Infrastructure', prix: 60000 }
                          ];
                          callback({ data: mockData });
                          return Promise.resolve({ data: mockData });
                        }
                      };
                    }
                  };
                }
              };
            }
          } as any;
        } else if (table === 'profiles') {
          // Mock for profiles table
          return {
            select: (columns: string) => {
              return {
                eq: (column: string, value: any) => {
                  return {
                    single: () => {
                      return Promise.resolve({
                        data: {
                          id: '1',
                          nom: 'Doe',
                          prenom: 'John'
                        } as MockProfile | null,
                        error: null
                      });
                    }
                  };
                }
              };
            }
          } as any;
        } else {
          // Generic mock for other tables
          return {
            select: (columns: string) => {
              return {
                eq: (column: string, value: any) => {
                  return {
                    single: () => {
                      return Promise.resolve({ data: null, error: null });
                    }
                  };
                }
              };
            }
          } as any;
        }
      }
    } as any;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}