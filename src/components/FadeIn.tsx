'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className = '',
  y = 16,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
