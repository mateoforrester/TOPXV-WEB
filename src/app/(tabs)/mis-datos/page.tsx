'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar } from '@/services/api';
import { TabScreen } from '@/components/TabScreen';
import { AnimatedCard } from '@/components/AnimatedCard';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';

export default function MisDatosPage() {
  const router = useRouter();
  const { usuario, refetchUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email
    : 'Usuario';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario?.id) return;

    setUploading(true);
    try {
      await uploadAvatar(usuario.id, file);
      await refetchUser();
      alert('Tu foto de perfil se actualizo.');
    } catch (err) {
      console.error(err);
      alert('No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <TabScreen
      title="Mis datos"
      headerRight={
        <button onClick={() => router.back()} className="p-2 text-oro hover:opacity-80">
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="w-full space-y-6">
        <AnimatedCard>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 flex flex-col items-center">
            <button
              onClick={() => !uploading && fileRef.current?.click()}
              className="relative group mb-3"
              disabled={uploading}
            >
              {usuario?.avatar_url ? (
                <Image src={usuario.avatar_url} alt="Avatar" width={120} height={120}
                  className="rounded-full object-cover" />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-oro/25 border-2 border-oro/40 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 size={32} className="text-white animate-spin" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-oro/40 border border-oro/60 flex items-center justify-center group-hover:bg-oro/60 transition-colors">
                <Camera size={18} className="text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <p className="text-sm text-white/60 mb-6">Hace clic en la foto para cambiarla</p>

            <div className="w-full space-y-4">
              {[
                { label: 'Nombre', value: usuario?.nombre },
                { label: 'Apellido', value: usuario?.apellido },
                { label: 'Email', value: usuario?.email },
                ...(usuario?.nombre_equipo ? [{ label: 'Nombre del equipo', value: usuario.nombre_equipo }] : []),
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-white/60 mb-1">{f.label}</p>
                  <p className="text-base font-medium text-white/95">{f.value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <button
            onClick={() => !uploading && fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-bordo text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Camera size={20} />
            <span>{uploading ? 'Subiendo...' : 'Cambiar foto de perfil'}</span>
          </button>
        </AnimatedCard>
      </div>
    </TabScreen>
  );
}
