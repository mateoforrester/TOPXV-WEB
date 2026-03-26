export const PUNTOS_TRY_PENAL = 7;

/** Bonus ofensivo WR: 4+ tries del equipo (independiente del resultado). */
export function bonusOfensivoEquipo(totalTriesEquipo: number): boolean {
  return totalTriesEquipo >= 4;
}

/** Bonus defensivo WR: pierde por 1 a 7 puntos inclusive. */
export function bonusDefensivoEquipo(
  clubId: string,
  clubLocalId: string,
  clubVisitanteId: string,
  puntosLocal: number,
  puntosVisitante: number,
  hayMarcador: boolean
): boolean {
  if (!hayMarcador) return false;
  if (clubId === clubLocalId) {
    if (puntosLocal >= puntosVisitante) return false;
    const margen = puntosVisitante - puntosLocal;
    return margen >= 1 && margen <= 7;
  }
  if (clubId === clubVisitanteId) {
    if (puntosVisitante >= puntosLocal) return false;
    const margen = puntosLocal - puntosVisitante;
    return margen >= 1 && margen <= 7;
  }
  return false;
}

export function sumarTriesPorClub(
  rows: { club_id: string; tries: number }[],
  clubId: string
): number {
  return rows.filter((r) => r.club_id === clubId).reduce((s, r) => s + r.tries, 0);
}

/** Normaliza punto de oro desde API (boolean o legado numérico). */
export function normalizarPuntoOro(
  raw: boolean | number | null | undefined
): boolean {
  if (raw === true || raw === false) return raw;
  if (typeof raw === 'number') return raw > 0;
  return false;
}
