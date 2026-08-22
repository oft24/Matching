# q2play — encuentra con quién jugar

> Conecta con jugadores que comparten tus objetivos, rango y estilo de juego.

## Arquitectura

```
q2play/
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
DIRECT_URL="postgresql://usuario:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
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

La app inicia **deslogueada** y permite entrar con correo y contraseña o con Google. Google funciona como registro e inicio de sesión en un solo paso; las cuentas de correo usan hashes bcrypt y nunca guardan la contraseña en texto plano.

```
Correo + contraseña ──> bcrypt ──> sesión JWT
Botón de Google ──────> ID token ──> verificación RS256 ──> sesión JWT
```

Con Google, entrar y registrarse son la misma acción: si el correo no existe se crea la cuenta, y si ya existe **se enlaza** en lugar de duplicarla. Crear una cuenta nueva requiere aceptar la versión vigente de Términos, Privacidad y Reglas; la fecha y versión quedan registradas en la cuenta.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Crea una cuenta con correo, contraseña y aceptación legal versionada |
| POST | /api/auth/login | Inicia sesión con correo y contraseña |
| POST | /api/auth/google | Canjea el ID token de Google por una sesión |
| GET | /api/auth/config | Si hay base de datos y Google configurados, y el client id |
| GET | /api/auth/me | Perfil actual (requiere token) |
| POST | /api/auth/logout | Cerrar sesión |

El backend **verifica el token localmente**: descarga las claves públicas de Google, comprueba la firma RS256, que el token esté emitido para esta aplicación (`aud`), que venga de Google (`iss`) y que el correo esté verificado. Las claves se cachean respetando el `max-age` de Google y se refrescan solas cuando rotan. Sin dependencias extra: `jsonwebtoken` más el `crypto` de Node.

### Configurar Google

1. En [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) crea un proyecto
2. Configura la **pantalla de consentimiento** (tipo *External*, con nombre de app y correo de contacto)
3. **Crear credenciales → ID de cliente de OAuth → Aplicación web**
4. En **Orígenes autorizados de JavaScript** añade las URLs desde las que se sirve la app:

```
http://localhost:5173
https://q2play.vercel.app
```

5. Copia el **Client ID** a `backend/.env`:

```env
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_AUTH_ENABLED="true"
```

Antes de activar Google, agrega `https://q2play.vercel.app` a los **Authorized
JavaScript origins** del cliente OAuth. Mientras `GOOGLE_AUTH_ENABLED` no sea
`true`, q2play oculta ese botón y mantiene disponible el acceso por correo.

> No hace falta el *client secret*: el flujo usa ID tokens, no el intercambio por código. El client id es público y el frontend lo pide a `/api/auth/config`, así que **no** se compila dentro del bundle ni necesita una variable `VITE_`.
>
> Los **orígenes** deben coincidir exactamente, incluido el puerto. Es la causa habitual del error `origin_mismatch`.

### Validar

```bash
npm run db:verify   # conexión + las 8 tablas esperadas
```

## Discord privado por match

q2play usa Discord sólo después de que ambas personas aceptan el match. El flujo OAuth pide `identify` y `guilds.join`, agrega al jugador al servidor mediante el bot y no lee mensajes ni contactos.

La autorización usa PKCE con la aplicación marcada como **Public Client**, así que no se almacena `DISCORD_CLIENT_SECRET`.

1. En Discord Developer Portal, abre la aplicación del bot y activa **Public Client**.
2. En OAuth2 añade el redirect exacto:

```text
https://q2play.vercel.app/api/connections/discord/callback
```

3. Configura estas variables:

```env
DISCORD_CLIENT_ID="application-id-publico"
DISCORD_BOT_TOKEN="token-secreto-del-bot"
DISCORD_GUILD_ID="id-del-servidor"
DISCORD_CATEGORY_ID="id-de-matches-privados"
DISCORD_CHANNEL_TTL_HOURS="12"
DISCORD_REDIRECT_URI="https://q2play.vercel.app/api/connections/discord/callback"
APP_URL="https://q2play.vercel.app"
```

Al confirmar un match, ambos usuarios deben haber autorizado Discord. El bot crea una voz `duo-usuario-usuario` con límite de 2, niega `View Channel` a `@everyone`, autoriza sólo a los dos miembros y elimina el canal al cerrar el match o vencer el TTL. La estructura y reglas operativas están en `assets/discord/SERVER_SETUP.md`.

## Migraciones y despliegue

El build del backend (`npm run build --prefix backend`) hace dos cosas: genera el cliente de Prisma y **aplica las migraciones pendientes** con `scripts/applySchema.js`.

Antes solo generaba el cliente, así que cada cambio de esquema llegaba a producción contra una base sin actualizar y tumbaba la API. Las migraciones listadas en `REPEATABLE` están escritas para poder ejecutarse en cada despliegue sin efecto (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`), y se aplican por `directUrl` para no pasar DDL por el pooler.

**Al añadir una migración nueva**, escríbela de forma idempotente y añade su carpeta a `REPEATABLE` en [applySchema.js](backend/scripts/applySchema.js). Si el build corre sin `DIRECT_URL` ni `DATABASE_URL`, omite el paso en vez de fallar.

```bash
npm run db:apply --prefix backend   # aplicarlas a mano contra el .env actual
```

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
- **Backend**: Node.js, Express 5, Prisma, JWT, Google Identity Services, Discord OAuth2 PKCE
- **Base de datos**: PostgreSQL (Neon)
- **Python**: FastAPI, Pydantic (scoring de compatibilidad)
