'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/inicio' : '/login');
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bordo-dark">
      <div className="animate-spin h-8 w-8 border-4 border-oro border-t-transparent rounded-full" />
    </div>
  );
}
