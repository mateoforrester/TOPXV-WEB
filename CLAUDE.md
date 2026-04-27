# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Instrucciones obligatorias

- Este repo es la **app web** (Next.js). La app mobile relacionada está en el repo **TOPXV**.
- Cada vez que modifiques funcionalidades, endpoints, dependencias o estructura, actualizá el `README.md`.
- Si el cambio afecta comportamiento de usuario, arquitectura, API o seguridad: actualizar sección principal + agregar entrada en **"7. Bitácora técnica"**.
- Si es cambio técnico interno: solo agregar entrada en **"7. Bitácora técnica"**.
- Al cerrar cada tarea, informar explícitamente: **README actualizado: sí/no**.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Production server (requires build first)
npm run lint     # ESLint
```

No test framework is configured.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Architecture

Fantasy rugby web app for the URBA Top 14 league. Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase** (auth + PostgreSQL + RLS). No separate backend — all data access goes through the Supabase SDK in `src/services/api.ts`.

### Key Directories

- `src/app/(tabs)/` — Main dashboard routes (inicio, mi-equipo, ranking, fixture, jugadores, mis-datos, admin-*)
- `src/services/api.ts` — All database queries; single source of truth for Supabase interactions
- `src/services/supabase.ts` — Supabase client setup
- `src/context/AuthContext.tsx` — Global auth state; uses sequence IDs to prevent race conditions
- `src/middleware.ts` — SSR Supabase client; refreshes auth cookies on every request
- `src/types/index.ts` — All TypeScript interfaces
- `src/utils/constants.ts` — Game rules (MAX_CAMBIOS_POR_FECHA, POSICIONES_RUGBY, COLORS)

### Database Schema (Supabase/PostgreSQL)

Main tables: `usuarios`, `clubes`, `fechas`, `jugadores`, `equipos_fecha`, `puntajes_jugador`, `fixture`

View: `v_jugadores_listado` — optimized player listing.

Stored procedures used via `.rpc()`:
- `get_ranking_fecha(fecha_id)`
- `get_equipo_ideal(fecha_id_param)`
- `get_mejor_xv_general_torneo()`
- `get_mejor_xv_general_slots()`

### Game Logic

- Max 4 players per club in a team
- Max 4 substitutions per week (`MAX_CAMBIOS_POR_FECHA`)
- Captain doubles points; Kicker gets conversion/penalty bonuses
- **Window states** (from `getEstadoVentanaFecha()`): `armar_equipo` (editing allowed), `fecha_en_juego` (read-only), `sin_ventana` (no activity)

### Auth Pattern

`AuthContext` wraps auth operations with a 15-second timeout (`withTimeout` util) to avoid hanging on slow Supabase responses. Sequential IDs prevent stale async updates from overwriting newer state.

### Styling

Custom Tailwind colors defined in `tailwind.config.ts`: `bordo` (maroon/primary), `oro` (gold/accent), `azul`, `cream`. Use these instead of the legacy `COLORS` object in `constants.ts`.

Path alias `@/*` resolves to `./src/*`.
