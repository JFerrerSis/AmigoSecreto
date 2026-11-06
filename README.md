# Amigo Secreto

Aplicación web completa para organizar intercambios de amigo secreto: salas privadas, invitaciones con link, sorteo con exclusiones, revelación privada y notificaciones por correo.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Clerk · Supabase (PostgreSQL + RLS + Realtime) · Resend · Bun · Docker.

---

## Estado del proyecto

Implementado:

- Autenticación obligatoria con Clerk (Google OAuth y correo/contraseña según la configuración de tu instancia).
- Dashboard con salas creadas y salas donde participas.
- Creación de salas con nombre, presupuesto mínimo/máximo, moneda, cupo, fecha límite y notificaciones por correo.
- Link único de invitación (`/join/:code`), con regreso automático a la sala después del login.
- Lista de participantes con actualización en tiempo real (Realtime + polling de respaldo).
- Gestión de exclusiones simétricas entre participantes.
- Sorteo ejecutado únicamente por el organizador.
- Algoritmo de asignación que garantiza: nadie se regala a sí mismo y se respetan todas las exclusiones.
- Persistencia atómica del sorteo en Supabase mediante RPC restringida a `service_role`.
- RLS en `draw_results`: cada usuario solo puede leer la fila donde él es `giver_id`.
- Tarjeta de revelación privada con animación, confetti y presupuesto.
- Emails automáticos con Resend al terminar el sorteo (sin revelar la asignación).
- Toasts, skeletons, estados vacíos y estados de error.
- Dockerfile multi-stage y `docker-compose.yml` con healthcheck.
- Tests unitarios del algoritmo con `bun test`.

Para una prueba funcional completa faltan las credenciales reales de Clerk, Supabase y (opcionalmente) Resend. Los valores de `.env.local` incluidos en este entorno son marcadores de posición y por eso Clerk responde `Invalid host`.

---

## Inicio rápido local

### 1. Requisitos

- Bun 1.4+
- Una instancia de Clerk
- Un proyecto de Supabase
- Opcional: cuenta de Resend con dominio verificado

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Completa `.env.local`:

| Variable | Dónde obtenerla | ¿Se expone al cliente? |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (`http://localhost:3000` en local) | Sí |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys | Sí |
| `CLERK_SECRET_KEY` | Clerk → API Keys | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **No. Solo servidor.** |
| `RESEND_API_KEY` | Resend → API Keys | **No. Solo servidor.** |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend | No |

Nunca subas `.env.local` al repositorio. La `SUPABASE_SERVICE_ROLE_KEY` omite RLS: úsala exclusivamente en las API routes del servidor.

### 3. Base de datos

En el SQL Editor de Supabase ejecuta el archivo completo:

```text
supabase/schema.sql
```

Ese archivo crea:

- `groups`, `group_members`, `exclusions`, `draw_results`.
- Índices, checks y unicidad de parejas.
- Funciones `current_clerk_id`, `is_group_member`, `is_group_creator`.
- Trigger de capacidad máxima para evitar sobrecupo en joins concurrentes.
- RPC `save_draw_results` (solo `service_role`).
- Políticas RLS.
- Publicación de Realtime.

### 4. Ejecutar

```bash
bun install
bun dev
```

Abre `http://localhost:3000`.

Comandos de verificación:

```bash
bun run typecheck
bun run lint
bun test
bun run build
```

---

## Integración de Clerk con Supabase

La app usa Clerk como único proveedor de identidad y Supabase como base de datos. No usa Supabase Auth. La integración recomendada por Supabase es **Clerk como Third-Party Auth**.

### Paso 1 — Crear la aplicación en Clerk

