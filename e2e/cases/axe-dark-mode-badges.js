import { writeFileSync } from "node:fs";
import path from "node:path";

import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";
import { runAxe, blockingViolations, summarizeViolation } from "../lib/axe.js";

/**
 * SHG-FE-060: `BADGE_TEXT_CONTRAST_OVERRIDE`/`BUTTON_ACTION_TEXT_COLOR`
 * (`@domain/estados`) fueron calculados y verificados con axe-core sólo
 * contra el fondo tintado CLARO de `<Badge variant="light">` (SHG-FE-041/045)
 * — el resolver de variables CSS (`cssVariablesResolver.js`) no tenía rama
 * `dark`, así que en dark mode ese mismo texto (pensado para un fondo casi
 * blanco) quedaba casi ilegible sobre el fondo tintado oscuro. Confirmado en
 * vivo navegando `/envios`/`/viajes` logueado como `admin`/`super`.
 *
 * Este caso replica el patrón de `axe-mvp-audit.js` (mismo helper `runAxe`/
 * `fetchJson`, mismo criterio de bloqueo `critical`/`serious`) pero:
 *   1. Fuerza dark mode a nivel de `BrowserContext` de Playwright
 *      (`colorScheme: "dark"`) — con `defaultColorScheme="auto"` en
 *      `App.jsx`, Mantine sigue `prefers-color-scheme`, así que alcanza con
 *      esto para no depender de encontrar/clickear el toggle del `Navbar`.
 *   2. Además de auditar `/envios` y `/viajes` (listado, lo que haya en la
 *      página 1 del seed), busca un id real vía la API real por cada uno de
 *      los 4 estados de envío que pide la tarea (`creado`/`en_sucursal`/
 *      `en_camino`/`entregado`) y por los estados relevantes de viaje
 *      (`creado`/`en_camino`/`finalizado`) para GARANTIZAR que las 4 rutas
 *      pedidas queden ejercitadas, no dependiendo de qué orden traiga el
 *      listado sin filtrar.
 *
 * Deja `<ruta>.axe.json` con el resultado completo de axe por ruta en el
 * directorio de artefactos del caso, igual que `axe-mvp-audit.js` — evidencia
 * reproducible, no un cálculo manual (ver advertencia del `revisor` en
 * SHG-FE-039, citada también en el task file de esta tarea).
 */
export const name = "axe-dark-mode-badges";

/**
 * Misma excepción ya conocida y aceptada en `axe-mvp-audit.js` (PR #75,
 * `ListaViajesTabla`) — no es parte del alcance de esta tarea, se allowlistea
 * para no bloquear esta corrida por una deuda ya revisada aparte.
 */
const KNOWN_ACCEPTED_VIOLATIONS = [{ route: "viajes-lista-dark", ruleId: "nested-interactive" }];

const isKnownAccepted = (violation) =>
  KNOWN_ACCEPTED_VIOLATIONS.some((k) => k.route === violation.route && k.ruleId === violation.id);

/**
 * Colores de texto EXACTOS que dejó SHG-FE-060 para dark mode (ver
 * `--shg-badge-text-orange`/`--shg-badge-text-green`/`--shg-button-text-green`/
 * `--shg-button-text-red` en `cssVariablesResolver.js`, que apuntan a
 * `orange-5`/`green-5`/`red-4` — shades estáticos de la paleta, no dependen
 * de alpha ni de composición, así que su hex es siempre el mismo). Un nodo
 * `color-contrast` es alcance de ESTA tarea si y sólo si axe-core midió el
 * foreground contra alguno de estos — es más preciso que buscar clases/texto
 * en el `html` del nodo (axe trunca el `html` con "..." en nodos con muchos
 * hermanos idénticos, ej. la lista de paradas de un recorrido, así que un
 * regex sobre `html` puede perder nodos reales — visto en la primera corrida
 * de este caso).
 */
const IN_SCOPE_FG_COLORS = new Set(["#ff922b", "#51cf66", "#ff8787"]);

