# TOP XV — App Web

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Licencia-Privado-lightgrey?style=flat)]()

App web del fantasy rugby TOP XV, alineada con la app mobile. Permite a los usuarios armar su equipo, ver el ranking, fixture y jugadores desde el navegador. Versión web adaptada desde la app móvil (React Native / Expo).

> **Repo relacionado:** la app mobile está en [TOPXV](../TOPXV).

---

## 0. Índice rápido

- [1. Descripción general](#1-descripción-general)
- [2. Stack tecnológico](#2-stack-tecnológico)
- [3. Arquitectura y estructura](#3-arquitectura-y-estructura)
- [4. Instalación y setup](#4-instalación-y-setup)
- [5. API y endpoints](#5-api-y-endpoints)
- [6. Roadmap y estado](#6-roadmap-y-estado)
- [7. Bitácora técnica](#7-bitácora-técnica)
- [8. Convención de actualización del README](#8-convención-de-actualización-del-readme)
- [Licencia](#licencia)

---

## 1. Descripción general

| Aspecto | Detalle |
|--------|---------|
| **Qué es** | App web (Next.js 14) que consume el mismo backend Supabase que la app mobile. |
| **Propósito** | Versión web del fantasy: armar XV, ver ranking, fixture, jugadores y perfil. |
| **Audiencia** | Usuarios finales del fantasy; administradores con `rol = admin`. |

Comparte el mismo esquema Supabase, RLS y Edge Functions que la app mobile. No tiene backend propio.

---

## 2. Stack tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | **Next.js 14** (App Router) |
| UI | **React 18**, **Tailwind CSS 3** |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Imágenes | next/image + Sharp |
| Auth / datos | @supabase/supabase-js, @supabase/ssr |
| Fechas | date-fns |
| Lenguaje | TypeScript |
| Calidad | ESLint (eslint-config-next) |

---

## 3. Arquitectura y estructura

```
top-xv-web/
├── public/                 # Logo, field.png, camiseta.png
├── src/
│   ├── app/
│   │   ├── (tabs)/           # Páginas principales (inicio, mi-equipo, ranking, jugadores, fixture)
│   │   │   ├── inicio/       # Resumen y acceso rápido
│   │   │   ├── mi-equipo/    # Armado del XV, capitán, pateador
│   │   │   ├── ranking/      # General y por fecha
│   │   │   ├── fixture/      # Partidos por fecha
│   │   │   ├── jugadores/    # Listado y búsqueda
│   │   │   ├── mis-datos/    # Perfil
│   │   │   ├── mas/          # Más opciones
│   │   │   ├── admin-puntajes/   # Admin: cargar puntajes
│   │   │   └── admin-partido/    # Admin: cargar resultado partido
│   │   ├── login/            # Auth (login + registro)
│   │   ├── layout.tsx        # Layout raíz + providers
│   │   └── providers.tsx     # AuthProvider global
│   ├── components/           # RugbyField, TabScreen, ClubLogo, PlayerModal, Sidebar, etc.
│   ├── context/
│   │   └── AuthContext.tsx   # AuthProvider único (sesión Supabase compartida)
│   ├── hooks/
│   │   └── useAuth.ts        # Hook de auth (user + usuario)
│   ├── services/
│   │   ├── supabase.ts       # Cliente Supabase (env sin fallbacks)
│   │   └── api.ts            # Capa de acceso a datos
│   ├── types/
│   │   └── index.ts          # Tipos TypeScript compartidos
│   └── utils/                # constants, withTimeout
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Módulos principales

- **`services/api.ts`**: única capa de llamadas a Supabase (misma estructura que la app mobile).
- **`context/AuthContext.tsx`**: AuthProvider único en layout; una sola sesión para todo el árbol.
- **`hooks/useAuth.ts`**: expone `user` (Supabase Auth) y `usuario` (perfil de la tabla `usuarios`).
- **`app/(tabs)/mi-equipo/page.tsx`**: selector "Ver equipos" para historial por fecha, resaltado amarillo de cambios, desglose de puntos por jugador con chips y modal.
- **`app/(tabs)/inicio/page.tsx`**: modal Mejor XV general + tarjeta de puntos de la última fecha cerrada.
- **`app/(tabs)/ranking/page.tsx`**: ranking general y por fecha con control de `resultados_publicados`.

### Pantallas principales

| Ruta / Tab    | Descripción |
|---------------|-------------|
| **Inicio**    | Resumen, estado de la fecha y acceso rápido a Mi Equipo y Ranking. |
| **Mi Equipo** | Armado del XV por fecha: 15 posiciones, capitán, pateador. Máx. 4 jugadores por club y máx. 4 cambios respecto a la fecha anterior. Cambios resaltados en amarillo. Modo solo lectura cuando la fecha está "en juego". |
| **Ranking**   | General o por fecha activa; tu posición destacada. Sin resultados visibles si `resultados_publicados = false`. |
| **Fixture**   | Partidos por fecha con resultado (local / visitante). |
| **Jugadores** | Listado con búsqueda por nombre o club. |
| **Mis datos** | Perfil de usuario. |
| **Más**       | Ajustes y enlaces. |
| **Login**     | Inicio de sesión y registro (nombre, apellido, club, email, contraseña). Misma lógica y colores que la app móvil. |

### Reglas de juego

- 15 jugadores por fecha (posiciones 1–15).
- Máximo 4 jugadores del mismo club.
- Máximo 4 cambios respecto al equipo de la fecha anterior (si existe).
- Capitán: doble puntaje; pateador: bonificación por conversiones y penales.
- Ventana "armar equipo" y "fecha en juego": la app muestra el estado según `getEstadoVentanaFecha()`.

### Base de datos (Supabase)

La configuración de la base (esquema, RLS, migraciones, fixture) está en el directorio **`supabase/`** del monorepo (raíz del repo `top-xv`). Para crear tablas, políticas y datos iniciales, seguí la guía en **`supabase/README.md`**.

La web usa las mismas tablas que la app móvil: `usuarios`, `clubes`, `fechas`, `jugadores`, `equipos_fecha`, `puntajes_jugador`, `fixture`.

---

## 4. Instalación y setup

### Requisitos

- Node.js 18+
- Proyecto Supabase configurado (mismo que la app mobile)

### Instalar

```bash
cd top-xv-web
npm install
```

### Variables de entorno

Creá `.env.local` en la raíz de `top-xv-web` (podés usar `.env.local.example` como referencia):

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon (pública) |

> ⚠️ El cliente web **no tiene fallbacks**: si faltan las env vars, falla explícitamente en producción.

### Scripts

```bash
npm run dev      # Servidor de desarrollo (hot reload) → http://localhost:3000
npm run build    # Build de producción
npm run start    # Servidor de producción (requiere build previo)
npm run lint     # ESLint
```

> **Tip de rendimiento:** para probar velocidad real antes de deploy, usar `npm run build && npm run start`. La navegación es notablemente más rápida al no haber compilación en caliente.

### Deploy

`npm run build` → deploy en Vercel o cualquier host compatible con Next.js.

1. Conectá el repo.
2. **Build command:** `npm run build`
3. **Output:** directorio por defecto de Next.js (no requiere configuración adicional).
4. Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Checklist de salida a producción

- Registro web: todos los campos obligatorios (`nombre`, `apellido`, `club`, `nombre_equipo`, `email`, `password`).
- Variables web obligatorias configuradas en el host (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- RLS activo y políticas validadas en Supabase para tablas críticas (`usuarios`, `equipos_fecha`, `puntajes_jugador`).
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente (solo server/Edge).
- Edge Function `send-push` con `PUSH_SECRET` definido y `ALLOWED_ORIGIN` restringido al dominio productivo.

---

## 5. API y endpoints

No hay servidor HTTP propio. Toda la API es Supabase (igual que la app mobile):

### Recursos REST principales

| Recurso | Método | Uso |
|---------|--------|-----|
| `usuarios` | GET, PATCH | Perfil, puntos_totales, rol |
| `jugadores` | GET | Listado y filtros |
| `v_jugadores_listado` | GET | Listado con puntos y posiciones elegibles |
| `fechas` | GET | Calendario, fecha activa, `resultados_publicados` |
| `equipos_fecha` | GET, POST, PATCH | XV por usuario y fecha |
| `puntajes_jugador` | GET, upsert | Admin: puntajes |
| `fixture` | GET, PATCH | Fixture y resultados |
| `ranking_general` | GET | Ranking global |

### RPC (Postgres)

| RPC | Descripción |
|-----|-------------|
| `get_ranking_fecha` | Ranking para una fecha específica |
| `get_mejor_xv_general_torneo` | Mejor XV por categorías |
| `get_mejor_xv_general_slots` | Mejor XV en 15 slots fijos |

---

## 6. Roadmap y estado

### Implementado

- ✅ Auth con Supabase (login, registro con validación, sesión compartida)
- ✅ Mi Equipo: historial por fecha con "Ver equipos", resaltado de cambios, desglose de puntos
- ✅ Ranking: modo General y modo Fecha con control de `resultados_publicados`
- ✅ Fixture con logos de club via next/image
- ✅ Modal Mejor XV general con escudo por jugador
- ✅ Tarjeta de puntos en Inicio con acceso directo a Mi Equipo
- ✅ AuthProvider único (sin duplicación de sesiones)
- ✅ Carga paralela (Promise.all) en Ranking e Inicio

### Pendiente

- 🔲 Tests automatizados (unit / e2e)
- 🔲 CI/CD documentado
- 🔲 Paridad mobile en Ranking modo Fecha con `resultados_publicados`

---

## 7. Bitácora técnica

### 2026-04-07 - Web: rendimiento Ranking + logos Inicio

- **Módulo:** top-xv-web
- **Tipo:** perf
- **Resumen:** `getFechaActiva` y `getRanking` en paralelo (Promise.all) en modo General. Logos de club en `ClubLogo` pasan a `next/image`.
- **Archivos clave:** `src/app/(tabs)/ranking/page.tsx`, `src/app/(tabs)/inicio/page.tsx`
- **Migración DB:** no
- **Validación rápida:** Ranking en General → una sola ronda de red paralela; logos visibles en Inicio.

### 2026-04-06 - Web: Ranking modo Fecha y resultados_publicados

- **Módulo:** top-xv-web
- **Tipo:** feature + ux
- **Resumen:** Ranking modo Fecha no invoca `getRanking(fechaId)` ni lista posiciones mientras `resultados_publicados !== true`. Muestra mensaje "Los resultados de esta fecha aún no están publicados".
- **Archivos clave:** `src/app/(tabs)/ranking/page.tsx`
- **Migración DB:** no
- **Validación rápida:**
  1. Fecha activa con `resultados_publicados = false` → mensaje de pendiente, sin filas.
  2. `UPDATE fechas SET resultados_publicados = true` → ranking aparece.

### 2026-03-28 - Limpieza correcta de marcador al borrar resultado

- **Módulo:** top-xv-web + app mobile
- **Tipo:** fix
- **Resumen:** `updatePartidoResult` limpia `puntos_local` y `puntos_visitante` a NULL cuando no hay resultado.
- **Archivos clave:** `src/services/api.ts`
- **Migración DB:** no
- **Validación rápida:** vaciar marcador y guardar → fixture sin puntajes anteriores.

### 2026-03-27 - Web: sin spinner global al volver a la pestaña (auth)

- **Módulo:** top-xv-web
- **Tipo:** ux + fix
- **Resumen:** Si el evento de auth conserva el mismo `user.id`, se llama `loadUserProfile` sin loading global (cubre TOKEN_REFRESHED, SIGNED_IN al volver). Login con usuario nuevo sigue con spinner.
- **Archivos clave:** `src/context/AuthContext.tsx`
- **Migración DB:** no
- **Validación rápida:** login → Mi Equipo → otra pestaña del browser → volver: sin spinner de layout.

### 2026-03-27 - Web: Mi Equipo header con select alineado

- **Módulo:** top-xv-web
- **Tipo:** ux
- **Resumen:** Select de fechas históricas y botón volver comparten fila con el título en desktop. Grilla `1fr auto 1fr` mantiene el título centrado.
- **Archivos clave:** `src/app/(tabs)/mi-equipo/page.tsx`
- **Migración DB:** no
- **Validación rápida:** Mi Equipo con fechas pasadas → alineación correcta en ≥ md y móvil.

### 2026-03-27 - Rendimiento web: auth compartido y carga Inicio

- **Módulo:** top-xv-web
- **Tipo:** refactor + perf
- **Resumen:** AuthProvider único en layout (antes cada `useAuth()` duplicaba `getSession` y suscripción). `getRankingFecha`, `getMejorXVGeneralSlots` y `getFixture` en paralelo en Inicio.
- **Archivos clave:** `src/context/AuthContext.tsx`, `src/app/providers.tsx`, `src/app/layout.tsx`, `src/hooks/useAuth.ts`, `src/app/(tabs)/inicio/page.tsx`
- **Migración DB:** no
- **Validación rápida:** navegar entre pestañas con sesión → sin errores ni timeouts.

### 2026-03-27 - Hardening: cliente sin fallbacks de env vars

- **Módulo:** top-xv-web
- **Tipo:** security
- **Resumen:** Cliente Supabase sin valores por defecto embebidos. Falla explícitamente si faltan `NEXT_PUBLIC_SUPABASE_*`.
- **Archivos clave:** `src/services/supabase.ts`, `src/app/login/page.tsx`
- **Migración DB:** no
- **Validación rápida:** deploy sin env vars → error claro en consola/runtime.

### Plantilla de entrada

```
### AAAA-MM-DD - Título del cambio

- **Módulo:** top-xv-web | shared
- **Tipo:** feature | fix | refactor | security | ux | perf | docs
- **Resumen:** qué cambió (1-2 bullets)
- **Archivos clave:** rutas modificadas
- **Migración DB:** sí (<nombre_archivo.sql>) | no
- **Impacto usuario:** efecto visible
- **Validación rápida:** pasos mínimos para probar
```

---

## 8. Convención de actualización del README

- Todo cambio funcional debe incluir actualización del README en el mismo bloque de trabajo.
- Si cambia comportamiento/arquitectura/API: actualizar sección principal + agregar entrada en **7. Bitácora técnica**.
- Si es cambio técnico interno: solo agregar entrada en **7. Bitácora técnica**.
- Si hay migración SQL o Edge Function: documentar nombre del archivo y efecto operativo.
- Al cerrar cada tarea, informar explícitamente: **README actualizado: sí/no**.

---

## Documentación relacionada

- [supabase/README.md](../TOPXV/supabase/README.md)

---

## Licencia

Proyecto **privado** — todos los derechos reservados.
