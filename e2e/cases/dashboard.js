import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * SHG-QA-012 — E2E web: Dashboard (`/dashboard`).
 *
 * Recorre los 4 casos de la tarea contra el stack real (backend dev + web),
 * mismo patrón que `login-guardas-tenant.js` (SHG-QA-006) / `crear-envio.js`
 * (SHG-QA-007): cada sub-caso en su propio `BrowserContext`, todos corren
 * aunque alguno falle, tabla de resultados + falla la corrida al final si
 * quedó alguno en rojo.
 *
 * **Rango de fechas — por qué no se usa ningún quick-filter:** el default de
 * `DashboardFiltros` ("Últimos 7 días") y el resto de los quick-filters (15
 * días / 1 / 3 / 6 meses) son relativos a la fecha real de la máquina. El
 * seed (`backend/dev-seed/generate_data_dev.py`) tiene fechas **fijas** de
 * enero 2026 (envíos "creado" 2026-01-20..27, viaje finalizado 2026-01-10,
 * viaje `en_camino` 2026-01-20) — si "hoy" ya pasó varios meses de enero
 * 2026 (como en este entorno), ningún quick-filter llega a esas fechas y el
 * dashboard quedaría vacío (real, pero inútil para confirmar agregados/
 * alcance). Por eso cada caso arma a mano el rango `RANGO` (2026-01-05 al
 * 2026-01-31) navegando el calendario real del `DatePickerInput` — ver
 * `seleccionarRangoDeSeed`. Mismo año (2026) que la fecha real de la
 * máquina en este entorno, así que alcanza con subir un nivel (día -> mes)
 * y elegir "ene", sin tocar año/década.
 *
 * **Datos de seed relevantes para el scoping** (`generate_data_dev.py`,
 * `envio_suc`): de los 24 envíos, el 23 es de sucursal Norte (id 2), el 24
 * de sucursal Sur (id 3), el resto (1..22) de sucursal Centro (id 1) — los
 * tres con su "creado" dentro de `RANGO`. Sirve para una aserción de
 * tenant-scoping exacta vía `GET /api/dashboard/resumen` (mismo patrón de
 * comparación por API directa que `login-guardas-tenant.js` caso 8).
 */
export const name = "dashboard";

const RANGO = { desde: "2026-01-05", hasta: "2026-01-31" };
const DIA_INICIO_ARIA = "5 enero 2026";
const DIA_FIN_ARIA = "31 enero 2026";
const MES_ARIA = "ene";
const SUCURSAL_NORTE_ID = 2; // `planning/DEV_ENV.md` §3 — admin2 = ShipGo Norte (id 2).

const results = [];

async function record(n, label, fn) {
  try {
    await fn();
    results.push({ n, label, status: "PASS" });
  } catch (err) {
    results.push({ n, label, status: "FAIL", error: err.message });
  }
}

async function irADashboard(page) {
  await page.goto(`${config.webBaseUrl}/dashboard`);
  await page.getByRole("heading", { name: "Dashboard" }).waitFor({ timeout: 15_000 });
}

/**
 * Selecciona `RANGO` en el `DatePickerInput` de `DashboardFiltros` navegando
 * el calendario real (Mantine v9 `@mantine/dates`, sin `dateParser`: el input
 * no acepta tipear la fecha directamente en un browser real). Header del
 * nivel "día" (`MonthLevel`) formatea `"MMMM YYYY"` (ej. "septiembre 2026");
 * clickearlo sube al nivel "año" (en realidad muestra los 12 MESES del año
 * actual, `YearLevel` en la lib) — mismo año que `RANGO` en este entorno, así
 * que no hace falta tocar año/década. Ahí se clickea "ene" (`dayjs('es')`
 * `MMM` -> abreviatura sin punto) para volver al nivel "día" ya en enero
 * 2026, y se clickean los dos días por su `aria-label` real
 * (`"D MMMM YYYY"`, ej. "5 enero 2026" — único en el grid, sin colisión con
 * los días de relleno de diciembre/febrero).
 */
async function seleccionarRangoDeSeed(page) {
  // `getByLabel` es ambiguo acá: el mismo `label` también asocia el botón
  // "Limpiar rango de fechas" (`InputClearButton`) que Mantine monta al lado
  // del input cuando el `DatePickerInput` es `clearable` — se apunta al botón
  // real del input por rol + nombre exacto.
  await page.getByRole("button", { name: "Rango de fechas", exact: true }).click();

  const nivelMes = page.locator(".mantine-DatePickerInput-calendarHeaderLevel");
  await nivelMes.waitFor({ timeout: 10_000 });
  await nivelMes.click();

  await page.getByRole("button", { name: MES_ARIA, exact: true }).click();

  // `exact: true`: sin esto, "15 enero 2026"/"25 enero 2026" matchean también
  // por substring contra "5 enero 2026" (termina con esa substring).
  await page.getByRole("button", { name: DIA_INICIO_ARIA, exact: true }).click();
  await page.getByRole("button", { name: DIA_FIN_ARIA, exact: true }).click();
  await page.keyboard.press("Escape");
}

