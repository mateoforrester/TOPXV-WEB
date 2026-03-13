'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TabScreen({
  children,
  title,
  subtitle,
  headerRight,
  headerExtra,
  showTransition = true,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string | null;
  headerRight?: ReactNode;
  headerExtra?: ReactNode;
  showTransition?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="pt-8 pb-4 px-8 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-oro">{title}</h1>
            {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
            {headerExtra && <div className="mt-3">{headerExtra}</div>}
          </div>
          {headerRight && <div className="ml-4">{headerRight}</div>}
        </header>
        <div className="px-8 pb-8">
          {showTransition ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={title + (subtitle || '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
