'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { TabScreen } from '@/components/TabScreen';
import { AnimatedCard } from '@/components/AnimatedCard';
import {
  Heart, Shirt, Trophy, HelpCircle, ClipboardList,
  LogOut, ChevronRight, Camera,
} from 'lucide-react';

function OptionRow({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 px-5 py-4 w-full text-left border-b border-white/[0.06] last:border-b-0 hover:bg-white/5 transition-colors"
    >
      <Icon size={20} className="text-white/70" />
      <span className="flex-1 text-sm font-medium text-white/90">{label}</span>
      <ChevronRight size={16} className="text-white/40" />
    </motion.button>
  );
}

export default function MasPage() {
  const { usuario, user, signOut } = useAuth();
  const router = useRouter();

  const displayName = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email
    : user?.email ?? 'Usuario';

  const handleLogout = () => {
    if (confirm('¿Estas seguro de que queres cerrar sesion?')) {
      signOut().catch(console.error);
    }
  };

  return (
    <TabScreen title="Mas">
      <div className="space-y-4 w-full">
        <AnimatedCard>
          <button
            onClick={() => router.push('/mis-datos')}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden hover:bg-white/[0.1] transition-colors"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="relative">
                {usuario?.avatar_url ? (
                  <Image src={usuario.avatar_url} alt="Avatar" width={64} height={64}
                    className="rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-oro/25 border-2 border-oro/50 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-lg font-semibold text-white/95 truncate">{displayName}</p>
                <p className="text-sm text-white/60">Mis datos</p>
              </div>
              <ChevronRight size={20} className="text-white/50" />
            </div>
          </button>
        </AnimatedCard>

        <AnimatedCard delay={0.05}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden">
            <OptionRow icon={Heart} label="Favoritos" onClick={() => {}} />
            <OptionRow icon={Shirt} label="Mi equipo" onClick={() => router.push('/mi-equipo')} />
            <OptionRow icon={Trophy} label="Ranking y puntos" onClick={() => router.push('/ranking')} />
          </div>
        </AnimatedCard>

        {usuario?.rol === 'admin' && (
          <AnimatedCard delay={0.1}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden">
              <OptionRow icon={ClipboardList} label="Cargar puntajes (admin)" onClick={() => router.push('/admin-puntajes')} />
            </div>
          </AnimatedCard>
        )}

        <AnimatedCard delay={0.15}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden">
            <OptionRow icon={HelpCircle} label="Ayuda" onClick={() => router.push('/ayuda')} />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-azul to-[#162d6b] text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
            <LogOut size={20} />
            <span>Cerrar sesion</span>
          </button>
        </AnimatedCard>

        <div className="flex flex-col items-center pt-6 pb-4 opacity-80">
          <div className="relative w-28 h-16">
            <Image src="/logo1.png" alt="TOP XV" fill className="object-contain" sizes="112px" />
          </div>
          <p className="text-xs text-white/50 font-semibold tracking-wider mt-1">TOP XV</p>
        </div>
      </div>
    </TabScreen>
  );
}
