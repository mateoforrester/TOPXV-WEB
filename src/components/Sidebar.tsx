'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Shirt, Trophy, Calendar, Users, User,
  Settings, HelpCircle, ClipboardList, LogOut, ChevronRight, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/mi-equipo', label: 'Mi Equipo', icon: Shirt },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/fixture', label: 'Fixture', icon: Calendar },
  { href: '/jugadores', label: 'Jugadores', icon: Users },
  { href: '/mas', label: 'Mas', icon: User },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, signOut } = useAuth();
  const isAdmin = usuario?.rol === 'admin';

  const handleCerrarSesion = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (e) {
      console.error('Error al cerrar sesion:', e);
      window.location.href = '/login';
    }
  };

  return (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="relative w-10 h-10">
          <Image src="/logo.png" alt="TOP XV" fill className="object-contain" sizes="40px" />
        </div>
        <div>
          <h1 className="text-oro font-bold text-lg leading-tight">TOP XV</h1>
          <p className="text-white/50 text-xs">Fantasy Rugby</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-oro'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </motion.div>
            </Link>
          );
        })}

        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="px-3 text-xs text-white/40 uppercase tracking-wider mb-2">Admin</p>
            <Link href="/admin-puntajes" onClick={onNavigate}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin') ? 'bg-white/15 text-oro' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <ClipboardList size={20} />
                <span>Cargar Puntajes</span>
              </motion.div>
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        {usuario && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-oro/20 flex items-center justify-center text-oro text-xs font-bold">
              {usuario.nombre?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{usuario.nombre}</p>
              <p className="text-white/40 text-xs truncate">{usuario.nombre_equipo || usuario.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleCerrarSesion}
          className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white text-sm w-full rounded-lg hover:bg-white/5 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-bordo-dark flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-bordo-dark z-40 flex items-center px-4 border-b border-white/10">
        <button onClick={() => setMobileOpen(true)} className="text-white/80 hover:text-white p-1">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="relative w-7 h-7">
            <Image src="/logo.png" alt="TOP XV" fill className="object-contain" sizes="40px" />
          </div>
          <span className="text-oro font-bold text-base">TOP XV</span>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-bordo-dark flex flex-col z-50"
            >
              <button onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white p-1">
                <X size={20} />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
