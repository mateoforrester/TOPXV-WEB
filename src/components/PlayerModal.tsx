'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JugadorListado, JugadorPosicion } from '@/types';
import { getJugadoresListado } from '@/services/api';
import { NOMBRES_POSICIONES, POSICION_A_POSICION_IDS } from '@/utils/constants';
import { X, Search, Loader2 } from 'lucide-react';

interface PlayerModalProps {
  posicion: number | null;
  equipo: JugadorPosicion[];
  jugadoresData: Record<string, any>;
  onSelect: (jugadorId: string) => void;
  onClose: () => void;
}

export default function PlayerModal({ posicion, equipo, jugadoresData, onSelect, onClose }: PlayerModalProps) {
  const [jugadores, setJugadores] = useState<JugadorListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<string | 'ALL'>('ALL');
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);

  const loadJugadores = useCallback(() => {
    if (posicion === null) return;
    setSearch('');
    setSelectedClub('ALL');
    setLoading(true);
    setError(null);
    const ids = POSICION_A_POSICION_IDS[posicion] ?? [posicion];
    getJugadoresListado({ activo: true, posicion_ids: ids, orderBy: 'puntos_totales' })
      .then((data) => {
        setJugadores(data ?? []);
        setError(null);
      })
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

  const clubesDisponibles = useMemo(() => {
    const set = new Set<string>();
    jugadores.forEach(j => {
      if (j.club_nombre) set.add(j.club_nombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [jugadores]);

  const filtered = useMemo(() => {
    let list = jugadores.filter(j => !idsEnOtrasPosiciones.has(j.id));

    if (selectedClub !== 'ALL') {
      list = list.filter(j => j.club_nombre === selectedClub);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(j =>
        j.apellido.toLowerCase().includes(q) ||
        j.nombre.toLowerCase().includes(q) ||
        (j.club_nombre || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [jugadores, search, idsEnOtrasPosiciones, selectedClub]);

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
          <div className="px-5 py-3 space-y-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador o club..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white/95 placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setClubDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-left text-sm text-white/95"
              >
                <span>{selectedClub === 'ALL' ? 'Todos los clubes' : selectedClub}</span>
                <span className="text-white/50">▼</span>
              </button>
              {clubDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setClubDropdownOpen(false)} aria-hidden />
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#2b0a10] border border-oro/30 shadow-xl max-h-48 overflow-y-auto z-50 py-1">
                    <button type="button" onClick={() => { setSelectedClub('ALL'); setClubDropdownOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm ${selectedClub === 'ALL' ? 'bg-oro/30 text-oro font-semibold' : 'text-white/90 hover:bg-white/10'}`}>
                      Todos
                    </button>
                    {clubesDisponibles.map((club) => (
                      <button key={club} type="button" onClick={() => { setSelectedClub(club); setClubDropdownOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm ${selectedClub === club ? 'bg-oro/30 text-oro font-semibold' : 'text-white/90 hover:bg-white/10'}`}>
                        {club}
                      </button>
                    ))}
                  </div>
                </>
              )}
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
                  <div className="flex items-center gap-2 mt-1">
                    {j.club_nombre && (
                      <span className="inline-block bg-azul/50 px-2 py-0.5 rounded text-[11px] text-white/75">
                        {j.club_nombre}
                      </span>
                    )}
                    <span className="inline-block text-[11px] text-oro/90 font-semibold">
                      {j.puntos_totales} pts
                    </span>
                  </div>
                </div>
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
