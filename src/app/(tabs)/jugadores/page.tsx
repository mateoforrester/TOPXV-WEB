'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getJugadoresListado } from '@/services/api';
import { JugadorListado } from '@/types';
import { POSICIONES_RUGBY } from '@/utils/constants';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { Search, RotateCcw } from 'lucide-react';
import { withTimeout } from '@/utils/withTimeout';

const API_TIMEOUT_MS = 20000;

function nombrePosicion(id: number): string {
  return POSICIONES_RUGBY.find(x => x.numero === id)?.nombre ?? `${id}`;
}

export default function JugadoresPage() {
  const [listado, setListado] = useState<JugadorListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await withTimeout(getJugadoresListado({ activo: true, orderBy: 'puntos_totales' }), API_TIMEOUT_MS);
      setListado(d || []);
    } catch (e) {
      console.error('Error loading jugadores:', e);
      setError(e instanceof Error ? e.message : 'Error al cargar. Reintenta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const q = search.trim().toLowerCase();
  const filtered = q === '' ? listado : listado.filter(j =>
    j.apellido.toLowerCase().includes(q) ||
    j.nombre.toLowerCase().includes(q) ||
    `${j.apellido} ${j.nombre}`.toLowerCase().includes(q) ||
    (j.club_nombre && j.club_nombre.toLowerCase().includes(q))
  );

  return (
    <TabScreen title="Jugadores">
      {loading ? <LoadingView message="Cargando jugadores..." /> : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-white/80 text-center max-w-sm">{error}</p>
          <button onClick={loadData}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-oro/80 hover:bg-oro text-bordo-dark font-semibold transition-colors">
            <RotateCcw size={18} />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido o club..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/95 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
            />
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center text-xs text-white/60 font-semibold px-3 pb-2 border-b border-white/20 mb-2">
              <span className="flex-1">Jugador / Club / Posicion</span>
              <span className="w-12 text-right">Pts</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-white/60 py-12">
              {listado.length === 0 ? 'No hay jugadores cargados' : 'Ningun jugador coincide con la busqueda'}
            </p>
          ) : filtered.map((item, idx) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center p-3 rounded-xl bg-white/10 mb-2 hover:bg-white/15 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white/95 text-sm">{item.apellido}, {item.nombre}</p>
                <p className="text-xs text-white/60 mt-0.5">{item.club_nombre}</p>
                <p className="text-xs text-white/50">{nombrePosicion(item.posicion_id)}</p>
              </div>
              <span className="text-lg font-bold text-oro-bright w-12 text-right">{item.puntos_totales}</span>
            </motion.div>
          ))}
        </div>
      )}
    </TabScreen>
  );
}

