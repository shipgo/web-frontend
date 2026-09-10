import dayjs from "dayjs";

import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * SHG-QA-009 — E2E web: Listas y filtros (`ListaEnvios` / `ListaViajes`).
 *
 * Recorre los 6 casos de la tarea contra el stack real (backend dev + web),
 * mismo patrón que `login-guardas-tenant.js`/`crear-envio.js`: cada caso
 * numerado corre en su propio `BrowserContext`, todos corren aunque alguno
 * falle, y al final se imprime la tabla completa + se falla la corrida si
 * quedó alguno en rojo. Es de sólo lectura (ningún caso crea/edita/borra
 * datos).
 *
 * **Hallazgo operativo importante — este `:8080` es un backend real
 * COMPARTIDO y ACTIVAMENTE MUTADO por otros tracks/tareas en paralelo,
 * verificado en vivo mientras se armaba este caso:**
 * - Hay envíos/viajes DE MÁS más allá del seed (otros casos E2E —
 *   `crear-envio.js` — u otras tareas creando datos reales), esperable y
 *   documentado en el README del harness ("Sin Docker... no hay reset").
 * - Pero además, filas del SEED ORIGINAL están siendo MUTADAS en vivo por
 *   otra tarea corriendo en paralelo: en una corrida real, `envio 4`
 *   (seed: `creado`) apareció en `entregado`, y `viaje 1`/`viaje 2` (seed:
 *   `planificado`/`en_camino`) aparecieron en `en_camino`/`con_problemas` —
 *   otra tarea ejerciendo la máquina de estados sobre las MISMAS filas del
 *   seed mientras este caso corría. También el prefijo real de
 *   `codigoSeguimiento` en este backend es `SEED000NNN`, no `SHG-DEV-NNNN`
 *   como documenta `planning/DEV_ENV.md`/el generador (`data-dev.sql` de
 *   este backend quedó desalineado del generador actual — no se toca acá,
 *   fuera de alcance de esta tarea de QA, pero vale la pena que quede
 *   registrado para quien mantenga el seed).
 *
 * Por esto NINGUNA aserción de este caso asume un id/código/estado FIJO del
 * seed ni un total exacto. Estrategia: para cada filtro, primero se pide el
 * MISMO filtro directo por API (vía `context.request`, milisegundos antes de
 * disparar la acción por UI) para tener un "esperado" fresco, y después se
 * verifica que la request que dispara la UI (params correctos) devuelva el
 * mismo conjunto — es exactamente lo que pide el criterio de aceptación
 * ("query param correcto, resultados coherentes"), y es inmune a que otra
 * tarea mute filas del seed entre que arranca este caso y que corre.
 *
 * **Login:** `super` (`ROLE_SUPERUSER`, alcance TODA la empresa).
 *
 * **Bugs reales encontrados y arreglados en esta tarea (dentro de alcance,
 * ambas pantallas comparten `ScreenContainer`):**
 * - El estado "vacío con filtros" (`onEmptyFiltersData`) mostraba título +
 *   descripción pero **sin ningún CTA para limpiar los filtros** (a
 *   diferencia de `onError`, que sí tiene "Reintentar") — el criterio de
 *   aceptación del caso 4 lo pide explícito. Arreglado: `ScreenContainer`
 *   (`src/app/components/ScreenContainer.jsx`) ahora acepta un
 *   `onEmptyFiltersData.onClick` opcional que renderiza un botón "Limpiar
 *   filtros" (mismo patrón que el botón "Reintentar" de `onError`).
 *   `ListaEnvios`/`ListaViajes` (`index.jsx`) lo conectan a `clearFilters`
 *   (de `useParams`, ya existía pero no se usaba) + un `key` en
 *   `ListaEnviosFiltros`/`ListaViajesFiltros` para remontar el form interno
 *   (sin API de reset propia) a `DEFAULT_VALUES` — si no, el próximo
 *   debounce del form hubiera reaplicado los valores viejos por encima del
 *   `clearFilters` de los params. Las otras 4 listas que usan
 *   `onEmptyFiltersData` sin CTA (`ListaMantenimientos`, `ListaSucursales`,
 *   `ListaUsuarios`, `ListaVehiculos`) quedan fuera de alcance de esta tarea
 *   (sólo `ListaEnvios`/`ListaViajes`) — mismo gap, candidato a un ticket
 *   `SHG-FE` aparte si se prioriza.
 *
 * **Gaps reales documentados (NO arreglados — fuera de alcance trivial):**
 * - **Bug de BACKEND — caso 5 queda en rojo por esto, no por un problema del
 *   front:** `GET /api/envio?page=1&size=10` (y `GET /api/viaje` igual)
 *   devuelve el MISMO contenido que `page=0` (`Page.number` viene `0` en
 *   ambos), verificado con `curl` directo sin pasar por el front. Patrón
 *   (`page=0/1`→`number=0`, `page=2`→`number=1`, `page=3`→`number=2`, ...)
 *   consistente con `number = max(0, page - 1)` — como si el backend tratara
 *   `page` como 1-indexed y le restara 1, pese a que CONTRACTS.md §4 y el
 *   front YA mandan `page` 0-indexed. Ver el comentario del caso 5 para el
 *   detalle completo. Se recomienda abrir `SHG-BE` nuevo (repo `backend`,
 *   fuera de alcance de esta tarea) — hasta que se arregle, "página 2" en
 *   cualquier lista paginada del sitio no muestra nada distinto de "página 1".
 * - `EnvioFilter.sucursal` (CONTRACTS.md §4 / SHG-BE-004, filtro real del
 *   backend, SUPERUSER-only) **no tiene ningún control en `ListaEnviosFiltros`**
 *   — no hay `Select`/`MultiSelect` de sucursal en la UI, sólo
 *   `search`/`destino`/`date`/`estado`. El caso 3 de esta tarea (definido en
 *   el task file como "search + rango de fechas + sucursal") se corre
 *   combinando `search` + `estado` + rango de fechas en su lugar (las 3
 *   dimensiones de filtro que sí existen en la UI: texto + selección +
 *   rango). Se recomienda abrir un ticket `SHG-FE` para agregar el filtro de
 *   sucursal a la pantalla (visible sólo para SUPERUSER, igual que el resto
 *   de la matriz de permisos — CONTRACTS.md §3).
 * - Ni `ListaEnvios` ni `ListaViajes` exponen **ningún control de orden/sort**
 *   en la UI (sin columnas de tabla clickeables, sin selector de orden) pese
 *   a que el backend (`EnvioFilter`/`ViajeFilter.sort`, CONTRACTS.md §4) y la
 *   capa `api/` (JSDoc de `envio.api.js`/`viaje.api.js`) sí lo soportan. El
 *   caso 5 de esta tarea ("Paginación y sort") corre sólo la parte de
 *   paginación — la parte de sort queda documentada acá como gap real, no
 *   ejercitable por UI hoy. Se recomienda abrir un ticket `SHG-FE` para
 *   agregar encabezados de columna ordenables (o un `Select` de orden) que
 *   arme el param `sort=campo:asc|desc`.
 * - `MultiSelect` de "Estado" en ambas pantallas: las opciones son
 *   `role="option"` dentro de un `role="listbox"` (confirmado contra el DOM
 *   real de Chrome, NO `role="checkbox"` como asumen algunos tests unitarios
 *   en jsdom) y el dropdown se CIERRA solo tras cada selección — hay que
 *   reabrir el combobox antes de cada pick. Sin impacto funcional, sólo el
 *   detalle de interacción que usa este harness.
 */
