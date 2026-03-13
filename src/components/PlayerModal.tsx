'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Jugador, JugadorPosicion } from '@/types';
import { getJugadores } from '@/services/api';
import { NOMBRES_POSICIONES, POSICION_A_POSICION_IDS, MAX_JUGADORES_MISMO_CLUB } from '@/utils/constants';
import { X, Search, Loader2 } from 'lucide-react';

interface PlayerModalProps {
  posicion: number | null;
  equipo: JugadorPosicion[];
  jugadoresData: Record<string, Jugador>;
  onSelect: (jugadorId: string) => void;
  onClose: () => void;
}

export default function PlayerModal({ posicion, equipo, jugadoresData, onSelect, onClose }: PlayerModalProps) {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadJugadores = useCallback(() => {
    if (posicion === null) return;
    setSearch('');
    setLoading(true);
    setError(null);
    const ids = POSICION_A_POSICION_IDS[posicion] ?? [posicion];
    getJugadores({ posicion_ids: ids, activo: true })
      .then((data) => { setJugadores(data ?? []); setError(null); })
      .catch((e) => {
        console.error('Error loading jugadores:', e);
        setError('No se pudieron cargar jugadores. Reintenta.');
        setJugadores([]);
      })
      .finally(() => setLoading(false));
  }, [posicion]);

  useEffect(() => { loadJugadores(); }, [loadJugadores]);

  const idsEnOtrasPosiciones = useMemo(() => {
    if (posicion === null) return new Set<string>();
    return new Set(
      equipo.filter(j => j.posicion !== posicion && j.jugador_id).map(j => j.jugador_id)
    );
  }, [equipo, posicion]);

  const filtered = useMemo(() => {
    let list = jugadores.filter(j => !idsEnOtrasPosiciones.has(j.id));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(j =>
        j.apellido.toLowerCase().includes(q) ||
        j.nombre.toLowerCase().includes(q) ||
        (j.club?.nombre || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jugadores, search, idsEnOtrasPosiciones]);

  if (posicion === null) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#3d0a14] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col border-2 border-oro/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-oro">#{posicion}</span>
                <span className="text-base font-semibold text-white/90">{NOMBRES_POSICIONES[posicion]}</span>
              </div>
              <p className="text-xs text-white/50 mt-1">Elegi un jugador para esta posicion</p>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={20} className="text-white/80" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador o club..."
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/95 placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-oro" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-white/50 py-12">{search ? 'No hay resultados' : 'No hay jugadores'}</p>
            ) : filtered.map(j => (
              <button key={j.id} onClick={() => onSelect(j.id)}
                className="w-full flex items-center p-3 rounded-xl mb-2 bg-white/[0.06] border border-white/[0.08] border-l-[3px] border-l-oro/40 hover:bg-oro/10 hover:border-l-oro transition-all text-left">
                <div className="bg-oro/25 px-2.5 py-1 rounded-lg mr-3">
                  <span className="text-xs font-extrabold text-oro">#{posicion}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-azul border-2 border-white/20 flex items-center justify-center mr-3">
                  <span className="text-sm font-bold text-white">
                    {((j.apellido?.[0] || '') + (j.nombre?.[0] || '')).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/95">{j.apellido} {j.nombre}</p>
                  {j.club && (
                    <span className="inline-block bg-azul/50 px-2 py-0.5 rounded text-xs text-white/70 mt-1">
                      {j.club.nombre}
                    </span>
                  )}
                </div>
                <span className="text-white/40 text-xl ml-2">&rsaquo;</span>
              </button>
            ))}
          </div>

          <button onClick={onClose} className="py-4 text-center text-oro font-semibold hover:bg-white/5 transition-colors">
            Cancelar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
