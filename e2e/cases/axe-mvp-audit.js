import { writeFileSync } from "node:fs";
import path from "node:path";

import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";
import { runAxe, blockingViolations, summarizeViolation } from "../lib/axe.js";

/**
 * SHG-FE-041: audita con axe-core (WCAG 2.0 A/AA + 2.1 AA) las 12 rutas de las 6
 * pantallas MVP (9 originales de SHG-FE-041 + 3 agregadas en SHG-FE-045 para
 * ejercitar los botones de acción Entregar/Marcar fallo/Finalizar/Cancelar),
 * con el backend real + seed real (no reinicia nada, reusa el stack que ya
 * esté corriendo — ver `ensureBackendUp`/`ensureWebUp` en `run.js`).
 *
 * A diferencia de `smoke-happy-path` (que sólo mira consola/4xx/5xx), este caso
 * FALLA si `axe.run()` encuentra alguna violación de impacto `critical`/`serious`
 * en cualquier ruta — ese es el criterio de aceptación de la tarea ("cualquier
 * violación crítica/seria... corregida"). Deja además un `<ruta>.axe.json` con el
 * resultado completo de axe por ruta en el directorio de artefactos del caso, como
 * evidencia reproducible (aparte del screenshot que ya deja `logger.step`).
 */
export const name = "axe-mvp-audit";

/**
 * Única excepción conocida, deliberada y ya documentada en el código: el
 * `<tr role="button" tabIndex={0}>` de `ListaViajesTabla` (navegar al detalle
 * con teclado) contiene un `Checkbox` y el botón de `RowActionsMenu`, ambos
 * interactivos — axe-core lo marca `nested-interactive` (serio). El propio
 * comentario en `ListaViajesTabla.jsx` ("Se acepta como fix rápido de
 * SHG-QA-002... un rediseño... queda para una tarea SHG-FE de UX", PR #75) ya
 * documenta que el equipo revisó este trade-off y lo aceptó a propósito para
 * no perder la navegación por teclado agregada en SHG-QA-002 — no es un
 * ajuste puntual (redesign del patrón de fila, fuera de alcance de esta
 * tarea) así que NO se corrige acá, sólo se allowlistea explícitamente para
 * que corridas futuras de este caso sigan fallando ante cualquier violación
 * NUEVA sin quedar bloqueadas para siempre por esta ya conocida.
 */
const KNOWN_ACCEPTED_VIOLATIONS = [{ route: "viajes", ruleId: "nested-interactive" }];

const isKnownAccepted = (violation) =>
  KNOWN_ACCEPTED_VIOLATIONS.some((k) => k.route === violation.route && k.ruleId === violation.id);

const AUTHENTICATED_ROUTES = [
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/envios", heading: "Envíos" },
  { path: "/envios/crear", heading: "Crear nuevo envío" },
  { path: "/viajes", heading: "Viajes" },
  { path: "/viajes/crear", heading: "Crear nuevo viaje" },
  { path: "/mapa", heading: "Mapa en vivo" },
];

