'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getClubes } from '@/services/api';
import { Club } from '@/types';
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import Image from 'next/image';

const AZUL_GRADIENT = 'linear-gradient(to bottom right, #1E3A8A, #162d6b)';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [clubId, setClubId] = useState('');
  const [clubes, setClubes] = useState<Club[]>([]);
  const [loadingClubes, setLoadingClubes] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false);
  const clubDropdownRef = useRef<HTMLDivElement>(null);

  // Cargar clubes al montar, como en la app mobile
  useEffect(() => {
    getClubes()
      .then(setClubes)
      .catch(() => setClubes([]))
      .finally(() => setLoadingClubes(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clubDropdownRef.current && !clubDropdownRef.current.contains(e.target as Node)) {
        setClubDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        router.push('/inicio');
      } else {
        if (!nombre.trim()) {
          setError('El nombre es obligatorio');
          setLoading(false);
          return;
        }
        if (!clubId) {
          setError('Selecciona tu club');
          setLoading(false);
          return;
        }
        await signUp(email, password, nombre, {
          apellido: apellido || undefined,
          club_id: clubId,
          nombre_equipo: nombreEquipo || undefined,
        });
        setSuccess('Cuenta creada correctamente. Ya podés iniciar sesión.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-bordo-deep to-bordo-dark px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24">
            <Image src="/logo.png" alt="TOP XV" fill className="object-contain" sizes="96px" priority />
          </div>
          <p className="text-oro font-semibold text-lg mt-4 text-center">Armá tu equipo. Sumá puntos.</p>
          <p className="text-oro/90 font-medium text-base mt-1 text-center">Ganá la liga.</p>
        </div>

        <div className="rounded-3xl border border-oro/40 bg-bordo-dark/95 shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-center text-oro mb-1">
            {mode === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
          </h1>
          <p className="text-center text-white/70 text-sm mb-6">
            {mode === 'login' ? 'Ingresa a tu equipo fantasy' : 'Unite al fantasy de rugby'}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-900/40 text-red-100 text-sm rounded-xl border border-red-500/60 p-3 mb-4"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-900/40 text-emerald-100 text-sm rounded-xl border border-emerald-500/60 p-3 mb-4"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <input
                  type="text" placeholder="Nombre *" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oro/40 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
                />
                <input
                  type="text" placeholder="Apellido" value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oro/40 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
                />
                <input
                  type="text" placeholder="Nombre de tu equipo" value={nombreEquipo}
                  onChange={e => setNombreEquipo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-oro/40 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
                />
                <div className="relative" ref={clubDropdownRef}>
                  <button
                    type="button"
                    onClick={() => !loadingClubes && setClubDropdownOpen(!clubDropdownOpen)}
                    disabled={loadingClubes}
                    className="w-full px-4 py-3 rounded-xl border border-oro/40 bg-white/5 text-left text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all flex items-center justify-between disabled:opacity-70"
                  >
                    <span className={!clubId ? 'text-white/50' : ''}>
                      {loadingClubes ? 'Cargando clubes...' : clubId ? clubes.find(c => c.id === clubId)?.nombre ?? 'Seleccionar club' : 'Seleccionar club'}
                    </span>
                    {!loadingClubes && <ChevronDown size={18} className="text-white/70 shrink-0" />}
                  </button>
                  <AnimatePresence>
                    {clubDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-oro/30 bg-[#3d0a14] shadow-xl max-h-56 overflow-y-auto"
                      >
                        {clubes.length === 0 ? (
                          <p className="px-4 py-3 text-white/50 text-sm">No hay clubes cargados</p>
                        ) : (
                          clubes.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setClubId(c.id); setClubDropdownOpen(false); }}
                              className="w-full px-4 py-3 text-left text-white/95 hover:bg-white/10 border-b border-white/10 last:border-0 transition-colors text-sm"
                            >
                              {c.nombre}
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            <input
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-oro/40 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
              required autoComplete="email"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contrasena"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-oro/40 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-oro focus:border-oro transition-all"
                required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white disabled:opacity-60 transition-all hover:opacity-95 active:scale-[0.99]"
              style={{ background: AZUL_GRADIENT }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' ? 'Ingresar' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); setClubDropdownOpen(false); }}
              className="text-sm text-[#1E3A8A] font-semibold hover:underline"
            >
              {mode === 'login' ? 'No tenes cuenta? Registrate' : 'Ya tenes cuenta? Inicia sesion'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
