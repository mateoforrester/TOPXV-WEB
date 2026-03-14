'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  getEstadoVentanaFecha, getFechaPorNumero, getEquipoFecha,
  saveEquipoFecha, getJugadoresByIds,
} from '@/services/api';
import { Fecha, EquipoFecha, JugadorPosicion, Jugador } from '@/types';
import { NOMBRES_POSICIONES, MAX_CAMBIOS_POR_FECHA, MAX_JUGADORES_MISMO_CLUB } from '@/utils/constants';
import RugbyField from '@/components/RugbyField';
import PlayerModal from '@/components/PlayerModal';
import { LoadingView } from '@/components/LoadingView';
import Image from 'next/image';
import { Loader2, X, RotateCcw } from 'lucide-react';
import { withTimeout } from '@/utils/withTimeout';

const API_TIMEOUT_MS = 20000;

const initialJugadores: JugadorPosicion[] = Array.from({ length: 15 }, (_, i) => ({
  posicion: i + 1, jugador_id: '',
}));

function normalizarJugadores(raw: { posicion: number | string; jugador_id?: string | null }[]): JugadorPosicion[] {
  return (raw || []).map(j => ({ posicion: Number(j.posicion), jugador_id: j.jugador_id != null ? String(j.jugador_id) : '' }));
}

function countCambios(jugadores: JugadorPosicion[], anterior: EquipoFecha | null): number {
  // Si no hay equipo anterior válido, no contamos cambios (primera vez que arma equipo)
  if (!anterior?.jugadores?.length) return 0;
  const map = new Map(anterior.jugadores.map((j: JugadorPosicion) => [j.posicion, j.jugador_id]));
  let c = 0;
  for (let pos = 1; pos <= 15; pos++) {
    if (map.get(pos) !== jugadores.find(j => j.posicion === pos)?.jugador_id) c++;
  }
  return c;
}

