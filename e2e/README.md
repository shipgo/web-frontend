# E2E smoke harness (SHG-QA-005)

Scripts de Playwright *headed* (Chrome real) que recorren flujos MVP contra
el stack real (backend dev + web) y dejan evidencia (screenshot + log +
consola/network) por corrida. El foco es **detectar humo** — errores de
consola, responses 4xx/5xx, pantallas rotas — no reemplazar los tests
unitarios (vitest/JUnit).

Esta tarea trae sólo el harness + **1 caso feliz** (`smoke-happy-path`:
login admin → `ListaEnvios` carga con datos del seed). Los casos por
pantalla/flujo son `SHG-QA-006`..`SHG-QA-012`.

## Cómo correrlo

```bash
npm run e2e
# o un solo caso:
npm run e2e -- --case=smoke-happy-path
```

Eso:

1. Chequea si el backend ya responde `UP` en `/actuator/health`. Si no, lo
   levanta (ver "Sin Docker en esta máquina" abajo) y espera a que esté sano.
2. Chequea si ya hay algo respondiendo en `http://localhost:5173`. Si no,
   levanta `vite` (dev server del front).
3. Corre los casos de `e2e/cases/*.js` con Chromium **headed**
   (`headless: false`) — vas a ver la ventana del navegador moverse.
4. Al terminar, hace tear down **sólo** de lo que él mismo levantó (si
   reusó un backend/vite que ya estaban corriendo, los deja como estaban).
5. Deja todo en `e2e/artifacts/<timestamp>/`:
   - `run.log` — log completo de la corrida (incluye stdout del backend/vite
     si el harness los levantó él mismo).
   - `summary.json` — resultado por caso (`pass`/`fail`) + lista de
     `issues` (errores de consola, `pageerror`, responses 4xx/5xx),
     agrupados por tipo. El resumen resaltado también se imprime al final
     del `run.log`/stdout.
   - `<caso>/NN-paso.png` — un screenshot por paso, numerado en orden.

Salida del proceso: exit code `1` si algún caso falló (aserción rota).
Los `issues` de consola/network **no** hacen fallar la corrida por defecto
(el objetivo es resaltarlos, no bloquear) — para que sí la hagan fallar:
`E2E_STRICT=1 npm run e2e`.

## Sin Docker en esta máquina — Maven local + vite dev

`planning/DEV_ENV.md` documenta dos formas de levantar el backend: Docker
(Opción A) o Maven local contra un Postgres ya corriendo (Opción B). **Esta
máquina no tiene Docker instalado**, así que el harness usa Opción B: si
`/actuator/health` no responde, corre

