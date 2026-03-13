'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  getPartidoById, getJugadores, getPuntajesPorFecha,
  updatePartidoResult, upsertPuntajesJugador,
} from '@/services/api';
import { Partido, Jugador, PuntajeJugador } from '@/types';
import { TabScreen } from '@/components/TabScreen';
import { LoadingView } from '@/components/LoadingView';
import { AnimatedCard } from '@/components/AnimatedCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

type PuntajeForm = {
  jugador_id: string; nombre: string; apellido: string; club_id: string;
  titularidad: boolean; tries: number; conversiones: number;
  penales: number; drops: number; amarilla: number; roja: number;
  figura_partido: boolean; puntos_oro: number;
};

function numVal(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function puntosAnotados(p: PuntajeForm): number {
  return p.tries * 5 + p.conversiones * 2 + p.penales * 3 + p.drops * 3;
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="w-14">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <input type="number" min={0} value={value}
        onChange={e => onChange(numVal(e.target.value))}
        className="w-full px-2 py-1.5 rounded-lg border border-oro/30 bg-white/[0.08] text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-oro" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span className="text-xs text-white/70">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-oro' : 'bg-white/30'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function AdminPartidoPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const { usuario, loading: authLoading } = useAuth();

  const [partido, setPartido] = useState<Partido | null>(null);
  const [players, setPlayers] = useState<PuntajeForm[]>([]);
  const [puntosLocal, setPuntosLocal] = useState('');
  const [puntosVisitante, setPuntosVisitante] = useState('');
  const [bonusLocal, setBonusLocal] = useState(false);
  const [bonusVisitante, setBonusVisitante] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await getPartidoById(id);
        if (cancelled || !p) return;
        setPartido(p);
        setPuntosLocal(p.puntos_local != null ? String(p.puntos_local) : '');
        setPuntosVisitante(p.puntos_visitante != null ? String(p.puntos_visitante) : '');

        const jugadores = await getJugadores({ club_ids: [p.club_local_id, p.club_visitante_id], activo: true });
        const puntajes = await getPuntajesPorFecha(p.fecha_id);
        const byJug = new Map<string, PuntajeJugador>();
        puntajes.forEach(pt => byJug.set(pt.jugador_id, pt));

        const forms: PuntajeForm[] = jugadores.map(j => {
          const ex = byJug.get(j.id);
          return {
            jugador_id: j.id, nombre: j.nombre, apellido: j.apellido, club_id: j.club_id,
            titularidad: ex?.titularidad ?? false, tries: ex?.tries ?? 0,
            conversiones: ex?.conversiones ?? 0, penales: ex?.penales ?? 0, drops: ex?.drops ?? 0,
            amarilla: ex?.amarilla ?? 0, roja: ex?.roja ?? 0,
            figura_partido: ex?.figura_partido ?? false, puntos_oro: ex?.puntos_oro ?? 0,
          };
        });

        const anyLocalBonus = puntajes.some(pt => {
          const j = jugadores.find(x => x.id === pt.jugador_id);
          return j?.club_id === p.club_local_id && (pt as any).victoria_bonus;
        });
        const anyVisitBonus = puntajes.some(pt => {
          const j = jugadores.find(x => x.id === pt.jugador_id);
          return j?.club_id === p.club_visitante_id && (pt as any).victoria_bonus;
        });

        if (!cancelled) {
          setPlayers(forms);
          setBonusLocal(anyLocalBonus);
          setBonusVisitante(anyVisitBonus);
        }
      } catch (e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (authLoading) return <TabScreen title="Puntajes partido"><LoadingView /></TabScreen>;
  if (!authLoading && usuario?.rol !== 'admin') { redirect('/inicio'); }

  const updatePlayer = (jugadorId: string, field: keyof PuntajeForm, value: boolean | number) => {
    setPlayers(prev => prev.map(p => p.jugador_id === jugadorId ? { ...p, [field]: value } : p));
  };

  const handleGuardar = async () => {
    if (!partido) return;
    const pl = numVal(puntosLocal);
    const pv = numVal(puntosVisitante);
    const hasResult = puntosLocal.trim() !== '' && puntosVisitante.trim() !== '';

    if (hasResult) {
      const sumLocal = players.filter(p => p.club_id === partido.club_local_id).reduce((s, p) => s + puntosAnotados(p), 0);
      const sumVisit = players.filter(p => p.club_id === partido.club_visitante_id).reduce((s, p) => s + puntosAnotados(p), 0);
      if (sumLocal !== pl || sumVisit !== pv) {
        alert(`La suma de puntos no coincide con el resultado.\n\n${partido.club_local?.nombre ?? 'Local'}: jugadores=${sumLocal}, resultado=${pl}\n${partido.club_visitante?.nombre ?? 'Visitante'}: jugadores=${sumVisit}, resultado=${pv}`);
        return;
      }
    }

    setSaving(true);
    try {
      if (hasResult) await updatePartidoResult(partido.id, pl, pv);
      const localWins = hasResult && pl > pv;
      const visitWins = hasResult && pv > pl;
      const rows = players.map(p => {
        const isLocal = p.club_id === partido.club_local_id;
        return {
          jugador_id: p.jugador_id, fecha_id: partido.fecha_id, titularidad: p.titularidad,
          victoria: isLocal ? localWins : visitWins,
          victoria_bonus: (isLocal && bonusLocal) || (!isLocal && bonusVisitante),
          tries: p.tries, conversiones: p.conversiones, penales: p.penales, drops: p.drops,
          amarilla: p.amarilla, roja: p.roja, figura_partido: p.figura_partido, puntos_oro: p.puntos_oro,
        };
      });
      await upsertPuntajesJugador(rows);
      alert('Puntajes guardados correctamente.');
      router.back();
    } catch (e) { console.error(e); alert('Error al guardar puntajes.'); }
    finally { setSaving(false); }
  };

  if (!id) {
    return (
      <TabScreen title="Puntajes partido">
        <p className="text-white/70">Falta ID del partido.</p>
        <button onClick={() => router.back()} className="text-oro mt-4 hover:underline">Volver</button>
      </TabScreen>
    );
  }

  if (loading || !partido) return <TabScreen title="Puntajes partido"><LoadingView /></TabScreen>;

  const localNombre = partido.club_local?.nombre ?? 'Local';
  const visitNombre = partido.club_visitante?.nombre ?? 'Visitante';
  const sumaLocal = players.filter(p => p.club_id === partido.club_local_id).reduce((s, p) => s + puntosAnotados(p), 0);
  const sumaVisit = players.filter(p => p.club_id === partido.club_visitante_id).reduce((s, p) => s + puntosAnotados(p), 0);
  const plNum = numVal(puntosLocal);
  const pvNum = numVal(puntosVisitante);
  const resultadoCargado = puntosLocal.trim() !== '' && puntosVisitante.trim() !== '';
  const localOk = !resultadoCargado || sumaLocal === plNum;
  const visitOk = !resultadoCargado || sumaVisit === pvNum;

  const q = search.trim().toLowerCase();
  const filtrados = q
    ? players.filter(p => `${p.apellido} ${p.nombre}`.toLowerCase().includes(q) || `${p.nombre} ${p.apellido}`.toLowerCase().includes(q))
    : players;

  return (
    <TabScreen
      title="Puntajes partido"
      headerRight={
        <button onClick={() => router.back()} className="p-2 text-oro hover:opacity-80">
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="w-full space-y-6">
        <AnimatedCard>
          <div className="rounded-2xl border border-oro/20 bg-white/[0.06] p-5">
            <h3 className="text-sm font-bold text-oro mb-4">Resultado del partido</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-xs text-white/70 mb-1 block">{localNombre}</label>
                <input type="number" min={0} value={puntosLocal} onChange={e => setPuntosLocal(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-oro/30 bg-white/[0.08] text-white text-center focus:outline-none focus:ring-1 focus:ring-oro" />
              </div>
              <span className="text-2xl font-bold text-white/60 pb-2">-</span>
              <div className="flex-1">
                <label className="text-xs text-white/70 mb-1 block">{visitNombre}</label>
                <input type="number" min={0} value={puntosVisitante} onChange={e => setPuntosVisitante(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-oro/30 bg-white/[0.08] text-white text-center focus:outline-none focus:ring-1 focus:ring-oro" />
              </div>
            </div>
            {resultadoCargado && (
              <div className="mt-3 space-y-1">
                <p className={`text-xs ${localOk ? 'text-white/60' : 'text-red-400 font-semibold'}`}>
                  Suma {localNombre}: {sumaLocal}{localOk ? ' ✓' : ` (resultado: ${plNum})`}
                </p>
                <p className={`text-xs ${visitOk ? 'text-white/60' : 'text-red-400 font-semibold'}`}>
                  Suma {visitNombre}: {sumaVisit}{visitOk ? ' ✓' : ` (resultado: ${pvNum})`}
                </p>
              </div>
            )}
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.05}>
          <div className="rounded-2xl border border-oro/20 bg-white/[0.06] p-5">
            <h3 className="text-sm font-bold text-oro mb-3">Bonus por equipo (titulares)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/90">{localNombre}</span>
                <Toggle label="" checked={bonusLocal} onChange={setBonusLocal} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/90">{visitNombre}</span>
                <Toggle label="" checked={bonusVisitante} onChange={setBonusVisitante} />
              </div>
            </div>
          </div>
        </AnimatedCard>

        <div>
          <h3 className="text-sm font-bold text-oro uppercase tracking-wider mb-3">Puntajes por jugador</h3>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            className="w-full px-4 py-2.5 rounded-xl border border-oro/30 bg-white/[0.08] text-white text-sm placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-oro mb-3" />
          {search.trim() && (
            <p className="text-xs text-white/60 mb-2">{filtrados.length} de {players.length} jugadores</p>
          )}

          <div className="space-y-3">
            {filtrados.map((p, i) => (
              <AnimatedCard key={p.jugador_id} delay={i * 0.015}>
                <div className="rounded-2xl border border-oro/20 bg-white/[0.06] p-4">
                  <p className="text-sm font-semibold text-white/95 mb-2">{p.apellido}, {p.nombre}</p>
                  <div className="flex flex-wrap gap-4 mb-3">
                    <Toggle label="Titular" checked={p.titularidad} onChange={v => updatePlayer(p.jugador_id, 'titularidad', v)} />
                    <Toggle label="Figura" checked={p.figura_partido} onChange={v => updatePlayer(p.jugador_id, 'figura_partido', v)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <NumInput label="Tries" value={p.tries} onChange={v => updatePlayer(p.jugador_id, 'tries', v)} />
                    <NumInput label="Conv." value={p.conversiones} onChange={v => updatePlayer(p.jugador_id, 'conversiones', v)} />
                    <NumInput label="Pen." value={p.penales} onChange={v => updatePlayer(p.jugador_id, 'penales', v)} />
                    <NumInput label="Drops" value={p.drops} onChange={v => updatePlayer(p.jugador_id, 'drops', v)} />
                    <NumInput label="Amarilla" value={p.amarilla} onChange={v => updatePlayer(p.jugador_id, 'amarilla', v)} />
                    <NumInput label="Roja" value={p.roja} onChange={v => updatePlayer(p.jugador_id, 'roja', v)} />
                    <NumInput label="Oro" value={p.puntos_oro} onChange={v => updatePlayer(p.jugador_id, 'puntos_oro', v)} />
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>

        <button
          onClick={handleGuardar}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-azul to-[#162d6b] text-white font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <span>Guardar puntajes</span>}
        </button>
      </div>
    </TabScreen>
  );
}
