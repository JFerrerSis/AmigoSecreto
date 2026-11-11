# Amigo Secreto

Aplicación web para organizar intercambios de amigo secreto: salas privadas, invitaciones por link, exclusiones, sorteo y revelación privada del resultado.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TypeScript · Supabase (Postgres + RLS) · `@supabase/supabase-js` · Resend opcional · Bun · Docker.

---

## Arquitectura

```text
Navegador
   │  cookie httpOnly firmada (UUID + HMAC)
   ▼
API Routes de Next.js (servidor)
   │
   ├── pg + DATABASE_URL  ──────────────►  Postgres de Supabase
   │   (rol privilegiado, transacciones)      tablas normalizadas + RLS
   │
   └── @supabase/supabase-js (opcional)
       ├── anon/publishable key  ───────►  REST/Realtime respetando RLS
       └── service role key      ───────►  REST con bypass de RLS
```

- La identidad es local: nombre + correo, sin contraseña. Se guarda en `public.users`.
- La sesión se guarda en una cookie `httpOnly` firmada con HMAC-SHA256: `__Host-amigo_secreto_user` en producción y `amigo_secreto_user` en desarrollo.
- Todo el CRUD pasa por las API routes del servidor. El navegador no escribe directamente en tablas privadas.
- La capa de datos (`lib/db/*`) usa `pg` con la connection string de Supabase para operaciones transaccionales: crear sala, unirse, exclusiones y sorteo.
- Los clientes oficiales de Supabase están configurados en:
  - `lib/supabase/client.ts` (navegador, anon key, respeta RLS).
  - `lib/supabase/server.ts` (servidor; service role opcional).

### ¿Por qué el CRUD no usa la anon key?

La anon/publishable key es **pública**. Con RLS, sin Supabase Auth no puede leer ni escribir tablas privadas. Este proyecto mantiene su propia cookie de sesión y ejecuta el CRUD en el servidor con la connection string de Postgres (rol privilegiado). Las políticas RLS ya están preparadas para una futura migración a Supabase Auth (`authenticated` + `auth.uid()`).

Si quieres usar `@supabase/supabase-js` en el servidor con bypass de RLS, agrega `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, nunca con `NEXT_PUBLIC_`).

---

## Modelo de datos

| Tabla | Propósito |
| --- | --- |
| `users` | Identidades locales (nombre, correo, avatar). |
| `groups` | Salas: presupuesto, moneda, cupo, fecha, estado, creador e invitación. |
| `group_members` | Participantes de cada sala. FK compuesta con `groups`/`users`. |
| `exclusions` | Parejas que no pueden regalarse. FKs compuestas que exigen pertenencia a la sala. |
| `draw_results` | Asignación privada `giver_id → receiver_id`. Una por participante. |
| `email_deliveries` | Historial de correos enviados con Resend (opcional). |

Restricciones destacadas:

- UUIDs con `gen_random_uuid()`.
- `invite_code` único.
- Un participante no puede repetirse en una sala: `unique (group_id, user_id)`.
- Cada `giver` y cada `receiver` aparece una sola vez por sorteo.
- Trigger `enforce_group_capacity` para evitar sobrecupo con joins concurrentes.
- Función `save_draw_results` para guardar el sorteo de forma atómica.
- `created_at`/`joined_at` con `now()`.

---

## Puesta en marcha

### 1. Preparar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Guarda la contraseña de la base de datos.
3. Copia la **Project URL** y la **publishable/anon key** desde **Project Settings → API**.
4. Copia la connection string del **Transaction Pooler** y, si la necesitas para migraciones, la conexión directa.

### 2. Aplicar las migraciones

Con `.env.local` configurado:

```bash
bun run db:migrate
```

El script ejecuta en orden:

- `supabase/migrations/0001_init.sql`: tablas, índices, constraints, triggers, funciones y RLS.
- `supabase/migrations/0002_import_app_state.sql`: importa datos legacy de `public.app_state` (idempotente).
- `supabase/migrations/0003_security_hardening.sql`: bloquea cambios sobre campos inmutables de identidad, pertenencia, resultados y grupos completados.

También puedes pegar los tres archivos en el **SQL Editor** de Supabase, en ese orden.

> `app_state` no se elimina. Consérvala como respaldo hasta validar la migración.

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://TU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_URL=https://TU_REF.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...

# Runtime (Transaction Pooler)
DATABASE_URL=postgresql://postgres.TU_REF:TU_PASSWORD@aws-0-TU_REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
# Migraciones/scripts (conexión directa o Session Pooler)
DIRECT_URL=postgresql://postgres:TU_PASSWORD@db.TU_REF.supabase.co:5432/postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false

COOKIE_SECURE=false

# Obligatorio en producción: mínimo 32 caracteres aleatorios.
SESSION_SECRET=

# Opcional: permite consultar detalles de /api/health con x-health-token.
HEALTH_CHECK_TOKEN=

RESEND_API_KEY=
RESEND_FROM_EMAIL="Amigo Secreto <hola@tudominio.com>"
```