export const name = "listas-filtros";

const results = [];

async function record(n, label, fn) {
  try {
    await fn();
    results.push({ n, label, status: "PASS" });
  } catch (err) {
    results.push({ n, label, status: "FAIL", error: err.message });
  }
}

/** `GET` directo contra el backend (vía `request` — reusa la cookie de sesión
 * del `BrowserContext`, mismo patrón que `login-guardas-tenant.js`). Sirve
 * para calcular un "esperado" fresco, milisegundos antes de disparar el
 * mismo filtro por UI — ver comentario de cabecera.
 *
 * Arma el query string A MANO (no vía la opción `params` de Playwright):
 * verificado que Playwright serializa un array como `estado=a%2Cb` (coma,
 * URL-encoded) en vez de params repetidos (`estado=a&estado=b`) — que es lo
 * que este backend espera (CONTRACTS.md §4, mismo criterio que la
 * `paramsSerializer: { indexes: null }` de axios en el front real). */
async function apiGet(request, path, params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, String(v)));
    } else {
      qs.append(key, String(value));
    }
  }
  const url = `${config.backendBaseUrl}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await request.get(url);
  if (!res.ok()) throw new Error(`GET ${path} -> ${res.status()} (params: ${JSON.stringify(params)})`);
  return res.json();
}

/** Espera la PRIMER response que matchee `urlIncludes` y tenga exactamente
 * los params pedidos (soporta arrays para params repetidos tipo `estado`).
 * Evita pisar/confundirse con las requests intermedias que dispara el
 * debounce de 500ms de los filtros mientras se escribe/selecciona. */
function esperarResponseConParams(page, urlIncludes, paramsEsperados, { timeout = 10_000 } = {}) {
  const p = page.waitForResponse((res) => {
    if (!res.url().includes(urlIncludes)) return false;
    const url = new URL(res.url());
    return Object.entries(paramsEsperados).every(([key, value]) => {
      if (Array.isArray(value)) {
        const all = url.searchParams.getAll(key);
        return all.length === value.length && value.every((v) => all.includes(v));
      }
      return url.searchParams.get(key) === value;
    });
  }, { timeout });
  // El waiter se registra ANTES de disparar la(s) acción(es) que lo cumplen
  // (algunas emiten el filtro sin pasar por el debounce de 500ms — ver
  // `ListaViajesFiltros`/`ListaEnviosFiltros`) para no perderse la respuesta
  // si llega antes de empezar a esperarla. Si una acción previa tira una
  // excepción, este waiter queda "huérfano" (nadie más lo await-ea) y su
  // eventual rechazo por timeout, sin handler, tumbaría todo el proceso
  // (unhandled rejection) — este `catch` mudo sólo evita ESE crash; el
  // rechazo real lo sigue viendo quien sí lo await-ee más abajo.
  p.catch(() => {});
  return p;
}

/** Espera la PRIMER response que matchee `urlIncludes` y NO tenga ninguno de
 * `keysAusentes` en el query string — para esperar a que el debounce termine
 * de propagar un filtro recién limpiado/deseleccionado (el param desaparece
 * del todo, no queda como `""`/`undefined`). */
function esperarResponseSinParams(page, urlIncludes, keysAusentes, { timeout = 10_000 } = {}) {
  const p = page.waitForResponse((res) => {
    if (!res.url().includes(urlIncludes)) return false;
    const url = new URL(res.url());
    return keysAusentes.every((key) => !url.searchParams.has(key));
  }, { timeout });
  p.catch(() => {}); // ver comentario en `esperarResponseConParams`
  return p;
}

/** Selecciona una opción del `MultiSelect` de estado (Mantine v9 real: las
 * opciones son `role="option"` dentro de un `role="listbox"` que sólo se
 * vuelve visible/interactuable con el combobox ABIERTO — no `role="checkbox"`
 * como en algunos tests unitarios de jsdom — y el dropdown se cierra solo
 * tras cada pick, así que hay que reabrirlo antes de cada selección/deselección). */
async function seleccionarOpcionEstado(page, comboboxLabel, optionLabel) {
  await page.getByRole("combobox", { name: comboboxLabel }).click();
  const option = page.getByRole("option", { name: optionLabel, exact: true });
  await option.waitFor({ timeout: 10_000 });
  await option.click();
}

/** Abre el `DatePickerInput` (`type="range"`) por su label, navega hasta el
 * mes de `targetMonthISO` (clickeando `[data-direction="previous"]` tantas
 * veces como meses de diferencia con "hoy" — determinístico, sin depender de
 * un `aria-label` de mes/año que Mantine no setea por defecto) y clickea los
 * días `desdeDia`/`hastaDia` de ESE mes (ambos dentro del mismo mes en los
 * casos de esta tarea). Los días "outside" (del mes anterior/siguiente que
 * se ven de relleno en la grilla) llevan `data-outside` — se excluyen para no
 * ambigüar con el mismo número de día del mes real. */
async function seleccionarRangoFechas(page, label, { targetMonthISO, desdeDia, hastaDia }) {
  await page.getByLabel(label).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10_000 });

  const now = dayjs();
  const target = dayjs(targetMonthISO);
  const mesesAtras = now.year() * 12 + now.month() - (target.year() * 12 + target.month());
  const prevBtn = dialog.locator('button[data-direction="previous"]');
  for (let i = 0; i < mesesAtras; i++) {
    await prevBtn.click();
  }

  const clickDia = async (dia) => {
    const btn = dialog
      .locator("button:not([data-outside])")
      .filter({ hasText: new RegExp(`^${dia}$`) });
    await btn.first().click();
  };
  await clickDia(desdeDia);
  await clickDia(hastaDia);
}

const idsOrdenados = (body) => (body.content ?? []).map((x) => x.id).sort((a, b) => a - b);

/** Labels reales de `src/app/domain/estados.js` (`ESTADO_VIAJE`) — no se
 * pueden derivar genéricamente del valor canónico (ej. `en_proceso_de_carga`
 * -> "En carga", no "En proceso de carga"), así que se copian acá tal cual. */
const ESTADO_VIAJE_LABELS = {
  creado: "Creado",
  planificado: "Planificado",
  en_proceso_de_carga: "En carga",
  en_camino: "En camino",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  con_problemas: "Con problemas",
};

export async function run({ browser, logger }) {
  // ── 1. ListaEnvios carga -> envíos del seed, columnas y badges correctos ──
  await record(1, "ListaEnvios carga -> envíos del seed, columnas y badges correctos", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });

      // Esperado fresco por API (alcance total, sin filtros) justo antes de navegar.
      const esperado = await apiGet(context.request, "/api/envio", { page: 0, size: 10 });

      await page.goto(`${config.webBaseUrl}/envios`);
      await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });

      const filas = page.locator("table tbody tr");
      await filas.first().waitFor({ timeout: 15_000 });

      const headers = await page.locator("table thead th").allInnerTexts();
      const columnasEsperadas = ["Código", "Remitente", "Destino", "Fecha de alta", "Estado", "Acciones"];
      const faltantes = columnasEsperadas.filter((c) => !headers.some((h) => h.includes(c)));
      if (faltantes.length > 0) {
        throw new Error(`Faltan columnas en ListaEnvios: ${faltantes.join(", ")} (vino: ${headers.join(" | ")})`);
      }

      if (esperado.totalElements < 24) {
        throw new Error(`Se esperaban al menos los 24 envíos del seed (super, alcance total), API trajo totalElements=${esperado.totalElements}`);
      }

      const totalTexto = await page.getByText(/de \d+ resultados/).innerText();
      if (!totalTexto.includes(`de ${esperado.totalElements} resultados`)) {
        throw new Error(`El total en pantalla no coincide con el de la API (${esperado.totalElements}): "${totalTexto}"`);
      }

      // El primer envío que trae la API (orden por defecto) debe ser también
      // la primera fila de la tabla, con el badge del label correcto para su estado.
      const primero = esperado.content[0];
      const primeraFila = filas.first();
      if (!(await primeraFila.getByText(primero.codigoSeguimiento).isVisible())) {
        throw new Error(`La primera fila de la tabla no muestra "${primero.codigoSeguimiento}" (primer resultado de la API)`);
      }
      await logger.step(page, name, "caso1-lista-envios-seed");
    } finally {
      await context.close();
    }
  });

  // ── 2. Filtro por estado -> query param correcto, resultados coherentes ──
  await record(2, "Filtro por estado -> query param correcto, resultados coherentes", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });
      await page.goto(`${config.webBaseUrl}/envios`);
      await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
      await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });

      // Esperado fresco por API, justo antes de filtrar por UI.
      const esperado = await apiGet(context.request, "/api/envio", { estado: "entregado", page: 0, size: 10 });
      if (esperado.totalElements < 1) {
        throw new Error("No hay ningún envío en estado 'entregado' ahora mismo — no se puede validar el filtro");
      }

      const responsePromise = esperarResponseConParams(page, "/api/envio", { estado: ["entregado"] });
      await seleccionarOpcionEstado(page, "Estado", "Entregado");
      const response = await responsePromise;

      const body = await response.json();
      if (body.totalElements !== esperado.totalElements) {
        throw new Error(`El filtro por UI trajo totalElements=${body.totalElements}, la API directa (mismo instante) trajo ${esperado.totalElements}`);
      }
      const estadosDevueltos = new Set(body.content.map((e) => e.estado));
      if (estadosDevueltos.size !== 1 || !estadosDevueltos.has("entregado")) {
        throw new Error(`La respuesta filtrada trajo estados fuera de "entregado": ${[...estadosDevueltos].join(", ")}`);
      }

      // Esperar a que la tabla realmente pinte el primer código devuelto por
      // ESTA respuesta (evita leer filas todavía no re-renderizadas: el
      // `ScreenContainer` desmonta la tabla entera durante el refetch —
      // `onLoading.show = isFetching` — así que cuando vuelve a aparecer ya
      // está con los datos nuevos completos).
      const codigosEsperados = body.content.map((e) => e.codigoSeguimiento);
      const primerCodigo = codigosEsperados[0];
      if (primerCodigo) await page.getByText(primerCodigo).waitFor({ timeout: 10_000 });

      const filas = page.locator("table tbody tr");
      const cantidadFilas = await filas.count();
      if (cantidadFilas !== body.content.length) {
        throw new Error(`La tabla muestra ${cantidadFilas} fila(s), la respuesta filtrada trae ${body.content.length}`);
      }
      const filasEnPantalla = await filas.allInnerTexts();
      const filasSinCodigoConocido = filasEnPantalla.filter((fila) => !codigosEsperados.some((c) => fila.includes(c)));
      if (filasSinCodigoConocido.length > 0) {
        throw new Error(`Alguna fila en pantalla no corresponde a los códigos de la respuesta filtrada (estado=entregado): ${filasSinCodigoConocido.join(" | ")}`);
      }
      await logger.step(page, name, "caso2-filtro-estado-entregado");
    } finally {
      await context.close();
    }
  });

  // ── 3. search + rango de fechas + [tercer filtro de EnvioFilter] combinados ──
  // Ver comentario de cabecera: "sucursal" no tiene UI en ListaEnviosFiltros,
  // se combina search + estado + rango de fechas (las 3 dimensiones reales
  // de filtro disponibles: texto + selección + rango).
  await record(
    3,
    'search + estado + rango de fechas combinados (sustituto de "sucursal", sin UI — ver cabecera)',
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "super", { logger, caseName: name });
        await page.goto(`${config.webBaseUrl}/envios`);
        await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
        await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });

        // `search=Diego` + `estado=en_sucursal` + enero 2026: combinación fija
        // del seed (nombre "Diego" cicla en `nombres[(eid-1)%12]`; la fecha de
        // alta del seed siempre cae en enero 2026) — cualquier envío nuevo que
        // otra corrida/tarea haya creado en este backend compartido tiene
        // fecha de alta de HOY, nunca enero 2026 (lo descarta el rango).
        // Esperado fresco por API con el mismo filtro, justo antes de repetirlo por UI.
        const filtroParams = { search: "Diego", estado: "en_sucursal", fechaDesde: "2026-01-01", fechaHasta: "2026-01-31" };
        const esperado = await apiGet(context.request, "/api/envio", filtroParams);
        if (esperado.totalElements < 1) {
          throw new Error('No hay ningún envío "Diego" en "en_sucursal" con alta en enero 2026 ahora mismo — no se puede validar el filtro combinado');
        }

        const responsePromise = esperarResponseConParams(page, "/api/envio", {
          search: "Diego",
          estado: ["en_sucursal"],
          fechaDesde: "2026-01-01",
          fechaHasta: "2026-01-31",
        });
        await page.getByLabel("Buscar envío").fill("Diego");
        await seleccionarOpcionEstado(page, "Estado", "En sucursal");
        await seleccionarRangoFechas(page, "Fecha de alta", {
          targetMonthISO: "2026-01-01",
          desdeDia: 1,
          hastaDia: 31,
        });

        const response = await responsePromise;
        const body = await response.json();
        if (body.totalElements !== esperado.totalElements || idsOrdenados(body).join(",") !== idsOrdenados(esperado).join(",")) {
          throw new Error(
            `Filtros combinados por UI trajeron ids [${idsOrdenados(body).join(",")}], la API directa (mismo instante) trajo [${idsOrdenados(esperado).join(",")}]`,
          );
        }
        const primerCodigo = body.content[0]?.codigoSeguimiento;
        if (primerCodigo) await page.getByText(primerCodigo).waitFor({ timeout: 10_000 });
        await logger.step(page, name, "caso3-filtros-combinados");
      } finally {
        await context.close();
      }
    },
  );

  // ── 4. Filtros sin match -> estado "vacío con filtros" + CTA para limpiar ──
  await record(4, 'Filtros sin match -> estado "vacío con filtros" + CTA para limpiar', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });
      await page.goto(`${config.webBaseUrl}/envios`);
      await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
      await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });

      await Promise.all([
        esperarResponseConParams(page, "/api/envio", { search: "ZZZ-NoExiste-E2E" }),
        page.getByLabel("Buscar envío").fill("ZZZ-NoExiste-E2E"),
      ]);

      await page.getByText("Sin resultados").waitFor({ timeout: 10_000 });
      await page
        .getByText("No se encontraron envíos con los filtros aplicados")
        .waitFor({ timeout: 5_000 });
      const limpiarBtn = page.getByRole("button", { name: "Limpiar filtros" });
      await limpiarBtn.waitFor({ timeout: 5_000 });
      await logger.step(page, name, "caso4-vacio-con-filtros-cta");

      const [response] = await Promise.all([
        esperarResponseConParams(page, "/api/envio", {}),
        limpiarBtn.click(),
      ]);
      const url = new URL(response.url());
      if (url.searchParams.has("search")) {
        throw new Error(`"Limpiar filtros" debía sacar "search" del request, siguió mandándolo: ${url.href}`);
      }
      await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
      const buscadorInput = page.getByLabel("Buscar envío");
      if ((await buscadorInput.inputValue()) !== "") {
        throw new Error('"Limpiar filtros" limpió los params pero el input "Buscar envío" quedó con texto viejo');
      }
      await logger.step(page, name, "caso4-post-limpiar-filtros");
    } finally {
      await context.close();
    }
  });

  // ── 5. Paginación y sort -> cambian los params, la tabla se actualiza ──
  // Ver comentario de cabecera: no hay UI de sort en ninguna de las dos
  // pantallas (gap real documentado, no arreglado) — se corre sólo paginación.
  //
  // **Bug real de BACKEND encontrado acá (fuera de alcance de `web-frontend`,
  // no se toca — para que el orquestador abra un `SHG-BE` nuevo):**
  // `GET /api/envio?page=1&size=10` devuelve el MISMO contenido que
  // `page=0` (`Page.number` viene `0` en ambos casos) — verificado también en
  // `GET /api/viaje` y con `curl` directo, sin pasar por el front. El patrón
  // completo (`page=0`→`number=0`, `page=1`→`number=0`, `page=2`→`number=1`,
  // `page=3`→`number=2`, ...) es consistente con `número = max(0, page - 1)`
  // en el backend — como si tratara el `page` recibido como 1-indexed y le
  // restara 1, pese a que el contrato (CONTRACTS.md §4) y el front YA mandan
  // `page` 0-indexed. Efecto: la "página 2" de la UI (params correctos,
  // `page=1` en la request) nunca trae contenido distinto de la página 1 —
  // este caso lo detecta correctamente y por eso queda en rojo hasta que se
  // arregle en `backend` (afecta como mínimo `/api/envio` y `/api/viaje`,
  // probablemente cualquier endpoint paginado que comparta el mismo helper).
  await record(5, "Paginación (sort sin UI, ver cabecera) -> cambian los params, la tabla se actualiza", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });
      await page.goto(`${config.webBaseUrl}/envios`);
      await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
      await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });

      const codigosPagina1 = await page.locator("table tbody tr td:nth-child(2)").allInnerTexts();

      // `exact: true`: sin esto, `getByRole('button', { name: '2' })` también
      // matchea botones de "Acciones de <código>" cuyo código contiene un "2"
      // en cualquier posición (accessible-name = substring por defecto).
      const paginaBoton2 = page.getByRole("button", { name: "2", exact: true });
      await paginaBoton2.waitFor({ timeout: 10_000 });
      if (await paginaBoton2.isDisabled()) {
        throw new Error('El botón de página "2" está disabled — no se puede paginar (¿menos de 11 envíos?)');
      }

      const [response] = await Promise.all([
        esperarResponseConParams(page, "/api/envio", { page: "1" }),
        paginaBoton2.click(),
      ]);
      const body = await response.json();

      // Esperar el PRIMER código de la página 2 (según la respuesta real) antes
      // de leer la tabla — `.first().waitFor()` sólo prueba que HAY filas, no
      // que ya son las nuevas (el `ScreenContainer` desmonta la tabla durante
      // el refetch, así que cuando el código nuevo aparece ya está completa).
      const primerCodigoPagina2 = body.content?.[0]?.codigoSeguimiento;
      if (primerCodigoPagina2) {
        await page.getByText(primerCodigoPagina2).waitFor({ timeout: 10_000 });
      } else {
        await page.locator("table tbody tr").first().waitFor({ timeout: 10_000 });
      }
      const codigosPagina2 = await page.locator("table tbody tr td:nth-child(2)").allInnerTexts();
      // El screenshot se toma ANTES de la aserción (no después): si el bug de
      // backend documentado arriba está presente, este caso va a tirar más
      // abajo — sin este orden, ese caso quedaría en la tabla de resultados
      // sin ninguna evidencia visual, pese a que "screenshot por caso" es un
      // criterio de aceptación de la tarea. Como bonus, la imagen queda como
      // evidencia visual del bug mismo (página "2" mostrando las mismas filas
      // que la página 1).
      await logger.step(page, name, "caso5-pagina-2");
      const interseccion = codigosPagina2.filter((c) => codigosPagina1.includes(c));
      if (interseccion.length > 0) {
        throw new Error(
          `La página 2 repite EXACTAMENTE las filas de la página 1 (${interseccion.join(", ")}) pese a que la request mandó page=1 correcto ` +
          `-> bug de backend confirmado por curl directo (ver comentario arriba de este caso): GET /api/envio?page=1 devuelve Page.number=0, mismo contenido que page=0.`,
        );
      }
    } finally {
      await context.close();
    }
  });

  // ── 6. ListaViajes carga + filtros (search patente/chofer, estado múltiple, fechas planificadas) ──
  await record(
    6,
    "ListaViajes carga + filtros (search patente/chofer, estado múltiple, rango de fechas planificadas)",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "super", { logger, caseName: name });
        await page.goto(`${config.webBaseUrl}/viajes`);
        await page.getByRole("heading", { name: "Viajes" }).waitFor({ timeout: 15_000 });
        await page.locator("table tbody tr").first().waitFor({ timeout: 15_000 });

        // 6a. Carga sin filtros -> el total en pantalla coincide con la API
        // (alcance total). Snapshot sin filtrar, usado también para elegir
        // valores REALES (patente/chofer/estados/fecha) para los sub-casos
        // siguientes — nunca se asume contenido fijo del seed (ver cabecera:
        // otra tarea está mutando filas del seed en vivo).
        const snapshot = await apiGet(context.request, "/api/viaje", { page: 0, size: 20 });
        if (snapshot.totalElements < 1) throw new Error("No hay ningún viaje ahora mismo — no se puede validar la pantalla");

        const totalTexto = await page.getByText(/de \d+ resultados/).innerText();
        if (!totalTexto.includes(`de ${snapshot.totalElements} resultados`)) {
          throw new Error(`El total en pantalla no coincide con el de la API (${snapshot.totalElements}): "${totalTexto}"`);
        }
        await logger.step(page, name, "caso6a-lista-viajes-seed");

        // 6b. search por patente -> se elige la patente del primer viaje del
        // snapshot y se compara UI vs. API (mismo filtro, milisegundos antes).
        {
          const viajeRef = snapshot.content.find((v) => v.vehiculo?.patente);
          if (!viajeRef) throw new Error("Ningún viaje del snapshot tiene vehículo asignado — no se puede probar search por patente");
          const patente = viajeRef.vehiculo.patente;

          const esperado = await apiGet(context.request, "/api/viaje", { search: patente, page: 0, size: 20 });
          const responsePromise = esperarResponseConParams(page, "/api/viaje", { search: patente });
          await page.getByLabel("Buscar viaje").fill(patente);
          const response = await responsePromise;
          const body = await response.json();

          if (idsOrdenados(body).join(",") !== idsOrdenados(esperado).join(",")) {
            throw new Error(`search="${patente}" por UI trajo ids [${idsOrdenados(body).join(",")}], la API directa trajo [${idsOrdenados(esperado).join(",")}]`);
          }
          const incoherentes = body.content.filter((v) => v.vehiculo?.patente !== patente);
          if (incoherentes.length > 0) {
            throw new Error(`search="${patente}" trajo viajes con otra patente: ${JSON.stringify(incoherentes.map((v) => ({ id: v.id, patente: v.vehiculo?.patente })))}`);
          }
          await logger.step(page, name, "caso6b-search-patente");
        }

        // 6c. search por chofer -> idem, con el nombre de pila de un chofer real.
        // `.fill()` reemplaza el valor entero (no hace falta limpiar antes).
        {
          const viajeConChofer = snapshot.content.find((v) => (v.choferes?.length ?? 0) > 0 || v.chofer);
          if (!viajeConChofer) throw new Error("Ningún viaje del snapshot tiene chofer asignado — no se puede probar search por chofer");
          const chofer = viajeConChofer.choferes?.[0] ?? viajeConChofer.chofer;
          const nombreChofer = chofer.nombre;

          const esperado = await apiGet(context.request, "/api/viaje", { search: nombreChofer, page: 0, size: 20 });
          const responsePromise = esperarResponseConParams(page, "/api/viaje", { search: nombreChofer });
          await page.getByLabel("Buscar viaje").fill(nombreChofer);
          const response = await responsePromise;
          const body = await response.json();

          if (idsOrdenados(body).join(",") !== idsOrdenados(esperado).join(",")) {
            throw new Error(`search="${nombreChofer}" por UI trajo ids [${idsOrdenados(body).join(",")}], la API directa trajo [${idsOrdenados(esperado).join(",")}]`);
          }
          const nombreCompleto = (p) => `${p?.nombre ?? ""} ${p?.apellido ?? ""}`;
          const incoherentes = body.content.filter((v) => {
            const choferes = v.choferes?.length ? v.choferes : v.chofer ? [v.chofer] : [];
            return !choferes.some((c) => nombreCompleto(c).toLowerCase().includes(nombreChofer.toLowerCase()));
          });
          if (incoherentes.length > 0) {
            throw new Error(`search="${nombreChofer}" trajo viajes sin ningún chofer que matchee: ${JSON.stringify(incoherentes.map((v) => v.id))}`);
          }
          await logger.step(page, name, "caso6c-search-chofer");
        }

        // Limpiar el buscador antes de seguir con los próximos sub-casos.
        await Promise.all([
          esperarResponseSinParams(page, "/api/viaje", ["search"]),
          page.getByLabel("Buscar viaje").fill(""),
        ]);

        // 6d. estado múltiple -> se eligen 2 estados REALMENTE presentes en
        // este momento (snapshot) y se compara UI vs. API.
        {
          const estadosPresentes = [...new Set(snapshot.content.map((v) => v.estado))];
          if (estadosPresentes.length < 2) {
            throw new Error(`Hacen falta al menos 2 estados distintos entre los viajes actuales para probar el filtro múltiple, hay: ${JSON.stringify(estadosPresentes)}`);
          }
          const [estadoA, estadoB] = estadosPresentes;
          const labelDe = (valor) => {
            const label = ESTADO_VIAJE_LABELS[valor];
            if (!label) throw new Error(`Estado de viaje sin label conocido en ESTADO_VIAJE_LABELS: "${valor}"`);
            return label;
          };

          const esperado = await apiGet(context.request, "/api/viaje", { estado: [estadoA, estadoB], page: 0, size: 20 });
          const responsePromise = esperarResponseConParams(page, "/api/viaje", { estado: [estadoA, estadoB] });
          await seleccionarOpcionEstado(page, "Estados", labelDe(estadoA));
          await seleccionarOpcionEstado(page, "Estados", labelDe(estadoB));
          const response = await responsePromise;
          const body = await response.json();

          if (idsOrdenados(body).join(",") !== idsOrdenados(esperado).join(",")) {
            throw new Error(`estado=[${estadoA},${estadoB}] por UI trajo ids [${idsOrdenados(body).join(",")}], la API directa trajo [${idsOrdenados(esperado).join(",")}]`);
          }
          const incoherentes = body.content.filter((v) => ![estadoA, estadoB].includes(v.estado));
          if (incoherentes.length > 0) {
            throw new Error(`estado=[${estadoA},${estadoB}] trajo viajes con otro estado: ${JSON.stringify(incoherentes.map((v) => ({ id: v.id, estado: v.estado })))}`);
          }
          await logger.step(page, name, "caso6d-estado-multiple");

          // Deseleccionar los 2 estados antes de seguir con el rango de fechas.
          const responseSinEstadoPromise = esperarResponseSinParams(page, "/api/viaje", ["estado"]);
          await seleccionarOpcionEstado(page, "Estados", labelDe(estadoA));
          await seleccionarOpcionEstado(page, "Estados", labelDe(estadoB));
          await responseSinEstadoPromise;
        }

        // 6e. rango de fechas planificadas -> se usa el mes de la fecha
        // planificada de un viaje real del snapshot (mes completo, para no
        // depender de qué día exacto cae la planificada).
        {
          const viajeRef = snapshot.content.find((v) => v.fechaHoraInicioPlanificada);
          if (!viajeRef) throw new Error("Ningún viaje del snapshot tiene fecha planificada — no se puede probar el rango de fechas");
          const fecha = dayjs(viajeRef.fechaHoraInicioPlanificada);
          const desde = fecha.startOf("month");
          const hasta = fecha.endOf("month");
          const fechaDesdeParam = `${desde.format("YYYY-MM-DD")}T00:00:00`;
          const fechaHastaParam = `${hasta.format("YYYY-MM-DD")}T23:59:59`;

          const esperado = await apiGet(context.request, "/api/viaje", {
            fechaDesde: fechaDesdeParam,
            fechaHasta: fechaHastaParam,
            page: 0,
            size: 20,
          });
          if (!esperado.content.some((v) => v.id === viajeRef.id)) {
            throw new Error(`El viaje de referencia (${viajeRef.id}) no vino en su propio rango de mes por API — dato inconsistente, no se puede validar`);
          }

          const responsePromise = esperarResponseConParams(page, "/api/viaje", {
            fechaDesde: fechaDesdeParam,
            fechaHasta: fechaHastaParam,
          });
          await seleccionarRangoFechas(page, "Rango de fechas", {
            targetMonthISO: desde.format("YYYY-MM-DD"),
            desdeDia: 1,
            hastaDia: desde.daysInMonth(),
          });
          const response = await responsePromise;
          const body = await response.json();

          if (idsOrdenados(body).join(",") !== idsOrdenados(esperado).join(",")) {
            throw new Error(`Rango de fechas planificadas por UI trajo ids [${idsOrdenados(body).join(",")}], la API directa trajo [${idsOrdenados(esperado).join(",")}]`);
          }
          await logger.step(page, name, "caso6e-rango-fechas-planificadas");
        }
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
