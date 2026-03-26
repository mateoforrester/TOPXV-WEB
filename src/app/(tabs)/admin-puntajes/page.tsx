'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getFechas, getFixture } from '@/services/api';
import { Fecha, Partido, Club } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { withTimeout } from '@/utils/withTimeout';

const API_TIMEOUT_MS = 20000;

function ClubLogo({ club, size = 44 }: { club: Club; size?: number }) {
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
    <div
      className="bg-azul rounded-lg flex items-center justify-center border border-white/30 text-white font-bold"
      style={{ width: size, height: size }}
    >
      {(club.nombre || '?').charAt(0).toUpperCase()}
    </div>
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

  const isAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/inicio');
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await withTimeout(getFechas(), API_TIMEOUT_MS);
        setFechas(data);
        setFechaSel((prev) => prev ?? data[0] ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar las fechas.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin || !fechaSel) return;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await withTimeout(getFixture(fechaSel.id), API_TIMEOUT_MS);
        setPartidos(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos.');
        setPartidos([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [authLoading, isAdmin, fechaSel]);

  const fechaPills = useMemo(
    () =>
      fechas.map((f) => (
        <button
          key={f.id}
          onClick={() => setFechaSel(f)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
            fechaSel?.id === f.id
              ? 'bg-oro/25 border-oro text-oro'
              : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
          }`}
        >
          Fecha {f.numero}
        </button>
      )),
    [fechas, fechaSel?.id]
  );

  if (authLoading || (!isAdmin && !error)) {
    return (
      <TabScreen title="Cargar puntajes">
        <LoadingView message="Cargando..." />
      </TabScreen>
    );
  }

  return (
    <TabScreen
      title="Cargar puntajes"
      subtitle="Selecciona un partido para cargar estadisticas por jugador"
      headerRight={<ClipboardList className="text-oro" size={20} />}
    >
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">{fechaPills}</div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-red-100 text-sm">
            <p>{error}</p>
            <button
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
              onClick={() => setFechaSel((f) => (f ? { ...f } : f))}
            >
              <RotateCcw size={14} />
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <LoadingView message="Cargando partidos..." />
        ) : (
          <div className="space-y-3">
            {partidos.map((p) => {
              const local = p.club_local ?? { id: p.club_local_id, nombre: 'Local' };
              const visitante = p.club_visitante ?? { id: p.club_visitante_id, nombre: 'Visitante' };
              const hasResult = p.puntos_local != null && p.puntos_visitante != null;
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/admin-partido/${p.id}`)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex flex-col items-center">
                      <ClubLogo club={local} />
                      <p className="text-sm text-white/90 mt-2 text-center">{local.nombre}</p>
                    </div>
                    <div className="min-w-[72px] text-center">
                      {hasResult ? (
                        <span className="text-base font-bold text-white">
                          {p.puntos_local} - {p.puntos_visitante}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-white/60">VS</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <ClubLogo club={visitante} />
                      <p className="text-sm text-white/90 mt-2 text-center">{visitante.nombre}</p>
                    </div>
                  </div>
                  <p className="text-xs text-oro mt-3 text-center font-semibold">Cargar puntajes</p>
                </button>
              );
            })}
            {partidos.length === 0 && (
              <p className="text-white/60 text-sm italic py-6 text-center">No hay partidos para esta fecha.</p>
            )}
          </div>
        )}
      </div>
    </TabScreen>
  );
}
