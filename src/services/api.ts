import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import {
  Usuario, Jugador, JugadorListado, Club, Fecha, EquipoFecha,
  Partido, RankingUsuario, PuntajeJugador, JugadorPosicion,
} from '@/types';

export async function getCurrentUser(): Promise<Usuario | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('usuarios').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUserProfile(
  userId: string, email: string, nombre: string,
  opts?: { apellido?: string; club_id?: string; nombre_equipo?: string }
) {
  const { data, error } = await supabase.from('usuarios').insert({
    id: userId, email, nombre,
    apellido: opts?.apellido ?? null, club_id: opts?.club_id ?? null,
    nombre_equipo: opts?.nombre_equipo ?? null, puntos_totales: 0,
  });
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('avatares').upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
  const { error: updateError } = await supabase
    .from('usuarios').update({ avatar_url: publicUrl }).eq('id', userId);
  if (updateError) throw updateError;
  return publicUrl;
}

export async function updateUsuarioProfile(
  userId: string,
  updates: { avatar_url?: string; nombre?: string; apellido?: string; nombre_equipo?: string }
): Promise<void> {
  const { error } = await supabase.from('usuarios').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function ensureUserProfile(userId: string, email: string, nombre?: string): Promise<void> {
  const { error } = await supabase.from('usuarios').upsert({
    id: userId, email: email || '', nombre: nombre || 'Usuario',
    apellido: null, club_id: null, nombre_equipo: null, puntos_totales: 0,
  }, { onConflict: 'id' });
  if (error) throw error;
}

export async function getJugadores(filters?: {
  club_id?: string; club_ids?: string[];
  posicion_id?: number; posicion_ids?: number[];
  activo?: boolean;
}): Promise<Jugador[]> {
  let query = supabase.from('jugadores').select('*, club:clubes(*)');
  if (filters?.club_id) query = query.eq('club_id', filters.club_id);
  if (filters?.club_ids?.length) query = query.in('club_id', filters.club_ids);
  if (filters?.posicion_ids?.length) query = query.in('posicion_id', filters.posicion_ids);
  else if (filters?.posicion_id != null) query = query.eq('posicion_id', filters.posicion_id);
  if (filters?.activo !== undefined) query = query.eq('activo', filters.activo);
  const { data, error } = await query.order('apellido', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getJugadorById(id: string): Promise<Jugador | null> {
  const { data, error } = await supabase
    .from('jugadores').select('*, club:clubes(*)').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getJugadoresByIds(ids: string[]): Promise<Jugador[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('jugadores').select('*, club:clubes(*)').in('id', ids);
  if (error) throw error;
  return data || [];
}

export async function getJugadoresListado(opts?: {
  activo?: boolean;
  posicion_ids?: number[];
  orderBy?: 'puntos_totales' | 'apellido' | 'club';
}): Promise<JugadorListado[]> {
  let query = supabase.from('v_jugadores_listado').select('*');
  if (opts?.activo !== undefined) query = query.eq('activo', opts.activo);
  if (opts?.posicion_ids?.length) query = query.in('posicion_id', opts.posicion_ids);
  const orderBy = opts?.orderBy ?? 'puntos_totales';
  if (orderBy === 'puntos_totales') {
    query = query.order('puntos_totales', { ascending: false }).order('apellido', { ascending: true });
  } else if (orderBy === 'club') {
    query = query.order('club_nombre', { ascending: true }).order('apellido', { ascending: true }).order('nombre', { ascending: true });
  } else {
    query = query.order('apellido', { ascending: true }).order('nombre', { ascending: true });
  }
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data || []) as Array<JugadorListado & { posicion_principal?: number }>;
  const prioridadPosicion = new Map<number, number>();
  (opts?.posicion_ids || []).forEach((posId, idx) => prioridadPosicion.set(posId, idx));

  const byJugador = new Map<string, JugadorListado & { posicion_principal?: number }>();
  rows.forEach((row) => {
    const actual = byJugador.get(row.id);
    if (!actual) {
      byJugador.set(row.id, row);
      return;
    }

    const rankActual = prioridadPosicion.get(actual.posicion_id) ?? Number.MAX_SAFE_INTEGER;
    const rankNuevo = prioridadPosicion.get(row.posicion_id) ?? Number.MAX_SAFE_INTEGER;
    if (rankNuevo < rankActual) {
      byJugador.set(row.id, row);
      return;
    }
    if (rankNuevo > rankActual) return;

    const actualEsPrincipal =
      actual.posicion_principal != null && actual.posicion_id === actual.posicion_principal;
    const nuevoEsPrincipal =
      row.posicion_principal != null && row.posicion_id === row.posicion_principal;
    if (!actualEsPrincipal && nuevoEsPrincipal) {
      byJugador.set(row.id, row);
    }
  });

  return Array.from(byJugador.values());
}

export async function getClubes(): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubes').select('*').order('nombre', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getFechas(): Promise<Fecha[]> {
  const { data, error } = await supabase
    .from('fechas').select('*').order('numero', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getFechaActiva(): Promise<Fecha | null> {
  const { data: fechas, error } = await supabase
    .from('fechas').select('*').order('numero', { ascending: true });
  if (error) throw error;
  if (!fechas?.length) return null;
  const now = new Date();
  return fechas.find((f: Fecha) => {
    return now >= new Date(f.fecha_inicio) && now <= new Date(f.fecha_fin);
  }) ?? null;
}

export type EstadoVentanaFecha =
  | { estado: 'armar_equipo'; fecha: Fecha }
  | { estado: 'fecha_en_juego'; numero: number }
  | { estado: 'sin_ventana' };

export async function getEstadoVentanaFecha(): Promise<EstadoVentanaFecha> {
  const { data: fechas, error } = await supabase
    .from('fechas').select('*').order('numero', { ascending: true });
  if (error) throw error;
  if (!fechas?.length) return { estado: 'sin_ventana' };
  const now = new Date();
  const activa = fechas.find((f: Fecha) => now >= new Date(f.fecha_inicio) && now <= new Date(f.fecha_fin));
  if (activa) return { estado: 'armar_equipo', fecha: activa };
  for (let i = 0; i < fechas.length - 1; i++) {
    if (now > new Date(fechas[i].fecha_fin) && now < new Date(fechas[i + 1].fecha_inicio)) {
      return { estado: 'fecha_en_juego', numero: fechas[i].numero };
    }
  }
  const ultima = fechas[fechas.length - 1];
  if (now > new Date(ultima.fecha_fin)) return { estado: 'fecha_en_juego', numero: ultima.numero };
  return { estado: 'sin_ventana' };
}

export async function getFechaById(id: string): Promise<Fecha | null> {
  const { data, error } = await supabase.from('fechas').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getFechaPorNumero(numero: number): Promise<Fecha | null> {
  const { data, error } = await supabase.from('fechas').select('*').eq('numero', numero).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getEquipoFecha(usuarioId: string, fechaId: string): Promise<EquipoFecha | null> {
  const { data, error } = await supabase
    .from('equipos_fecha')
    .select('id, usuario_id, fecha_id, jugadores, capitan_id, pateador_id, cambios_realizados, created_at, updated_at')
    .eq('usuario_id', usuarioId).eq('fecha_id', fechaId).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function saveEquipoFecha(
  usuarioId: string, fechaId: string, jugadores: JugadorPosicion[],
  capitanId?: string, pateadorId?: string, equipoAnterior?: EquipoFecha | null
): Promise<EquipoFecha> {
  if (!usuarioId || typeof usuarioId !== 'string' || !usuarioId.trim()) {
    throw new Error('Usuario no valido. Debe iniciar sesion con una cuenta registrada.');
  }
  let cambios = 0;
  const ant = equipoAnterior?.jugadores && Array.isArray(equipoAnterior.jugadores) ? equipoAnterior.jugadores : [];
  if (equipoAnterior && ant.length > 0) {
    const mapAnt = new Map(ant.map((j: JugadorPosicion) => [j.posicion, j.jugador_id]));
    const mapNuevo = new Map(jugadores.map(j => [j.posicion, j.jugador_id]));
    for (let pos = 1; pos <= 15; pos++) { if (mapAnt.get(pos) !== mapNuevo.get(pos)) cambios++; }
  } else {
    cambios = jugadores.filter(j => j.jugador_id).length;
  }
  const payload = {
    usuario_id: usuarioId, fecha_id: fechaId,
    jugadores: jugadores.map(j => ({ posicion: j.posicion, jugador_id: j.jugador_id && String(j.jugador_id).trim() ? String(j.jugador_id) : null })),
    capitan_id: capitanId && String(capitanId).trim() ? capitanId : null,
    pateador_id: pateadorId && String(pateadorId).trim() ? pateadorId : null,
    cambios_realizados: cambios,
  };
  const existing = await getEquipoFecha(usuarioId, fechaId);
  let data, error;
  if (existing) {
    ({ data, error } = await supabase.from('equipos_fecha').update(payload).eq('id', existing.id).select().single());
  } else {
    ({ data, error } = await supabase.from('equipos_fecha').insert(payload).select().single());
  }
  if (error) throw error;
  return data;
}

export async function getPuntajesJugador(jugadorId: string): Promise<PuntajeJugador[]> {
  const { data, error } = await supabase
    .from('puntajes_jugador').select('*').eq('jugador_id', jugadorId).order('fecha_id', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPuntajesPorFecha(fechaId: string): Promise<PuntajeJugador[]> {
  const { data, error } = await supabase
    .from('puntajes_jugador').select('*, jugador:jugadores(*)').eq('fecha_id', fechaId);
  if (error) throw error;
  return data || [];
}

export async function getRanking(fechaId?: string): Promise<RankingUsuario[]> {
  if (fechaId) {
    const { data, error } = await supabase.rpc('get_ranking_fecha', { fecha_id: fechaId });
    if (error) throw error;
    return data || [];
  }
  const { data, error } = await supabase
    .from('ranking_general').select('*').order('posicion', { ascending: true });
  if (error) throw error;
  const rows = (data || []) as Array<{
    usuario_id: string; posicion: number; puntos_totales: number;
    nombre: string; apellido?: string; email: string;
    nombre_equipo?: string; avatar_url?: string;
  }>;
  return rows.map(row => ({
    usuario_id: row.usuario_id, posicion: row.posicion, puntos_totales: row.puntos_totales,
    usuario: {
      id: row.usuario_id, nombre: row.nombre, apellido: row.apellido,
      email: row.email, nombre_equipo: row.nombre_equipo,
      avatar_url: row.avatar_url, puntos_totales: row.puntos_totales,
      created_at: '',
    },
  }));
}

export async function getFixture(fechaId?: string): Promise<Partido[]> {
  let query = supabase.from('fixture')
    .select('*, club_local:clubes!fixture_club_local_id_fkey(*), club_visitante:clubes!fixture_club_visitante_id_fkey(*)');
  if (fechaId) query = query.eq('fecha_id', fechaId);
  const { data, error } = await query.order('fecha_partido', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPartidoById(partidoId: string): Promise<Partido | null> {
  const { data, error } = await supabase.from('fixture')
    .select('*, club_local:clubes!fixture_club_local_id_fkey(*), club_visitante:clubes!fixture_club_visitante_id_fkey(*)')
    .eq('id', partidoId).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

function isTryPenalColumnsMissingError(error: PostgrestError): boolean {
  const blob = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`;
  if (error.code === 'PGRST204' && /try_penal/i.test(blob)) return true;
  return /try_penal_(local|visitante)/i.test(blob);
}

export async function updatePartidoResult(
  partidoId: string,
  options: {
    try_penal_local: number;
    try_penal_visitante: number;
    actualizarMarcador: boolean;
    puntos_local?: number | null;
    puntos_visitante?: number | null;
  }
): Promise<string | undefined> {
  const patch: Record<string, number | null> = {
    try_penal_local: Math.max(0, options.try_penal_local),
    try_penal_visitante: Math.max(0, options.try_penal_visitante),
  };
  if (options.actualizarMarcador) {
    patch.puntos_local = options.puntos_local ?? null;
    patch.puntos_visitante = options.puntos_visitante ?? null;
  }
  const { error } = await supabase.from('fixture').update(patch).eq('id', partidoId);
  if (!error) return undefined;

  if (isTryPenalColumnsMissingError(error)) {
    if (options.actualizarMarcador) {
      const { error: err2 } = await supabase
        .from('fixture')
        .update({
          puntos_local: options.puntos_local ?? null,
          puntos_visitante: options.puntos_visitante ?? null,
        })
        .eq('id', partidoId);
      if (err2) throw err2;
      return (
        'El marcador se guardó, pero tu proyecto Supabase no tiene las columnas try_penal_local / try_penal_visitante. ' +
        'En SQL Editor ejecutá supabase/migrations/20250326110000_fixture_try_penal.sql y volvé a guardar.'
      );
    }
    throw new Error(
      'Tu proyecto Supabase no tiene las columnas de try penal en fixture. En SQL Editor ejecutá: supabase/migrations/20250326110000_fixture_try_penal.sql'
    );
  }

  throw error;
}

export async function upsertPuntajesJugador(
  rows: Array<{
    jugador_id: string; fecha_id: string; titularidad?: boolean;
    victoria?: boolean; victoria_bonus?: boolean; tries?: number;
    conversiones?: number; penales?: number; drops?: number;
    amarilla?: number; roja?: number; figura_partido?: boolean; puntos_oro?: number;
  }>
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('puntajes_jugador').upsert(rows, { onConflict: 'jugador_id,fecha_id' });
  if (error) throw error;
}

export interface EquipoIdealJugador {
  id: string; nombre: string; apellido: string; club_id: string;
  posicion_id: number; numero_camiseta: number; foto_url?: string;
  activo: boolean; puntos: number;
}

export async function getEquipoIdeal(fechaId?: string): Promise<EquipoIdealJugador[]> {
  const { data, error } = await supabase.rpc('get_equipo_ideal', fechaId ? { fecha_id_param: fechaId } : {});
  if (error) throw error;
  return (data || []) as EquipoIdealJugador[];
}

export async function getRankingFecha(fechaId: string): Promise<RankingUsuario[]> {
  const { data: rows, error } = await supabase.rpc('get_ranking_fecha', { fecha_id: fechaId });
  if (error) throw error;
  const list = (rows || []) as Array<{
    usuario_id: string; posicion: number; puntos_totales: number; puntos_fecha: number;
  }>;
  if (list.length === 0) return [];
  const userIds = [...new Set(list.map(r => r.usuario_id))];
  const { data: usuarios, error: errU } = await supabase
    .from('usuarios').select('id, nombre, apellido, nombre_equipo, avatar_url, puntos_totales').in('id', userIds);
  if (errU) throw errU;
  const userMap = new Map((usuarios || []).map(u => [u.id, u]));
  return list.map(r => ({
    usuario_id: r.usuario_id, posicion: r.posicion,
    puntos_totales: r.puntos_totales, puntos_fecha: r.puntos_fecha,
    usuario: userMap.get(r.usuario_id) ?? undefined,
  })) as RankingUsuario[];
}

export function ultimaFechaCompletada(fechas: Fecha[]): Fecha | null {
  const now = new Date();
  const cerradas = fechas.filter(f => new Date(f.fecha_fin) < now).sort((a, b) => b.numero - a.numero);
  return cerradas[0] ?? null;
}

export function proximaFecha(fechas: Fecha[], estado: EstadoVentanaFecha): Fecha | null {
  if (fechas.length === 0) return null;
  if (estado.estado === 'armar_equipo') return estado.fecha;
  const now = new Date();
  const futuras = fechas.filter(f => new Date(f.fecha_inicio) >= now).sort((a, b) => a.numero - b.numero);
  return futuras[0] ?? fechas[fechas.length - 1];
}
