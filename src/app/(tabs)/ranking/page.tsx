'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getRanking, getFechaActiva, getFechas } from '@/services/api';
import { RankingUsuario, Fecha } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { withTimeout } from '@/utils/withTimeout';
import Image from 'next/image';
import { RotateCcw } from 'lucide-react';

const API_TIMEOUT_MS = 20000;

export default function RankingPage() {
  const { usuario } = useAuth();
  const [ranking, setRanking] = useState<RankingUsuario[]>([]);
  const [fechaActiva, setFechaActiva] = useState<Fecha | null>(null);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [fechaRankingId, setFechaRankingId] = useState<string | null>(null);
  const [modo, setModo] = useState<'general' | 'fecha'>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fechaSeleccionada = fechas.find(f => f.id === fechaRankingId) ?? null;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fecha, listaFechas] = await Promise.all([
        withTimeout(getFechaActiva(), API_TIMEOUT_MS),
        withTimeout(getFechas(), API_TIMEOUT_MS),
      ]);
      setFechaActiva(fecha);
      setFechas(listaFechas);

      if (modo === 'general') {
        const data = await withTimeout(getRanking(undefined), API_TIMEOUT_MS);
        setRanking(data || []);
        return;
      }

      let fid = fechaRankingId;
      if (!fid && listaFechas.length) {
        fid = fecha?.id ?? listaFechas[listaFechas.length - 1]?.id ?? listaFechas[0]?.id ?? null;
        if (fid) setFechaRankingId(fid);
      }

      const fechaSel = listaFechas.find(f => f.id === fid) ?? null;
      if (!fid || !fechaSel) {
        setRanking([]);
        return;
      }
      if (fechaSel.resultados_publicados !== true) {
        setRanking([]);
        return;
      }
      const data = await withTimeout(getRanking(fid), API_TIMEOUT_MS);
      setRanking(data || []);
    } catch (e) {
      console.error('Error loading ranking:', e);
      setError(e instanceof Error ? e.message : 'Error al cargar. Reintenta.');
    } finally {
      setLoading(false);
    }
  }, [modo, fechaRankingId]);

  useEffect(() => { loadData(); }, [loadData]);

  const ModeSelector = fechas.length > 0 ? (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex bg-white/20 rounded-full p-1 gap-1 self-center">
        {(['general', 'fecha'] as const).map(m => (
          <button key={m} type="button" onClick={() => setModo(m)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              modo === m ? 'bg-oro-bright text-bordo-deep shadow-sm' : 'text-white'
            }`}>
            {m === 'general' ? 'General' : 'Por fecha'}
          </button>
        ))}
      </div>
      {modo === 'fecha' && (
        <label className="flex items-center gap-2 text-sm text-white/90">
          <span className="whitespace-nowrap shrink-0">Jornada</span>
          <select
            value={fechaRankingId ?? ''}
            onChange={e => setFechaRankingId(e.target.value || null)}
            className="rounded-lg bg-white/15 text-white border border-white/25 px-3 py-2 text-sm font-medium min-w-[8rem] max-w-full"
          >
            {fechas.map(f => (
              <option key={f.id} value={f.id} className="text-bordo-deep">
                Fecha {f.numero}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  ) : undefined;

  const subtitle =
    modo === 'fecha' && fechaSeleccionada
      ? `Fecha ${fechaSeleccionada.numero}`
      : fechaActiva
        ? `Fecha ${fechaActiva.numero}`
        : undefined;

  return (
    <TabScreen title="Ranking"
      subtitle={subtitle}
      headerExtra={ModeSelector}>
      {loading ? <LoadingView message="Cargando ranking..." /> : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-white/80 text-center max-w-sm">{error}</p>
          <button onClick={() => loadData()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-oro/80 hover:bg-oro text-bordo-dark font-semibold transition-colors">
            <RotateCcw size={18} />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="w-full space-y-2">
          {modo === 'fecha' && fechaSeleccionada && fechaSeleccionada.resultados_publicados !== true ? (
            <p className="text-center text-white/70 py-12 px-4">
              Los resultados de esta fecha aún no están publicados.
            </p>
          ) : (
            <>
              <div className="flex items-center text-xs text-white/60 font-semibold px-2 pb-1">
                <span className="w-12 text-center">#</span>
                <span className="flex-1 ml-12">Jugador</span>
                <span className="w-14 text-right">{modo === 'fecha' ? 'Pts fecha' : 'Pts'}</span>
              </div>
              {ranking.length === 0 ? (
                <p className="text-center text-white/60 py-12">No hay datos de ranking aun</p>
              ) : ranking.map((item, idx) => {
            const pos = idx + 1;
            const isMe = item.usuario_id === usuario?.id;
            const medal = pos === 1 ? '1f947' : pos === 2 ? '1f948' : pos === 3 ? '1f949' : null;
            const puntosMostrar = modo === 'fecha' ? (item.puntos_fecha ?? item.puntos_totales) : item.puntos_totales;
            return (
              <motion.div key={item.usuario_id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx, 24) * 0.015 }}
                className={`flex items-center p-3 rounded-xl ${
                  isMe ? 'bg-oro-bright/20 border-2 border-oro-bright' : 'bg-white/10'
                }`}>
                <div className="w-12 text-center">
                  {medal ? (
                    <span className="text-2xl">{String.fromCodePoint(parseInt(medal, 16))}</span>
                  ) : (
                    <span className={`text-base font-bold ${isMe ? 'text-azul' : 'text-oro-bright'}`}>#{pos}</span>
                  )}
                </div>
                {item.usuario?.avatar_url ? (
                  <Image src={item.usuario.avatar_url} alt="" width={40} height={40}
                    className="rounded-full mr-3 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    <span className="text-white/90 font-semibold">
                      {(item.usuario?.nombre?.charAt(0) || '?').toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isMe ? 'text-azul' : 'text-white/95'}`}>
                    {item.usuario?.nombre || 'Usuario'}
                    {item.usuario?.apellido ? ` ${item.usuario.apellido}` : ''}
                    {isMe && ' (vos)'}
                  </p>
                  {item.usuario?.nombre_equipo && (
                    <p className="text-xs text-white/60 truncate">{item.usuario.nombre_equipo}</p>
                  )}
                </div>
                <span className={`font-bold text-lg ${isMe ? 'text-azul' : 'text-oro-bright'}`}>
                  {puntosMostrar}
                </span>
              </motion.div>
            );
          })}
            </>
          )}
        </div>
      )}
    </TabScreen>
  );
}
