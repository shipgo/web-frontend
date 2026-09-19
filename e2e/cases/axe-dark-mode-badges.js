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
 * SHG-FE-067 amplió el alcance de este mismo caso (en vez de escribir uno
 * nuevo — ver nota de esa tarea) a los 3 problemas reales que esta misma
 * auditoría encontró pero SHG-FE-060 dejó deliberadamente fuera de su
 * alcance acotado: `--mantine-color-dimmed`/`--mantine-color-placeholder`
 * en dark mode (SHG-FE-041 sólo había corregido su rama `light`) y CADA color
 * de los 4 mapas `ESTADO_*` sin override manual (`gray`/`cyan`/`blue`/
 * `indigo`/`red`/`yellow` — no sólo `indigo`, que fue el único que se vio en
 * la corrida que abrió la tarea). `IN_SCOPE_FG_COLORS` abajo refleja el
 * alcance ampliado (SHG-FE-069 lo amplió una vez más — ver nota abajo).
 *
 * Este caso replica el patrón de `axe-mvp-audit.js` (mismo helper `runAxe`/
 * `fetchJson`, mismo criterio de bloqueo `critical`/`serious`) pero:
 *   1. Fuerza dark mode a nivel de `BrowserContext` de Playwright
 *      (`colorScheme: "dark"`) — con `defaultColorScheme="auto"` en
 *      `App.jsx`, Mantine sigue `prefers-color-scheme`, así que alcanza con
 *      esto para no depender de encontrar/clickear el toggle del `Navbar`.
 *   2. Además de auditar `/envios`, `/viajes` y `/vehiculos` (listado, lo
 *      que haya en la página 1 del seed), busca un id real vía la API real
 *      por cada uno de los estados de envío/viaje que hace falta ejercitar
 *      para cubrir los 4 mapas `ESTADO_*` completos (ver `ENVIO_ESTADOS`/
 *      `VIAJE_ESTADOS` abajo) para GARANTIZAR que las rutas pedidas queden
 *      ejercitadas, no dependiendo de qué orden traiga el listado sin
 *      filtrar. `/vehiculos` no tiene filtro por estado en la UI (ni ruta de
 *      detalle que pinte `Badge` de estado — ver `ListaVehiculosTabla`), pero
 *      el seed (`generate_data_dev.py`) tiene sólo 8 vehículos con
 *      `PAGE_LIMIT=10`, así que la página 1 sin filtrar ya los muestra
 *      todos — incluido el único vehículo `en_service` (`yellow`), el único
 *      color de `ESTADO_VEHICULO` que no aparece en `ESTADO_ENVIO`/
 *      `ESTADO_VIAJE`.
 *
 * Deja `<ruta>.axe.json` con el resultado completo de axe por ruta en el
 * directorio de artefactos del caso, igual que `axe-mvp-audit.js` — evidencia
 * reproducible, no un cálculo manual (ver advertencia del `revisor` en
 * SHG-FE-039, citada también en el task file de esta tarea).
 *
 * SHG-FE-069: corrige el único `color-contrast` que SHG-FE-067 había dejado
 * deliberadamente fuera de alcance (allowlisteado como
 * `OUT_OF_SCOPE_PRIMARY_BUTTON_FG_COLORS`/`isOutOfScopeNode`/
 * `splitOutOfScopeNodes`, ahora eliminados de este archivo por no hacer
 * falta más) — el botón "Ver viaje" (`DetalleEnvio`, `<Button
 * variant="light">` con el color primario). `--shg-button-text-primary`
 * (`cssVariablesResolver.js`) resuelve esto igual que
 * `--shg-badge-text-*`/`--shg-button-text-green`/`-red`, así que se suma al
 * mismo `IN_SCOPE_FG_COLORS`/`IN_SCOPE_LABEL_RE` en vez de mantener una
 * categoría de "fuera de alcance" separada — no queda ningún
 * `color-contrast` conocido sin clasificar tras esta tarea.
 *
 * SHG-FE-070 (auditoría completa de `<Button variant="light">` con color
 * primario implícito fuera de las pantallas que ya cubría este caso — el
 * revisor de SHG-FE-069 había encontrado, buscando en todo el repo, otros
 * dos botones con el mismo patrón sin verificar: "Volver al detalle"
 * (`EditarViaje`, `/viajes/:id/editar`, sólo se renderiza si el viaje NO
 * está en `VIAJE_ESTADOS_EDITABLES`) y "Ver detalle completo" (`MapDetalles`,
 * `/mapa`, sólo se renderiza con un viaje seleccionado en el panel lateral).
 * Ambos confirmados con el mismo bug real (mismo `--shg-button-text-primary`
 * sin aplicar) y corregidos con el mismo token — se suman a este caso en vez
 * de escribir uno nuevo, mismo criterio que SHG-FE-067/SHG-FE-069. Una
 * auditoría completa de `variant="light"` en todo `src/` (no sólo estas dos
 * rutas) no encontró ningún otro `<Button variant="light">` con color
 * primario implícito sin corregir — todos los `<Badge>`/`<Alert>`/
 * `<ThemeIcon>`/`<Chip>` `variant="light"` restantes son componentes
 * distintos (contraste ya resuelto por sus propios tokens, o no aplica por
 * ser sólo ícono) y los `<Button variant="light">` restantes ya usan
 * `color` explícito (`red`/`green`/`blue`/`orange`, patrón ya confirmado
 * seguro por la auditoría de SHG-FE-069). El resto de los `<Button
 * variant="light">` con color primario implícito que corrigió esta tarea
 * (`SelectionBanner`, `Dashboard`, `AgregarPaqueteModal`,
 * `EnviosAcciones`/`SeccionHeader` de `CrearViaje`, `FotoPerfilUpload`,
 * landing/portal) usan el mismo `c="var(--shg-button-text-primary)"` sobre
 * el mismo token ya confirmado por axe-core en "Ver viaje"/"Volver al
 * detalle"/"Ver detalle completo" — no se agrega una ruta e2e por cada uno
 * (serían rutas nuevas sólo para re-confirmar el mismo CSS var, no un
 * comportamiento distinto), documentado acá en vez de en el task file.
 */
export const name = "axe-dark-mode-badges";

/**
 * Misma excepción ya conocida y aceptada en `axe-mvp-audit.js` (PR #75,
 * `ListaViajesTabla`) — no es parte del alcance de esta tarea, se allowlistea
 * para no bloquear esta corrida por una deuda ya revisada aparte.
 *
 * `vehiculos-lista-dark`/`label`: los checkbox de selección de fila de
 * `ListaVehiculosTabla` no tienen `aria-label` — bug real (`label`,
 * crítico) pero de nombre accesible, no de contraste de color, y nada que
 * ver con dark mode/`ESTADO_*`/dimmed/placeholder (alcance de esta tarea).
 * Encontrado de rebote al sumar `/vehiculos` a este caso para auditar
 * `yellow` (SHG-FE-067) — nadie había corrido axe-core contra esa pantalla
 * antes. Se allowlistea (no silenciosamente) para no bloquear esta corrida
 * por una deuda no relacionada; queda para que se abra una tarea aparte si
 * corresponde.
 *
 * `mapa-detalle-dark`/`aria-progressbar-name` (SHG-FE-070): el `<Progress>`
 * de Mantine que pinta el panel de `MapDetalles` (progreso del viaje
 * seleccionado) no tiene `aria-label`/nombre accesible — bug real
 * (`aria-progressbar-name`, serio) pero de nombre accesible en un control
 * ARIA, nada que ver con contraste de color/dark mode (alcance de esta
 * tarea). Encontrado de rebote al sumar `/mapa` con un viaje seleccionado a
 * este caso para auditar "Ver detalle completo" — nadie había corrido
 * axe-core contra ese panel antes (`axe-mvp-audit.js` visita `/mapa` pero
 * nunca selecciona un viaje). Se allowlistea (no silenciosamente) por el
 * mismo motivo que `vehiculos-lista-dark`/`label`; queda para que se abra
 * una tarea aparte si corresponde.
 */
const KNOWN_ACCEPTED_VIOLATIONS = [
  { route: "viajes-lista-dark", ruleId: "nested-interactive" },
  { route: "vehiculos-lista-dark", ruleId: "label" },
  { route: "mapa-detalle-dark", ruleId: "aria-progressbar-name" },
];

const isKnownAccepted = (violation) =>
  KNOWN_ACCEPTED_VIOLATIONS.some((k) => k.route === violation.route && k.ruleId === violation.id);

/**
 * Colores de texto EXACTOS que dejaron SHG-FE-060/SHG-FE-067 para dark mode
 * (ver `--shg-badge-text-orange`/`--shg-badge-text-green`/`--shg-badge-text-indigo`/
 * `--shg-button-text-green`/`--shg-button-text-red` en `cssVariablesResolver.js`,
 * que apuntan a `orange-5`/`green-5`/`indigo-3`/`red-4` — shades estáticos de
 * la paleta, no dependen de alpha ni de composición, así que su hex es
 * siempre el mismo). Un nodo `color-contrast` es alcance de ESTA tarea si y
 * sólo si axe-core midió el foreground contra alguno de estos — es más
 * preciso que buscar clases/texto en el `html` del nodo (axe trunca el
 * `html` con "..." en nodos con muchos hermanos idénticos, ej. la lista de
 * paradas de un recorrido, así que un regex sobre `html` puede perder nodos
 * reales — visto en la primera corrida de este caso).
 *
 * `#80cbc4` agregado en SHG-FE-069: `--shg-button-text-primary`
 * (`colorPalette-2`, ver `cssVariablesResolver.js`) — texto del botón "Ver
 * viaje" (`DetalleEnvio`, `<Button variant="light">` con el color primario
 * del theme, sin `color` explícito). A diferencia de los demás tokens de
 * este set, este hex SÍ depende de `COLOR_PALETTE`/`theme.primaryColor` (no
 * es un color "estático" de Mantine como `orange`/`green`/`indigo`/`red`) —
 * sigue siendo seguro fijarlo acá porque ninguna de las dos cosas cambia sin
 * tocar `theme.js`/`colorPalette.js` explícitamente. Mismo hex reutilizado
 * por "Volver al detalle"/"Ver detalle completo" (SHG-FE-070, mismo token).
 */
const IN_SCOPE_FG_COLORS = new Set(["#ff922b", "#51cf66", "#ff8787", "#91a7ff", "#80cbc4"]);

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
 * lo renderizó. `en_vehiculo` ("En vehículo") agregado en SHG-FE-067.
 * "Ver viaje" agregado en SHG-FE-069 (`--shg-button-text-primary`).
 * "Volver al detalle"/"Ver detalle completo" agregados en SHG-FE-070 (mismo
 * token, `EditarViaje`/`MapDetalles`).
 */
const IN_SCOPE_LABEL_RE =
  /En camino|Entregado|Finalizado(?! c\/)|Entregar|Marcar fallo|Cancelar|En vehículo|Ver viaje|Volver al detalle|Ver detalle completo/;

/** Labels de badges/botones en alcance que axe-core evaluó y confirmó ≥4.5:1 en ESTA página. */
const collectConfirmedPassingLabels = (results) => {
  const colorContrastPass = (results.passes ?? []).find((p) => p.id === "color-contrast");
  if (!colorContrastPass) return [];
  return colorContrastPass.nodes
    .filter((n) => /mantine-Badge-label|mantine-Button-label/.test(n.html) && IN_SCOPE_LABEL_RE.test(n.html))
    .map((n) => n.html.replace(/<[^>]+>/g, "").trim());
};

/**
 * Igual que `collectConfirmedPassingLabels` pero para labels en alcance que
 * axe-core dejó `incomplete` (ni `pass` ni `fail`) en vez de confirmar. Sólo
 * pasa esto con "Ver detalle completo" (`MapDetalles`, SHG-FE-070): el panel
 * es un `Card` posicionado ENCIMA del canvas de Mapbox GL (mapa en vivo,
 * `position: absolute`), y ese botón queda pegado a los controles propios
 * del mapa (zoom, atribución) — axe-core no puede aislar el color de fondo
 * ahí de forma confiable (los otros nodos que también quedan `incomplete`
 * en esa misma ruta son justamente los controles de Mapbox: zoom, "©
 * Mapbox"/"© OpenStreetMap"/"Improve this map"), así que lo deja
 * `incomplete` en vez de `pass`, aunque tampoco lo marca `fail`. Esto NO es
 * evidencia de que el fix esté mal — es la MISMA `c="var(--shg-...)"` que ya
 * confirmó `pass` el badge "0/2 paradas" un par de líneas arriba en el
 * mismo `Card` (mismo fondo tintado `variant="light"`, mismo token) — se
 * documenta acá en vez de forzar una `pass` que axe-core no puede dar por
 * una limitación real de la herramienta (superposición con un canvas),
 * no del fix.
 */
const collectIncompleteInScopeLabels = (results) => {
  const colorContrastIncomplete = (results.incomplete ?? []).find((i) => i.id === "color-contrast");
  if (!colorContrastIncomplete) return [];
  return colorContrastIncomplete.nodes
    .filter((n) => /mantine-Badge-label|mantine-Button-label/.test(n.html) && IN_SCOPE_LABEL_RE.test(n.html))
    .map((n) => n.html.replace(/<[^>]+>/g, "").trim());
};

/**
 * Igual que `collectConfirmedPassingLabels` pero para `--mantine-color-dimmed`/
 * `--mantine-color-placeholder` (SHG-FE-067) — no tienen un "label" de texto
 * fijo como un badge, así que la evidencia positiva acá es "axe-core evaluó
 * al menos un nodo con este estilo/clase y no lo marcó como violación en
 * ESTA página" (el `pass` de axe trae la lista completa).
 */
const collectConfirmedPassingDimmedPlaceholder = (results) => {
  const colorContrastPass = (results.passes ?? []).find((p) => p.id === "color-contrast");
  if (!colorContrastPass) return { dimmed: false, placeholder: false };
  return {
    dimmed: colorContrastPass.nodes.some((n) => /color:\s*var\(--mantine-color-dimmed\)/.test(n.html)),
    placeholder: colorContrastPass.nodes.some((n) => /mantine-InputPlaceholder-placeholder/.test(n.html)),
  };
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
  const incompleteInScopeLabels = collectIncompleteInScopeLabels(results);
  if (incompleteInScopeLabels.length > 0) {
    logger.log(
      `[${caseName}]   ◐ ${routeLabel}: axe-core dejó "incomplete" (no pudo aislar el fondo, ver comentario de ` +
        `\`collectIncompleteInScopeLabels\`) para: ${incompleteInScopeLabels.join(", ")}`,
    );
  }
  const confirmedDimmedPlaceholder = collectConfirmedPassingDimmedPlaceholder(results);
  if (confirmedDimmedPlaceholder.dimmed || confirmedDimmedPlaceholder.placeholder) {
    logger.log(
      `[${caseName}]   ✔ ${routeLabel}: axe-core confirmó ≥4.5:1 (color-contrast) para: ${[
        confirmedDimmedPlaceholder.dimmed && "c=\"dimmed\"",
        confirmedDimmedPlaceholder.placeholder && "placeholder",
      ]
        .filter(Boolean)
        .join(", ")}`,
    );
  }

  // SHG-FE-069: ya no hace falta partir violaciones en alcance/fuera de
  // alcance (`splitOutOfScopeNodes`, eliminado) — el único caso que motivaba
  // esa separación (el botón "Ver viaje", color primario) está resuelto, así
  // que cualquier violación `color-contrast` bloqueante que quede es alcance
  // de este caso sin excepción, salvo `KNOWN_ACCEPTED_VIOLATIONS`.
  const allBlocking = blockingViolations(results).map((v) => ({ route: routeLabel, ...v }));
  const known = allBlocking.filter(isKnownAccepted);
  const newBlocking = allBlocking.filter((v) => !isKnownAccepted(v));

  logger.log(
    `[${caseName}] ${routeLabel}: ${results.violations.length} violación(es) totales, ` +
      `${allBlocking.length} crítica(s)/seria(s) (${known.length} ya conocida(s)/aceptada(s)). ` +
      `Reporte: ${path.relative(logger.runDir, reportPath)}`,
  );
  known.forEach((v) => logger.log(`[${caseName}]   ⚠ CONOCIDA ${routeLabel}: ${summarizeViolation(v)}`));
  newBlocking.forEach((v) => logger.log(`[${caseName}]   ⚠ ${routeLabel}: ${summarizeViolation(v)}`));

  return { newBlocking, confirmedPassingLabels, incompleteInScopeLabels, confirmedDimmedPlaceholder };
};

export async function run({ browser, logger }) {
  const allBlocking = [];
  const allConfirmedPassingLabels = new Set();
  const allIncompleteInScopeLabels = new Set();
  let dimmedConfirmed = false;
  let placeholderConfirmed = false;
  const record = async (opts) => {
    const { newBlocking, confirmedPassingLabels, incompleteInScopeLabels, confirmedDimmedPlaceholder } =
      await auditCurrentPage(opts);
    allBlocking.push(...newBlocking);
    confirmedPassingLabels.forEach((l) => allConfirmedPassingLabels.add(l));
    incompleteInScopeLabels.forEach((l) => allIncompleteInScopeLabels.add(l));
    dimmedConfirmed = dimmedConfirmed || confirmedDimmedPlaceholder.dimmed;
    placeholderConfirmed = placeholderConfirmed || confirmedDimmedPlaceholder.placeholder;
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

    // --- /vehiculos (listado tal cual, dark mode) — SHG-FE-067: no tiene
    // filtro por estado en la UI ni ruta de detalle con Badge, pero el seed
    // (`generate_data_dev.py`) sólo tiene 8 vehículos con `PAGE_LIMIT=10` en
    // `ListaVehiculos`, así que la página 1 sin filtrar ya trae los 5
    // estados usados (`disponible`/`asignado_a_viaje`/`en_viaje`/
    // `en_service`/`fuera_de_servicio`) — en particular el único vehículo
    // `en_service` ("En service", `yellow`), el único color de
    // `ESTADO_VEHICULO` que no aparece en `ESTADO_ENVIO`/`ESTADO_VIAJE`.
    await page.goto(`${config.webBaseUrl}/vehiculos`);
    await page.getByRole("heading", { name: "Vehículos" }).first().waitFor({ timeout: 15_000 });
    await waitForRouteSettled(page);
    await record({ page, logger, caseName: name, routeLabel: "vehiculos-lista-dark" });

    // --- /envios/:id por cada estado que hace falta para cubrir los 4
    // colores de `ESTADO_ENVIO` sin override (gray/cyan/blue/indigo) + los 2
    // ya cubiertos por SHG-FE-060 (orange/green) + red (rechazado) — el
    // listado sin filtrar no garantiza ejercitar todos (depende de qué haya
    // en la página 1 del seed), así que se busca un id real por estado vía
    // la API real (mismo patrón que `fetchFirstId` de `axe-mvp-audit.js`,
    // SHG-FE-041).
    const ENVIO_ESTADOS = [
      "creado", // gray
      "en_sucursal", // cyan
      "asignado_a_viaje", // blue
      "en_vehiculo", // indigo — el que motivó SHG-FE-067
      "en_camino", // orange (SHG-FE-060)
      "entregado", // green (SHG-FE-060)
      "rechazado", // red
    ];
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

    // --- /viajes/:id: `planificado` (blue, SHG-FE-067) además de
    // `creado`/`en_camino`/`finalizado` que ya cubría SHG-FE-060. Guarda los
    // ids encontrados (`viajeIdPorEstado`) para reusarlos abajo en
    // `/viajes/:id/editar` y `/mapa` (SHG-FE-070) — evita otro round-trip a
    // la API por lo mismo.
    const VIAJE_ESTADOS = ["creado", "planificado", "en_camino", "finalizado"];
    const viajeIdPorEstado = {};
    for (const estado of VIAJE_ESTADOS) {
      const id = await fetchFirstId(page, "/api/viaje?page=0&size=1", estado);
      if (id == null) {
        logger.log(
          `[${name}] viajes-detalle-${estado}-dark: el seed no tiene ningún viaje en estado "${estado}" — se omite esta ruta.`,
        );
        continue;
      }
      viajeIdPorEstado[estado] = id;
      await page.goto(`${config.webBaseUrl}/viajes/${id}`);
      await page.getByRole("heading", { name: "Detalle de viaje" }).first().waitFor({ timeout: 15_000 });
      await waitForRouteSettled(page);
      await record({ page, logger, caseName: name, routeLabel: `viajes-detalle-${estado}-dark` });
    }

    // --- /viajes/:id/editar, viaje NO editable -> botón "Volver al detalle"
    // (SHG-FE-070: `EditarViaje` sólo renderiza ese botón, `<Button
    // variant="light">` con color primario implícito, cuando el viaje NO
    // está en `VIAJE_ESTADOS_EDITABLES` = ['creado', 'planificado'] — ver
    // `EditarViaje/index.jsx`). Se prefiere `finalizado` (terminal, siempre
    // no-editable) y se cae a `en_camino` (tampoco editable) si el seed no
    // tiene ninguno finalizado en esta corrida.
    const viajeNoEditableId = viajeIdPorEstado.finalizado ?? viajeIdPorEstado.en_camino;
    if (viajeNoEditableId == null) {
      logger.log(
        `[${name}] viajes-editar-no-editable-dark: el seed no tiene ningún viaje "finalizado"/"en_camino" en esta corrida — se omite esta ruta.`,
      );
    } else {
      await page.goto(`${config.webBaseUrl}/viajes/${viajeNoEditableId}/editar`);
      await page.getByRole("button", { name: "Volver al detalle" }).waitFor({ timeout: 15_000 });
      await waitForRouteSettled(page);
      await record({ page, logger, caseName: name, routeLabel: "viajes-editar-no-editable-dark" });
    }

    // --- /mapa, con un viaje `en_camino` seleccionado -> botón "Ver detalle
    // completo" (SHG-FE-070: `MapDetalles` sólo se monta con
    // `selectedViajeId` seteado — se selecciona haciendo click en la
    // patente del viaje en `MapListadoViajesItem`, mismo patrón que el caso
    // 3 de `detalle-envio-viaje-tracking.js`). Reusa el id `en_camino` ya
    // encontrado arriba si lo hay.
    const viajeEnCaminoIdParaMapa = viajeIdPorEstado.en_camino;
    if (viajeEnCaminoIdParaMapa == null) {
      logger.log(
        `[${name}] mapa-detalle-dark: el seed no tiene ningún viaje "en_camino" en esta corrida — se omite esta ruta.`,
      );
    } else {
      const patente = (await fetchJson(page, `/api/viaje/${viajeEnCaminoIdParaMapa}`))?.vehiculo?.patente;
      if (!patente) {
        logger.log(
          `[${name}] mapa-detalle-dark: el viaje ${viajeEnCaminoIdParaMapa} no tiene patente asociada — se omite esta ruta.`,
        );
      } else {
        await page.goto(`${config.webBaseUrl}/mapa`);
        await page.getByRole("heading", { name: "Mapa en vivo" }).first().waitFor({ timeout: 15_000 });
        await page.getByText(patente, { exact: true }).first().waitFor({ timeout: 20_000 });
        await page.getByText(patente, { exact: true }).first().click();
        // `component={Link}` (wouter) renderiza un <a>, no un <button> real
        // — el rol accesible es "link", no "button" (a diferencia de
        // "Volver al detalle", que sí es un <button> con onClick).
        await page.getByRole("link", { name: "Ver detalle completo" }).waitFor({ timeout: 15_000 });
        await waitForRouteSettled(page);
        await record({ page, logger, caseName: name, routeLabel: "mapa-detalle-dark" });
      }
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
  // ninguna ruta terminó renderizando un badge/botón/texto dimmed/placeholder
  // en alcance (seed vacío en esos estados, cambio de heading que rompe un
  // `waitFor`, etc.) esta corrida "pasaría" sin haber verificado nada — justo
  // el tipo de evidencia no reproducible que el `revisor` rechazó en
  // SHG-FE-039. Exige que axe-core haya confirmado ≥4.5:1 en AL MENOS un
  // badge naranja ("En camino"), uno verde ("Entregado"/"Finalizado"), uno
  // indigo ("En vehículo" — SHG-FE-067), el botón "Ver viaje" (color
  // primario — SHG-FE-069), "Volver al detalle"/"Ver detalle completo"
  // (color primario — SHG-FE-070), y al menos un nodo `dimmed` y un
  // `placeholder` (SHG-FE-067). Cualquier envío `en_vehiculo`/`en_camino`/
  // `entregado` ya tiene un viaje asociado (por eso esos estados existen),
  // así que las mismas rutas que confirman indigo/naranja/verde también
  // confirman "Ver viaje" — no hace falta una ruta extra sólo para ese
  // botón. "Volver al detalle"/"Ver detalle completo" sí dependen de que el
  // seed real tenga un viaje "finalizado"/"en_camino" en el momento de la
  // corrida (ver `viajeNoEditableId`/`viajeEnCaminoIdParaMapa` arriba) — si
  // ninguno existe esas dos rutas se omiten (logueado) y esta aserción falla
  // con un mensaje explícito en vez de dar un falso OK.
  const gotOrange = allConfirmedPassingLabels.has("En camino");
  const gotGreen = [...allConfirmedPassingLabels].some((l) => l === "Entregado" || l === "Finalizado");
  const gotIndigo = allConfirmedPassingLabels.has("En vehículo");
  const gotVerViaje = allConfirmedPassingLabels.has("Ver viaje");
  const gotVolverDetalle = allConfirmedPassingLabels.has("Volver al detalle");
  // "Ver detalle completo" acepta también evidencia `incomplete` (ver
  // `collectIncompleteInScopeLabels`) — axe-core no puede darle `pass` por
  // la superposición con el canvas de Mapbox GL, no por un problema del fix
  // (mismo token que el badge "0/2 paradas" del mismo panel, que sí confirma
  // `pass`). Si algún día esto SÍ vuelve a aparecer como violación
  // (`fail`/`allBlocking`), la corrida ya falla arriba antes de llegar acá.
  const gotVerDetalleCompleto =
    allConfirmedPassingLabels.has("Ver detalle completo") ||
    allIncompleteInScopeLabels.has("Ver detalle completo");
  const missing = [
    !gotOrange && "naranja (\"En camino\")",
    !gotGreen && "verde (\"Entregado\"/\"Finalizado\")",
    !gotIndigo && "indigo (\"En vehículo\")",
    !gotVerViaje && "botón \"Ver viaje\" (color primario)",
    !gotVolverDetalle && "botón \"Volver al detalle\" (color primario)",
    !gotVerDetalleCompleto && "botón \"Ver detalle completo\" (color primario)",
    !dimmedConfirmed && "c=\"dimmed\"",
    !placeholderConfirmed && "placeholder",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(
      `Evidencia insuficiente: axe-core nunca confirmó color-contrast ≥4.5:1 para ${missing.join(", ")} ` +
        `en ninguna ruta — labels confirmados: [${[...allConfirmedPassingLabels].join(", ") || "ninguno"}], ` +
        `incompletos: [${[...allIncompleteInScopeLabels].join(", ") || "ninguno"}].`,
    );
  }

  logger.log(
    `[${name}] Sin violaciones críticas/serias NUEVAS de axe-core en dark mode ` +
      `(badges/botones de \`@domain/estados\` + botón "Ver viaje"/"Volver al detalle"/` +
      `"Ver detalle completo" + dimmed/placeholder — SHG-FE-060/SHG-FE-067/SHG-FE-069/SHG-FE-070). ` +
      `${KNOWN_ACCEPTED_VIOLATIONS.length} excepción(es) ya conocida(s)/aceptada(s). ` +
      `Labels confirmados ≥4.5:1 por axe-core real: ${[...allConfirmedPassingLabels].join(", ")}` +
      `${allIncompleteInScopeLabels.size > 0 ? `; incompletos (ver comentario \`collectIncompleteInScopeLabels\`): ${[...allIncompleteInScopeLabels].join(", ")}` : ""}; ` +
      `dimmed=${dimmedConfirmed}, placeholder=${placeholderConfirmed}.`,
  );
}

export default { name, run };