async function fetchResumen(requestCtx, { desde, hasta, sucursalId } = {}) {
  const params = { desde, hasta };
  if (sucursalId != null) params.sucursalId = sucursalId;
  const resp = await requestCtx.get(`${config.backendBaseUrl}/api/dashboard/resumen`, { params });
  if (!resp.ok()) {
    throw new Error(`GET /api/dashboard/resumen -> ${resp.status()} (params=${JSON.stringify(params)})`);
  }
  return resp.json();
}

/** Card de una KpiCard/ChartCard por su título visible (ambas son `.mantine-Card-root`). */
const cardPorTitulo = (page, titulo) =>
  page.locator(".mantine-Card-root").filter({ hasText: titulo });

/**
 * Verifica que ningún widget haya quedado en estado de error / cargando para
 * siempre (`ScreenContainer`, `@components/ScreenContainer.jsx`): KpiCard usa
 * el título "Error", ChartCard usa "No se pudo cargar". No exige ausencia de
 * "Sin datos" — para un alcance chico (ej. admin2/Norte, caso 3) algún widget
 * puede legítimamente no tener datos en el período, eso no es un bug.
 */
async function assertSinErrores(page) {
  const problemas = [];
  if (await page.locator(".mantine-Loader-root").count()) {
    problemas.push("quedó un Loader visible (algún widget no terminó de cargar)");
  }
  if (await page.getByText("No se pudo cargar").count()) {
    problemas.push("algún ChartCard quedó en estado de error");
  }
  if (await page.getByText("Error", { exact: true }).count()) {
    problemas.push("algún KpiCard quedó en estado de error");
  }
  if (problemas.length > 0) throw new Error(problemas.join(" | "));
}

