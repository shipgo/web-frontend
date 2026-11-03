import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

// Home del portal CUSTOMER (`src/app/domain/roles.js` → `PORTAL_HOME_PATH`).
// Hardcodeado (no importado desde `src/`) para mantener el harness E2E
// autocontenido, mismo criterio que el resto de `e2e/cases/*.js`.
const PORTAL_HOME_PATH = "/portal/envios";

/**
 * SHG-QA-011 — E2E web: Portal cliente (`/portal/*`) + tracking guest.
 *
 * Recorre los 6 casos de la tarea contra el stack real (backend dev + web),
 * mismo patrón que el resto de `e2e/cases/*.js`: cada sub-caso corre en su
 * propio `BrowserContext`, todos corren aunque alguno falle, tabla de
 * resultados al final + falla la corrida si quedó alguno en rojo.
 *
 * **Foco seguridad/autorización (`CONTRACT-007`, `planning/CONTRACTS.md §7`):**
 * los casos 3 y 4 no sólo miran lo que renderiza la UI — capturan la response
 * HTTP cruda (`page.waitForResponse`) del endpoint público de tracking
 * (`GET /api/public/tracking/{codigo}`) y verifican, contra un allowlist
 * explícito de claves, que el backend nunca manda de más (nada de
 * nombre/apellido/email/teléfono/dirección exacta del remitente/receptor).
 *
 * **Datos de seed — verificados EN VIVO contra el backend real al momento de
 * escribir este caso** (mismo drift ya documentado por `SHG-QA-010`: los
 * códigos son `SEED000001`..`SEED000024`, no `SHG-DEV-0001`..`-0024`):
 * - `customer@shipgo.dev` (`GET /api/envio/mios`) es remitente o receptor de
 *   exactamente 6 envíos: `SEED000001` (creado), `SEED000005` (en_sucursal),
 *   `SEED000009` (asignado_a_viaje), `SEED000015` (en_camino), `SEED000018`
 *   (entregado), `SEED000022` (rechazado) — mismo patrón de ids que documenta
 *   `DEV_ENV.md §4` (posiciones -0001/-0005/-0009/-0015/-0018/-0022), sólo
 *   cambió el prefijo del código.
 * - El envío id **2** (`SEED000002`) se confirmó ajeno: `emailRemitente` =
 *   `remitente2@mail.dev`, `emailReceptor` = `receptor2@mail.dev`, ninguno es
 *   `customer@shipgo.dev` — se usa como "envío ajeno" del caso 3.
 *
 * **Hallazgo real durante esta tarea, documentado (no arreglado acá — toca
 * backend, fuera del alcance de este repo/tarea) — ver bitácora del PR para
 * el detalle completo y la severidad:**
 * 1. `GET /api/envio/mios` (`EnvioDTO`, la MISMA lista que consume
 *    `PortalEnviosPage`) expone, dentro de cada `historialEstado[].usuario`,
 *    el registro interno COMPLETO del empleado que hizo cada transición de
 *    estado — DNI, fecha de nacimiento, dirección exacta, teléfono, email,
 *    sexo, tipoDocumento — a un `ROLE_CUSTOMER` autenticado. `EnvioDTO` no
 *    tiene una proyección reducida para el portal, a diferencia de
 *    `PublicTrackingDTO` (que sí es un DTO dedicado sin PII). No afecta a los
 *    6 casos de este archivo (ninguno depende de ese campo ni la UI del
 *    portal lo renderiza), pero es un leak de PII real de personal interno
 *    hacia un cliente externo, visible en la pestaña Network del navegador.
 * 2. `PortalEnvioDetallePage` (`src/features/portal/pages/PortalEnvioDetalle`)
 *    reutiliza a propósito (decisión ya tomada en `SHG-FE-026`, comentario en
 *    el propio archivo) el mismo endpoint público/guest de tracking para
 *    armar el detalle — **sin verificar que el código pertenezca al
 *    CUSTOMER logueado**. Resultado: forzar `/portal/envios/<código ajeno>`
 *    SÍ carga (200), mostrando el mismo subconjunto sin PII que vería
 *    cualquier guest anónimo para ese código (verificado payload crudo, caso
 *    3 abajo) — no es un leak de PII (el DTO público nunca la tuvo), pero SÍ
 *    es una superficie de autorización más laxa que lo que describe
 *    literalmente el caso 3 de esta tarea ("403 / oculto"). El caso 3 de este
 *    archivo por eso verifica DOS rutas distintas para "forzar URL de un
 *    envío ajeno": la ruta de administración (`/envios/:id`, sí bloqueada:
 *    redirect inmediato al portal + `403` real del backend) y la ruta propia
 *    del portal (`/portal/envios/:codigo`, no bloqueada por diseño, pero sin
 *    PII). Documentado con precisión en la bitácora del PR para que el
 *    orquestador decida si amerita una tarea de scoping dedicada
 *    (`GET /api/envio/mios` no acepta filtro por código hoy — no hay forma de
 *    verificar pertenencia sin tocar backend).
 */
