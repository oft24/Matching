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

La app inicia **deslogueada**. El registro exige **confirmar el correo con un código de 6 dígitos** antes de poder entrar.

```
Registro ──> código al correo ──> Verificar ──> sesión iniciada
                                      ▲
Login (cuenta sin verificar) ─────────┘
```

- **Registrarse** — usuario, email y contraseña. La cuenta queda pendiente y **no** se inicia sesión: se envía un código que caduca en **10 minutos**.
- **Verificar** — seis casillas (acepta pegar el código completo). Máximo **5 intentos** por código; reenvío disponible cada **60 segundos**.
- **Iniciar sesión** — email y contraseña. Si la cuenta aún no está verificada, el backend responde `403`, reenvía el código y la interfaz salta al paso de verificación.
- **Cerrar sesión** — en Mi Perfil, header o sidebar.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Crear cuenta y enviar código (no devuelve token) |
| POST | /api/auth/verify-email | Confirmar el código → devuelve token |
| POST | /api/auth/resend-code | Reenviar código (429 si aún hay espera) |
| POST | /api/auth/login | Iniciar sesión (403 si falta verificar) |
| GET | /api/auth/config | Si hay base de datos y correo configurados |
| GET | /api/auth/me | Perfil actual (requiere token) |
| POST | /api/auth/logout | Cerrar sesión |

Los códigos se guardan **hasheados** con bcrypt en la tabla `VerificationCode`; nunca viajan al cliente ni quedan en claro en la base de datos.

### Envío de correo

[mailService.js](backend/src/services/mailService.js) admite dos proveedores y elige solo: usa **Brevo** si existe `BREVO_API_KEY`, y si no **Resend** con `RESEND_API_KEY`. `GET /api/auth/config` dice cuál está activo.

Ningún proveedor de correo transaccional deja escribir a desconocidos sin demostrar antes que controlas la dirección o el dominio desde el que envías. La diferencia está en cómo se demuestra:

| | Verificación | Gratis | Entregabilidad |
|---|---|---|---|
| **Brevo** | Una sola dirección, sin dominio | 300/día | Aceptable |
| **Resend** | Dominio completo (DKIM/SPF) | 3000/mes | Mejor |

#### Brevo — sin dominio propio

1. Crea cuenta en [brevo.com](https://brevo.com)
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: pon tu correo y confirma el enlace que te llega
3. **SMTP & API → API Keys** → genera una clave
4. En `backend/.env`:

```env
BREVO_API_KEY="xkeysib-xxxxxxxx"
MAIL_FROM="Matching <tu-correo-verificado@gmail.com>"
```

> `MAIL_FROM` debe coincidir **exactamente** con el remitente verificado, o Brevo rechaza el envío.

#### Resend — con dominio propio

Verifica el dominio en [resend.com/domains](https://resend.com/domains), añade los registros DKIM/SPF en tu DNS y usa una dirección de ese dominio en `MAIL_FROM`. El remitente de pruebas `onboarding@resend.dev` funciona sin dominio pero **solo entrega al correo dueño de la cuenta**.

**Sin ninguna clave** el flujo sigue siendo usable en desarrollo: el código se imprime en la consola del backend y la interfaz avisa dónde encontrarlo.

### Validar el flujo

```bash
npm run db:verify         # conexión + las 9 tablas esperadas
npm run db:validate-auth  # registro → código → verificación → login, de punta a punta
```

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
- **Backend**: Node.js, Express 5, Prisma, JWT, bcrypt
- **Base de datos**: PostgreSQL (Neon)
- **Python**: FastAPI, Pydantic (scoring de compatibilidad)
