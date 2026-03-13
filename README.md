# TOP XV Web

Aplicación web del fantasy rugby **TOP XV**: armá tu equipo de 15 jugadores por fecha, elegí capitán y pateador, y competí en el ranking. Versión web adaptada desde la app móvil (React Native / Expo).

---

## Stack

- **Framework:** Next.js 14 (App Router) con TypeScript
- **UI:** React 18, Tailwind CSS, Framer Motion, Lucide React
- **Backend / Auth:** Supabase (Auth, Postgres, RLS)
- **Imágenes:** Next/Image, Sharp (producción)

---

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) con el proyecto TOP XV configurado (esquema y migraciones del monorepo en `../supabase/`)

---

## Instalación

```bash
cd top-xv-web
npm install
```

### Variables de entorno

Creá `.env.local` en la raíz de `top-xv-web`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Podés usar como referencia `.env.local.example`. Si no definís estas variables, la app usa fallbacks del proyecto (solo para desarrollo local).

---

## Cómo correr la app

### Desarrollo (hot reload)

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### Producción (velocidad real)

Para probar rendimiento similar a producción:

```bash
npm run build
npm run start
```

Luego abrí [http://localhost:3000](http://localhost:3000). La navegación es más rápida al no haber compilación en caliente.

---

## Estructura del proyecto

```
top-xv-web/
├── public/                 # Logo, field.png, camiseta.png
├── src/
│   ├── app/
│   │   ├── (tabs)/         # Pantallas con tabs
│   │   │   ├── inicio/     # Resumen y acceso rápido
│   │   │   ├── mi-equipo/  # Armado del XV, capitán, pateador
│   │   │   ├── ranking/    # General y por fecha
│   │   │   ├── fixture/    # Partidos por fecha
│   │   │   ├── jugadores/  # Listado y búsqueda
│   │   │   ├── mis-datos/  # Perfil
│   │   │   ├── mas/        # Más opciones
│   │   │   ├── admin-puntajes/  # Admin: cargar puntajes
│   │   │   └── admin-partido/   # Admin: cargar resultado partido
│   │   ├── login/          # Login y registro (email + club)
│   │   ├── layout.tsx
│   │   └── page.tsx        # Redirección según auth
│   ├── components/         # RugbyField, PlayerModal, TabScreen, Sidebar, etc.
│   ├── hooks/              # useAuth
│   ├── services/           # API (Supabase client, getFechas, getEquipoFecha, etc.)
│   ├── types/              # Tipos TypeScript
│   └── utils/              # constants, withTimeout
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## Pantallas principales

| Ruta / Tab   | Descripción |
|--------------|-------------|
| **Inicio**   | Resumen, estado de la fecha y acceso rápido a Mi Equipo y Ranking. |
| **Mi Equipo**| Armado del XV por fecha: 15 posiciones, capitán, pateador. Máx. 4 jugadores por club y máx. 4 cambios respecto a la fecha anterior. Cambios resaltados en amarillo. Modo solo lectura cuando la fecha está "en juego". |
| **Ranking**  | General o por fecha activa; tu posición destacada. |
| **Fixture**  | Partidos por fecha con resultado (local / visitante). |
| **Jugadores**| Listado con búsqueda por nombre o club. |
| **Mis datos**| Perfil de usuario. |
| **Más**      | Ajustes y enlaces. |
| **Login**    | Inicio de sesión y registro (nombre, apellido, club, email, contraseña). Misma lógica y colores que la app móvil. |

---

## Base de datos (Supabase)

La configuración de la base (esquema, RLS, migraciones, fixture) está en el directorio **`supabase/`** del monorepo (raíz del repo `top-xv`). Para crear tablas, políticas y datos iniciales, seguí la guía en **`supabase/README.md`**.

La web usa las mismas tablas que la app móvil: `usuarios`, `clubes`, `fechas`, `jugadores`, `equipos_fecha`, `puntajes_jugador`, `fixture`.

---

## Scripts

| Comando           | Uso |
|-------------------|-----|
| `npm run dev`     | Servidor de desarrollo (Next.js). |
| `npm run build`   | Build de producción. |
| `npm run start`   | Servidor de producción (después de `build`). |
| `npm run lint`    | Ejecuta ESLint. |

---

## Reglas de juego (resumen)

- 15 jugadores por fecha (posiciones 1–15).
- Máximo 4 jugadores del mismo club.
- Máximo 4 cambios respecto al equipo de la fecha anterior (si existe).
- Capitán: doble puntaje; pateador: bonificación por conversiones y penales.
- Ventana "armar equipo" y "fecha en juego": la app muestra el estado según `getEstadoVentanaFecha()`.

---

## Deploy (Vercel, Netlify, etc.)

1. Conectá el repo (por ejemplo `top-xv-web`).
2. **Build command:** `npm run build`
3. **Output:** uso por defecto de Next.js (no hace falta indicar carpeta si es un proyecto Next).
4. Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Licencia

Proyecto privado.