export const name = "portal-tracking-guest";

const ENVIO_AJENO_ID = 2;
const ENVIO_AJENO_CODIGO = "SEED000002";
const ENVIO_AJENO_NOMBRE = "Maria";
const ENVIO_AJENO_APELLIDO = "Gomez";
const ENVIO_AJENO_EMAIL_REMITENTE = "remitente2@mail.dev";
const ENVIO_AJENO_EMAIL_RECEPTOR = "receptor2@mail.dev";

const CODIGO_INEXISTENTE = "SEED000999"; // bien formado (6-16 alfanumérico), no existe.
const CODIGO_MAL_FORMADO = "AB1"; // 3 caracteres tras normalizar -> < CODIGO_MIN (6), inválido client-side.

// Allowlist de `PublicTrackingDTO` (`planning/CONTRACTS.md §7` / backend
// `dto/response/PublicTrackingDTO.java`) — cualquier clave fuera de esto es
// "el backend mandó de más".
const ALLOWED_TOP_KEYS = [
  "codigoSeguimiento",
  "estado",
  "estadoLabel",
  "historial",
  "destino",
  "fechaEstimada",
  "ultimaUbicacionAprox",
];
const ALLOWED_DESTINO_KEYS = ["localidad", "provincia"];
const ALLOWED_HISTORIAL_KEYS = ["estado", "fecha"];
const ALLOWED_UBICACION_KEYS = ["lat", "lng", "fecha"];

// Marcadores de PII: si aparecen como CLAVE en cualquier nivel del payload,
// es un leak (nombre/email/teléfono/dirección/DNI del remitente/receptor).
const PII_KEY_MARKERS = [
  "nombre",
  "apellido",
  "email",
  "telefono",
  "prefijo",
  "dni",
  "numeroCalle",
  "nombreCalle",
  "fechaNacimiento",
  "sexo",
  "usuario",
];

const collectKeysRecursive = (value, acc = []) => {
  if (value == null || typeof value !== "object") return acc;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeysRecursive(item, acc));
    return acc;
  }
  Object.entries(value).forEach(([k, v]) => {
    acc.push(k);
    collectKeysRecursive(v, acc);
  });
  return acc;
};

/** Verifica un `PublicTrackingDTO` crudo contra el allowlist de CONTRACT-007. */
function assertNoLeakedPii(body, label) {
  const extraTop = Object.keys(body).filter((k) => !ALLOWED_TOP_KEYS.includes(k));
  if (extraTop.length > 0) {
    throw new Error(`${label}: el payload trae claves de nivel superior no esperadas: ${extraTop.join(", ")}`);
  }
  if (body.destino) {
    const extra = Object.keys(body.destino).filter((k) => !ALLOWED_DESTINO_KEYS.includes(k));
    if (extra.length > 0) {
      throw new Error(`${label}: "destino" trae claves de más (¿dirección exacta?): ${extra.join(", ")}`);
    }
  }
  (body.historial ?? []).forEach((item, i) => {
    const extra = Object.keys(item).filter((k) => !ALLOWED_HISTORIAL_KEYS.includes(k));
    if (extra.length > 0) {
      throw new Error(`${label}: historial[${i}] trae claves de más: ${extra.join(", ")}`);
    }
  });
  if (body.ultimaUbicacionAprox) {
    const extra = Object.keys(body.ultimaUbicacionAprox).filter((k) => !ALLOWED_UBICACION_KEYS.includes(k));
    if (extra.length > 0) {
      throw new Error(`${label}: "ultimaUbicacionAprox" trae claves de más: ${extra.join(", ")}`);
    }
  }
  // Defensa en profundidad: ningún marcador de PII como CLAVE en ningún nivel.
  const allKeys = collectKeysRecursive(body).map((k) => k.toLowerCase());
  const foundMarkers = PII_KEY_MARKERS.filter((marker) => allKeys.includes(marker.toLowerCase()));
  if (foundMarkers.length > 0) {
    throw new Error(`${label}: aparecen claves marcadoras de PII en el payload: ${foundMarkers.join(", ")}`);
  }
  // Defensa en profundidad #2: ningún valor-string es literalmente el
  // nombre completo/email del dueño real del envío ajeno (evita que un campo
  // con otro nombre de clave cuele el mismo dato). Se usa el nombre COMPLETO
  // ("Maria Gomez"), no el nombre o apellido sueltos: el destino real de este
  // envío es "Villa Maria" — chequear "Maria" solo daría un falso positivo
  // contra un dato 100% legítimo (localidad, no PII).
  const serialized = JSON.stringify(body);
  [`${ENVIO_AJENO_NOMBRE} ${ENVIO_AJENO_APELLIDO}`, ENVIO_AJENO_EMAIL_REMITENTE, ENVIO_AJENO_EMAIL_RECEPTOR].forEach(
    (needle) => {
      if (serialized.includes(needle)) {
        throw new Error(`${label}: el payload incluye el valor "${needle}" (PII del envío ajeno)`);
      }
    },
  );
}

