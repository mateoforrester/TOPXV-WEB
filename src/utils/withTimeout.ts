const DEFAULT_MS = 20000;

/**
 * Rejecta si la promesa tarda más de ms en resolverse.
 * Evita loading infinito cuando Supabase/red no responde.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_MS
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('La carga tardó demasiado. Reintenta.')), ms)
    ),
  ]);
}
