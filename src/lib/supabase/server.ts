import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Types for our mock data (matching client.ts)
type MockFormation = {
  id: string;
  nom: string;
  type_concours: string;
  prix: number;
  description?: string;
};

type MockProfile = {
  id: string;
  nom: string;
  prenom: string;
};

type MockEnrollment = {
  id: string;
  statut: string;
  created_at: string;
  formations: { nom: string; prix: number } | { nom: string; prix: number }[] | null;
};

// Client "identité" — respecte la session de l'utilisateur connecté et donc
// les policies RLS (utilisé dans les Server Components et routes protégées).
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieStore = cookies();

  // Si les variables d'environnement ne sont pas définies (ex: lors du build sans configuration),
  // retourner un client qui ne fait rien pour éviter les erreurs de build
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
                            { id: '1', nom: 'Formation JavaScript', type_concours: 'Développement Web', prix: 50000, description: 'Maîtrisez JavaScript et les frameworks modernes' },
                            { id: '2', nom: 'Formation Python', type_concours: 'Data Science', prix: 75000, description: 'Devenez expert en analyse de données et machine learning' },
                            { id: '3', nom: 'Formation DevOps', type_concours: 'Infrastructure', prix: 60000, description: 'Automatisez le déploiement et la gestion de l infrastructure' }
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
        } else if (table === 'enrollments') {
          // Mock for enrollments table
          return {
            select: (columns: string) => {
              return {
                order: (column: string, options: { ascending: boolean }) => {
                  return {
                    then: (callback: (result: { data: MockEnrollment[] | null }) => void) => {
                      // Retourner des données d'exemple pour les inscriptions
                      const mockData: MockEnrollment[] = [
                        {
                          id: 'enr1',
                          statut: 'paye',
                          created_at: new Date().toISOString(),
                          formations: { nom: 'Formation JavaScript', prix: 50000 }
                        },
                        {
                          id: 'enr2',
                          statut: 'en_attente',
                          created_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
                          formations: { nom: 'Formation Python', prix: 75000 }
                        }
                      ];
                      callback({ data: mockData });
                      return Promise.resolve({ data: mockData });
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
                            { id: '1', nom: 'Formation JavaScript', type_concours: 'Développement Web', prix: 50000, description: 'Maîtrisez JavaScript et les frameworks modernes' },
                            { id: '2', nom: 'Formation Python', type_concours: 'Data Science', prix: 75000, description: 'Devenez expert en analyse de données et machine learning' },
                            { id: '3', nom: 'Formation DevOps', type_concours: 'Infrastructure', prix: 60000, description: 'Automatisez le déploiement et la gestion de l infrastructure' }
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
        } else if (table === 'enrollments') {
          // Mock for enrollments table
          return {
            select: (columns: string) => {
              return {
                order: (column: string, options: { ascending: boolean }) => {
                  return {
                    then: (callback: (result: { data: MockEnrollment[] | null }) => void) => {
                      // Retourner des données d'exemple pour les inscriptions
                      const mockData: MockEnrollment[] = [
                        {
                          id: 'enr1',
                          statut: 'paye',
                          created_at: new Date().toISOString(),
                          formations: { nom: 'Formation JavaScript', prix: 50000 }
                        },
                        {
                          id: 'enr2',
                          statut: 'en_attente',
                          created_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
                          formations: { nom: 'Formation Python', prix: 75000 }
                        }
                      ];
                      callback({ data: mockData });
                      return Promise.resolve({ data: mockData });
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

  return createBaseClient(
    supabaseUrl!,
    supabaseServiceRoleKey!,
    { auth: { persistSession: false } }
  );
}