/**
 * `color-contrast` en dark mode, PERO fuera del alcance de SHG-FE-060 —
 * encontrados corriendo esta misma auditoría (evidencia real, no descartados
 * a ojo): `--mantine-color-dimmed`/`--mantine-color-placeholder` (SHG-FE-041
 * sólo corrigió su rama `light`, la rama `dark` nunca se auditó pese al
 * comentario viejo de `cssVariablesResolver.js` que decía lo contrario), el
 * `<Badge variant="light" color="indigo">` de `en_vehiculo` (color de
 * `ESTADO_*` SIN override manual — sólo `orange`/`green` lo tienen, que es
 * justo el alcance de esta tarea), y botones/links con el color primario
 * `colorPalette` (ej. "Ver viaje") — ninguno de estos pasa por
 * `BADGE_TEXT_CONTRAST_OVERRIDE`/`BUTTON_ACTION_TEXT_COLOR`. Corregirlos acá
 * hubiera sido scope creep (`planning/AGENTS.md` regla 5) — se abrió
 * `SHG-FE-067` para esto, este filtro deja constancia (logueada, no
 * silenciosa) de que quedan pendientes en vez de ocultarlos.
 *
 * Cualquier nodo cuyo foreground SÍ sea uno de `IN_SCOPE_FG_COLORS` (ver
 * arriba) sigue bloqueando la corrida — sería una regresión real del fix de
 * esta tarea.
 */
const OUT_OF_SCOPE_DARK_MODE_CONTRAST = {
  ruleId: "color-contrast",
  followUpTask: "SHG-FE-067",
  isOutOfScopeNode: (node) => {
    const fg = node.any?.find((c) => c.data?.fgColor)?.data?.fgColor?.toLowerCase();
    return !fg || !IN_SCOPE_FG_COLORS.has(fg);
  },
};

/**
 * Separa, DENTRO de una violación `color-contrast`, los nodos que son deuda
 * ya conocida y derivada a `SHG-FE-067` (`OUT_OF_SCOPE_DARK_MODE_CONTRAST`)
 * de los que sí son parte del alcance de esta tarea. A diferencia de
 * `isKnownAccepted` (que descarta la violación entera por ruta+regla), acá
 * hace falta partir los NODOS de una misma violación — la misma regla
 * `color-contrast` dispara tanto para un badge naranja/verde nuestro como
 * para el texto `dimmed` de al lado, en la misma página.
 */
const splitOutOfScopeNodes = (violation) => {
  if (violation.id !== OUT_OF_SCOPE_DARK_MODE_CONTRAST.ruleId) return { inScope: violation, outOfScope: null };
  const outOfScopeNodes = violation.nodes.filter(OUT_OF_SCOPE_DARK_MODE_CONTRAST.isOutOfScopeNode);
  const inScopeNodes = violation.nodes.filter((n) => !OUT_OF_SCOPE_DARK_MODE_CONTRAST.isOutOfScopeNode(n));
  return {
    inScope: inScopeNodes.length > 0 ? { ...violation, nodes: inScopeNodes } : null,
    outOfScope: outOfScopeNodes.length > 0 ? { ...violation, nodes: outOfScopeNodes } : null,
  };
};

