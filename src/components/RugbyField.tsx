'use client';

import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { POSICIONES_RUGBY } from '@/utils/constants';
import { JugadorPosicion, Jugador } from '@/types';

function JerseySlot({
  pos,
  jugador,
  isEmpty,
  isSelected,
  isCapitan,
  isPateador,
  highlightCambio,
  spinOnSelect,
  puntosJugador,
  readOnly,
  onPositionPress,
  onPlayerScoreClick,
}: {
  pos: (typeof POSICIONES_RUGBY)[0];
  jugador: Jugador | null;
  isEmpty: boolean;
  isSelected: boolean;
  isCapitan: boolean;
  isPateador: boolean;
  highlightCambio: boolean;
  spinOnSelect: boolean;
  puntosJugador?: number;
  readOnly: boolean;
  onPositionPress: (posicion: number) => void;
  onPlayerScoreClick?: (jugadorId: string) => void;
}) {
  const prevSpinRef = useRef(false);
  const [spinY, setSpinY] = useState(0);

  useEffect(() => {
    if (spinOnSelect && !prevSpinRef.current) {
      prevSpinRef.current = true;
      // Giro 3D tipo moneda, hacia la derecha (sentido horario).
      setSpinY((prev) => prev + 360);
    }
    if (!spinOnSelect) prevSpinRef.current = false;
  }, [spinOnSelect]);

  return (
    <motion.button
      type="button"
      onClick={() => !readOnly && onPositionPress(pos.numero)}
      className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transformPerspective: 900 }}
      initial={false}
      animate={{
        rotateY: spinY,
      }}
      transition={{
        rotateY: { duration: 0.45, ease: 'linear' },
      }}
    >
      <div className="relative w-12 h-12 md:w-[54px] md:h-[54px] flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/camiseta.png"
            alt={`Posicion ${pos.numero}`}
            fill
            sizes="(min-width: 768px) 54px, 48px"
            className={`object-contain ${
              isEmpty ? 'opacity-50 grayscale drop-shadow-lg' : 'opacity-100 drop-shadow-lg'
            } ${
              highlightCambio
                ? 'sepia saturate-[8] hue-rotate-[345deg] brightness-125 contrast-120'
                : ''
            }`}
          />
          {highlightCambio && (
            <Image
              src="/camiseta.png"
              alt=""
              fill
              sizes="(min-width: 768px) 54px, 48px"
              aria-hidden
              className="object-contain pointer-events-none"
              style={{
                opacity: 0.9,
                mixBlendMode: 'multiply',
                filter:
                  'brightness(0) saturate(100%) invert(78%) sepia(79%) saturate(995%) hue-rotate(359deg) brightness(103%) contrast(105%)',
              }}
            />
          )}
        </div>
        <span className="relative z-10 text-xs md:text-[12px] font-extrabold text-azul drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
          {pos.numero}
        </span>
        {isCapitan && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[10px] md:w-[14px] md:h-[8px] flex items-center justify-center overflow-visible">
            <Image
              src="/captain-band.png"
              alt="Capitán"
              width={18}
              height={10}
              className="object-contain md:scale-[0.78] origin-center"
            />
          </div>
        )}
        {isPateador && (
          <div className="absolute -top-1 -left-1 w-5 h-5 md:w-[18px] md:h-[18px] flex items-center justify-center">
            <Image
              src="/rugby-ball.png"
              alt="Pateador"
              width={24}
              height={24}
              className="object-contain w-5 h-5 md:w-[18px] md:h-[18px]"
            />
          </div>
        )}
      </div>
      <div className="mt-1 px-2 py-1 rounded-full bg-azul flex flex-col items-center gap-0.5 min-w-[84px] md:mt-0.5 md:px-2 md:py-0.5 md:min-w-0 md:max-w-[76px] md:w-max">
        <button
          type="button"
          disabled={!jugador || !onPlayerScoreClick}
          onClick={(e) => {
            e.stopPropagation();
            if (!jugador || !onPlayerScoreClick) return;
            onPlayerScoreClick(jugador.id);
          }}
          className="text-[10px] md:text-[10px] text-white font-semibold max-w-[80px] md:max-w-[74px] px-0 md:px-0.5 leading-tight block truncate text-center"
        >
          {jugador ? (jugador.apellido || jugador.nombre) : `#${pos.numero}`}
        </button>
        {jugador && puntosJugador != null && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!onPlayerScoreClick) return;
              onPlayerScoreClick(jugador.id);
            }}
            className="text-[10px] md:text-[10px] text-oro font-bold leading-none"
          >
            {puntosJugador} pts
          </button>
        )}
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
  changedComparedToPrevious?: number[];
  justSelectedPositions?: number[];
  puntosByJugadorId?: Record<string, number>;
  onPlayerScoreClick?: (jugadorId: string) => void;
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
  changedComparedToPrevious = [],
  justSelectedPositions = [],
  puntosByJugadorId = {},
  onPlayerScoreClick,
  fillOnMobile = false,
}: RugbyFieldProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${
        fillOnMobile
          ? 'flex-1 min-h-[55vh] h-[62vh] aspect-auto md:aspect-[16/9] md:h-auto md:flex-initial md:min-h-[min(72vh,56vw)]'
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
        const highlightCambio = changedComparedToPrevious.includes(pos.numero);
        const spinOnSelect = justSelectedPositions.includes(pos.numero);
        const puntosJugador = jugador ? puntosByJugadorId[jugador.id] : undefined;

        return (
          <JerseySlot
            key={pos.numero}
            pos={pos}
            jugador={jugador}
            isEmpty={isEmpty}
            isSelected={isSelected}
            isCapitan={!!isCapitan}
            isPateador={!!isPateador}
            highlightCambio={highlightCambio}
            spinOnSelect={spinOnSelect}
            puntosJugador={puntosJugador}
            readOnly={readOnly}
            onPositionPress={onPositionPress}
            onPlayerScoreClick={onPlayerScoreClick}
          />
        );
      })}
    </div>
  );
}
