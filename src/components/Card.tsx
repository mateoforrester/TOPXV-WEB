'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  onClick,
  className = '',
  dark = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  dark?: boolean;
}) {
  const base = dark
    ? 'bg-white/10 border border-white/10 rounded-2xl'
    : 'bg-white rounded-2xl shadow-sm border border-gray-100';

  if (onClick) {
    return (
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${base} p-4 text-left w-full transition-shadow hover:shadow-md ${className}`}
      >
        {children}
      </motion.button>
    );
  }

  return <div className={`${base} p-4 ${className}`}>{children}</div>;
}