const fetchJson = async (page, url) =>
  page.evaluate(async (u) => {
    const res = await fetch(u, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${u} respondió ${res.status}`);
    return res.json();
  }, url);

const fetchFirstId = async (page, apiPath, estado) => {
  const json = await fetchJson(page, `${apiPath}&estado=${encodeURIComponent(estado)}`);
  return json?.content?.[0]?.id ?? null;
};

/** Ver `waitForRouteSettled` en `axe-mvp-audit.js` — mismo motivo. */
const waitForRouteSettled = (page) =>
  page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {}).then(() => page.waitForTimeout(300));

/**
 * Confirma que la página efectivamente está en dark mode antes de auditar —
 * sin esto, un bug en cómo se fuerza `colorScheme` en el context de
 * Playwright podría hacer pasar este caso auditando light mode sin darse
 * cuenta (exactamente el tipo de "evidencia no reproducible" que el
 * `revisor` rechazó en SHG-FE-039).
 */
const assertDarkModeActive = async (page) => {
  const scheme = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--mantine-color-scheme").trim(),
  );
  if (scheme !== "dark") {
    throw new Error(
      `Se esperaba dark mode activo (--mantine-color-scheme: dark) pero se detectó "${scheme}" — ` +
        `el BrowserContext de Playwright no forzó colorScheme "dark" correctamente, esta corrida NO es evidencia válida.`,
    );
  }
};

/**
 * Texto de los badges/botones que SÍ son alcance de esta tarea (ver
 * `BADGE_TEXT_CONTRAST_OVERRIDE`/`BUTTON_ACTION_TEXT_COLOR` en
 * `@domain/estados`) — usado para juntar evidencia POSITIVA (no sólo
 * "no violó", sino "axe-core efectivamente evaluó este elemento y pasó") de
 * que el fix se ejercitó de verdad en alguna ruta, no sólo que ninguna ruta
 * lo renderizó.
 */
const IN_SCOPE_LABEL_RE = /En camino|Entregado|Finalizado(?! c\/)|Entregar|Marcar fallo|Cancelar/;

/** Labels de badges/botones en alcance que axe-core evaluó y confirmó ≥4.5:1 en ESTA página. */
const collectConfirmedPassingLabels = (results) => {
  const colorContrastPass = (results.passes ?? []).find((p) => p.id === "color-contrast");
  if (!colorContrastPass) return [];
  return colorContrastPass.nodes
    .filter((n) => /mantine-Badge-label|mantine-Button-label/.test(n.html) && IN_SCOPE_LABEL_RE.test(n.html))
    .map((n) => n.html.replace(/<[^>]+>/g, "").trim());
};

const auditCurrentPage = async ({ page, logger, caseName, routeLabel }) => {
  await assertDarkModeActive(page);
  await logger.step(page, caseName, `${routeLabel}-render`);
  const results = await runAxe(page);

  const reportPath = path.join(logger.caseDir(caseName), `${routeLabel}.axe.json`);
  writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const confirmedPassingLabels = collectConfirmedPassingLabels(results);
  if (confirmedPassingLabels.length > 0) {
    logger.log(
      `[${caseName}]   ✔ ${routeLabel}: axe-core confirmó ≥4.5:1 (color-contrast) para: ${confirmedPassingLabels.join(", ")}`,
    );
  }

  // Partir cada violación bloqueante en lo que es alcance de SHG-FE-060 vs.
  // deuda ya derivada a SHG-FE-067 (`OUT_OF_SCOPE_DARK_MODE_CONTRAST`) ANTES
  // de aplicar `isKnownAccepted` (esa función descarta la violación entera
  // por ruta+regla, acá hace falta separar nodos dentro de la misma
  // violación — ver `splitOutOfScopeNodes`).
  const allBlocking = blockingViolations(results).map((v) => ({ route: routeLabel, ...v }));
  const outOfScope = [];
  const scoped = [];
  for (const v of allBlocking) {
    const { inScope, outOfScope: oos } = splitOutOfScopeNodes(v);
    if (inScope) scoped.push(inScope);
    if (oos) outOfScope.push(oos);
  }

  const known = scoped.filter(isKnownAccepted);
  const newBlocking = scoped.filter((v) => !isKnownAccepted(v));

  logger.log(
    `[${caseName}] ${routeLabel}: ${results.violations.length} violación(es) totales, ` +
      `${scoped.length} crítica(s)/seria(s) en alcance de SHG-FE-060 (${known.length} ya conocida(s)/aceptada(s)), ` +
      `${outOfScope.length} fuera de alcance (derivada(s) a ${OUT_OF_SCOPE_DARK_MODE_CONTRAST.followUpTask}). ` +
      `Reporte: ${path.relative(logger.runDir, reportPath)}`,
  );
  known.forEach((v) => logger.log(`[${caseName}]   ⚠ CONOCIDA ${routeLabel}: ${summarizeViolation(v)}`));
  newBlocking.forEach((v) => logger.log(`[${caseName}]   ⚠ ${routeLabel}: ${summarizeViolation(v)}`));
  outOfScope.forEach((v) =>
    logger.log(
      `[${caseName}]   ℹ FUERA DE ALCANCE (${OUT_OF_SCOPE_DARK_MODE_CONTRAST.followUpTask}) ${routeLabel}: ${summarizeViolation(v)}`,
    ),
  );

  return { newBlocking, confirmedPassingLabels };
};

export async function run({ browser, logger }) {
  const allBlocking = [];
  const allConfirmedPassingLabels = new Set();
  const record = async (opts) => {
    const { newBlocking, confirmedPassingLabels } = await auditCurrentPage(opts);
    allBlocking.push(...newBlocking);
    confirmedPassingLabels.forEach((l) => allConfirmedPassingLabels.add(l));
  };

  // `colorScheme: "dark"` en el context: con `defaultColorScheme="auto"`
  // (`App.jsx`), Mantine sigue `prefers-color-scheme` — forzarlo acá alcanza
  // para auditar dark mode real sin depender de clickear el toggle del
  // `Navbar` (`toggleColorScheme`, texto "Modo claro"/"Modo oscuro").
  const context = await browser.newContext({ colorScheme: "dark" });
  try {
    const page = await context.newPage();
    logger.attachPage(page, name);
    await loginAs(page, "super", { logger, caseName: name });

    // --- /envios y /viajes (listado tal cual, dark mode) ---
    await page.goto(`${config.webBaseUrl}/envios`);
    await page.getByRole("heading", { name: "Envíos" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    await record({ page, logger, caseName: name, routeLabel: "envios-lista-dark" });

    await page.goto(`${config.webBaseUrl}/viajes`);
    await page.getByRole("heading", { name: "Viajes" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    await record({ page, logger, caseName: name, routeLabel: "viajes-lista-dark" });

    // --- /envios/:id por cada uno de los 4 estados que pide la tarea
    // (creado/en_sucursal/en_camino/entregado) — el listado sin filtrar no
    // garantiza ejercitar los 4 (depende de qué haya en la página 1 del
    // seed), así que se busca un id real por estado vía la API real (mismo
    // patrón que `fetchFirstId` de `axe-mvp-audit.js`, SHG-FE-041).
    const ENVIO_ESTADOS = ["creado", "en_sucursal", "en_camino", "entregado"];
    for (const estado of ENVIO_ESTADOS) {
      const id = await fetchFirstId(page, "/api/envio?page=0&size=1", estado);
      if (id == null) {
        logger.log(
          `[${name}] envios-detalle-${estado}-dark: el seed no tiene ningún envío en estado "${estado}" — se omite esta ruta.`,
        );
        continue;
      }
      await page.goto(`${config.webBaseUrl}/envios/${id}`);
      await page.getByRole("heading", { name: "Detalle de envío" }).first().waitFor({ timeout: 15_000 });
      await waitForRouteSettled(page);
      await record({ page, logger, caseName: name, routeLabel: `envios-detalle-${estado}-dark` });
    }

    // --- /viajes/:id en sus estados naranja/verde (en_camino/finalizado) +
    // creado, mismo motivo que arriba.
    const VIAJE_ESTADOS = ["creado", "en_camino", "finalizado"];
    for (const estado of VIAJE_ESTADOS) {
      const id = await fetchFirstId(page, "/api/viaje?page=0&size=1", estado);
      if (id == null) {
        logger.log(
          `[${name}] viajes-detalle-${estado}-dark: el seed no tiene ningún viaje en estado "${estado}" — se omite esta ruta.`,
        );
        continue;
      }
      await page.goto(`${config.webBaseUrl}/viajes/${id}`);
      await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
      await waitForRouteSettled(page);
      await record({ page, logger, caseName: name, routeLabel: `viajes-detalle-${estado}-dark` });
    }
  } finally {
    await context.close();
  }

  if (allBlocking.length > 0) {
    const detail = allBlocking.map((v) => `  - [${v.route}] ${summarizeViolation(v)}`).join("\n");
    throw new Error(
      `${allBlocking.length} violación(es) axe-core crítica(s)/seria(s) en dark mode en ` +
        `${new Set(allBlocking.map((v) => v.route)).size} ruta(s):\n${detail}`,
    );
  }

  // Evidencia POSITIVA, no sólo ausencia de violaciones: si por lo que sea
  // ninguna ruta terminó renderizando un badge/botón naranja o verde (seed
  // vacío en esos estados, cambio de heading que rompe un `waitFor`, etc.)
  // esta corrida "pasaría" sin haber verificado nada — justo el tipo de
  // evidencia no reproducible que el `revisor` rechazó en SHG-FE-039. Exige
  // que axe-core haya confirmado ≥4.5:1 en AL MENOS un badge naranja
  // ("En camino") y uno verde ("Entregado"/"Finalizado").
  const gotOrange = allConfirmedPassingLabels.has("En camino");
  const gotGreen = [...allConfirmedPassingLabels].some((l) => l === "Entregado" || l === "Finalizado");
  if (!gotOrange || !gotGreen) {
    throw new Error(
      `Evidencia insuficiente: axe-core nunca confirmó color-contrast ≥4.5:1 para un badge ` +
        `${!gotOrange ? "naranja (\"En camino\") " : ""}${!gotGreen ? "verde (\"Entregado\"/\"Finalizado\") " : ""}` +
        `en ninguna ruta — labels confirmados: [${[...allConfirmedPassingLabels].join(", ") || "ninguno"}].`,
    );
  }

  logger.log(
    `[${name}] Sin violaciones críticas/serias NUEVAS de axe-core en dark mode ` +
      `(badges/botones de \`@domain/estados\` — SHG-FE-060). ${KNOWN_ACCEPTED_VIOLATIONS.length} excepción(es) ya conocida(s)/aceptada(s), ` +
      `${OUT_OF_SCOPE_DARK_MODE_CONTRAST.followUpTask} tiene la deuda fuera de alcance encontrada en esta misma corrida. ` +
      `Labels confirmados ≥4.5:1 por axe-core real: ${[...allConfirmedPassingLabels].join(", ")}.`,
  );
}

export default { name, run };
