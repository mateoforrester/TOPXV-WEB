export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  club_id?: string;
  nombre_equipo?: string;
  avatar_url?: string;
  puntos_totales: number;
  created_at: string;
  rol?: 'usuario' | 'admin';
}

export interface Jugador {
  id: string;
  nombre: string;
  apellido: string;
  club_id: string;
  club?: Club;
  posicion_id: number;
  numero_camiseta: number;
  foto_url?: string;
  activo: boolean;
  puntaje_total?: number;
  puntajes_fecha?: { [fechaId: string]: number };
}

export interface Club {
  id: string;
  nombre: string;
  logo_url?: string;
  color_principal?: string;
}

export interface Fecha {
  id: string;
  numero: number;
  fecha_inicio: string;
  fecha_fin: string;
  bloqueada: boolean;
  activa: boolean;
}

export interface EquipoFecha {
  id: string;
  usuario_id: string;
  fecha_id: string;
  jugadores: JugadorPosicion[];
  capitan_id?: string;
  pateador_id?: string;
  cambios_realizados: number;
  created_at: string;
  updated_at: string;
}

export interface JugadorPosicion {
  posicion: number;
  jugador_id: string;
  jugador?: Jugador;
}

export interface PuntajeJugador {
  id?: string;
  jugador_id: string;
  fecha_id: string;
  puntos?: number;
  titularidad?: boolean;
  victoria?: boolean;
  victoria_bonus?: boolean;
  tries: number;
  conversiones: number;
  penales: number;
  drops: number;
  amarilla?: number;
  roja?: number;
  figura_partido?: boolean;
  puntos_oro?: number;
}

export interface Partido {
  id: string;
  fecha_id: string;
  club_local_id: string;
  club_visitante_id: string;
  club_local?: Club;
  club_visitante?: Club;
  puntos_local?: number;
  puntos_visitante?: number;
  fecha_partido: string;
}

export interface RankingUsuario {
  usuario_id: string;
  usuario?: Usuario;
  puntos_totales: number;
  posicion: number;
  puntos_fecha?: number;
}

export interface JugadorListado {
  id: string;
  nombre: string;
  apellido: string;
  club_id: string;
  club_nombre: string;
  posicion_id: number;
  activo: boolean;
  puntos_totales: number;
}

export interface PosicionRugby {
  numero: number;
  nombre: string;
  categoria: 'Forward' | 'Back';
  x: number;
  y: number;
}
