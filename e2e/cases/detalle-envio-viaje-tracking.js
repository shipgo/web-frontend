import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * SHG-QA-010 — E2E web: Detalle de envío/viaje + tracking en vivo (mapa / SSE).
 *
 * Recorre los 5 casos de la tarea contra el stack real (backend dev + web),
 * mismo patrón que el resto de `e2e/cases/*.js`: cada sub-caso corre en su
 * propio `BrowserContext`, todos corren aunque alguno falle, tabla de
 * resultados al final + falla la corrida si quedó alguno en rojo.
 *
 * **Datos de seed — drift real detectado (documentado, no se toca `planning/`
 * desde acá; el orquestador actualiza `DEV_ENV.md`):** este backend real
 * lleva encadenadas muchas corridas de e2e de otras tareas (crear-envio,
 * crear-viaje, otro worker QA corriendo en paralelo) sin reset posible (sin
 * Docker en esta máquina, ver `e2e/README.md`). Al momento de escribir este
 * caso, el estado real difiere del documentado en `DEV_ENV.md` §4:
 * - Los códigos de seguimiento del seed son `SEED000001`..`SEED000024`, no
 *   `SHG-DEV-0001`..`SHG-DEV-0024` — se usa el envío id 1 (`SEED000001`) como
 *   equivalente real más cercano al caso 1 de la tarea.
 * - El viaje `en_camino` con track GPS es hoy el id **1** (patente `AA222AA`),
 *   no el id 2 (que está en estado `con_problemas`) — se usa el id 1 para los
 *   casos 2/3. Sólo tiene 2 puntos de historial (no 8): la aserción del caso 2
 *   compara contra el conteo real vía API en el momento de la corrida, no un
 *   número fijo.
 * - No existe ningún viaje en estado `planificado` en este momento (todos los
 *   viajes libres de esta franja fueron consumidos por corridas previas). Se
 *   usa el viaje id **4** (`cancelado`, sin ningún punto GPS ni recorridos
 *   cargados) para el caso 4 — mismo comportamiento bajo prueba (mapa sin
 *   tracking, sin crash), estado real distinto al de la doc.
 * - Ninguno de estos casos toca los viajes id 1/2 de forma destructiva (sólo
 *   lecturas vía API + UI); el caso 3 sí agrega UN punto GPS nuevo al viaje 1
 *   posteando como el chofer real asignado (`POST /api/tracking/location`) —
 *   efecto aditivo idéntico a lo que haría el chofer real manejando, nunca
 *   cambia su estado ni cancela/edita nada.
 *
 * **Bug real encontrado y arreglado en esta tarea (dentro de alcance de esta
 * pantalla) — `ViajeMapa` (`DetalleViaje/components/ViajeMapa.jsx`):**
 * el mini-mapa de `DetalleViaje` sólo pedía la última ubicación conocida
 * (`GET /api/tracking/viaje/{id}/last`) y nunca el historial completo
 * (`GET /api/tracking/viaje/{id}/historial`, ya expuesto por `trackingApi` —
 * `SHG-BE-015`) — el caso 2 de esta tarea ("mapa con los 8 puntos GPS
 * trazados") no podía pasar nunca contra el código anterior, con cualquier
 * cantidad de puntos. Se agregó `historialQuery` a `useViajeDetalle` y
 * `ViajeMapa` ahora traza el recorrido completo (polyline `Source`/`Layer`,
 * mismo patrón que `MapRoute.jsx` del mapa en vivo) además del marker de
 * última posición. De paso, el mensaje "sin ubicación GPS" estaba acotado a
 * `estado === 'en_camino'` (nunca aparecía para un viaje `planificado` sin
 * GPS, caso 4 de esta tarea) — se generalizó a "no hay tracking" sin
 * importar el estado. Tests unitarios (`DetalleViaje/index.test.jsx`)
 * actualizados con el mock de `getHistorial` + `Source`/`Layer`.
 */
export const name = "detalle-envio-viaje-tracking";

const VIAJE_EN_CAMINO_ID = 1; // patente AA222AA, chofer `chofer` (ver comentario de cabecera)
const VIAJE_SIN_TRACKING_ID = 4; // cancelado, sin recorridos ni GPS
const ENVIO_ID = 1; // SEED000001

const results = [];

async function record(n, label, fn) {
  try {
    await fn();
    results.push({ n, label, status: "PASS" });
  } catch (err) {
    results.push({ n, label, status: "FAIL", error: err.message });
  }
}

const apiGet = async (requestCtx, path) => {
  const resp = await requestCtx.get(`${config.backendBaseUrl}${path}`);
  if (!resp.ok()) throw new Error(`GET ${path} -> ${resp.status()}`);
  return resp.json();
};

export async function run({ browser, logger }) {
  // ── 1. DetalleEnvio -> datos + historial de estados consistentes ────────
  await record(1, `DetalleEnvio id ${ENVIO_ID} -> datos + historial consistentes`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "admin", { logger, caseName: name });

      const envio = await apiGet(context.request, `/api/envio/${ENVIO_ID}`);

      await page.goto(`${config.webBaseUrl}/envios/${ENVIO_ID}`);
      await page.getByRole("heading", { name: "Detalle de envío" }).waitFor({ timeout: 15_000 });

      await page
        .getByText(`Código de seguimiento: ${envio.codigoSeguimiento}`)
        .waitFor({ timeout: 10_000 });

      const nombreCompleto = `${envio.nombre ?? ""} ${envio.apellido ?? ""}`.trim();
      if (nombreCompleto) {
        await page.getByText(nombreCompleto, { exact: true }).first().waitFor({ timeout: 10_000 });
      }

      await page.getByText("Historial de estados").waitFor({ timeout: 10_000 });
      const items = page.locator('[data-testid="historial-estado-item"]');
      await items.first().waitFor({ timeout: 10_000 });
      const itemCount = await items.count();
      const esperados = envio.historialEstado?.length ?? 0;
      if (itemCount !== esperados) {
        throw new Error(
          `El historial mostró ${itemCount} entrada(s), la API trae ${esperados} (envío ${envio.codigoSeguimiento})`,
        );
      }
      await logger.step(page, name, "caso1-detalle-envio-historial");
    } finally {
      await context.close();
    }
  });

  // ── 2. DetalleViaje en_camino -> mapa con los puntos GPS trazados ───────
  await record(
    2,
    `DetalleViaje id ${VIAJE_EN_CAMINO_ID} (en_camino) -> mapa con el track GPS trazado`,
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });

        const historialPrevio = await apiGet(
          context.request,
          `/api/tracking/viaje/${VIAJE_EN_CAMINO_ID}/historial`,
        );
        if (historialPrevio.length < 1) {
          throw new Error(
            `El viaje ${VIAJE_EN_CAMINO_ID} no tiene ningún punto GPS en el historial real — no se puede validar el trazado`,
          );
        }

        await page.goto(`${config.webBaseUrl}/viajes/${VIAJE_EN_CAMINO_ID}`);
        await page.getByRole("heading", { name: "Detalle de viaje" }).waitFor({ timeout: 15_000 });
        await page.getByText("Mapa del viaje").waitFor({ timeout: 15_000 });

        // El track se pinta async (queries de tracking); se espera a que el
        // contenedor refleje AL MENOS los puntos que ya existían al arrancar
        // el caso (`>=`, no `===`: puede haber llegado algún punto más real
        // entre medio — chofer real u otro proceso — sin que eso sea un fallo).
        await page.waitForFunction(
          (min) => {
            const el = document.querySelector('[data-testid="viaje-mapa-track"]');
            return !!el && Number(el.dataset.trackPuntos) >= min;
          },
          historialPrevio.length,
          { timeout: 20_000 },
        );
        // Margen para que Mapbox GL termine de pintar los tiles/la polyline
        // antes de la captura (si no, el screenshot puede salir con el mapa
        // en blanco aunque el track ya esté cargado en el DOM/mapa lógico).
        await page.waitForTimeout(1_500);
        await logger.step(page, name, "caso2-mapa-track-gps");

        const sinUbicacionesVisible = await page
          .getByText(/Sin ubicaciones GPS/i)
          .count();
        if (sinUbicacionesVisible > 0) {
          throw new Error(
            'El mensaje "Sin ubicaciones GPS..." apareció aunque el viaje tiene track real (no debería)',
          );
        }
      } finally {
        await context.close();
      }
    },
  );

  // ── 3. Stream SSE del viaje en_camino -> llegan puntos + snapshot progreso/ETA ──
  await record(
    3,
    `Mapa en vivo, viaje id ${VIAJE_EN_CAMINO_ID} -> SSE entrega location-update + snapshot progreso/ETA sin errores`,
    async () => {
      const context = await browser.newContext();
      // Engancha el `EventSource` global ANTES de que cargue el bundle de la
      // app, para poder esperar realmente a que llegue el evento
      // `location-update` real (no un timeout ciego) sin tocar el código de
      // producción.
      await context.addInitScript(() => {
        window.__sseMessages = [];
        const OriginalEventSource = window.EventSource;
        window.EventSource = new Proxy(OriginalEventSource, {
          construct(target, args) {
            const es = new target(...args);
            const track = (type) => (ev) => {
              window.__sseMessages.push({ type, data: ev.data ?? null });
            };
            ["subscribed", "location-update", "viaje-iniciado", "viaje-finalizado"].forEach((type) =>
              es.addEventListener(type, track(type)),
            );
            return es;
          },
        });
      });

      const page = await context.newPage();
      logger.attachPage(page, name);
      let choferContext;
      try {
        await loginAs(page, "admin", { logger, caseName: name });

        await page.goto(`${config.webBaseUrl}/mapa`);
        await page.getByText("En vivo").waitFor({ timeout: 20_000 });
        await logger.step(page, name, "caso3-sse-conectado");

        const patente = (await apiGet(context.request, `/api/viaje/${VIAJE_EN_CAMINO_ID}`)).vehiculo
          ?.patente;
        if (!patente) throw new Error(`No se encontró patente para el viaje ${VIAJE_EN_CAMINO_ID}`);

        await page.getByText(patente, { exact: true }).first().waitFor({ timeout: 20_000 });
        await page.getByText(patente, { exact: true }).first().click();
        await page.getByText("Progreso").waitFor({ timeout: 15_000 });
        await logger.step(page, name, "caso3-panel-progreso-eta");

        // Snapshot de progreso real (`SHG-BE-015`) para contrastar contra el badge.
        const estadoViaje = await apiGet(
          context.request,
          `/api/tracking/viaje/${VIAJE_EN_CAMINO_ID}/estado`,
        );
        const badgeParadas = page.getByText(
          `${estadoViaje.paradasEntregadas}/${estadoViaje.paradasTotales} paradas`,
        );
        await badgeParadas.waitFor({ timeout: 10_000 });

        // Chofer real asignado al viaje reporta UNA ubicación nueva (mismo
        // efecto que su app mobile posteando en vivo) para forzar un evento
        // SSE real y verificar que el front lo recibe y no cuelga.
        choferContext = await browser.newContext();
        await choferContext.request.post(`${config.backendBaseUrl}/api/login`, {
          form: { username: "chofer", password: config.seedPassword },
        });
        const nuevoPunto = {
          viajeId: VIAJE_EN_CAMINO_ID,
          latitud: estadoViaje.ultimaUbicacion?.lat != null ? estadoViaje.ultimaUbicacion.lat - 0.01 : -31.5,
          longitud:
            estadoViaje.ultimaUbicacion?.lng != null ? estadoViaje.ultimaUbicacion.lng - 0.01 : -64.25,
          velocidad: 42,
        };
        const postLocation = await choferContext.request.post(
          `${config.backendBaseUrl}/api/tracking/location`,
          { data: nuevoPunto },
        );
        if (!postLocation.ok()) {
          throw new Error(`POST /api/tracking/location -> ${postLocation.status()} (setup del caso 3)`);
        }

        await page.waitForFunction(
          (viajeId) =>
            window.__sseMessages.some((m) => {
              if (m.type !== "location-update" || !m.data) return false;
              try {
                return JSON.parse(m.data).viajeId === viajeId;
              } catch {
                return false;
              }
            }),
          VIAJE_EN_CAMINO_ID,
          { timeout: 20_000 },
        );
        await logger.step(page, name, "caso3-location-update-recibido");
      } finally {
        if (choferContext) await choferContext.close();
        // Navega fuera de `/mapa` para desmontar `TrackingProvider` y que
        // `useTrackingStream` cierre el `EventSource` por su propio cleanup
        // (no dejar la conexión SSE colgada al terminar el caso).
        await page.goto("about:blank").catch(() => {});
        await context.close();
      }
    },
  );

  // ── 4. DetalleViaje sin tracking -> mapa sin puntos, mensaje "sin ubicaciones" ──
  await record(
    4,
    `DetalleViaje id ${VIAJE_SIN_TRACKING_ID} (sin tracking) -> mapa sin puntos + mensaje, sin error`,
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });

        await page.goto(`${config.webBaseUrl}/viajes/${VIAJE_SIN_TRACKING_ID}`);
        await page.getByRole("heading", { name: "Detalle de viaje" }).waitFor({ timeout: 15_000 });
        await page.getByText("Mapa del viaje").waitFor({ timeout: 15_000 });

        await page.waitForFunction(() => {
          const el = document.querySelector('[data-testid="viaje-mapa-track"]');
          return !!el && el.dataset.trackPuntos === "0";
        }, { timeout: 15_000 });

        await page.getByText(/Sin ubicaciones GPS/i).waitFor({ timeout: 10_000 });
        await logger.step(page, name, "caso4-sin-tracking-mensaje");
      } finally {
        await context.close();
      }
    },
  );

  // ── 5. Envío / viaje inexistente (999999) -> estado vacío/404, sin crash ─
  await record(5, "Envío y viaje id 999999 -> estado vacío/404 in-place, sin crash", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "admin", { logger, caseName: name });

      await page.goto(`${config.webBaseUrl}/envios/999999`);
      await page
        .getByText(/no se pudo cargar el envío|envío no encontrado/i)
        .waitFor({ timeout: 15_000 });
      await logger.step(page, name, "caso5-envio-inexistente");

      await page.goto(`${config.webBaseUrl}/viajes/999999`);
      await page.getByRole("heading", { name: "Detalle de viaje" }).waitFor({ timeout: 15_000 });
      await page
        .getByText(/no se pudo cargar el viaje|viaje no encontrado/i)
        .waitFor({ timeout: 15_000 });
      await logger.step(page, name, "caso5-viaje-inexistente");
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