const apiGet = async (requestCtx, path) => {
  const resp = await requestCtx.get(`${config.backendBaseUrl}${path}`);
  return resp;
};

const results = [];

async function record(n, label, fn) {
  try {
    await fn();
    results.push({ n, label, status: "PASS" });
  } catch (err) {
    results.push({ n, label, status: "FAIL", error: err.message });
  }
}

export async function run({ browser, logger }) {
  // ── 1. Login customer -> "mis envíos": exactamente sus envíos, ninguno ajeno ──
  await record(1, 'Login customer -> "Mis envíos" muestra exactamente sus envíos reales, ninguno ajeno', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "customer", { logger, caseName: name });

      const miosResp = await apiGet(context.request, "/api/envio/mios?size=50");
      if (!miosResp.ok()) throw new Error(`GET /api/envio/mios -> ${miosResp.status()} (setup del caso 1)`);
      const mios = await miosResp.json();
      const codigosEsperados = mios.content.map((e) => e.codigoSeguimiento).sort();
      if (codigosEsperados.length === 0) {
        throw new Error("customer@shipgo.dev no tiene ningún envío propio en el seed real — no se puede validar el caso");
      }
      if (codigosEsperados.includes(ENVIO_AJENO_CODIGO)) {
        throw new Error(
          `El envío de referencia "ajeno" (${ENVIO_AJENO_CODIGO}) resultó SER del customer -- elegir otra referencia`,
        );
      }

      await page.goto(`${config.webBaseUrl}${PORTAL_HOME_PATH}`);
      await page.getByRole("heading", { name: "Mis envíos" }).waitFor({ timeout: 15_000 });
      await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });
      const codigosRenderizados = (
        await page.locator("table tbody tr td:nth-child(1)").allInnerTexts()
      )
        .map((t) => t.trim())
        .sort();
      await logger.step(page, name, "caso1-mis-envios");

      if (JSON.stringify(codigosRenderizados) !== JSON.stringify(codigosEsperados)) {
        throw new Error(
          `La tabla mostró [${codigosRenderizados.join(", ")}], la API trae [${codigosEsperados.join(", ")}]`,
        );
      }
      if (codigosRenderizados.includes(ENVIO_AJENO_CODIGO)) {
        throw new Error(`La tabla de "Mis envíos" muestra el envío ajeno ${ENVIO_AJENO_CODIGO}`);
      }
    } finally {
      await context.close();
    }
  });

  // ── 2. Detalle de uno de sus envíos -> datos + estado + historial ───────
  await record(2, "Detalle de un envío propio -> datos + estado + historial consistentes con la API", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "customer", { logger, caseName: name });

      const miosResp = await apiGet(context.request, "/api/envio/mios?size=50");
      const mios = await miosResp.json();
      const envioPropio = mios.content[0];
      if (!envioPropio?.codigoSeguimiento) {
        throw new Error("No se encontró un envío propio con código de seguimiento para abrir su detalle");
      }

      await page.goto(`${config.webBaseUrl}${PORTAL_HOME_PATH}`);
      await page.getByRole("heading", { name: "Mis envíos" }).waitFor({ timeout: 15_000 });

      const respPromise = page.waitForResponse(
        (res) => res.url().includes(`/api/public/tracking/${envioPropio.codigoSeguimiento}`),
        { timeout: 15_000 },
      );
      await page
        .getByRole("button", { name: `Ver detalle del envío ${envioPropio.codigoSeguimiento}` })
        .click();
      const resp = await respPromise;
      if (!resp.ok()) throw new Error(`GET /api/public/tracking/${envioPropio.codigoSeguimiento} -> ${resp.status()}`);
      const detalle = await resp.json();

      await page
        .getByRole("heading", { name: `Envío ${envioPropio.codigoSeguimiento}` })
        .waitFor({ timeout: 15_000 });
      await page.getByText("Historial").waitFor({ timeout: 10_000 });

      const itemCount = await page.locator(".mantine-Timeline-item").count();
      const esperados = envioPropio.historialEstado?.length ?? 0;
      if (itemCount !== esperados) {
        throw new Error(
          `El timeline mostró ${itemCount} entrada(s), la API trae ${esperados} en historialEstado (envío ${envioPropio.codigoSeguimiento})`,
        );
      }
      if (detalle.estado !== envioPropio.estado) {
        throw new Error(
          `El detalle público trae estado "${detalle.estado}", "mis envíos" trae "${envioPropio.estado}"`,
        );
      }
      if (detalle.historial.length !== esperados) {
        throw new Error(
          `El payload público trae ${detalle.historial.length} entradas de historial, se esperaban ${esperados}`,
        );
      }
      await logger.step(page, name, "caso2-detalle-envio-propio");
    } finally {
      await context.close();
    }
  });

  // ── 3. Forzar URL de un envío ajeno -> bloqueado (admin) / sin PII (portal) ──
  await record(
    3,
    "Forzar URL de un envío ajeno -> ruta admin bloqueada (403/redirect); ruta portal sin PII (verificado a nivel payload)",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "customer", { logger, caseName: name });

        // 3a — ruta de administración (`/envios/:id`, SU/AD/CH/CA únicamente):
        // el guard de rol redirige a CUALQUIER customer al portal ANTES de
        // renderizar nada (ver `ProtectedRoutes` en `src/app/routes/index.jsx`),
        // y el backend igual devuelve 403 si se lo llama directo.
        await page.goto(`${config.webBaseUrl}/envios/${ENVIO_AJENO_ID}`);
        await page.waitForURL((url) => url.pathname === PORTAL_HOME_PATH, { timeout: 10_000 });
        await logger.step(page, name, "caso3a-admin-route-bloqueada");

        const envioAjenoResp = await apiGet(context.request, `/api/envio/${ENVIO_AJENO_ID}`);
        if (envioAjenoResp.status() !== 403) {
          throw new Error(
            `GET /api/envio/${ENVIO_AJENO_ID} (rol CUSTOMER) debía dar 403, dio ${envioAjenoResp.status()}`,
          );
        }
        const errorBody = await envioAjenoResp.json();
        if (Object.prototype.hasOwnProperty.call(errorBody, "nombre")) {
          throw new Error("El 403 de /api/envio/{id} filtró datos del envío en el body de error");
        }

        // 3b — ruta propia del portal (`/portal/envios/:codigo`): por diseño
        // (SHG-FE-026, ver comentario de cabecera) reutiliza el endpoint
        // público de tracking SIN chequeo de pertenencia — carga 200, pero se
        // verifica a nivel payload crudo que sigue sin exponer PII alguna del
        // dueño real del envío (mismo subconjunto que vería un guest anónimo).
        const respPromise = page.waitForResponse(
          (res) => res.url().includes(`/api/public/tracking/${ENVIO_AJENO_CODIGO}`),
          { timeout: 15_000 },
        );
        await page.goto(`${config.webBaseUrl}${PORTAL_HOME_PATH}/${ENVIO_AJENO_CODIGO}`);
        const resp = await respPromise;
        if (resp.status() !== 200) {
          throw new Error(
            `GET /api/public/tracking/${ENVIO_AJENO_CODIGO} vía portal dio ${resp.status()} (se esperaba 200 dado el diseño actual, documentado en la cabecera)`,
          );
        }
        const body = await resp.json();
        assertNoLeakedPii(body, `caso3b payload /portal/envios/${ENVIO_AJENO_CODIGO}`);
        await page
          .getByRole("heading", { name: `Envío ${ENVIO_AJENO_CODIGO}` })
          .waitFor({ timeout: 15_000 });
        await logger.step(page, name, "caso3b-portal-envio-ajeno-sin-pii");
      } finally {
        await context.close();
      }
    },
  );

  // ── 4. Tracking guest de un envío real -> estado + historial, sin PII ────
  await record(4, "Tracking guest (sin sesión) de un envío real -> estado + historial, payload sin PII", async () => {
    const context = await browser.newContext(); // sin login: contexto limpio, sin cookie de sesión.
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      // Referencia: el mismo envío ajeno (`SEED000002`) sirve para probar el
      // guest — es exactamente la misma superficie pública, sin sesión.
      const respPromise = page.waitForResponse(
        (res) => res.url().includes(`/api/public/tracking/${ENVIO_AJENO_CODIGO}`),
        { timeout: 15_000 },
      );
      await page.goto(`${config.webBaseUrl}/tracking/${ENVIO_AJENO_CODIGO}`);
      const resp = await respPromise;
      if (resp.status() !== 200) throw new Error(`GET /api/public/tracking/${ENVIO_AJENO_CODIGO} (guest) -> ${resp.status()}`);
      const body = await resp.json();
      assertNoLeakedPii(body, `caso4 payload guest /tracking/${ENVIO_AJENO_CODIGO}`);

      await page.getByText(ENVIO_AJENO_CODIGO, { exact: true }).first().waitFor({ timeout: 15_000 });
      await page.getByText("Historial").waitFor({ timeout: 10_000 });
      const itemCount = await page.locator(".mantine-Timeline-item").count();
      if (itemCount !== body.historial.length) {
        throw new Error(`El timeline mostró ${itemCount} entrada(s), el payload trae ${body.historial.length}`);
      }
      await logger.step(page, name, "caso4-tracking-guest-real");

      const whoami = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      if (whoami.ok()) throw new Error("El contexto de guest tenía una sesión activa (no debería)");
    } finally {
      await context.close();
    }
  });

  // ── 5. Tracking guest con código inexistente -> "no encontrado", sin leak/crash ──
  await record(5, "Tracking guest con código inexistente -> mensaje claro, sin leak, sin crash", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      const respPromise = page.waitForResponse(
        (res) => res.url().includes(`/api/public/tracking/${CODIGO_INEXISTENTE}`),
        { timeout: 15_000 },
      );
      await page.goto(`${config.webBaseUrl}/tracking/${CODIGO_INEXISTENTE}`);
      const resp = await respPromise;
      if (resp.status() !== 404) {
        throw new Error(`GET /api/public/tracking/${CODIGO_INEXISTENTE} -> ${resp.status()} (se esperaba 404)`);
      }
      const body = await resp.json();
      if (Object.prototype.hasOwnProperty.call(body, "estado")) {
        throw new Error("El 404 de código inexistente trae un campo \"estado\" (¿leak parcial?)");
      }

      await page.getByText(/No encontramos ese envío/i).waitFor({ timeout: 10_000 });
      await logger.step(page, name, "caso5-codigo-inexistente");
    } finally {
      await context.close();
    }
  });

  // ── 6. Tracking guest con código mal formado -> validación de formato local ──
  await record(6, "Tracking guest con código mal formado -> validación de formato, sin pegarle al backend", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    let hitBackend = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/public/tracking/")) hitBackend = true;
    });
    try {
      await page.goto(`${config.webBaseUrl}/tracking/${CODIGO_MAL_FORMADO}`);
      await page.getByText(/Ingresá un código de seguimiento válido/i).waitFor({ timeout: 10_000 });
      // Margen para confirmar que ninguna request tardía le pegó al backend
      // (la validación es 100% local, ver `TrackingPublicoPage`/`usePublicTracking`).
      await page.waitForTimeout(1_500);
      await logger.step(page, name, "caso6-codigo-mal-formado");

      if (hitBackend) {
        throw new Error("Un código mal formado disparó una request a /api/public/tracking/ (debería validarse sólo client-side)");
      }
    } finally {
      await context.close();
    }
  });

  logger.log(`──────── Tabla de resultados (${name}) ────────`);
  results.forEach((r) => {
    logger.log(`${r.status === "PASS" ? "✔" : "✘"} #${r.n} ${r.label}${r.error ? ` — ${r.error}` : ""}`);
  });

  const failed = results.filter((r) => r.status === "FAIL");
  if (failed.length > 0) {
    throw new Error(
      `${failed.length}/${results.length} caso(s) fallaron: ${failed.map((f) => `#${f.n} (${f.label}): ${f.error}`).join(" | ")}`,
    );
  }
}

export default { name, run };
