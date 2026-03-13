'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { User } from '@supabase/supabase-js';
import { Usuario } from '@/types';
import { getCurrentUser, ensureUserProfile } from '@/services/api';
import { withTimeout } from '@/utils/withTimeout';

const AUTH_TIMEOUT_MS = 15000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      let profile = await withTimeout(getCurrentUser(), AUTH_TIMEOUT_MS);
      if (!profile) {
        try {
          await withTimeout(ensureUserProfile(
            authUser.id,
            authUser.email ?? '',
            authUser.user_metadata?.nombre ?? authUser.user_metadata?.full_name ?? undefined
          ), AUTH_TIMEOUT_MS);
          profile = await withTimeout(getCurrentUser(), AUTH_TIMEOUT_MS);
        } catch (e) {
          console.error('Error ensuring user profile:', e);
        }
      }
      setUsuario(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS)
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth getSession error:', err);
        setUser(null);
        setUsuario(null);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUsuario(null);
            setLoading(false);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setUser(null);
          setUsuario(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (
    email: string,
    password: string,
    nombre: string,
    opts?: { apellido?: string; club_id?: string; nombre_equipo?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
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
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refetchUser = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await loadUserProfile(u);
  };

  return { user, usuario, loading, signIn, signUp, signOut, refetchUser };
}
