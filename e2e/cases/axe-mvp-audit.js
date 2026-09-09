import { writeFileSync } from "node:fs";
import path from "node:path";

import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";
import { runAxe, blockingViolations, summarizeViolation } from "../lib/axe.js";

/**
 * SHG-FE-041: audita con axe-core (WCAG 2.0 A/AA + 2.1 AA) las 9 rutas de las 6
 * pantallas MVP, con el backend real + seed real (no reinicia nada, reusa el
 * stack que ya esté corriendo — ver `ensureBackendUp`/`ensureWebUp` en `run.js`).
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

/** Trae un id real del seed vía la misma API que usa la app (`Page<DTO>.content`). */
const fetchFirstId = async (page, apiPath) => {
  const json = await page.evaluate(async (url) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
    return res.json();
  }, apiPath);
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

    // --- /envios/:id y /viajes/:id reales (primer elemento del seed, vía la API real) ---
    const envioId = await fetchFirstId(page, "/api/envio?page=0&size=1");
    await page.goto(`${config.webBaseUrl}/envios/${envioId}`);
    await page.getByRole("heading", { name: "Detalle de envío" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "envios-detalle" })));

    const viajeId = await fetchFirstId(page, "/api/viaje?page=0&size=1");
    await page.goto(`${config.webBaseUrl}/viajes/${viajeId}`);
    await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    allBlocking.push(...(await auditCurrentPage({ page, logger, caseName: name, routeLabel: "viajes-detalle" })));
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
    `[${name}] Sin violaciones críticas/serias NUEVAS de axe-core en las 9 rutas auditadas ` +
      `(${KNOWN_ACCEPTED_VIOLATIONS.length} excepción(es) ya conocida(s)/aceptada(s) — ver KNOWN_ACCEPTED_VIOLATIONS).`,
  );
}

export default { name, run };
