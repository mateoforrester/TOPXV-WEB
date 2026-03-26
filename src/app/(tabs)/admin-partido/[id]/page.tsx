'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getPartidoById,
  getJugadores,
  getPuntajesPorFecha,
  updatePartidoResult,
  upsertPuntajesJugador,
} from '@/services/api';
import { Jugador, Partido, PuntajeJugador } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { withTimeout } from '@/utils/withTimeout';
import {
  bonusDefensivoEquipo,
  bonusOfensivoEquipo,
  normalizarPuntoOro,
  PUNTOS_TRY_PENAL,
  sumarTriesPorClub,
} from '@/utils/rugbyPuntajes';

type PuntajeForm = {
  jugador_id: string;
  nombre: string;
  apellido: string;
  club_id: string;
  titularidad: boolean;
  tries: number;
  conversiones: number;
  penales: number;
  drops: number;
  amarilla: number;
  roja: number;
  figura_partido: boolean;
  puntos_oro: boolean;
};

const API_TIMEOUT_MS = 20000;

function numVal(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}

function puntosAnotados(p: PuntajeForm): number {
  return p.tries * 5 + p.conversiones * 2 + p.penales * 3 + p.drops * 3;
}

export default function AdminPartidoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { usuario, loading: authLoading } = useAuth();
  const [partido, setPartido] = useState<Partido | null>(null);
  const [players, setPlayers] = useState<PuntajeForm[]>([]);
  const [puntosLocal, setPuntosLocal] = useState('');
  const [puntosVisitante, setPuntosVisitante] = useState('');
  const [tryPenalLocal, setTryPenalLocal] = useState('');
  const [tryPenalVisitante, setTryPenalVisitante] = useState('');
  const [searchJugador, setSearchJugador] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partidoId = params?.id;
  const isAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/inicio');
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin || !partidoId) return;
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const partidoData = await withTimeout(getPartidoById(partidoId), API_TIMEOUT_MS);
        if (!partidoData || cancelled) throw new Error('Partido no encontrado.');
        setPartido(partidoData);
        setPuntosLocal(partidoData.puntos_local != null ? String(partidoData.puntos_local) : '');
        setPuntosVisitante(partidoData.puntos_visitante != null ? String(partidoData.puntos_visitante) : '');
        setTryPenalLocal(String(partidoData.try_penal_local ?? 0));
        setTryPenalVisitante(String(partidoData.try_penal_visitante ?? 0));

        const [jugadores, puntajes] = await withTimeout(
          Promise.all([
            getJugadores({ club_ids: [partidoData.club_local_id, partidoData.club_visitante_id], activo: true }),
            getPuntajesPorFecha(partidoData.fecha_id),
          ]),
          API_TIMEOUT_MS
        );
        if (cancelled) return;

        const byJugador = new Map<string, PuntajeJugador & { jugador?: Jugador }>();
        puntajes.forEach((p: PuntajeJugador & { jugador?: Jugador }) => byJugador.set(p.jugador_id, p));

        const forms: PuntajeForm[] = jugadores.map((j) => {
          const existing = byJugador.get(j.id);
          return {
            jugador_id: j.id,
            nombre: j.nombre,
            apellido: j.apellido,
            club_id: j.club_id,
            titularidad: existing?.titularidad ?? false,
            tries: existing?.tries ?? 0,
            conversiones: existing?.conversiones ?? 0,
            penales: existing?.penales ?? 0,
            drops: existing?.drops ?? 0,
            amarilla: existing?.amarilla ?? 0,
            roja: existing?.roja ?? 0,
            figura_partido: existing?.figura_partido ?? false,
            puntos_oro: normalizarPuntoOro(existing?.puntos_oro),
          };
        });

        setPlayers(forms);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el partido.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAdmin, partidoId]);

  const updatePlayer = (jugadorId: string, patch: Partial<PuntajeForm>) => {
    setPlayers((prev) => prev.map((p) => (p.jugador_id === jugadorId ? { ...p, ...patch } : p)));
  };

  const localNombre = partido?.club_local?.nombre ?? 'Local';
  const visitanteNombre = partido?.club_visitante?.nombre ?? 'Visitante';
  const plNum = numVal(puntosLocal);
  const pvNum = numVal(puntosVisitante);
  const resultadoCargado = puntosLocal.trim() !== '' && puntosVisitante.trim() !== '';
  const tpLocalNum = numVal(tryPenalLocal);
  const tpVisitNum = numVal(tryPenalVisitante);
  const sumaLocal = useMemo(
    () => players.filter((p) => p.club_id === partido?.club_local_id).reduce((s, p) => s + puntosAnotados(p), 0),
    [players, partido?.club_local_id]
  );
  const sumaVisitante = useMemo(
    () => players.filter((p) => p.club_id === partido?.club_visitante_id).reduce((s, p) => s + puntosAnotados(p), 0),
    [players, partido?.club_visitante_id]
  );
  const totalEsperadoLocal = sumaLocal + tpLocalNum * PUNTOS_TRY_PENAL;
  const totalEsperadoVisit = sumaVisitante + tpVisitNum * PUNTOS_TRY_PENAL;
  const localCoincide = !resultadoCargado || totalEsperadoLocal === plNum;
  const visitanteCoincide = !resultadoCargado || totalEsperadoVisit === pvNum;

  const triesJugLocal = useMemo(
    () => (partido ? sumarTriesPorClub(players, partido.club_local_id) : 0),
    [players, partido?.club_local_id]
  );
  const triesJugVisit = useMemo(
    () => (partido ? sumarTriesPorClub(players, partido.club_visitante_id) : 0),
    [players, partido?.club_visitante_id]
  );
  const triesLocal = triesJugLocal + tpLocalNum;
  const triesVisitante = triesJugVisit + tpVisitNum;
  const bonusOfLocal = bonusOfensivoEquipo(triesLocal);
  const bonusOfVisit = bonusOfensivoEquipo(triesVisitante);
  const bonusDefLocal = partido
    ? bonusDefensivoEquipo(
        partido.club_local_id,
        partido.club_local_id,
        partido.club_visitante_id,
        plNum,
        pvNum,
        resultadoCargado
      )
    : false;
  const bonusDefVisit = partido
    ? bonusDefensivoEquipo(
        partido.club_visitante_id,
        partido.club_local_id,
        partido.club_visitante_id,
        plNum,
        pvNum,
        resultadoCargado
      )
    : false;

  const playersFiltrados = useMemo(() => {
    const q = searchJugador.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      const full1 = `${p.apellido} ${p.nombre}`.toLowerCase();
      const full2 = `${p.nombre} ${p.apellido}`.toLowerCase();
      return p.apellido.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || full1.includes(q) || full2.includes(q);
    });
  }, [players, searchJugador]);

  const handleGuardar = async () => {
    if (!partido) return;
    const tpL = numVal(tryPenalLocal);
    const tpV = numVal(tryPenalVisitante);
    if (resultadoCargado && (!localCoincide || !visitanteCoincide)) {
      setError(
        `Jugadores + try penal (7 c/u) debe igualar el marcador.\n${localNombre}: ${sumaLocal} + ${tpL}×7 = ${sumaLocal + tpL * PUNTOS_TRY_PENAL} (marcador ${plNum}) | ${visitanteNombre}: ${sumaVisitante} + ${tpV}×7 = ${sumaVisitante + tpV * PUNTOS_TRY_PENAL} (marcador ${pvNum})`
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const advertenciaFixture = await withTimeout(
        updatePartidoResult(partido.id, {
          try_penal_local: tpL,
          try_penal_visitante: tpV,
          actualizarMarcador: resultadoCargado,
          puntos_local: plNum,
          puntos_visitante: pvNum,
        }),
        API_TIMEOUT_MS
      );

      const localWins = resultadoCargado && plNum > pvNum;
      const visitanteWins = resultadoCargado && pvNum > plNum;
      const boLocal = bonusOfensivoEquipo(sumarTriesPorClub(players, partido.club_local_id) + tpL);
      const boVisit = bonusOfensivoEquipo(sumarTriesPorClub(players, partido.club_visitante_id) + tpV);
      const bdLocal = bonusDefensivoEquipo(
        partido.club_local_id,
        partido.club_local_id,
        partido.club_visitante_id,
        plNum,
        pvNum,
        resultadoCargado
      );
      const bdVisit = bonusDefensivoEquipo(
        partido.club_visitante_id,
        partido.club_local_id,
        partido.club_visitante_id,
        plNum,
        pvNum,
        resultadoCargado
      );
      const rows = players.map((p) => {
        const isLocal = p.club_id === partido.club_local_id;
        const victoria = isLocal ? localWins : visitanteWins;
        return {
          jugador_id: p.jugador_id,
          fecha_id: partido.fecha_id,
          titularidad: p.titularidad,
          victoria,
          victoria_visitante: resultadoCargado && visitanteWins && !isLocal,
          bonus_ofensivo: isLocal ? boLocal : boVisit,
          bonus_defensivo: isLocal ? bdLocal : bdVisit,
          tries: p.tries,
          conversiones: p.conversiones,
          penales: p.penales,
          drops: p.drops,
          amarilla: p.amarilla,
          roja: p.roja,
          figura_partido: p.figura_partido,
          puntos_oro: p.puntos_oro,
        };
      });

      await withTimeout(upsertPuntajesJugador(rows), API_TIMEOUT_MS);
      if (advertenciaFixture) {
        window.alert(`Puntajes guardados.\n\n${advertenciaFixture}`);
      }
      router.push('/admin-puntajes');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los puntajes.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!isAdmin && !error)) {
    return (
      <TabScreen title="Puntajes partido">
        <LoadingView message="Cargando..." />
      </TabScreen>
    );
  }

  if (loading || !partido) {
    return (
      <TabScreen title="Puntajes partido">
        <LoadingView message="Cargando partido..." />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Puntajes partido" subtitle={`${localNombre} vs ${visitanteNombre}`}>
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-3 text-red-100 text-sm whitespace-pre-wrap">{error}</div>}

        <div className="rounded-2xl border border-oro/25 bg-white/5 p-4 space-y-3">
          <h3 className="text-oro font-semibold">Resultado del partido</h3>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <p className="text-xs text-white/70 mb-1">{localNombre}</p>
              <input className="w-full bg-white/10 border border-oro/30 rounded-lg px-3 py-2 text-white" value={puntosLocal} onChange={(e) => setPuntosLocal(e.target.value)} />
            </div>
            <span className="text-white/70 pb-2">-</span>
            <div>
              <p className="text-xs text-white/70 mb-1">{visitanteNombre}</p>
              <input className="w-full bg-white/10 border border-oro/30 rounded-lg px-3 py-2 text-white" value={puntosVisitante} onChange={(e) => setPuntosVisitante(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-white/65 mt-3 mb-1">Try penal (7 pts por marca, equipo — sin jugador)</p>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <p className="text-xs text-white/70 mb-1">{localNombre}</p>
              <input
                className="w-full bg-white/10 border border-oro/30 rounded-lg px-3 py-2 text-white"
                value={tryPenalLocal}
                onChange={(e) => setTryPenalLocal(e.target.value)}
              />
            </div>
            <span className="text-white/70 pb-2">-</span>
            <div>
              <p className="text-xs text-white/70 mb-1">{visitanteNombre}</p>
              <input
                className="w-full bg-white/10 border border-oro/30 rounded-lg px-3 py-2 text-white"
                value={tryPenalVisitante}
                onChange={(e) => setTryPenalVisitante(e.target.value)}
              />
            </div>
          </div>
          {resultadoCargado && (
            <div className="text-xs">
              <p className={localCoincide ? 'text-white/70' : 'text-red-300'}>
                {localNombre}: {sumaLocal} jug. + {tpLocalNum}×{PUNTOS_TRY_PENAL} try penal = {totalEsperadoLocal}
                {localCoincide ? ' ✓' : ` (marcador ${plNum})`}
              </p>
              <p className={visitanteCoincide ? 'text-white/70' : 'text-red-300'}>
                {visitanteNombre}: {sumaVisitante} jug. + {tpVisitNum}×{PUNTOS_TRY_PENAL} try penal = {totalEsperadoVisit}
                {visitanteCoincide ? ' ✓' : ` (marcador ${pvNum})`}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/85 space-y-2">
          <h3 className="text-oro font-semibold">Bonus tabla (WR, solo titulares al puntear)</h3>
          <p className="text-white/65 text-xs">
            Ofensivo: 4+ tries del equipo (jugadores + try penal). Defensivo: pierde por 1–7.
          </p>
          <p>
            {localNombre}: tries {triesJugLocal} jug. + {tpLocalNum} try penal = {triesLocal} · Ofensivo {bonusOfLocal ? 'sí' : 'no'} · Defensivo {bonusDefLocal ? 'sí' : 'no'}
          </p>
          <p>
            {visitanteNombre}: tries {triesJugVisit} jug. + {tpVisitNum} try penal = {triesVisitante} · Ofensivo {bonusOfVisit ? 'sí' : 'no'} · Defensivo {bonusDefVisit ? 'sí' : 'no'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-oro font-semibold">Puntajes por jugador</h3>
            <input
              className="bg-white/10 border border-oro/30 rounded-lg px-3 py-1.5 text-sm text-white w-64 max-w-[60vw]"
              placeholder="Buscar jugador..."
              value={searchJugador}
              onChange={(e) => setSearchJugador(e.target.value)}
            />
          </div>

          {playersFiltrados.map((p) => (
            <div key={p.jugador_id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-white font-semibold text-sm mb-3">{p.apellido}, {p.nombre}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center justify-between text-white/80"><span>Titular</span><input type="checkbox" checked={p.titularidad} onChange={(e) => updatePlayer(p.jugador_id, { titularidad: e.target.checked })} /></label>
                <label className="flex items-center justify-between text-white/80"><span>Figura</span><input type="checkbox" checked={p.figura_partido} onChange={(e) => updatePlayer(p.jugador_id, { figura_partido: e.target.checked })} /></label>
                <label className="flex items-center justify-between text-white/80"><span>Oro (+5)</span><input type="checkbox" checked={p.puntos_oro} onChange={(e) => updatePlayer(p.jugador_id, { puntos_oro: e.target.checked })} /></label>
                {[
                  ['tries', 'Tries'],
                  ['conversiones', 'Conv'],
                  ['penales', 'Pen'],
                  ['drops', 'Drops'],
                  ['amarilla', 'Amarilla'],
                  ['roja', 'Roja'],
                ].map(([field, label]) => (
                  <label key={field} className="text-white/80">
                    <span className="block mb-1">{label}</span>
                    <input
                      className="w-full bg-white/10 border border-oro/25 rounded px-2 py-1 text-white"
                      value={String(p[field as keyof PuntajeForm] as number)}
                      onChange={(e) => updatePlayer(p.jugador_id, { [field]: numVal(e.target.value) } as Partial<PuntajeForm>)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleGuardar}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-azul hover:bg-azul/90 disabled:opacity-70 text-white font-semibold py-3"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Guardar puntajes
        </button>
      </div>
    </TabScreen>
  );
}