export async function run({ browser, logger }) {
  // ── 1. admin -> Dashboard carga con los agregados reales, sin errores ────
  await record(
    1,
    "Login admin -> Dashboard carga con los agregados reales (no mock), sin errores de consola",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      let issuesDesde;
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irADashboard(page);

        // Se cuentan sólo los issues de consola DESDE que se llegó a
        // `/dashboard` (no los del login): el mount inicial de `AuthProvider`
        // (`getUserInfo`/refresh silencioso en cualquier página sin sesión
        // todavía, incluido `/login`) deja un `console.error` pre-existente y
        // ajeno a esta pantalla — deuda de FE ya presente en TODAS las
        // pantallas/casos de este harness (no sólo Dashboard), no introducida
        // ni agravada por esta tarea. Ver bitácora del PR.
        issuesDesde = logger.issues.length;

        const [resumenResp, seriesResp] = await Promise.all([
          page.waitForResponse(
            (res) => res.url().includes("/api/dashboard/resumen") && res.url().includes(`desde=${RANGO.desde}`),
            { timeout: 15_000 },
          ),
          page.waitForResponse(
            (res) => res.url().includes("/api/dashboard/series") && res.url().includes(`desde=${RANGO.desde}`),
            { timeout: 15_000 },
          ),
          seleccionarRangoDeSeed(page),
        ]);

        const resumenBody = await resumenResp.json();
        const seriesBody = await seriesResp.json();
        const totalEnvios = resumenBody?.envios?.total;
        if (!(totalEnvios > 0)) {
          throw new Error(
            `envios.total del período de seed vino <= 0 (${JSON.stringify(resumenBody?.envios)}) — ` +
              "no se puede confirmar que son datos reales del seed (¿mock o período mal armado?)",
          );
        }
        const sumaVolumenPorDia = (seriesBody?.volumenPorDia ?? []).reduce(
          (acc, p) => acc + (p.cantidad ?? 0),
          0,
        );
        if (sumaVolumenPorDia !== totalEnvios) {
          throw new Error(
            `series.volumenPorDia (suma=${sumaVolumenPorDia}) no coincide con resumen.envios.total (${totalEnvios})`,
          );
        }

        // El valor mostrado en la KpiCard "Envíos del período" debe ser
        // EXACTAMENTE el `envios.total` de la respuesta real (no un mock ni un
        // valor estático) — mismo patrón de "leer del backend real y comparar
        // contra la UI" que `login-guardas-tenant.js`.
        await cardPorTitulo(page, "Envíos del período")
          .getByText(String(totalEnvios), { exact: true })
          .waitFor({ timeout: 10_000 });

        await page.waitForTimeout(300); // asienta el resto de los widgets (misma tanda de fetch).
        await assertSinErrores(page);

        await logger.step(page, name, "caso1-admin-agregados-reales");
      } finally {
        await context.close();
      }

      const issuesDeConsola = logger.issues
        .slice(issuesDesde)
        .filter((i) => i.type === "pageerror" || i.type === "console-error");
      if (issuesDeConsola.length > 0) {
        throw new Error(
          `quedaron ${issuesDeConsola.length} issue(s) de consola: ${issuesDeConsola.map((i) => i.detail).join(" | ")}`,
        );
      }
    },
  );

  // ── 2. super -> Dashboard con alcance total (toda la empresa) ────────────
  await record(2, "Login super -> Dashboard con alcance total (toda la empresa)", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });
      await irADashboard(page);

      // Selector de sucursal visible (SUPERUSER-only, `DashboardFiltros.jsx`).
      await page.getByPlaceholder("Todas las sucursales").waitFor({ timeout: 10_000 });

      const [totalResp] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes("/api/dashboard/resumen") &&
            res.url().includes(`desde=${RANGO.desde}`) &&
            !res.url().includes("sucursalId"),
          { timeout: 15_000 },
        ),
        seleccionarRangoDeSeed(page),
      ]);
      const totalBody = await totalResp.json();

      await cardPorTitulo(page, "Envíos del período")
        .getByText(String(totalBody?.envios?.total), { exact: true })
        .waitFor({ timeout: 10_000 });
      await page.waitForTimeout(300);
      await assertSinErrores(page);
      await logger.step(page, name, "caso2-super-alcance-total");

      // Alcance total real: sumar el resumen consultado por cada sucursal
      // (API directa, mismo patrón que `login-guardas-tenant.js` caso 8) debe
      // dar EXACTAMENTE el mismo total que "todas las sucursales" — si el
      // scoping estuviera roto (ej. ignorando alguna sucursal), no coincidiría.
      const sucursalesResp = await context.request.get(`${config.backendBaseUrl}/api/sucursal/all`);
      if (!sucursalesResp.ok()) {
        throw new Error(`GET /api/sucursal/all -> ${sucursalesResp.status()}`);
      }
      const sucursales = await sucursalesResp.json();
      if (!Array.isArray(sucursales) || sucursales.length < 2) {
        throw new Error("el seed no tiene al menos 2 sucursales — no se puede confirmar el alcance total por comparación");
      }

      let sumaPorSucursal = 0;
      for (const s of sucursales) {
        const r = await fetchResumen(context.request, { ...RANGO, sucursalId: s.id });
        sumaPorSucursal += r?.envios?.total ?? 0;
      }
      if (sumaPorSucursal !== totalBody?.envios?.total) {
        throw new Error(
          `alcance total de super (${totalBody?.envios?.total}) no coincide con la suma por sucursal (${sumaPorSucursal}, sucursales=${JSON.stringify(sucursales.map((s) => s.id))})`,
        );
      }
    } finally {
      await context.close();
    }
  });

  // ── 3. admin2 (Norte) -> Dashboard con datos sólo de su sucursal ─────────
  await record(3, "Login admin2 (Norte) -> Dashboard con datos sólo de su sucursal", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "admin2", { logger, caseName: name });
      await irADashboard(page);

      // ADMIN no ve el selector de sucursal (sólo SUPERUSER elige, `CONTRACTS.md §3`).
      const selectorSucursal = await page.getByPlaceholder("Todas las sucursales").count();
      if (selectorSucursal > 0) {
        throw new Error("admin2 (ADMIN) no debería ver el selector de sucursal del dashboard");
      }

      const whoami = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      const sucursalNombre = (await whoami.json())?.sucursal?.nombre ?? "";
      if (!/norte/i.test(sucursalNombre)) {
        throw new Error(`whoami de admin2 no tiene sucursal "Norte" (vino: ${sucursalNombre})`);
      }

      const [resp] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes("/api/dashboard/resumen") && res.url().includes(`desde=${RANGO.desde}`),
          { timeout: 15_000 },
        ),
        seleccionarRangoDeSeed(page),
      ]);
      const body = await resp.json();

      await cardPorTitulo(page, "Envíos del período")
        .getByText(String(body?.envios?.total), { exact: true })
        .waitFor({ timeout: 10_000 });
      await page.waitForTimeout(300);
      await assertSinErrores(page);
      await logger.step(page, name, "caso3-admin2-solo-norte");

      // Comparar contra el mismo resumen consultado como SUPERUSER filtrado a
      // Norte (id 2, `DEV_ENV.md` §3) y contra "todas las sucursales": el
      // scoping de admin2 debe coincidir EXACTO con Norte y ser estrictamente
      // menor al total de la empresa (Centro + Sur también aportan envíos).
      const superContext = await browser.newContext();
      try {
        const superPage = await superContext.newPage();
        logger.attachPage(superPage, name);
        await loginAs(superPage, "super", { logger, caseName: name });

        const comoNorte = await fetchResumen(superContext.request, { ...RANGO, sucursalId: SUCURSAL_NORTE_ID });
        if (comoNorte?.envios?.total !== body?.envios?.total) {
          throw new Error(
            `total de admin2 (${body?.envios?.total}) no coincide con el mismo resumen consultado como super filtrado a Norte (${comoNorte?.envios?.total})`,
          );
        }

        const total = await fetchResumen(superContext.request, RANGO);
        if (!(body?.envios?.total < total?.envios?.total)) {
          throw new Error(
            `admin2 (Norte, ${body?.envios?.total}) debería ver estrictamente menos que el total de la empresa (${total?.envios?.total})`,
          );
        }
      } finally {
        await superContext.close();
      }
    } finally {
      await context.close();
    }
  });

  // ── 4. Backend 5xx forzado en un agregado -> ese widget muestra error/retry,
  //      el resto del dashboard sigue funcionando ──────────────────────────
  await record(
    4,
    "Backend 5xx forzado en /api/dashboard/resumen -> KpiCards/FleetDonut/StatusDonut muestran error/retry, los widgets de /series siguen funcionando",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irADashboard(page);

        // Sólo el PRIMER GET a /api/dashboard/resumen para `RANGO` se fuerza a
        // 500 (mismo shape que CONTRACTS.md §5 "500 — error interno"); del
        // segundo en adelante (el retry) deja pasar la request real. El fetch
        // inicial del período default (al montar la pantalla) no matchea
        // `desde=RANGO.desde` y pasa siempre real. `/api/dashboard/series` no
        // se toca en ningún momento.
        let forzado = false;
        await page.route(
          (url) => url.pathname === "/api/dashboard/resumen",
          async (route) => {
            const reqUrl = new URL(route.request().url());
            if (route.request().method() !== "GET" || forzado || reqUrl.searchParams.get("desde") !== RANGO.desde) {
              return route.continue();
            }
            forzado = true;
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ statusCode: 500, message: "Error interno del servidor." }),
            });
          },
        );

        await seleccionarRangoDeSeed(page);

        const descKpi = "No se pudo cargar este dato.";
        const descChart = "Ocurrió un error al traer los datos de esta sección.";
        await page.getByText(descKpi).first().waitFor({ timeout: 15_000 });
        await logger.step(page, name, "caso4-error-forzado");

        const countKpiError = await page.getByText(descKpi).count();
        const countChartError = await page.getByText(descChart).count();
        if (countKpiError !== 4) {
          throw new Error(`se esperaban 4 KpiCard en error (las 4 usan resumenQuery), vinieron ${countKpiError}`);
        }
        if (countChartError !== 2) {
          throw new Error(
            `se esperaban 2 ChartCard en error (FleetDonut + StatusDonut, resumenQuery), vinieron ${countChartError}`,
          );
        }

        // El resto del dashboard (charts basados en /series, no forzado) sigue funcionando.
        const volumenSigueOk = await cardPorTitulo(page, "Volumen de envíos").getByText(descChart).count();
        const categoriaSigueOk = await cardPorTitulo(page, "Envíos por categoría").getByText(descChart).count();
        const sucursalSigueOk = await cardPorTitulo(page, "Envíos por sucursal").getByText(descChart).count();
        const desvioSigueOk = await cardPorTitulo(page, "Desvío de viajes finalizados").getByText(descChart).count();
        if (volumenSigueOk || categoriaSigueOk || sucursalSigueOk || desvioSigueOk) {
          throw new Error("algún widget basado en /api/dashboard/series (no forzado) quedó en error también");
        }

        // Retry: cualquier botón "Reintentar" dispara el mismo `resumenQuery.refetch`
        // compartido por las 6 cards afectadas (4 Kpi + FleetDonut + StatusDonut).
        await page.getByRole("button", { name: "Reintentar" }).first().click();
        await page.getByText(descKpi).first().waitFor({ state: "hidden", timeout: 15_000 });
        if (await page.getByText(descChart).count() > 0) {
          throw new Error("seguía en error tras el retry");
        }
        await assertSinErrores(page);
        await logger.step(page, name, "caso4-retry-exitoso");
      } finally {
        await context.close();
      }
    },
  );

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
