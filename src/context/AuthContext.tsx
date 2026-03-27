'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/services/supabase';
import type { User } from '@supabase/supabase-js';
import type { Usuario } from '@/types';
import { getCurrentUser, ensureUserProfile } from '@/services/api';
import { withTimeout } from '@/utils/withTimeout';

const AUTH_TIMEOUT_MS = 15000;

type AuthContextValue = {
  user: User | null;
  usuario: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    nombre: string,
    opts?: { apellido?: string; club_id?: string; nombre_equipo?: string }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const loadSeq = useRef(0);

  const loadUserProfile = useCallback(async (authUser: User, seq: number) => {
    try {
      let profile = await withTimeout(getCurrentUser(), AUTH_TIMEOUT_MS);
      if (seq !== loadSeq.current) return;
      if (!profile) {
        try {
          await withTimeout(
            ensureUserProfile(
              authUser.id,
              authUser.email ?? '',
              authUser.user_metadata?.nombre ?? authUser.user_metadata?.full_name ?? undefined
            ),
            AUTH_TIMEOUT_MS
          );
          if (seq !== loadSeq.current) return;
          profile = await withTimeout(getCurrentUser(), AUTH_TIMEOUT_MS);
        } catch (e) {
          console.error('Error ensuring user profile:', e);
        }
      }
      if (seq !== loadSeq.current) return;
      setUsuario(profile);
    } catch (error) {
      if (seq === loadSeq.current) {
        console.error('Error loading user profile:', error);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          const seq = ++loadSeq.current;
          setLoading(true);
          await loadUserProfile(session.user, seq);
        } else {
          setUsuario(null);
        }
      } catch (err) {
        console.error('Auth getSession error:', err);
        if (mounted) {
          setUser(null);
          setUsuario(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;

      const u = session?.user ?? null;
      setUser(u);

      if (!u) {
        loadSeq.current += 1;
        setUsuario(null);
        setLoading(false);
        return;
      }

      const seq = ++loadSeq.current;
      setLoading(true);
      try {
        await loadUserProfile(u, seq);
      } finally {
        if (mounted && seq === loadSeq.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      nombre: string,
      opts?: { apellido?: string; club_id?: string; nombre_equipo?: string }
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            apellido: opts?.apellido?.trim() ?? '',
            club_id: opts?.club_id ?? '',
            nombre_equipo: opts?.nombre_equipo?.trim() ?? '',
          },
        },
      });
      if (error) throw error;
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refetchUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      await loadUserProfile(u, seq);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [loadUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      usuario,
      loading,
      signIn,
      signUp,
      signOut,
      refetchUser,
    }),
    [user, usuario, loading, signIn, signUp, signOut, refetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
