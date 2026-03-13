'use client';

import { useRouter } from 'next/navigation';
import { TabScreen } from '@/components/TabScreen';
import { AnimatedCard } from '@/components/AnimatedCard';
import { ArrowLeft } from 'lucide-react';
import { MAX_JUGADORES_MISMO_CLUB, MAX_CAMBIOS_POR_FECHA, HORA_BLOQUEO_VIERNES } from '@/utils/constants';

function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-oro uppercase tracking-wider mb-2">{title}</h3>
      <AnimatedCard delay={delay}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-5 space-y-3">
          {children}
        </div>
      </AnimatedCard>
    </div>
  );
}

export default function AyudaPage() {
  const router = useRouter();

  return (
    <TabScreen
      title="Como funciona?"
      headerRight={
        <button onClick={() => router.back()} className="p-2 text-oro hover:opacity-80">
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="w-full space-y-6">
        <Section title="Tu equipo" delay={0}>
          <p className="text-sm text-white/90 leading-relaxed">
            Arma tu equipo con 15 jugadores (las posiciones del rugby). Elegi un{' '}
            <strong className="text-oro">capitan</strong> y un{' '}
            <strong className="text-oro">pateador</strong> entre ellos.
          </p>
          <p className="text-sm text-white/90 leading-relaxed">
            Los puntos de tu equipo se suman segun lo que hagan tus jugadores en los partidos de cada fecha.
          </p>
        </Section>

        <Section title="Como suman puntos" delay={0.05}>
          <ul className="space-y-1 text-sm text-white/90">
            <li>• Try: 5 pts</li>
            <li>• Conversion: 2 pts</li>
            <li>• Penal: 3 pts</li>
            <li>• Drop: 3 pts</li>
            <li>• Tarjeta amarilla: -2 pts</li>
            <li>• Tarjeta roja: -5 pts</li>
            <li>• Figura del partido: puntos extra</li>
          </ul>
          <p className="text-sm text-white/90 leading-relaxed">
            Tu capitan duplica los puntos que haga ese jugador. Tu pateador suma ademas por conversiones, penales y drops que patee.
          </p>
        </Section>

        <Section title="Limites por fecha" delay={0.1}>
          <p className="text-sm text-white/90 leading-relaxed">
            Podes hacer hasta <strong className="text-oro">{MAX_CAMBIOS_POR_FECHA} cambios</strong> por fecha respecto al equipo que tenias en la fecha anterior. Si es tu primera fecha, podes elegir los 15 sin limite.
          </p>
          <p className="text-sm text-white/90 leading-relaxed">
            De un mismo club podes tener como maximo <strong className="text-oro">{MAX_JUGADORES_MISMO_CLUB} jugadores</strong> en tu equipo.
          </p>
        </Section>

        <Section title="Ventana para armar equipo" delay={0.15}>
          <p className="text-sm text-white/90 leading-relaxed">
            En cada fecha hay una ventana en la que podes armar o modificar tu equipo. Una vez que cierra (generalmente el viernes a las {HORA_BLOQUEO_VIERNES}:00), tu equipo queda fijado para esa fecha y no podes hacer mas cambios hasta la proxima.
          </p>
        </Section>
      </div>
    </TabScreen>
  );
}
