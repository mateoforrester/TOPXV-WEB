'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getFechas, getFixture } from '@/services/api';
import { Fecha, Partido, Club } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { AnimatedCard } from '@/components/AnimatedCard';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { withTimeout } from '@/utils/withTimeout';

function ClubLogo({ club, size = 40 }: { club: Club; size?: number }) {
  const [err, setErr] = useState(false);
  if (club.logo_url && !err) {
    return (
      <img
        src={club.logo_url}
        alt={club.nombre}
        width={size}
        height={size}
        className="rounded-lg object-contain"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="bg-azul rounded-lg flex items-center justify-center border border-white/25"
      style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.45 }}>
        {(club.nombre || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function PartidoCard({ partido, onCargar }: { partido: Partido; onCargar: (p: Partido) => void }) {
  const local = partido.club_local ?? { id: partido.club_local_id, nombre: 'Local' };
  const visit = partido.club_visitante ?? { id: partido.club_visitante_id, nombre: 'Visitante' };
  const tieneResultado = partido.puntos_local != null && partido.puntos_visitante != null;

  return (
    <button onClick={() => onCargar(partido)}
      className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-4 mb-3 hover:bg-white/[0.1] transition-colors text-left">
      <div className="flex items-center justify-between">
        <div className="flex-1 flex flex-col items-center">
          <ClubLogo club={local} />
          <span className="text-xs font-semibold text-white/90 mt-1 text-center truncate max-w-[90px]">{local.nombre}</span>
        </div>
        <div className="px-3">
          {tieneResultado ? (
            <span className="text-lg font-bold text-white/95">{partido.puntos_local} - {partido.puntos_visitante}</span>
          ) : (
            <span className="text-sm font-medium text-white/60">VS</span>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center">
          <ClubLogo club={visit} />
          <span className="text-xs font-semibold text-white/90 mt-1 text-center truncate max-w-[90px]">{visit.nombre}</span>
        </div>
      </div>
      <p className="text-xs text-azul text-center mt-2 font-medium">Cargar puntajes</p>
    </button>
  );
}

export default function AdminPuntajesPage() {
  const router = useRouter();
  const { usuario, loading: authLoading } = useAuth();
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [fechaSel, setFechaSel] = useState<Fecha | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_TIMEOUT_MS = 20000;

  const loadFechas = useCallback(async () => {
    try {
      const data = await withTimeout(getFechas(), API_TIMEOUT_MS);
      setFechas(data);
      setFechaSel(prev => prev ?? data[0] ?? null);
      return data;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error al cargar fechas. Reintenta.');
      return [];
    }
  }, []);

  const loadPartidos = useCallback(async (fecha?: Fecha | null) => {
    const f = fecha ?? fechaSel;
    if (!f) {
      setPartidos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await withTimeout(getFixture(f.id), API_TIMEOUT_MS);
      setPartidos(data);
    } catch (e) {
      console.error(e);
      setPartidos([]);
      setError(e instanceof Error ? e.message : 'Error al cargar partidos. Reintenta.');
    } finally {
      setLoading(false);
    }
  }, [fechaSel]);

  const handleRetry = useCallback(async () => {
    setError(null);
    const data = await loadFechas();
    const sel = data?.[0] ?? fechaSel;
    if (sel) await loadPartidos(sel);
  }, [loadFechas, loadPartidos, fechaSel]);

  useEffect(() => { loadFechas(); }, [loadFechas]);
  useEffect(() => { loadPartidos(); }, [loadPartidos]);

  if (authLoading) return <TabScreen title="Cargar puntajes"><LoadingView /></TabScreen>;
  if (!authLoading && usuario?.rol !== 'admin') { redirect('/inicio'); }

  return (
    <TabScreen
      title="Cargar puntajes"
      headerRight={
        <button onClick={() => router.back()} className="p-2 text-oro hover:opacity-80">
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="w-full">
        <div className="pb-4 mb-4 border-b border-white/10">
          <p className="text-xs text-white/60 mb-2">Fecha</p>
          <div className="flex gap-2 flex-wrap">
            {fechas.map(f => (
              <button key={f.id} onClick={() => setFechaSel(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  fechaSel?.id === f.id
                    ? 'bg-oro/30 border border-oro text-oro'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}>
                {f.numero}
              </button>
            ))}
          </div>
        </div>

        {loading ? <LoadingView /> : (
          <div>
            <h3 className="text-sm font-bold text-oro uppercase tracking-wider mb-3">Partidos</h3>
            {partidos.map((p, i) => (
              <AnimatedCard key={p.id} delay={i * 0.03}>
                <PartidoCard partido={p} onCargar={(partido) => router.push(`/admin-partido?id=${partido.id}`)} />
              </AnimatedCard>
            ))}
            {partidos.length === 0 && (
              <p className="text-sm text-white/50 italic">No hay partidos para esta fecha.</p>
            )}
          </div>
        )}
      </div>
    </TabScreen>
  );
}
