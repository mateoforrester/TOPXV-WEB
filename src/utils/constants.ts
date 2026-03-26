import { PosicionRugby } from '@/types';

export const SPACING = {
  none: 0, tiny: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 40,
} as const;

export const COLORS = {
  bordó: '#6B1C28',
  bordóOscuro: '#8B0000',
  bordóOscuroApp: '#2B0A10',
  azul: '#1E3A8A',
  azulSlate: '#3f4b6d',
  azulReal: '#0000CD',
  amarillo: '#FFD700',
  amarilloOro: '#d4af37',
  naranja: '#FF8C00',
  blanco: '#FFFFFF',
  gris: '#F5F5F5',
  grisOscuro: '#333333',
  placeholder: '#9E9E9E',
  verdeCancha: '#3A8E00',
  verde: '#4CAF50',
  rojo: '#F44336',
};

export const POSICIONES_RUGBY: PosicionRugby[] = [
  { numero: 1, nombre: 'Pilar Izquierdo', categoria: 'Forward', x: 14.5, y: 12 },
  { numero: 2, nombre: 'Hooker', categoria: 'Forward', x: 46.5, y: 12 },
  { numero: 3, nombre: 'Pilar Derecho', categoria: 'Forward', x: 77.5, y: 12 },
  { numero: 4, nombre: 'Segunda Línea Izquierdo', categoria: 'Forward', x: 30.5, y: 25 },
  { numero: 5, nombre: 'Segunda Línea Derecho', categoria: 'Forward', x: 62, y: 25 },
  { numero: 6, nombre: 'Ala Izquierdo', categoria: 'Forward', x: 14, y: 38 },
  { numero: 7, nombre: 'Ala Derecho', categoria: 'Forward', x: 79, y: 38 },
  { numero: 8, nombre: 'Octavo', categoria: 'Forward', x: 46.5, y: 38 },
  { numero: 9, nombre: 'Medio Scrum', categoria: 'Back', x: 30.5, y: 51 },
  { numero: 10, nombre: 'Apertura', categoria: 'Back', x: 62, y: 51 },
  { numero: 11, nombre: 'Wing Izquierdo', categoria: 'Back', x: 14.5, y: 65 },
  { numero: 12, nombre: 'Primer Centro', categoria: 'Back', x: 36.33, y: 65 },
  { numero: 13, nombre: 'Segundo Centro', categoria: 'Back', x: 58.66, y: 65 },
  { numero: 14, nombre: 'Wing Derecho', categoria: 'Back', x: 77.5, y: 65},
  { numero: 15, nombre: 'Fullback', categoria: 'Back', x: 44.5, y: 76 },
];

export const MAX_JUGADORES_MISMO_CLUB = 4;
export const MAX_CAMBIOS_POR_FECHA = 4;
export const HORA_BLOQUEO_VIERNES = 18;

export const NOMBRES_POSICIONES: { [key: number]: string } = {
  1: 'Pilar Izquierdo', 2: 'Hooker', 3: 'Pilar Derecho',
  4: 'Segunda Línea Izq.', 5: 'Segunda Línea Der.',
  6: 'Ala Izquierdo', 7: 'Ala Derecho', 8: 'Octavo',
  9: 'Medio Scrum', 10: 'Apertura', 11: 'Wing Izquierdo',
  12: 'Primer Centro', 13: 'Segundo Centro', 14: 'Wing Derecho', 15: 'Fullback',
};

export const POSICION_A_POSICION_IDS: Record<number, number[]> = {
  1: [1], 2: [2], 3: [1, 3], 4: [4], 5: [4, 5], 6: [6], 7: [6, 7],
  8: [6, 7, 8], 9: [9], 10: [10], 11: [11], 12: [12], 13: [12, 13], 14: [11, 14], 15: [15],
};