const fetchJson = async (page, url) =>
  page.evaluate(async (u) => {
    const res = await fetch(u, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${u} respondió ${res.status}`);
    return res.json();
  }, url);

/**
 * Trae un id real del seed vía la misma API que usa la app (`Page<DTO>.content`).
 *
 * Con `estadosPreferidos` (en orden de prioridad, uno por uno — NO como un OR
 * `estado=a&estado=b`, ver nota abajo) busca un elemento en el primero de esos
 * estados que exista en el seed, para que `/envios/:id` y `/viajes/:id` se
 * auditen sobre un elemento que efectivamente ejercite
 * `BADGE_TEXT_CONTRAST_OVERRIDE` (`@domain/estados`): si esta auditoría toma
 * "el primer elemento a secas" del seed, puede caer en un estado no afectado
 * (azul/cyan/gris) y dejar sin auditar el mismo bug de contraste que ya se
 * encontró y corrigió en las tablas de listado (SHG-FE-041, revisión de PR
 * #100 — el gap era justamente que ningún caso e2e ejercitaba las rutas de
 * detalle en un estado afectado).
 *
 * El orden importa y es deliberado: para envío se prueba primero `entregado`
 * y para viaje `finalizado` (antes que `en_camino`) porque son terminales —
 * `DetalleEnvio`/`DetalleViajeHeader` no muestran ahí ninguno de los botones
 * de acción (`Entregar`/`Marcar fallo`/`Finalizar`, ver `acciones.js` de cada
 * pantalla). Un envío/viaje `en_camino` SÍ los muestra, y esos botones
 * (`<Button variant="light" color="green|red">`) tenían su propio problema de
 * contraste — real, pero DISTINTO del que corrige
 * `BADGE_TEXT_CONTRAST_OVERRIDE` (que es sólo para `<Badge variant="light">`)
 * — corregido aparte en SHG-FE-045 (ver `BUTTON_ACTION_TEXT_COLOR` en
 * `@domain/estados`), auditado más abajo con un elemento `en_camino` a
 * propósito (`envios-detalle-en-camino`/`viajes-detalle-en-camino`) para
 * ejercitar esos botones. Este bloque preferir el estado terminal sólo
 * asegura que el badge afectado (`entregado`/`finalizado`, también naranja/
 * verde) quede cubierto en una ruta separada de la de los botones.
 *
 * Se hace una consulta por estado (no un OR) para poder respetar ese orden de
 * prioridad — con `estado=a&estado=b` el backend puede devolver cualquiera de
 * los dos primero según su orden de sort por defecto. Si el seed no tiene
 * ningún elemento en ninguno de los estados preferidos, cae al primer
 * elemento sin filtrar (dejando constancia en el log) — la auditoría no se
 * cae por esto, sólo pierde cobertura de ese caso puntual en esta corrida.
 */
const fetchFirstId = async (page, apiPath, { estadosPreferidos, logger, caseName, label } = {}) => {
  for (const estado of estadosPreferidos ?? []) {
    const filtrado = await fetchJson(page, `${apiPath}&estado=${encodeURIComponent(estado)}`);
    const idFiltrado = filtrado?.content?.[0]?.id;
    if (idFiltrado != null) return idFiltrado;
  }
  if (estadosPreferidos?.length) {
    logger?.log(
      `[${caseName}] ${label}: el seed no tiene ningún elemento en estado ${estadosPreferidos.join("/")} — ` +
        `se audita el primer elemento sin filtrar (pierde cobertura del bug de contraste de SHG-FE-041 en esta ruta).`,
    );
  }

  const json = await fetchJson(page, apiPath);
  const id = json?.content?.[0]?.id;
  if (id == null) {
    throw new Error(`${apiPath} no devolvió ningún elemento (¿seed vacío?) — no hay id real para auditar el detalle.`);
  }
  return id;
};

/**
 * Espera a que se aquiete la red (fetch de datos de la ruta) + un margen chico
 * para el re-render de React después de esa respuesta. Sin esto, páginas con
 * fetch propio (ej. `/envios`) podían auditarse todavía en su estado
 * "Cargando..." — visto en la primera corrida de este caso (SHG-FE-041): el
 * `heading` de la página aparece antes que la tabla, así que esperar sólo el
 * heading no alcanza. No hace fallar el caso si nunca se aquieta (ej. `/mapa`
 * con polling en vivo) — es best-effort.
 */
const waitForRouteSettled = (page) =>
  page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {}).then(() => page.waitForTimeout(300));

/** Corre axe sobre la `page` actual, guarda evidencia y devuelve las violaciones bloqueantes. */
const auditCurrentPage = async ({ page, logger, caseName, routeLabel }) => {
  await logger.step(page, caseName, `${routeLabel}-render`);
  const results = await runAxe(page);

  const reportPath = path.join(logger.caseDir(caseName), `${routeLabel}.axe.json`);
  writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const blocking = blockingViolations(results).map((v) => ({ route: routeLabel, ...v }));
  const [known, newBlocking] = [blocking.filter(isKnownAccepted), blocking.filter((v) => !isKnownAccepted(v))];

  logger.log(
    `[${caseName}] ${routeLabel}: ${results.violations.length} violación(es) totales, ` +
      `${blocking.length} crítica(s)/seria(s) (${known.length} ya conocida(s)/aceptada(s)). ` +
      `Reporte: ${path.relative(logger.runDir, reportPath)}`,
  );
  known.forEach((v) => logger.log(`[${caseName}]   ⚠ CONOCIDA ${routeLabel}: ${summarizeViolation(v)}`));
  newBlocking.forEach((v) => logger.log(`[${caseName}]   ⚠ ${routeLabel}: ${summarizeViolation(v)}`));

  return newBlocking;
};

export async function run({ browser, logger }) {
  const allBlocking = [];

  // --- /login, sin sesión (contexto propio, nunca logueado) ---
  const anonContext = await browser.newContext();
  try {
    const page = await anonContext.newPage();
    logger.attachPage(page, name);
    await page.goto(`${config.webBaseUrl}/login`);
    await page.getByLabel("Usuario").waitFor({ timeout: 15_000 });
    allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "login" })));
  } finally {
    await anonContext.close();
  }

  // --- resto de las rutas, logueado como `super` (ROLE_SUPERUSER: ve todo) ---
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    logger.attachPage(page, name);
    await loginAs(page, "super", { logger, caseName: name });

    for (const { path: routePath, heading } of AUTHENTICATED_ROUTES) {
      await page.goto(`${config.webBaseUrl}${routePath}`);
      await page.getByRole("heading", { name: heading }).first().waitFor({ timeout: 15_000 });
      await waitForRouteSettled(page);
      const routeLabel = routePath === "/" ? "home" : routePath.replace(/^\//, "").replace(/\//g, "-");
      allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel })));
    }

    // --- /envios/:id y /viajes/:id reales, vía la API real ---
    // Preferimos un elemento en un estado afectado por
    // `BADGE_TEXT_CONTRAST_OVERRIDE` (`en_camino`/`entregado` para envío,
    // `en_camino`/`finalizado` para viaje) en vez de ciegamente "el primero
    // del seed" — ver comentario de `fetchFirstId`.
    const envioId = await fetchFirstId(page, "/api/envio?page=0&size=1", {
      estadosPreferidos: ["entregado", "en_camino"],
      logger,
      caseName: name,
      label: "envios-detalle",
    });
    await page.goto(`${config.webBaseUrl}/envios/${envioId}`);
    await page.getByRole("heading", { name: "Detalle de envío" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "envios-detalle" })));

    const viajeId = await fetchFirstId(page, "/api/viaje?page=0&size=1", {
      estadosPreferidos: ["finalizado", "en_camino"],
      logger,
      caseName: name,
      label: "viajes-detalle",
    });
    await page.goto(`${config.webBaseUrl}/viajes/${viajeId}`);
    await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "viajes-detalle" })));

    // --- /envios/:id y /viajes/:id en `en_camino`: ejercita los botones de
    // acción (Entregar/Marcar fallo/Finalizar/Cancelar, `<Button
    // variant="light" color="green|red">`) que los bloques de arriba evitan
    // a propósito preferiendo un estado terminal (ver comentario de
    // `fetchFirstId`). Este es el gap real que dejó SHG-FE-041 (corregido en
    // SHG-FE-045) — sin esta ruta, ningún caso e2e llega a renderizar esos
    // botones.
    const envioEnCaminoId = await fetchFirstId(page, "/api/envio?page=0&size=1", {
      estadosPreferidos: ["en_camino"],
      logger,
      caseName: name,
      label: "envios-detalle-en-camino",
    });
    await page.goto(`${config.webBaseUrl}/envios/${envioEnCaminoId}`);
    await page.getByRole("heading", { name: "Detalle de envío" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(
      ...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "envios-detalle-en-camino" })),
    );

    const viajeEnCaminoId = await fetchFirstId(page, "/api/viaje?page=0&size=1", {
      estadosPreferidos: ["en_camino"],
      logger,
      caseName: name,
      label: "viajes-detalle-en-camino",
    });
    await page.goto(`${config.webBaseUrl}/viajes/${viajeEnCaminoId}`);
    await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(
      ...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "viajes-detalle-en-camino" })),
    );

    // --- /viajes/:id "cancelable" (creado/planificado/en_proceso_de_carga):
    // `puedeCancelar` (`acciones.js` de `DetalleViaje`) NUNCA se solapa con
    // `puedeFinalizar` (sólo `en_camino`) — el botón "Cancelar" (`<Button
    // variant="light" color="red">`) no queda ejercitado por el bloque
    // `en_camino` de arriba, necesita su propia ruta.
    const viajeCancelableId = await fetchFirstId(page, "/api/viaje?page=0&size=1", {
      estadosPreferidos: ["planificado", "en_proceso_de_carga", "creado"],
      logger,
      caseName: name,
      label: "viajes-detalle-cancelable",
    });
    await page.goto(`${config.webBaseUrl}/viajes/${viajeCancelableId}`);
    await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(
      ...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "viajes-detalle-cancelable" })),
    );
  } finally {
    await context.close();
  }

  if (allBlocking.length > 0) {
    const detail = allBlocking
      .map((v) => `  - [${v.route}] ${summarizeViolation(v)}`)
      .join("\n");
    throw new Error(
      `${allBlocking.length} violación(es) axe-core crítica(s)/seria(s) en ${new Set(allBlocking.map((v) => v.route)).size} ruta(s):\n${detail}`,
    );
  }

  logger.log(
    `[${name}] Sin violaciones críticas/serias NUEVAS de axe-core en las 12 rutas auditadas ` +
      `(${KNOWN_ACCEPTED_VIOLATIONS.length} excepción(es) ya conocida(s)/aceptada(s) — ver KNOWN_ACCEPTED_VIOLATIONS).`,
  );
}

export default { name, run };
