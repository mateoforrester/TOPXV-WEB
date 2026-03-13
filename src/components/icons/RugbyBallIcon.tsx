'use client';

/** Icono de pelota de rugby (oval con costura), blanco por defecto para badges. */
export function RugbyBallIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.65}
      viewBox="0 0 24 16"
      fill="none"
      className={className}
      aria-hidden
    >
      <ellipse cx="12" cy="8" rx="11" ry="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 1.2 Q16 8 12 14.8 M12 1.2 Q8 8 12 14.8" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