export default function MiEquipoPage() {
  const { user, usuario } = useAuth();
  const [fechaActiva, setFechaActiva] = useState<Fecha | null>(null);
  const [fechaEnJuegoNum, setFechaEnJuegoNum] = useState<number | null>(null);
  const [equipo, setEquipo] = useState<JugadorPosicion[]>(initialJugadores);
  const [equipoAnterior, setEquipoAnterior] = useState<EquipoFecha | null>(null);
  const [jugadoresData, setJugadoresData] = useState<Record<string, Jugador>>({});
  const [capitanId, setCapitanId] = useState<string | undefined>();
  const [pateadorId, setPateadorId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [modalCP, setModalCP] = useState<'capitan' | 'pateador' | null>(null);
  const [limitModal, setLimitModal] = useState<'club' | 'cambios' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    const uid = user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const estado = await withTimeout(getEstadoVentanaFecha(), API_TIMEOUT_MS);
      if (estado.estado === 'armar_equipo') {
        setFechaActiva(estado.fecha);
        setFechaEnJuegoNum(null);
        const fecha = estado.fecha;
        const [equipoData, fechaAnterior] = await Promise.all([
          getEquipoFecha(uid, fecha.id),
          getFechaPorNumero(fecha.numero - 1),
        ]);
        let anterior: EquipoFecha | null = null;
        if (fechaAnterior) {
          const ea = await getEquipoFecha(uid, fechaAnterior.id);
          if (ea?.jugadores?.length) anterior = { ...ea, jugadores: normalizarJugadores(ea.jugadores) };
          else anterior = ea;
        }
        setEquipoAnterior(anterior);
        const tieneActual = equipoData?.jugadores?.length && equipoData.jugadores.some((j: { jugador_id?: string | null }) => j.jugador_id);
        const raw = tieneActual
          ? normalizarJugadores(equipoData!.jugadores)
          : (anterior?.jugadores?.length ? normalizarJugadores(anterior.jugadores) : initialJugadores.map(j => ({ ...j })));
        const byPos = new Map(raw.map(j => [j.posicion, j]));
        const full: JugadorPosicion[] = [];
        for (let p = 1; p <= 15; p++) full.push(byPos.get(p) || { posicion: p, jugador_id: '' });
        setEquipo(full);
        setCapitanId((tieneActual ? equipoData?.capitan_id : anterior?.capitan_id) ?? undefined);
        setPateadorId((tieneActual ? equipoData?.pateador_id : anterior?.pateador_id) ?? undefined);
        const ids = full.map(j => j.jugador_id).filter(Boolean) as string[];
        if (ids.length > 0) {
          const data = await getJugadoresByIds(ids);
          const m: Record<string, Jugador> = {};
          data.forEach(j => { m[j.id] = j; });
          setJugadoresData(m);
        }
      } else if (estado.estado === 'fecha_en_juego') {
        setFechaActiva(null);
        setFechaEnJuegoNum(estado.numero);
        const fej = await getFechaPorNumero(estado.numero);
        if (fej) {
          const eq = await getEquipoFecha(uid, fej.id);
          const raw = eq?.jugadores?.length ? normalizarJugadores(eq.jugadores) : initialJugadores.map(j => ({ ...j }));
          const byPos = new Map(raw.map(j => [j.posicion, j]));
          const full: JugadorPosicion[] = [];
          for (let p = 1; p <= 15; p++) full.push(byPos.get(p) || { posicion: p, jugador_id: '' });
          setEquipo(full);
          setCapitanId(eq?.capitan_id ?? undefined);
          setPateadorId(eq?.pateador_id ?? undefined);
          const ids = full.map(j => j.jugador_id).filter(Boolean) as string[];
          if (ids.length > 0) {
            const data = await getJugadoresByIds(ids);
            const m: Record<string, Jugador> = {};
            data.forEach(j => { m[j.id] = j; });
            setJugadoresData(m);
          }
        }
      } else {
        setFechaActiva(null);
        setFechaEnJuegoNum(null);
      }
    } catch (e) {
      console.error('Error loading Mi Equipo:', e);
      setError(e instanceof Error ? e.message : 'Error al cargar. Reintenta.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleSelectJugador = async (jugadorId: string) => {
    if (selectedPos === null) return;
    const posicion = selectedPos;
    if (equipo.some(j => j.posicion !== posicion && j.jugador_id === jugadorId)) {
      showToast('No podes poner al mismo jugador en dos posiciones.');
      return;
    }
    const dataConNuevo = { ...jugadoresData };
    if (!dataConNuevo[jugadorId]) {
      const fetched = await getJugadoresByIds([jugadorId]);
      if (fetched[0]) dataConNuevo[jugadorId] = fetched[0];
    }
    const nuevo = equipo.map(j => j.posicion === posicion ? { ...j, jugador_id: jugadorId } : j);
    const clubCounts = new Map<string, number>();
    for (const j of nuevo) {
      if (!j.jugador_id) continue;
      const jug = dataConNuevo[j.jugador_id];
      if (jug?.club_id) clubCounts.set(jug.club_id, (clubCounts.get(jug.club_id) || 0) + 1);
    }
    if ([...clubCounts.values()].some(c => c > MAX_JUGADORES_MISMO_CLUB)) {
      setLimitModal('club');
      return;
    }
    if (equipoAnterior?.jugadores?.length) {
      const cambios = countCambios(nuevo, equipoAnterior);
      if (cambios > MAX_CAMBIOS_POR_FECHA) {
        setLimitModal('cambios');
        return;
      }
    }
    setEquipo(nuevo);
    setSelectedPos(null);
    const jugadoresFetched = await getJugadoresByIds([jugadorId]);
    if (jugadoresFetched[0]) setJugadoresData(prev => ({ ...prev, [jugadorId]: jugadoresFetched[0] }));
    await persistEquipo(nuevo, capitanId, pateadorId);
  };

  const persistEquipo = async (jugadores: JugadorPosicion[], capId?: string, patId?: string) => {
    if (!user?.id || !fechaActiva?.id) return;
    setSaving(true);
    try { await saveEquipoFecha(user.id, fechaActiva.id, jugadores, capId, patId, equipoAnterior); }
    catch (e) { console.error('Error saving:', e); showToast('No se pudo guardar el equipo.'); }
    finally { setSaving(false); }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const jugadoresDelEquipo = useMemo(() => {
    return equipo.filter(j => j.jugador_id && jugadoresData[j.jugador_id]).map(j => jugadoresData[j.jugador_id]);
  }, [equipo, jugadoresData]);

  const elegirCP = (tipo: 'capitan' | 'pateador', jugador: Jugador) => {
    if (tipo === 'capitan') { setCapitanId(jugador.id); persistEquipo(equipo, jugador.id, pateadorId); }
    else { setPateadorId(jugador.id); persistEquipo(equipo, capitanId, jugador.id); }
    setModalCP(null);
  };

  const readOnly = fechaEnJuegoNum != null;
  const subtitle = fechaActiva ? `Fecha ${fechaActiva.numero}` : fechaEnJuegoNum != null ? `Fecha ${fechaEnJuegoNum} en juego` : null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingView message="Cargando equipo..." /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-4">
        <p className="text-white/80 text-center max-w-sm">{error}</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-oro/80 hover:bg-oro text-bordo-dark font-semibold transition-colors">
          <RotateCcw size={18} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full flex flex-col">
      <div className="max-w-4xl mx-auto flex flex-col flex-1 min-h-0 w-full">
      <header className="pt-4 pb-2 px-6 text-center shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-oro">
          {fechaActiva ? 'Armá tu equipo' : fechaEnJuegoNum != null ? 'Fecha en juego' : 'Mi Equipo'}
        </h1>
        {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
        {/* Barra Capitán / Pateador como en mobile: mitad oro, mitad azul */}
        {jugadoresDelEquipo.length === 15 && (
          <div className="mt-3 max-w-sm mx-auto">
            <div className="flex items-stretch rounded-2xl overflow-hidden border border-white/15 shadow-lg text-left">
              <button
                onClick={() => !readOnly && setModalCP('capitan')}
                className={`flex-1 flex items-center gap-2 bg-oro/90 hover:bg-oro transition-colors rounded-none py-2 px-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src="/captain-band.png" alt="" width={28} height={28} className="object-contain" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-white/95 font-medium">Capitán</p>
                  <p className="text-xs md:text-sm font-semibold text-white truncate max-w-[100px]">
                    {capitanId && jugadoresData[capitanId] ? jugadoresData[capitanId].apellido : 'Elegir'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => !readOnly && setModalCP('pateador')}
                className={`flex-1 flex items-center gap-2 bg-azul hover:bg-azul/90 transition-colors rounded-none py-2 px-3 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                  <Image src="/rugby-ball.png" alt="" width={28} height={28} className="object-contain" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] text-white/90 font-medium">Pateador</p>
                  <p className="text-xs md:text-sm font-semibold text-white truncate max-w-[100px]">
                    {pateadorId && jugadoresData[pateadorId] ? jugadoresData[pateadorId].apellido : 'Elegir'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="px-4 pb-6 flex-1 min-h-0 flex flex-col max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 min-h-0 flex flex-col min-w-0"
        >
          <div className="flex-1 min-h-0 min-w-0 flex flex-col min-h-[60vh] md:min-h-0">
            <RugbyField
              jugadores={equipo} jugadoresData={jugadoresData}
              onPositionPress={pos => !readOnly && setSelectedPos(pos)}
              selectedPosicion={selectedPos} capitanId={capitanId} pateadorId={pateadorId}
              readOnly={readOnly} equipoAnterior={equipoAnterior}
              fillOnMobile
            />
          </div>
        </motion.div>
        {saving && (
          <div className="flex items-center justify-center gap-2 py-3 shrink-0">
            <Loader2 size={16} className="animate-spin text-azul" />
            <span className="text-sm text-white/80">Guardando...</span>
          </div>
        )}
      </div>
      </div>

      {/* Player selection modal */}
      <AnimatePresence>
        {selectedPos !== null && (
          <PlayerModal posicion={selectedPos} equipo={equipo} jugadoresData={jugadoresData}
            onSelect={handleSelectJugador} onClose={() => setSelectedPos(null)} />
        )}
      </AnimatePresence>

      {/* Captain/Kicker modal */}
      <AnimatePresence>
        {modalCP !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalCP(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-bordo-dark rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden border border-oro/25">
              <h2 className="text-center text-oro font-bold py-4 border-b border-white/10">
                {modalCP === 'capitan' ? 'Elegir capitan' : 'Elegir pateador'}
              </h2>
              <div className="overflow-y-auto max-h-80">
                {jugadoresDelEquipo.map(j => (
                  <button key={j.id} onClick={() => modalCP && elegirCP(modalCP, j)}
                    className="w-full text-left px-5 py-4 text-white/90 border-b border-white/[0.08] hover:bg-white/10 transition-colors">
                    {j.apellido} {j.nombre}
                  </button>
                ))}
              </div>
              <button onClick={() => setModalCP(null)}
                className="w-full py-4 text-oro font-semibold bg-white/10 hover:bg-white/15 transition-colors">
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal límite (club o cambios) */}
      <AnimatePresence>
        {limitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLimitModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-bordo-dark rounded-3xl w-full max-w-sm p-6 border border-oro/25 text-center">
              <h2 className="text-oro font-bold text-lg mb-2">
                {limitModal === 'club' ? 'Máximo por club' : 'Máximo de cambios'}
              </h2>
              <p className="text-white/90 text-sm mb-6">
                {limitModal === 'club'
                  ? `Solo podés tener hasta ${MAX_JUGADORES_MISMO_CLUB} jugadores del mismo club en tu equipo.`
                  : `Solo podés hacer hasta ${MAX_CAMBIOS_POR_FECHA} cambios respecto a tu equipo de la fecha anterior.`}
              </p>
              <button onClick={() => setLimitModal(null)}
                className="w-full py-3 rounded-xl bg-oro/80 hover:bg-oro text-bordo-dark font-semibold transition-colors">
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
            <span className="text-sm">{toast}</span>
            <button onClick={() => setToast(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
