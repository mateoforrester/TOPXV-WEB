'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFechas, getFixture, getEstadoVentanaFecha } from '@/services/api';
import { Fecha, Partido, Club } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { ChevronDown } from 'lucide-react';
import { withTimeout } from '@/utils/withTimeout';

const FIXTURE_LAST_UPDATE_KEY = 'fixture_last_update_at';

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function ClubLogo({ club, size = 52 }: { club: Club; size?: number }) {
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
    <div className="bg-azul rounded-lg flex items-center justify-center border-2 border-white/30"
      style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.45 }}>
        {(club.nombre || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function PartidoCard({ partido }: { partido: Partido }) {
  const local = partido.club_local ?? { id: partido.club_local_id, nombre: 'Local' };
  const visit = partido.club_visitante ?? { id: partido.club_visitante_id, nombre: 'Visitante' };
  const hasResult = partido.puntos_local != null && partido.puntos_visitante != null;

  return (
    <div className="bg-white/10 rounded-2xl p-4 mb-3">
      <p className="text-xs text-white/60 text-center mb-3">{formatFecha(partido.fecha_partido)}</p>
      <div className="flex items-center justify-between">
        <div className="flex-1 flex flex-col items-center max-w-[38%]">
          <ClubLogo club={local} />
          <p className="text-sm font-semibold text-white/90 mt-2 text-center leading-tight">{local.nombre}</p>
        </div>
        <div className="min-w-[56px] text-center">
          {hasResult ? (
            <span className="text-xl font-bold text-white/95">{partido.puntos_local} - {partido.puntos_visitante}</span>
          ) : (
            <span className="text-sm font-semibold text-white/60">VS</span>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center max-w-[38%]">
          <ClubLogo club={visit} />
          <p className="text-sm font-semibold text-white/90 mt-2 text-center leading-tight">{visit.nombre}</p>
        </div>
      </div>
    </div>
  );
}

export default function FixturePage() {
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [fechaSel, setFechaSel] = useState<Fecha | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const loadFechas = async () => {
    try {
      const [data, estado] = await withTimeout(Promise.all([getFechas(), getEstadoVentanaFecha()]), 20000);
      const lista = data || [];
      setFechas(lista);
      let def: Fecha | null = null;
      if (estado.estado === 'armar_equipo') def = lista.find(f => f.id === estado.fecha.id) ?? estado.fecha;
      else if (estado.estado === 'fecha_en_juego') def = lista.find(f => f.numero === estado.numero) ?? null;
      if (!def && lista.length) def = lista[0];
      setFechaSel(def);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error al cargar.');
    }
  };

  const loadPartidos = async () => {
    if (!fechaSel) { setPartidos([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const d = await withTimeout(getFixture(fechaSel.id), 20000);
      setPartidos(d || []);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error al cargar partidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFechas(); }, []);

  useEffect(() => {
    if (!fechaSel) { setPartidos([]); setLoading(false); return; }
    loadPartidos();
  }, [fechaSel?.id]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FIXTURE_LAST_UPDATE_KEY) return;
      if (!fechaSel?.id) return;
      loadPartidos();
    };
    const onFocus = () => {
      if (!fechaSel?.id) return;
      loadPartidos();
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!fechaSel?.id) return;
      loadPartidos();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fechaSel?.id]);

  const FechaPicker = (
    <div className="relative">
      <button onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-white/90 text-sm font-semibold hover:bg-white/25 transition-colors">
        {fechaSel ? `Fecha ${fechaSel.numero}` : 'Seleccionar'}
        <ChevronDown size={16} />
      </button>
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 bg-bordo-dark border border-oro/20 rounded-2xl p-2 min-w-[160px] shadow-xl z-50">
            {fechas.map(f => (
              <button key={f.id} onClick={() => { setFechaSel(f); setShowPicker(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                  fechaSel?.id === f.id ? 'bg-oro/20 text-oro font-semibold border-l-2 border-oro' : 'text-white/80 hover:bg-white/10'
                }`}>
                Fecha {f.numero}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <TabScreen title="Fixture"
      subtitle={fechaSel ? `Fecha ${fechaSel.numero}` : undefined}
      headerRight={FechaPicker}>
      {loading ? <LoadingView message="Cargando partidos..." /> : error ? (
        <p className="text-white/80 text-center py-16 max-w-sm">{error}</p>
      ) : (
        <div className="w-full">
          <h3 className="text-sm font-semibold text-white/80 mb-3">
            {fechaSel ? `Partidos - Fecha ${fechaSel.numero}` : 'Partidos'}
          </h3>
          {partidos.length === 0 ? (
            <p className="text-center text-white/60 py-12">
              {fechaSel ? 'No hay partidos cargados para esta fecha' : 'Selecciona una fecha'}
            </p>
          ) : partidos.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <PartidoCard partido={p} />
            </motion.div>
          ))}
        </div>
      )}
    </TabScreen>
  );
}