Genera `SESSION_SECRET` con `openssl rand -base64 48` o con PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Opcional, solo si usas `supabase-js` en el servidor con bypass de RLS:

```env
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Desarrollo local

```bash
bun install
bun run db:migrate
bun dev
```

Abre `http://localhost:3000`.

---

## Desplegar en Vercel

### 1. Subir el proyecto

Haz commit y push a tu repositorio. Importa el proyecto en Vercel.

### 2. Configurar variables en Vercel

En **Project Settings → Environment Variables**, crea las variables para **Production**, **Preview** y **Development**:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://topsecretfriend.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://TU_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu publishable/anon key |
| `SUPABASE_URL` | `https://TU_REF.supabase.co` |
| `SUPABASE_ANON_KEY` | tu publishable/anon key |
| `DATABASE_URL` | connection string del **Transaction Pooler** (puerto `6543`, `pgbouncer=true`) |
| `DATABASE_SSL` | `true` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` (el pooler usa cadena autofirmada); `true` si configuras `DATABASE_SSL_CA` |
| `COOKIE_SECURE` | `true` |
| `SESSION_SECRET` | obligatorio, mínimo 32 caracteres aleatorios |
| `HEALTH_CHECK_TOKEN` | opcional, para ver detalles de `/api/health` con `x-health-token` |
| `RESEND_API_KEY` | opcional |
| `RESEND_FROM_EMAIL` | opcional, remitente verificado |
| `SUPABASE_SERVICE_ROLE_KEY` | opcional, solo si usas `supabase-js` server-side con bypass de RLS |

Importante:

- **No uses la conexión directa `db.<ref>.supabase.co:5432` en Vercel.** Puede ser IPv6 y fallar. Usa el Transaction Pooler.
- `DIRECT_URL` solo se necesita para migraciones locales. No la requiere el runtime de Vercel.
- No pongas secretos con prefijo `NEXT_PUBLIC_`.
- Después de agregar o cambiar variables, haz **Redeploy**.

### 3. Aplicar migraciones antes del primer uso

Vercel no ejecuta migraciones automáticamente. Ejecuta una vez desde tu máquina:

```bash
bun run db:migrate
```

O pega `0001_init.sql`, `0002_import_app_state.sql` y `0003_security_hardening.sql` en el SQL Editor de Supabase.

### 4. Verificar

1. Abre `https://topsecretfriend.vercel.app/api/health`.
2. Debe responder `"status":"ok"`. Para ver el detalle de la base de datos, envía el header `x-health-token` con el valor de `HEALTH_CHECK_TOKEN`.
3. Crea una identidad, una sala, invita a otra persona, ejecuta el sorteo y revisa que cada participante vea solo su resultado.

### 5. Consideraciones de producción

- `SESSION_SECRET` es obligatorio en producción. Sin él, la app falla cerrada y no puede firmar sesiones.
- `COOKIE_SECURE=true` exige HTTPS (Vercel ya lo provee).
- El pool de `pg` usa `max: 1` para entornos serverless. El Transaction Pooler de Supabase maneja las conexiones.
- `next.config.ts` aplica CSP, HSTS, `nosniff`, `DENY` para frames, `Permissions-Policy`, `no-store` en APIs y oculta `X-Powered-By`.
- `middleware.ts` fuerza HTTPS, bloquea rutas sensibles y valida el origen de las mutaciones de API.
- Configura `RESEND_FROM_EMAIL` con un dominio verificado en Resend si quieres enviar correos reales.
- Si usas Supabase Auth en el futuro, las políticas RLS ya están definidas para `authenticated` y `auth.uid()`.

---

## Docker

Con Docker Desktop corriendo y `DATABASE_URL` configurada en `.env.local`:

```bash
bun run docker:up
```

La app queda en `http://localhost:3000` y usa Supabase como base de datos. El contenedor ya no monta un volumen local para JSON.

```bash
docker compose --env-file .env.local ps
curl http://localhost:3000/api/health
bun run docker:down
```

Si el puerto 3000 está ocupado:

