'use client';

import Image from 'next/image';
import { POSICIONES_RUGBY } from '@/utils/constants';
import { JugadorPosicion, Jugador, EquipoFecha } from '@/types';
import { RugbyBallIcon } from '@/components/icons/RugbyBallIcon';

interface RugbyFieldProps {
  jugadores: JugadorPosicion[];
  jugadoresData: Record<string, Jugador>;
  onPositionPress: (posicion: number) => void;
  selectedPosicion?: number | null;
  capitanId?: string;
  pateadorId?: string;
  readOnly?: boolean;
  equipoAnterior?: EquipoFecha | null;
}

export default function RugbyField({
  jugadores,
  jugadoresData,
  onPositionPress,
  selectedPosicion = null,
  capitanId,
  pateadorId,
  readOnly = false,
  equipoAnterior = null,
}: RugbyFieldProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: '4/3',
        backgroundImage: 'url(/field.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay muy sutil para no tapar líneas de la cancha */}
      <div className="absolute inset-0 bg-black/[0.05] pointer-events-none" />

      {/* Posiciones con camisetas y números */}
      {POSICIONES_RUGBY.map((pos) => {
        const slot = jugadores.find((j) => j.posicion === pos.numero);
        const jugador = slot?.jugador_id ? jugadoresData[slot.jugador_id] : null;
        const isSelected = selectedPosicion === pos.numero;
        const isCapitan = jugador && capitanId === jugador.id;
        const isPateador = jugador && pateadorId === jugador.id;
        const isEmpty = !jugador;
        const tieneEquipoAnterior = !!(equipoAnterior?.jugadores && equipoAnterior.jugadores.length > 0);
        const anteriorId = tieneEquipoAnterior
          ? equipoAnterior!.jugadores.find((j) => j.posicion === pos.numero)?.jugador_id
          : null;
        const isCambio = !!(tieneEquipoAnterior && jugador && anteriorId !== jugador.id);

        return (
          <button
            key={pos.numero}
            type="button"
            onClick={() => !readOnly && onPositionPress(pos.numero)}
            className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10 ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div
              className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center transition-transform ${
                isSelected ? 'scale-110' : ''
              }`}
            >
              {/* Fondo de camiseta - si es cambio, la camiseta entera se pinta de amarillo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/camiseta.png"
                  alt={`Posicion ${pos.numero}`}
                  fill
                  sizes="56px"
                  className={`object-contain ${
                    isEmpty ? 'opacity-50 grayscale drop-shadow-lg' : 'opacity-100 drop-shadow-lg'
                  }`}
                />
                {isCambio && (
                  <div
                    className="absolute inset-0 rounded-full bg-amber-400/80 pointer-events-none"
                    style={{ mixBlendMode: 'color' }}
                    aria-hidden
                  />
                )}
              </div>
              {/* Número de la camiseta (azul como en mobile) */}
              <span className="relative z-10 text-xs md:text-sm font-extrabold text-azul drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                {pos.numero}
              </span>

              {/* Captain badge: arriba-derecha */}
              {isCapitan && (
                <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-oro-bright flex items-center justify-center shadow-md">
                  <span className="text-[10px] md:text-[11px] font-bold text-bordo-dark">C</span>
                </div>
              )}
              {/* Pateador badge: arriba-izquierda, icono pelota de rugby */}
              {isPateador && (
                <div className="absolute -top-1 -left-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-azul flex items-center justify-center shadow-md text-white">
                  <RugbyBallIcon size={12} className="md:w-3 md:h-[0.65rem]" />
                </div>
              )}
            </div>

            {/* Pastilla azul con nombre */}
            <div className="mt-1 px-2 py-0.5 rounded-full bg-azul">
              <span className="text-[10px] md:text-[11px] text-white font-semibold max-w-[80px] block truncate text-center">
                {jugador ? (jugador.apellido || jugador.nombre) : `#${pos.numero}`}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
