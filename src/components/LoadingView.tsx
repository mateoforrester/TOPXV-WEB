'use client';

import { Loader2 } from 'lucide-react';

export function LoadingView({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 size={32} className="animate-spin text-oro" />
      <p className="text-white/60 text-base">{message}</p>
    </div>
  );
}