1. Entra a [dashboard.clerk.com](https://dashboard.clerk.com) y crea una aplicación.
2. En **User & Authentication**, habilita los métodos que quieras: Google OAuth y Email/Password.
3. Copia `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` en `.env.local`.

### Paso 2 — Conectar Clerk con Supabase

La forma más rápida:

1. Abre [clerk.com/setup/supabase](https://dashboard.clerk.com/setup/supabase).
2. Sigue el flujo de Clerk para agregar el claim `role: "authenticated"` a la sesión de Clerk.
3. En Supabase: **Authentication → Third-Party Auth → Add provider → Clerk**.
4. Indica el dominio de tu instancia de Clerk (por ejemplo `tu-app.clerk.accounts.dev`).

También puedes hacerlo manualmente:

1. En Clerk, edita el **Session Token** y agrega un claim personalizado:
   - Nombre: `role`
   - Valor: `authenticated`
2. Registra Clerk como proveedor Third-Party Auth en Supabase.

> **Importante:** sin el claim `role: authenticated`, las políticas RLS creadas con `to authenticated` no aplican. El resultado típico es que el dashboard aparece vacío o Supabase responde con permisos insuficientes.

### Paso 3 — Cómo consume la app la sesión de Clerk

El cliente de Supabase se crea con un callback `accessToken` que entrega el token de sesión de Clerk:

```ts
// lib/supabase/client.ts
createClient(url, anonKey, {
  accessToken: async () => (await getToken()) ?? null,
  auth: { persistSession: false, autoRefreshToken: false },
});
```

`useSupabase()` obtiene `getToken` con `useAuth()` de Clerk:

```ts
// hooks/use-supabase.ts
const { getToken } = useAuth();
return createBrowserSupabaseClient(() => getToken());
```

Supabase valida el token de Clerk y ejecuta las consultas con el rol `authenticated`. En las políticas, el ID del usuario se obtiene así:

```sql
auth.jwt() ->> 'sub'
```

Ese valor es el ID de Clerk (`user_...`), por eso las columnas `creator_id`, `user_id`, `giver_id` y `receiver_id` son `text`, no `uuid`.

La app nunca usa el token de Clerk en el servidor para escribir datos sensibles. Las API routes:

1. Verifican la sesión con `auth()` de Clerk.
2. Verifican permisos (por ejemplo, que el creador ejecute el sorteo).
3. Usan `SUPABASE_SERVICE_ROLE_KEY` desde el servidor.
4. Llaman la RPC atómica `save_draw_results`.

### Paso 4 — RLS de resultados

`draw_results` solo tiene política de `SELECT`:

```sql
giver_id = auth.jwt() ->> 'sub'
```

No hay políticas de escritura para clientes. El organizador tampoco puede leer todas las asignaciones. El sorteo se inserta con `service_role` desde el servidor.

### Paso 5 — Realtime

`schema.sql` agrega las tablas a la publicación `supabase_realtime`. El cliente llama:

```ts
await supabase.realtime.setAuth(token);
```

Además, la sala hace un polling silencioso cada 20 segundos como respaldo si Realtime no está disponible.

---

## Cómo funciona el sorteo

1. El organizador debe estar autenticado y ser `groups.creator_id`.
2. La API lee participantes, exclusiones y configuración con `service_role`.
3. `lib/draw.ts` construye un emparejamiento perfecto con el algoritmo de caminos aumentantes de Kuhn:
   - Se eliminan las aristas de auto-regalo.
   - Se eliminan las aristas de exclusiones en ambos sentidos.
   - Se aleatoriza el orden de participantes y candidatos.
   - Si no existe un emparejamiento perfecto, se devuelve un error claro y no se guarda nada.
4. `save_draw_results` bloquea la fila del grupo (`FOR UPDATE`), valida estado, integrantes, auto-regalos y exclusiones, inserta los resultados y marca el grupo como `completed` en una sola transacción.
5. Si `send_emails` está activo, se envían correos con Resend. El correo contiene el link a la sala y el presupuesto, nunca la asignación.
6. Cada participante lee únicamente su fila de `draw_results` gracias a RLS.

Si un correo falla, el sorteo no se revierte: la respuesta indica cuántos correos se enviaron o si Resend no está configurado.

---

## Docker

### Construir y levantar

Con Docker Desktop corriendo:

```bash
bun run docker:up
```

Equivalente:

```bash
docker compose --env-file .env.local up --build -d
```

La app queda en `http://localhost:3000`.

```bash
docker compose --env-file .env.local ps
curl http://localhost:3000/api/health
bun run docker:down
```

El `Dockerfile` usa:

- `oven/bun:1.4.4` para instalar dependencias y compilar.
- `node:22-alpine` como runtime de la build standalone de Next.js.
- Usuario no root.
- Healthcheck contra `/api/health`.

### Variables de build vs runtime

Las variables `NEXT_PUBLIC_*` se incrustan en el bundle del cliente durante el build. Si cambias la publishable key de Clerk, la URL o la anon key de Supabase, **debes reconstruir la imagen**:

```bash
bun run docker:up
```

Las variables secretas (`CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) se pasan en runtime mediante `env_file: .env.local` y no se hornean en la imagen.

Si el puerto 3000 está ocupado:

```powershell
$env:APP_PORT=3001
bun run docker:up
```

Recuerda que `NEXT_PUBLIC_APP_URL` debe coincidir con la URL pública final; en producción no uses `localhost`.

### Error `Invalid host` en Docker o local

Significa que Clerk está recibiendo una publishable key de ejemplo o inválida. Solución:

1. Reemplaza `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` por las de tu instancia real.
2. Reconstruye la imagen si usas Docker.
3. Verifica que el dominio de Clerk esté registrado en Supabase Third-Party Auth.

---

## Emails con Resend

1. Crea una API key en Resend.
2. Verifica un dominio y usa un remitente de ese dominio en `RESEND_FROM_EMAIL`.
3. Con el remitente de pruebas `onboarding@resend.dev`, Resend solo permite enviar a la dirección de tu cuenta.

Si `RESEND_API_KEY` o `RESEND_FROM_EMAIL` faltan, el sorteo se completa correctamente y la UI muestra que los correos no se enviaron.

---

## Estructura

```text
app/
  api/groups/route.ts              Crear sala
  api/groups/join/route.ts         Unirse por código
  api/groups/[id]/draw/route.ts    Ejecutar sorteo + emails
  api/health/route.ts              Healthcheck
  dashboard/page.tsx               Mis salas
  groups/new/page.tsx              Crear sala
  groups/[id]/page.tsx             Sala + revelación
  join/[code]/page.tsx             Invitación
  sign-in, sign-up                 Clerk
components/
  groups/                          Sala, sorteo, exclusiones, revelación
  landing/                         Landing page
  ui/                              Botones, inputs, toasts, diálogos, skeletons
hooks/                             Supabase, datos de sala, copiar link
lib/
  draw.ts                          Algoritmo de emparejamiento
  draw.test.ts                     Tests del algoritmo
  email.ts                         Resend + plantilla HTML
  supabase/                        Cliente browser y admin server
  validation.ts                    Esquemas Zod
supabase/schema.sql                Tablas, RLS, funciones, Realtime
Dockerfile / docker-compose.yml
```

---

## Seguridad

- `draw_results` tiene RLS de lectura solo para el `giver_id`.
- Ningún cliente puede insertar, actualizar o borrar resultados, grupos o participantes directamente.
- El sorteo se ejecuta en el servidor y exige que el usuario autenticado sea el creador.
- `save_draw_results` está revocada para `public`, `anon` y `authenticated`.
- El trigger de capacidad bloquea sobrecupos incluso con joins simultáneos.
- El link de invitación usa un código aleatorio de 9 bytes en base64url.
- Los correos no revelan la asignación.
- La service role key nunca se expone con prefijo `NEXT_PUBLIC_`.

Mejoras recomendadas antes de producción:

- Rate limiting en las API routes.
- Verificación de origen/CSRF adicional si se expone a terceros.
- Restringir la visibilidad del email entre participantes con una vista/RPC si tu política de privacidad lo requiere.
- Observabilidad y alertas para fallos de Resend.

---

## Pruebas

```bash
bun test          # algoritmo del sorteo
bun run typecheck
bun run lint
bun run build
```

Prueba manual recomendada:

1. Crea una sala con la cuenta A.
2. Abre el link de invitación en una ventana incógnito y únete con la cuenta B (y C).
3. Agrega una exclusión entre B y C.
4. Ejecuta el sorteo con A.
5. Verifica que B y C no se asignaron entre sí.
6. Revela en cada cuenta: cada uno debe ver solo su resultado.
7. Confirma que el correo no contiene el nombre del amigo secreto.

---

## Pendiente para una entrega productiva

- Cargar credenciales reales y aplicar `supabase/schema.sql`.
- Verificar dominio de Resend.
- Ejecutar la prueba manual de extremo a extremo con al menos 3 cuentas.
- Añadir rate limiting y monitoreo.
- Opcional: edición de sala, salir de sala, recordatorios y tests E2E.
