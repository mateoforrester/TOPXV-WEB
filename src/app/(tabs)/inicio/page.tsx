'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  getRanking, getFechas, getEstadoVentanaFecha, getRankingFecha,
  getFixture, getMejorXVGeneralSlots, ultimaFechaCompletada, proximaFecha,
  type MejorXVSlot, type EstadoVentanaFecha,
} from '@/services/api';
import { RankingUsuario, Fecha, Partido, Club } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { AnimatedCard } from '@/components/AnimatedCard';
import { LoadingView } from '@/components/LoadingView';
import {
  ChevronRight, Shirt, Calendar, Trophy, X, RotateCcw,
} from 'lucide-react';
import { withTimeout } from '@/utils/withTimeout';

function ClubLogo({ club, size = 28 }: { club: Club; size?: number }) {
  const [err, setErr] = useState(false);
  if (club.logo_url && !err) {
    return (
      <img
        src={club.logo_url}
        alt={club.nombre}
        width={size}
        height={size}
        className="rounded-lg object-contain w-full h-full"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="bg-azul rounded-lg flex items-center justify-center border border-white/25"
      style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>
        {(club.nombre || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function FixtureLine({ partido }: { partido: Partido }) {
  const local = partido.club_local ?? { id: partido.club_local_id, nombre: 'Local' };
  const visit = partido.club_visitante ?? { id: partido.club_visitante_id, nombre: 'Visitante' };
  return (
    <div className="flex items-center py-1.5 px-2 rounded-lg bg-white/[0.04] mb-2">
      <div className="flex-1 flex flex-col items-center">
        <ClubLogo club={local} />
        <span className="text-[11px] font-semibold text-white/90 mt-1 text-center truncate max-w-[80px]">
          {local.nombre}
        </span>
      </div>
      <span className="text-xs font-bold text-white/50 mx-2">vs</span>
      <div className="flex-1 flex flex-col items-center">
        <ClubLogo club={visit} />
        <span className="text-[11px] font-semibold text-white/90 mt-1 text-center truncate max-w-[80px]">
          {visit.nombre}
        </span>
      </div>
    </div>
  );
}

export default function InicioPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [ranking, setRanking] = useState<RankingUsuario[]>([]);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [estadoVentana, setEstadoVentana] = useState<EstadoVentanaFecha | null>(null);
  const [ganadorUltima, setGanadorUltima] = useState<RankingUsuario | null>(null);
  const [miPtsUltimaFecha, setMiPtsUltimaFecha] = useState<number | null>(null);
  const [fixtureProxima, setFixtureProxima] = useState<Partido[]>([]);
  const [mejorXVGeneral, setMejorXVGeneral] = useState<MejorXVSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMejorXV, setShowMejorXV] = useState(false);

  const ultimaFecha = ultimaFechaCompletada(fechas);
  const proxima = proximaFecha(fechas, estadoVentana ?? { estado: 'sin_ventana' });

  useEffect(() => { loadData(); }, [usuario?.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rankingData, fechasData, estado] = await withTimeout(Promise.all([
        getRanking(), getFechas(), getEstadoVentanaFecha(),
      ]), 20000);
      setRanking(rankingData); setFechas(fechasData); setEstadoVentana(estado);
      const ultima = ultimaFechaCompletada(fechasData);
      const prox = proximaFecha(fechasData, estado);
      const rfPromise = ultima?.id
        ? withTimeout(getRankingFecha(ultima.id), 15000)
        : Promise.resolve([] as Awaited<ReturnType<typeof getRankingFecha>>);
      const mejorXVPromise = withTimeout(getMejorXVGeneralSlots(), 15000);
      const fixturePromise = prox?.id
        ? withTimeout(getFixture(prox.id), 15000)
        : Promise.resolve([] as Partido[]);
      const [rf, mejorXV, fixtureProx] = await Promise.all([rfPromise, mejorXVPromise, fixturePromise]);
      if (ultima?.id && rf.length) {
        setGanadorUltima(rf[0] ?? null);
        if (usuario?.id) {
          const mi = rf.find(r => r.usuario_id === usuario.id);
          setMiPtsUltimaFecha(mi?.puntos_fecha ?? null);
        } else {
          setMiPtsUltimaFecha(null);
        }
      } else {
        setGanadorUltima(null);
        setMiPtsUltimaFecha(null);
      }
      setMejorXVGeneral(mejorXV);
      if (prox?.id) setFixtureProxima(fixtureProx);
    } catch (e) {
      console.error('Error loading home:', e);
      setError(e instanceof Error ? e.message : 'Error al cargar. Reintenta.');
    } finally { setLoading(false); }
  };

  const miIdx = ranking.findIndex(r => r.usuario_id === usuario?.id);
  const miPts = miIdx >= 0 ? ranking[miIdx]?.puntos_totales ?? 0 : 0;

  return (
    <TabScreen title={`Hola, ${usuario?.nombre ?? 'Usuario'}!`}>
      {loading ? <LoadingView /> : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-white/80 text-center max-w-sm">{error}</p>
          <button onClick={() => loadData()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-oro/80 hover:bg-oro text-bordo-dark font-semibold transition-colors">
            <RotateCcw size={18} />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-6 w-full">
          {/* Hero - Tu resumen */}
          <AnimatedCard>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] overflow-hidden shadow-lg">
              <div className="h-[3px] bg-oro" />
              <div className="flex items-center">
                <div className="flex-1 text-center py-5">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Tu posicion</p>
                  <p className="text-4xl font-extrabold text-oro">#{miIdx >= 0 ? miIdx + 1 : '-'}</p>
                  <p className="text-xs text-white/50 mt-1">{ranking.length > 0 ? `de ${ranking.length}` : ''}</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="flex-1 text-center py-5">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Puntos totales</p>
                  <p className="text-3xl font-bold text-white">{miPts}</p>
                  <p className="text-xs text-white/50 mt-1">pts</p>
                </div>
              </div>
              <button onClick={() => router.push('/ranking')}
                className="flex items-center justify-center gap-1.5 py-3 border-t border-white/10 w-full hover:bg-white/5 transition-colors">
                <span className="text-sm font-semibold text-oro">Ver ranking completo</span>
                <ChevronRight size={16} className="text-oro" />
              </button>
            </div>
          </AnimatedCard>

          {/* CTA - Arma tu equipo */}
          <div>
            <h3 className="flex items-center gap-2 text-white/90 font-semibold text-base mb-3">
              <Calendar size={18} className="text-oro" /> Proxima fecha
            </h3>
            <AnimatedCard delay={0.1}>
              <button onClick={() => router.push('/mi-equipo')}
                className="w-full rounded-3xl border border-oro/30 bg-oro/[0.08] overflow-hidden shadow-lg text-left hover:bg-oro/[0.12] transition-colors">
                <div className="h-[3px] bg-oro" />
                <div className="flex items-center p-5 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-oro/25 flex items-center justify-center">
                    <Shirt size={28} className="text-oro" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-oro">Arma tu equipo</p>
                    <p className="text-sm text-white/60 mt-0.5">15 jugadores, capitan y pateador</p>
                  </div>
                  <ChevronRight size={22} className="text-oro" />
                </div>
              </button>
            </AnimatedCard>
          </div>

          {/* Fixture proxima */}
          {proxima && (
            <AnimatedCard delay={0.15}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] overflow-hidden shadow-lg">
                <div className="h-[3px] bg-oro" />
                <div className="p-5">
                  <h4 className="text-sm font-bold text-white/90 mb-3">Fixture Fecha {proxima.numero}</h4>
                  {fixtureProxima.length > 0 ? (
                    <>
                      {fixtureProxima.slice(0, 3).map(p => <FixtureLine key={p.id} partido={p} />)}
                      <button onClick={() => router.push('/fixture')}
                        className="flex items-center gap-1.5 mt-2 hover:opacity-80">
                        <span className="text-sm font-semibold text-oro">Ver fixture</span>
                        <ChevronRight size={14} className="text-oro" />
                      </button>
                    </>
                  ) : <p className="text-sm text-white/50 italic">Proximamente</p>}
                </div>
              </div>
            </AnimatedCard>
          )}

          {/* Ultima fecha: ganador + mejor XV */}
          {(ultimaFecha || ganadorUltima || mejorXVGeneral.length > 0) && (
            <div>
              <h3 className="flex items-center gap-2 text-white/90 font-semibold text-base mb-3">
                <Trophy size={18} className="text-oro" /> Ultima fecha
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {ultimaFecha && (
                  <AnimatedCard delay={0.2}>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.06] overflow-hidden shadow-lg">
                      <div className="h-[3px] bg-oro" />
                      <div className="p-5">
                        <h4 className="text-sm font-bold text-white/90 mb-2">Ganador</h4>
                        {ganadorUltima ? (
                          <>
                            <p className="text-base font-semibold text-white/90">
                              {ganadorUltima.usuario?.nombre ?? '-'}
                              {ganadorUltima.usuario?.apellido ? ` ${ganadorUltima.usuario.apellido}` : ''}
                            </p>
                            <p className="text-sm font-bold text-oro mt-1">
                              {ganadorUltima.puntos_fecha ?? ganadorUltima.puntos_totales} pts
                            </p>
                          </>
                        ) : <p className="text-sm text-white/50 italic">Aun no hay resultados</p>}
                      </div>
                    </div>
                  </AnimatedCard>
                )}
                {ultimaFecha && miPtsUltimaFecha != null && (
                  <AnimatedCard delay={0.22}>
                    <button
                      onClick={() => router.push(`/mi-equipo?fecha=${ultimaFecha.id}`)}
                      className="w-full text-left rounded-3xl border border-white/10 bg-white/[0.06] overflow-hidden shadow-lg hover:bg-white/[0.1] transition-colors"
                    >
                      <div className="h-[3px] bg-oro" />
                      <div className="p-5 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white/90 mb-2">
                            Tus puntos en Fecha {ultimaFecha.numero}
                          </h4>
                          <p className="text-xs text-white/60">Ver detalle</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-oro">
                            {miPtsUltimaFecha} pts
                          </span>
                          <ChevronRight size={18} className="text-oro" />
                        </div>
                      </div>
                    </button>
                  </AnimatedCard>
                )}
                {mejorXVGeneral.length > 0 && (
                  <AnimatedCard delay={0.25}>
                    <button onClick={() => setShowMejorXV(true)}
                      className="w-full text-left rounded-3xl border border-white/10 bg-white/[0.06] overflow-hidden shadow-lg hover:bg-white/[0.1] transition-colors">
                      <div className="h-[3px] bg-oro" />
                      <div className="p-5">
                        <h4 className="text-sm font-bold text-white/90 mb-2">Mejor XV</h4>
                        <p className="text-xs text-white/60">Mejor XV general del torneo</p>
                        <p className="text-sm font-semibold text-oro mt-2">Ver detalle &rarr;</p>
                      </div>
                    </button>
                  </AnimatedCard>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Mejor XV */}
      <AnimatePresence>
        {showMejorXV && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMejorXV(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-bordo-dark rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-oro/25">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-xl font-bold text-oro">
                  Mejor XV general
                </h2>
                <button onClick={() => setShowMejorXV(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh] p-5 space-y-0">
                {mejorXVGeneral.length === 0 && (
                  <p className="text-sm text-white/60 italic">Todavia no hay datos para calcular el Mejor XV general.</p>
                )}
                {mejorXVGeneral.map((slot) => (
                  <div key={slot.slot_numero} className="py-3 border-b border-white/[0.06]">
                    <p className="text-xs font-bold text-oro mb-2">
                      {slot.slot_numero} - {slot.slot_nombre}
                    </p>
                    {slot.jugadores.length === 0 ? (
                      <p className="text-xs text-white/45 italic">Sin datos</p>
                    ) : (
                      <div className="space-y-2">
                        {slot.jugadores.map((j) => (
                          <div key={`${slot.slot_numero}-${j.jugador_id}`} className="flex items-center">
                            <div className="w-8 h-8 rounded-lg overflow-hidden mr-3 shrink-0">
                              <ClubLogo club={{ id: j.club_id, nombre: j.club_nombre, logo_url: j.club_logo_url }} size={32} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white/90">{j.apellido}, {j.nombre}</p>
                            </div>
                            <span className="text-sm font-bold text-oro">{j.puntos_totales} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TabScreen>
  );
}