```
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

(`mvnw.cmd` en Windows) en background y espera al health check. El paso de
"levantar backend" está aislado en `e2e/lib/stack.js` detrás de un mapa de
estrategias (`BACKEND_STRATEGIES`) justo para esto: el día que haya Docker
en otra máquina (CI vía `SHG-INFRA-002`, u otra estación de desarrollo)
alcanza con agregar una entrada `docker: { start: (log) => spawnBackground("docker", ["compose", "up", "--build"], ...) }`
y correr con `E2E_BACKEND_STRATEGY=docker npm run e2e` — nada más del
harness cambia.

**Reset de seed entre corridas — limitación conocida sin Docker:** cuando
el harness levanta el backend él mismo (no había uno corriendo), el `ddl-auto=create-drop`
+ `data-dev.sql` de Spring garantizan seed limpio en cada arranque, así que
cada corrida completa (`npm run e2e`) parte de datos frescos. Pero si ya
había un backend corriendo (el caso normal en esta máquina: server real
levantado a mano en `:8080`, seed ya cargado) el harness lo **reusa tal
cual y no lo reinicia** — no hay `docker compose down -v && up` posible sin
Docker, y reiniciar a la fuerza un backend que puede estar siendo usado a
mano sería más disruptivo que útil. El caso feliz de esta tarea es de sólo
lectura (login + listar) así que no le afecta; los casos de `SHG-QA-006..012`
que muevan datos (crear/editar/eliminar) van a necesitar decidir esto caso
por caso — documentado acá como pendiente para esas tareas / para cuando
`SHG-INFRA-002` traiga Docker a CI.

## Headed vs headless

Por defecto corre **headed** (`headless: false`) — así lo pide la tarea,
para poder ver visualmente que la pantalla no está rota. En CI (variable de
entorno `CI` presente, la setea el runner) cae a headless automáticamente
porque no hay display. Para forzarlo manualmente en cualquier entorno:

```bash
E2E_HEADLESS=1 npm run e2e   # fuerza headless
E2E_HEADLESS=0 npm run e2e   # fuerza headed (incluso con CI=1)
```

## Helper de login por rol

`e2e/lib/auth.js` expone `loginAs(page, roleKey, { logger, caseName })`.
Loguea por el **formulario real** (no llama a la API directo), así que
ejercita el flujo tal cual lo usa un usuario. La cookie `AUTH-TOKEN` la
maneja sola el `BrowserContext` de Playwright.

`roleKey` es una clave de `e2e/users.js` (mapeado a los usuarios seed de
`planning/DEV_ENV.md` §3, todos con password `Shipgo123!`):

| roleKey    | username   | rol              |
|---|---|---|
| `super`    | `super`    | `ROLE_SUPERUSER` |
| `admin`    | `admin`    | `ROLE_ADMIN`     |
| `admin2`   | `admin2`   | `ROLE_ADMIN` (sucursal Norte) |
| `chofer`   | `chofer`   | `ROLE_CHOFER` (sólo mobile — helper sirve para probar el guard) |
| `chofer2`  | `chofer2`  | `ROLE_CHOFER` (sucursal Norte) |
| `carga`    | `carga`    | `ROLE_CARGA` (sólo mobile) |
| `customer` | `customer` | `ROLE_CUSTOMER` (portal) |

`loginAs` sólo espera a salir de `/login` — no asume a dónde redirige
(`/` para SU/AD, `/portal/envios` para CUSTOMER, pantalla "usá la app" para
CHOFER/CARGA). El caso que lo llama navega y asere lo que corresponda
después.

## Config / variables de entorno

Todo vive en `e2e/lib/config.js`. Las más relevantes:

| Variable | Default | Uso |
|---|---|---|
| `E2E_WEB_PORT` / `E2E_WEB_URL` | `5173` / `http://localhost:5173` | dónde vive (o se levanta) el dev server |
| `E2E_BACKEND_PORT` / `E2E_BACKEND_URL` | `8080` / `http://localhost:8080` | idem backend |
| `E2E_BACKEND_DIR` | auto-detectado (`../backend` o `../../backend` desde este repo) | checkout de `backend`, para la estrategia `local-maven` |
| `E2E_BACKEND_STRATEGY` | `local-maven` | qué estrategia usar si hace falta levantar el backend |
| `E2E_STARTUP_TIMEOUT_MS` | `120000` | cuánto esperar a que backend/vite respondan sanos |
| `E2E_HEADLESS` | auto (`CI` → headless, si no headed) | forzar headed/headless |
| `E2E_STRICT` | `0` | `1` = la corrida falla si hay algún issue (console/4xx/5xx), no sólo si falló una aserción |

## Cómo agregar un caso nuevo

1. Crear `e2e/cases/<nombre>.js` con esta forma:

   ```js
   import config from "../lib/config.js";
   import { loginAs } from "../lib/auth.js";

   export const name = "mi-caso";

   export async function run({ browser, logger }) {
     const context = await browser.newContext();
     const page = await context.newPage();
     logger.attachPage(page, name); // engancha consola/pageerror/responses

     try {
       await loginAs(page, "admin", { logger, caseName: name });

       await page.goto(`${config.webBaseUrl}/mi-ruta`);
       // ... interacciones ...
       await logger.step(page, name, "descripcion-del-paso"); // screenshot + log

       // aserciones MÍNIMAS — el foco es "no está roto", no cobertura funcional
       if (/* algo no cargó */ false) throw new Error("mensaje claro de qué falló");
     } finally {
       await context.close();
     }
   }

   export default { name, run };
   ```

2. `run.js` lo levanta solo (lee todo `e2e/cases/*.js`) — no hace falta
   registrarlo en ningún lado más.
3. `logger.attachPage(page, name)` es lo que hace que los errores de
   consola y los 4xx/5xx de esa página queden resaltados en el resumen —
   no te olvides de llamarlo en cada `page` nueva que abra el caso.
4. Aserciones mínimas: el objetivo de este harness es humo, no reemplazar
   los tests unitarios — si algo necesita cobertura funcional fina, va en
   vitest/JUnit, no acá.

## Qué no incluye esta tarea (a propósito)

- Los casos de prueba por pantalla — eso es `SHG-QA-006`..`SHG-QA-012`.
- CI: el target es parametrizable (`E2E_*` env vars, `CI` auto-detectado
  para headless) pero engancharlo a un pipeline es `SHG-INFRA-002`.
- Mobile E2E: `SHG-MOB-016`, en `app-mobile`, otro repo.
