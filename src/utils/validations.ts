import { EquipoFecha, JugadorPosicion, Fecha } from '@/types';
import { MAX_JUGADORES_MISMO_CLUB, MAX_CAMBIOS_POR_FECHA, HORA_BLOQUEO_VIERNES } from './constants';

export function validatePosition(jugadores: JugadorPosicion[], posicion: number): boolean {
  return !jugadores.some(j => j.posicion === posicion);
}

export function validateClubLimit(
  jugadores: JugadorPosicion[],
  clubId: string,
  jugadoresData: { [key: string]: { club_id: string } }
): boolean {
  const jugadoresDelClub = jugadores.filter(
    j => jugadoresData[j.jugador_id]?.club_id === clubId
  ).length;
  return jugadoresDelClub < MAX_JUGADORES_MISMO_CLUB;
}

export function validateChanges(
  equipoAnterior: EquipoFecha | null,
  nuevoEquipo: JugadorPosicion[]
): { valid: boolean; cambios: number } {
  if (!equipoAnterior) return { valid: true, cambios: nuevoEquipo.length };
  const jugadoresAnteriores = new Map(
    equipoAnterior.jugadores.map(j => [j.posicion, j.jugador_id])
  );
  const jugadoresNuevos = new Map(nuevoEquipo.map(j => [j.posicion, j.jugador_id]));
  let cambios = 0;
  for (let pos = 1; pos <= 15; pos++) {
    if (jugadoresAnteriores.get(pos) !== jugadoresNuevos.get(pos)) cambios++;
  }
  return { valid: cambios <= MAX_CAMBIOS_POR_FECHA, cambios };
}

export function validateDateLock(fecha: Fecha): boolean {
  if (!fecha.bloqueada) return true;
  const ahora = new Date();
  if (ahora.getDay() === 5 && ahora.getHours() >= HORA_BLOQUEO_VIERNES) return false;
  return ahora < new Date(fecha.fecha_fin);
}

export function validateCaptainAndKicker(
  equipo: JugadorPosicion[],
  capitanId?: string,
  pateadorId?: string
): { valid: boolean; error?: string } {
  if (capitanId && !equipo.some(j => j.jugador_id === capitanId))
    return { valid: false, error: 'El capitán debe estar en el equipo' };
  if (pateadorId && !equipo.some(j => j.jugador_id === pateadorId))
    return { valid: false, error: 'El pateador debe estar en el equipo' };
  return { valid: true };
}

export function validateCompleteTeam(equipo: JugadorPosicion[]): boolean {
  if (equipo.length !== 15) return false;
  const posiciones = equipo.map(j => j.posicion).sort((a, b) => a - b);
  for (let i = 1; i <= 15; i++) {
    if (posiciones[i - 1] !== i) return false;
  }
  return true;
}
