'use client';

import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { POSICIONES_RUGBY } from '@/utils/constants';
import { JugadorPosicion, Jugador, EquipoFecha } from '@/types';

function JerseySlot({
  pos,
  jugador,
  isEmpty,
  isSelected,
  isCapitan,
  isPateador,
  isCambio,
  readOnly,
  onPositionPress,
}: {
  pos: (typeof POSICIONES_RUGBY)[0];
  jugador: Jugador | null;
  isEmpty: boolean;
  isSelected: boolean;
  isCapitan: boolean;
  isPateador: boolean;
  isCambio: boolean;
  readOnly: boolean;
  onPositionPress: (posicion: number) => void;
}) {
  const prevCambioRef = useRef(false);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    if (isCambio && !prevCambioRef.current) {
      prevCambioRef.current = true;
      setSpin(360);
      const t = setTimeout(() => { setSpin(0); }, 400);
      return () => clearTimeout(t);
    }
    if (!isCambio) prevCambioRef.current = false;
  }, [isCambio]);

  return (
    <motion.button
      type="button"
      onClick={() => !readOnly && onPositionPress(pos.numero)}
      className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      initial={false}
      animate={{
        scale: isSelected ? 1.1 : 1,
        rotate: spin,
      }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        rotate: { duration: 0.35 },
      }}
      whileHover={readOnly ? undefined : { scale: (isSelected ? 1.1 : 1) * 1.08 }}
      whileTap={readOnly ? undefined : { scale: 0.95 }}
    >
      <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/camiseta.png"
            alt={`Posicion ${pos.numero}`}
            fill
            sizes="56px"
            className={`object-contain ${isEmpty ? 'opacity-50 grayscale drop-shadow-lg' : 'opacity-100 drop-shadow-lg'}`}
          />
          {isCambio && (
            <div
              className="absolute inset-0 rounded-full bg-amber-400/80 pointer-events-none"
              style={{ mixBlendMode: 'color' }}
              aria-hidden
            />
          )}
        </div>
        <span className="relative z-10 text-xs md:text-sm font-extrabold text-azul drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
          {pos.numero}
        </span>
        {isCapitan && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[10px] flex items-center justify-center">
            <Image src="/captain-band.png" alt="Capitán" width={18} height={10} className="object-contain" />
          </div>
        )}
        {isPateador && (
          <div className="absolute -top-1 -left-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
            <Image src="/rugby-ball.png" alt="Pateador" width={24} height={24} className="object-contain" />
          </div>
        )}
      </div>
      <div className="mt-1 px-2 py-0.5 rounded-full bg-azul">
        <span className="text-[10px] md:text-[11px] text-white font-semibold max-w-[80px] block truncate text-center">
          {jugador ? (jugador.apellido || jugador.nombre) : `#${pos.numero}`}
        </span>
      </div>
    </motion.button>
  );
}

interface RugbyFieldProps {
  jugadores: JugadorPosicion[];
  jugadoresData: Record<string, Jugador>;
  onPositionPress: (posicion: number) => void;
  selectedPosicion?: number | null;
  capitanId?: string;
  pateadorId?: string;
  readOnly?: boolean;
  equipoAnterior?: EquipoFecha | null;
  /** En móvil, la cancha ocupa todo el alto disponible (flex-1). En desktop se mantiene aspect ratio. */
  fillOnMobile?: boolean;
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
  fillOnMobile = false,
}: RugbyFieldProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${
        fillOnMobile
          ? 'flex-1 min-h-0 min-h-[50vh] h-full aspect-auto md:aspect-[16/9] md:h-auto md:flex-initial md:min-h-0 md:min-h-[min(72vh,56vw)]'
          : 'aspect-[16/9] min-h-[min(72vh,56vw)]'
      }`}
      style={{
        backgroundImage: 'url(/field.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 22px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.08)',
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
          <JerseySlot
            key={pos.numero}
            pos={pos}
            jugador={jugador}
            isEmpty={isEmpty}
            isSelected={isSelected}
            isCapitan={!!isCapitan}
            isPateador={!!isPateador}
            isCambio={isCambio}
            readOnly={readOnly}
            onPositionPress={onPositionPress}
          />
        );
      })}
    </div>
  );
}
