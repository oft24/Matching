# Matching — Plataforma de Matchmaking para Videojuegos

> Conecta con jugadores que comparten tus objetivos, rango y estilo de juego.

## Arquitectura

```
matching/
├── frontend/          # React 19 + TypeScript + Vite + Tailwind CSS 4
├── backend/           # Node.js + Express 5 + Prisma + PostgreSQL
├── services/python/   # FastAPI (algoritmo de compatibilidad)
└── package.json       # Workspace raíz
```

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js     | 18+     |
| Python      | 3.10+   |
| npm         | 9+      |
| PostgreSQL  | Neon (gratis en la nube) |

## Base de datos gratis (recomendado: Neon)

Para login, registro y perfiles necesitas PostgreSQL en línea. **Recomendamos [Neon](https://neon.tech)** — plan gratis, sin tarjeta, ideal para proyectos estudiantiles.

### Alternativas gratis

| Servicio | Ventaja | URL |
|----------|---------|-----|
| **Neon** (recomendado) | PostgreSQL serverless, fácil con Prisma | https://neon.tech |
| **Supabase** | PostgreSQL + panel visual + auth opcional | https://supabase.com |
| **Railway** | Deploy + PostgreSQL (créditos limitados) | https://railway.app |

### Pasos con Neon

1. Crea cuenta en [neon.tech](https://neon.tech)
2. Crea un proyecto → copia la **Connection string** (modo `Pooled` o `Direct`)
3. Pégala en `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="un-secreto-largo-y-aleatorio"
```

4. Aplica el esquema:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

5. Reinicia el backend (`npm run dev` desde la raíz)

## Instalación

```bash
npm run install:all
pip install -r services/python/requirements.txt
cd backend && npx prisma generate && cd ..
```

Copia `backend/.env.example` a `backend/.env` y configura `DATABASE_URL`.

## Ejecutar

```bash
npm run dev
```

Servicios:
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:4000
- **Python Service** → http://localhost:8001

## Autenticación

La app inicia **deslogueada**. El usuario puede:

- **Iniciar sesión** — botón en header, sidebar o sección Mi Perfil
- **Registrarse** — desde el modal de login (pestaña Registro)
- **Cerrar sesión** — en Mi Perfil, header o sidebar

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Crear cuenta |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Perfil actual (requiere token) |
| POST | /api/auth/logout | Cerrar sesión |

## Otros endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/matchmaking/games | Lista de juegos |
| POST | /api/matchmaking/search | Buscar jugadores compatibles |
| GET | /api/players | Lista de jugadores |
| GET | /api/dashboard | Dashboard (requiere login) |

## Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons
- **Backend**: Node.js, Express 5, Prisma, JWT, bcrypt
- **Base de datos**: PostgreSQL (Neon)
- **Python**: FastAPI, Pydantic (scoring de compatibilidad)