```powershell
$env:APP_PORT=3001
bun run docker:up
```

---

## Flujo de uso

1. El organizador crea una sala con presupuesto, moneda, cupo y fecha.
2. Comparte el link de invitación (`/join/<invite_code>`).
3. Los participantes crean su identidad local o inician sesión con su correo.
4. El organizador agrega exclusiones opcionales.
5. El organizador ejecuta el sorteo.
6. Cada participante ve únicamente su propia asignación.
7. Si Resend está configurado, se envían correos y se registra el historial en `email_deliveries`.

El algoritmo de `lib/draw.ts` garantiza que nadie se regale a sí mismo y que se respeten las exclusiones. Si no existe una asignación válida, no se guarda nada.

---

## Comandos

```bash
bun run dev
bun run build
bun run start
bun run typecheck
bun run lint
bun test
bun audit
bun run db:migrate
bun run docker:up
bun run docker:down
```

---

## Estructura

```text
app/
  api/session/                     Crear/iniciar identidad y cerrar sesión
  api/groups/                      Crear y listar salas
  api/groups/join/                 Unirse con código
  api/groups/[id]/                 Detalle de sala y resultado privado
  api/groups/[id]/draw/            Ejecutar sorteo
  api/groups/[id]/exclusions/      Gestionar exclusiones
  api/health/                      Healthcheck + estado de DB
components/
  auth/                            Login local
  groups/                          Sala, sorteo, exclusiones, revelación
  landing/                         Landing
  ui/                              Botones, inputs, alertas, toasts
hooks/                             Usuario, datos de sala, copiar link
lib/
  db/pool.ts                       Pool de Postgres (Supabase) y transacciones
  db/users.ts                      Identidades
  db/groups.ts                     Salas, miembros, exclusiones y sorteo
  db/email-deliveries.ts           Historial de correos
  supabase/client.ts               Cliente oficial para navegador (anon)
  supabase/server.ts               Cliente oficial de servidor (service role opcional)
  local/session.ts                 Cookie de sesión firmada
  security/request.ts              IP de cliente y validación de origen
  security/rate-limit.ts           Rate limit en memoria por IP/scope
  draw.ts                          Algoritmo de emparejamiento
  email.ts                         Resend
  validation.ts                    Esquemas Zod
middleware.ts                      HTTPS, rutas bloqueadas y origen
supabase/migrations/
  0001_init.sql                    Esquema, RLS, triggers y funciones
  0002_import_app_state.sql        Importación de datos legacy
  0003_security_hardening.sql      Protección de campos inmutables
scripts/db-migrate.mjs             Runner de migraciones
```

---

## Seguridad y limitaciones

- No hay contraseñas: la identidad local se basa en el correo. Es adecuada para grupos pequeños, no para autenticación sensible.
- La cookie es `httpOnly`, `sameSite=lax`, `secure` en producción y está firmada con HMAC-SHA256. Si cambias `SESSION_SECRET`, todas las sesiones se invalidan.
- La connection string de Postgres es un secreto de servidor y nunca debe llevar prefijo `NEXT_PUBLIC_`. No la subas al repositorio.
- RLS está activo. `anon` no tiene acceso directo a las tablas. `authenticated` solo ve lo que le corresponde si migras a Supabase Auth.
- El resultado del sorteo se filtra en el servidor: cada usuario recibe solo su asignación. Los correos de los participantes solo los ve el organizador.
- Las exclusiones son bidireccionales: si A no puede regalar a B, B tampoco puede regalar a A.
- Solo el creador puede borrar una sala; el borrado se valida en una transacción con `FOR UPDATE`.
- Hay rate limiting en memoria por IP y scope. En serverless no es consistente entre instancias: para protección estricta usa WAF/Redis o un CAPTCHA.
- `middleware.ts` y `next.config.ts` añaden HTTPS, CSP, HSTS, `nosniff`, bloqueo de frames, `no-store` en APIs y bloqueo de rutas sensibles.
- Los esquemas Zod usan `.strict()`, validan UUIDs, longitudes y caracteres de control; los formularios incluyen un honeypot anti-bots.
- Las operaciones críticas usan transacciones y locks (`SELECT ... FOR UPDATE`) para evitar condiciones de carrera.
- TLS cifra el tráfico a Supabase. El pooler usa una cadena autofirmada; si necesitas validación estricta, configura `DATABASE_SSL_CA` y `DATABASE_SSL_REJECT_UNAUTHORIZED=true`.
- `bun audit` queda con un aviso low de `deepmerge` (dependencia transitiva de Resend) sin versión corregida disponible.
