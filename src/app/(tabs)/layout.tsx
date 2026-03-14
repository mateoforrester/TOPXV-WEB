'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bordo-dark">
        <div className="animate-spin h-8 w-8 border-4 border-oro border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen h-dvh">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-bordo-deep to-bordo-dark pt-14 lg:pt-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
