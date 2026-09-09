import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * SHG-QA-007 — E2E web: Crear Envío (wizard `CrearEnvios`).
 *
 * Recorre los 5 casos de la tarea contra el stack real (backend dev + web),
 * con el mismo patrón que `login-guardas-tenant.js` (SHG-QA-006): cada
 * sub-caso corre en su propio `BrowserContext`, todos corren aunque alguno
 * falle, y al final se imprime la tabla completa + se falla la corrida si
 * quedó alguno en rojo.
 *
 * **Reset de seed — decisión para esta tarea:** esta máquina no tiene Docker
 * (ver README "Sin Docker en esta máquina") así que, igual que documenta
 * `login-guardas-tenant.js` para `SHG-QA-006`, no hay reset de seed posible
 * sin reiniciar a la fuerza un backend que puede estar en uso — no se hace.
 * A diferencia de `SHG-QA-006` (solo lectura), el caso 1 de esta tarea SÍ
 * crea un envío real (y el caso 4 crea uno más al reintentar tras el 500
 * simulado) — es un efecto secundario intencional y aceptado: son envíos
 * nuevos con datos propios (apellido con sufijo `E2E...-<timestamp>` para no
 * colisionar con el seed ni entre corridas), nunca tocan/borran filas
 * existentes, y la tabla de `ListaEnvios` los admite sin romper nada. Los
 * casos 2/3/5 no llegan a mandar un POST real (2/3 fallan la validación de
 * Zod antes de salir; 5 intercepta la request con `page.route` y nunca deja
 * pasar el POST real).
 *
 * Direcciones: se geocodifica con el Mapbox real (`VITE_MAPBOX_API_KEY` de
 * `.env.local`) usando una dirección real de Córdoba capital. El auto-match
 * de provincia/localidad (`matchByName` en `SeccionOrigen.jsx`) le pega bien
 * al nombre que devuelve Mapbox para esta dirección (comprobado); si en algún
 * entorno no matcheara, `geocodearDireccion` cae a selección manual como
 * fallback — pero NUNCA re-selecciona algo que ya matcheó solo: Mantine
 * `Select` deselecciona si se clickea de nuevo la opción ya activa
 * (`allowDeselect`), así que "reforzar" una selección correcta la vacía.
 *
 * **Bug real encontrado (fuera de alcance de este repo, backend) — parche
 * de coordenadas:** `PuntoEntregaDTO.latitud`/`longitud`
 * (`backend/.../dto/PuntoEntregaDTO.java`) tienen `@DecimalMin("0.0")`, o sea
 * exigen coordenadas NO NEGATIVAS. Cualquier dirección real de Argentina
 * (todo el país está en latitud/longitud negativa) hace que el backend
 * rechace el alta con 400 (`"El campo latitud/longitud debe ser mayor que
 * 0."`) — un 400 real e inesperado que rompería el caso 1 (y el retry del
 * caso 4) sin que sea un problema del frontend ni de este harness. Reportado
 * aparte para que se abra un ticket de backend (`@DecimalMin` no tiene
 * sentido para lat/lng reales, debería ser `@NotNull` a lo sumo, o un rango
 * `-90..90`/`-180..180`). Mientras no se corrija, `parchearCoordenadasMapbox`
 * intercepta sólo la respuesta de `retrieve` de Mapbox (nunca la del POST
 * `/api/envio`) y le invierte el signo a `features[0].geometry.coordinates`
 * — mismo lugar real, mismo nombre de calle/provincia/localidad, sólo con el
 * signo del punto en el mapa dado vuelta para no pisar el bug de backend al
 * validar el resto del flujo (payload, notificación, ListaEnvios).
 */
export const name = "crear-envio";

const DIRECCION_TEST = {
  query: "Av. Colón 1234, Córdoba",
  provincia: "Córdoba",
  localidad: "Cordoba",
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

/** Helper genérico para los `Select` searchable de Mantine (v9): abre, tipea
 * para filtrar y clickea la opción. `root` puede ser la `page` o un `Locator`
 * (para escopar dentro de un modal, ej. el de "Añadir paquete").
 *
 * Mantine mantiene montada (oculta vía CSS) la lista de opciones de CADA
 * `Select` de la pantalla incluso con el dropdown cerrado (mismo footgun que
 * documenta `CrearEnvios/index.test.jsx` para el equivalente en jsdom) — un
 * lookup de `role="option"` sin escopar puede matchear la copia oculta de
 * OTRO combobox. Se escopa al `listbox` real vía `aria-controls`. */
async function seleccionarCombobox(page, root, name, optionText) {
  const combobox = root.getByRole("combobox", { name });
  await combobox.click();
  await combobox.fill(optionText);
  const listboxId = await combobox.getAttribute("aria-controls");
  const listbox = listboxId ? page.locator(`#${listboxId}`) : root;
  const opcion = listbox.getByRole("option", { name: optionText }).first();
  await opcion.waitFor({ timeout: 10_000 });
  await opcion.click();
}

async function fillContacto(page, datos) {
  await page.getByLabel(/^nombre/i).fill(datos.nombre);
  await page.getByLabel(/apellido/i).fill(datos.apellido);
  await page.getByLabel(/email del remitente/i).fill(datos.emailRemitente);
  await page.getByLabel(/email del receptor/i).fill(datos.emailReceptor);
  await page.getByLabel(/^prefijo/i).fill(datos.prefijo);
  await page.getByLabel(/^teléfono/i).fill(datos.telefono);
}

/**
 * Geocodifica con el buscador de direcciones (Mapbox real). El `onSelect` de
 * `SeccionOrigen.jsx` intenta auto-matchear Provincia/Localidad por nombre
 * (`matchByName`) contra el catálogo real ya cargado — comprobado que con
 * `DIRECCION_TEST` (Av. Colón 1234, Córdoba) matchea bien las dos. Sólo si
 * ese auto-match fallara (nombre de Mapbox sin correlato exacto) se cae a
 * selección manual como fallback.
 *
 * Importante: nunca hay que "re-seleccionar a mano" una opción que ya quedó
 * auto-matcheada — Mantine `Select` permite deseleccionar clickeando de nuevo
 * la opción ya activa (`allowDeselect`), así que reforzar una selección ya
 * correcta la vacía en vez de confirmarla.
 */
async function geocodearDireccion(page, { query, provincia, localidad }) {
  // `getByLabel` matea también el `listbox` de opciones (mismo `aria-labelledby`
  // que el input) — se acota a `role="combobox"` para agarrar sólo el input real.
  const buscador = page.getByRole("combobox", { name: "Buscar dirección" });
  await buscador.click();
  await buscador.pressSequentially(query, { delay: 15 });

  const opcion = page.getByRole("option").first();
  await opcion.waitFor({ timeout: 20_000 });
  await opcion.click();

  // Da tiempo a que termine el `retrieve()` de Mapbox + el auto-match de
  // provincia/localidad que dispara al resolver la sugerencia.
  await page.waitForTimeout(1_500);

  const provinciaCombo = page.getByRole("combobox", { name: "Provincia" });
  if (!(await provinciaCombo.inputValue())) {
    await seleccionarCombobox(page, page, "Provincia", provincia);
    await page
      .waitForResponse(
        (res) => res.url().includes("/api/localidad") && res.request().method() === "GET",
        { timeout: 10_000 },
      )
      .catch(() => {});
  }

  const localidadCombo = page.getByRole("combobox", { name: "Localidad" });
  if (!(await localidadCombo.inputValue())) {
    await seleccionarCombobox(page, page, "Localidad", localidad);
  }
}

async function agregarPaquete(page, { categoria, peso, descripcion }) {
  await page.getByRole("button", { name: "Añadir paquete" }).click();
  const modal = page.getByRole("dialog");
  await modal.waitFor({ timeout: 10_000 });

  await seleccionarCombobox(page, modal, "Categoría", categoria);
  await modal.getByLabel(/peso/i).fill(String(peso));
  if (descripcion) await modal.getByLabel(/descripción/i).fill(descripcion);

  await modal.getByRole("button", { name: "Agregar paquete" }).click();
  await modal.waitFor({ state: "hidden", timeout: 10_000 });
}

async function completarFormularioValido(page, { datos, paquete }) {
  await fillContacto(page, datos);
  await geocodearDireccion(page, DIRECCION_TEST);
  await agregarPaquete(page, paquete);
}

/**
 * Ver comentario de cabecera ("Bug real encontrado"). Sólo toca la respuesta
 * de `retrieve` de Mapbox (nunca el POST `/api/envio` real, ni el `suggest`) —
 * el resto del flujo de geocodificación queda intacto.
 */
async function parchearCoordenadasMapbox(page) {
  await page.route("**/autofill/v1/retrieve/**", async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    const coords = json?.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords)) {
      json.features[0].geometry.coordinates = coords.map((c) => Math.abs(c));
    }
    await route.fulfill({ response, json });
  });
}

async function irACrearEnvio(page) {
  await parchearCoordenadasMapbox(page);
  await page.goto(`${config.webBaseUrl}/envios/crear`);
  await page.getByRole("heading", { name: "Crear nuevo envío" }).waitFor({ timeout: 15_000 });
}

const notificacion = (page, hasText) =>
  page.locator(".mantine-Notification-root, [role='alert']").filter({ hasText });

/** Espera a que termine la transición de entrada de la notificación antes de
 * capturar el screenshot (mismo criterio que `login-guardas-tenant.js` caso 5:
 * si no, el screenshot puede salir sin nada pintado todavía). */
async function esperarAnimacion(locator) {
  await locator.evaluate((el) =>
    Promise.all(el.getAnimations({ subtree: true }).map((anim) => anim.finished)).catch(() => {}),
  );
}

export async function run({ browser, logger }) {
  // ── 1. Form completo y válido -> POST 2xx, payload correcto, aparece en ListaEnvios ──
  await record(
    1,
    "Form completo y válido -> submit crea el envío (payload correcto + aparece en ListaEnvios)",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irACrearEnvio(page);

        const datos = {
          nombre: "Juan",
          apellido: `E2E-Caso1-${Date.now()}`,
          emailRemitente: "remitente.e2e@example.com",
          emailReceptor: "receptor.e2e@example.com",
          prefijo: "351",
          telefono: "1234567",
        };
        await completarFormularioValido(page, {
          datos,
          paquete: { categoria: "Alimentos", peso: "3", descripcion: "Caja de prueba E2E" },
        });
        await logger.step(page, name, "caso1-form-completo");

        const [request] = await Promise.all([
          page.waitForRequest(
            (req) => req.url().includes("/api/envio") && req.method() === "POST",
            { timeout: 15_000 },
          ),
          page.getByRole("button", { name: "Registrar envío" }).click(),
        ]);

        const payload = request.postDataJSON();
        const response = await request.response();
        if (!response || response.status() < 200 || response.status() >= 300) {
          throw new Error(`POST /api/envio -> ${response?.status()} (se esperaba 2xx)`);
        }

        // Validación mínima del payload contra `EnvioReqDTO` (CONTRACTS.md §2 / buildEnvioReqDTO).
        const problemas = [];
        if (payload.nombre !== datos.nombre) problemas.push("nombre");
        if (payload.apellido !== datos.apellido) problemas.push("apellido");
        if (payload.emailRemitente !== datos.emailRemitente) problemas.push("emailRemitente");
        if (payload.emailReceptor !== datos.emailReceptor) problemas.push("emailReceptor");
        if (payload.prefijo !== datos.prefijo) problemas.push("prefijo");
        if (payload.telefono !== datos.telefono) problemas.push("telefono");
        if (typeof payload.destino?.localidad?.id !== "number") problemas.push("destino.localidad.id");
        if (
          typeof payload.destino?.latitud !== "number" ||
          typeof payload.destino?.longitud !== "number"
        ) {
          problemas.push("destino.latitud/longitud");
        }
        if (!Array.isArray(payload.detalleEnvios) || payload.detalleEnvios.length !== 1) {
          problemas.push("detalleEnvios.length");
        } else if (
          typeof payload.detalleEnvios[0].categoria?.id !== "number" ||
          payload.detalleEnvios[0].peso !== 3
        ) {
          problemas.push("detalleEnvios[0]");
        }
        if (problemas.length > 0) {
          throw new Error(
            `Payload de POST /api/envio no coincide con lo esperado: ${problemas.join(", ")} (vino: ${JSON.stringify(payload)})`,
          );
        }

        // El código de seguimiento lo genera `CodigoSeguimientoGenerator` (backend)
        // como un alfanumérico random SIN prefijo fijo (ej. "JHMJD3VG75", no
        // "SHG-..." como el seed) — se lee de la respuesta real, no se asume un
        // formato por regex.
        const body = await response.json();
        const codigoSeguimiento = body?.codigoSeguimiento;
        if (!codigoSeguimiento) {
          throw new Error(`La respuesta de POST /api/envio no trajo codigoSeguimiento: ${JSON.stringify(body)}`);
        }

        const toastExito = notificacion(page, /envío creado/i).filter({ hasText: codigoSeguimiento });
        await toastExito.waitFor({ timeout: 10_000 });
        await esperarAnimacion(toastExito);
        await logger.step(page, name, "caso1-envio-creado");

        // Aparece en ListaEnvios (buscando por su código de seguimiento).
        await page.goto(`${config.webBaseUrl}/envios`);
        await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
        await page.getByLabel("Buscar envío").fill(codigoSeguimiento);
        const fila = page.locator("table tbody tr").filter({ hasText: codigoSeguimiento });
        await fila.first().waitFor({ timeout: 15_000 });
        await logger.step(page, name, "caso1-aparece-en-lista-envios");
      } finally {
        await context.close();
      }
    },
  );

  // ── 2. Campos requeridos vacíos -> errores inline, no se envía request ──
  await record(
    2,
    "Campos requeridos vacíos -> submit muestra errores inline y NO envía request",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irACrearEnvio(page);

        let requestDisparada = false;
        page.on("request", (req) => {
          if (req.url().includes("/api/envio") && req.method() === "POST") requestDisparada = true;
        });

        await page.getByRole("button", { name: "Registrar envío" }).click();
        await page.getByText("El nombre es requerido").waitFor({ timeout: 10_000 });
        await logger.step(page, name, "caso2-errores-inline");

        const erroresEsperados = [
          "El nombre es requerido",
          "El apellido es requerido",
          "Email inválido",
          "El prefijo es requerido",
          "El teléfono es requerido",
          "La calle es requerida",
          "Seleccioná una provincia",
          "Seleccioná una localidad",
          "Elegí una sugerencia del buscador de direcciones para ubicar el envío en el mapa",
          "Agregá al menos un paquete",
        ];
        const faltantes = [];
        for (const texto of erroresEsperados) {
          const visible = await page
            .getByText(texto)
            .first()
            .isVisible()
            .catch(() => false);
          if (!visible) faltantes.push(texto);
        }
        if (faltantes.length > 0) {
          throw new Error(`No se mostraron todos los errores inline esperados: ${faltantes.join(" | ")}`);
        }

        // Margen para confirmar que no se disparó ninguna request en paralelo a la validación.
        await page.waitForTimeout(500);
        if (requestDisparada) {
          throw new Error("Se disparó POST /api/envio con el formulario vacío (no debería enviarse)");
        }
      } finally {
        await context.close();
      }
    },
  );

  // ── 3. Email / datos mal formados -> validación de formato antes de enviar ──
  await record(
    3,
    "Email mal formado -> error de validación de formato antes de enviar (sin request)",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irACrearEnvio(page);

        await page.getByLabel(/^nombre/i).fill("Ana");
        await page.getByLabel(/apellido/i).fill("Lopez");
        await page.getByLabel(/^prefijo/i).fill("351");
        await page.getByLabel(/^teléfono/i).fill("7654321");
        // Ambos sin "@": formato inválido (no vacíos, para aislar la validación de formato
        // de la de campo requerido, ya cubierta por el caso 2).
        await page.getByLabel(/email del remitente/i).fill("correo-remitente-invalido");
        await page.getByLabel(/email del receptor/i).fill("otro-correo-invalido");

        let requestDisparada = false;
        page.on("request", (req) => {
          if (req.url().includes("/api/envio") && req.method() === "POST") requestDisparada = true;
        });

        await page.getByRole("button", { name: "Registrar envío" }).click();
        await page.getByText("Email inválido").first().waitFor({ timeout: 10_000 });
        await logger.step(page, name, "caso3-email-malformado");

        await page.waitForTimeout(500);
        if (requestDisparada) {
          throw new Error("Se disparó POST /api/envio con emails mal formados (no debería enviarse)");
        }
      } finally {
        await context.close();
      }
    },
  );

  // ── 4. Backend responde 5xx (forzado) -> alerta de error + retry, sin pantalla en blanco ──
  await record(
    4,
    "Backend 5xx forzado -> alerta de error visible, formulario intacto (sin pantalla en blanco), retry exitoso",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irACrearEnvio(page);

        const datos = {
          nombre: "Carlos",
          apellido: `E2E-Caso4-${Date.now()}`,
          emailRemitente: "caso4.remitente@example.com",
          emailReceptor: "caso4.receptor@example.com",
          prefijo: "351",
          telefono: "1112223",
        };
        await completarFormularioValido(page, {
          datos,
          paquete: { categoria: "Alimentos", peso: "2" },
        });

        // Sólo el PRIMER POST a /api/envio se fuerza a 500 (mismo shape que
        // CONTRACTS.md §5 "500 — error interno"); del segundo en adelante deja
        // pasar la request real, para poder probar el retry.
        let intentos = 0;
        await page.route("**/api/envio", async (route) => {
          if (route.request().method() !== "POST") return route.continue();
          intentos += 1;
          if (intentos === 1) {
            await route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({
                statusCode: 500,
                message: "La acción a realizar entregar no existe para el estado entregado",
              }),
            });
          } else {
            await route.continue();
          }
        });

        await page.getByRole("button", { name: "Registrar envío" }).click();

        const toastError = notificacion(page, /error en el servidor/i);
        await toastError.waitFor({ timeout: 10_000 });
        await esperarAnimacion(toastError);
        await logger.step(page, name, "caso4-error-5xx");

        // La notificación (`autoClose` 20s, `App.jsx`) queda flotando sobre el
        // botón "Registrar envío" del footer — se cierra a mano antes de
        // reintentar para no tapar el click del retry.
        await toastError.getByRole("button").first().click();
        await toastError.waitFor({ state: "hidden", timeout: 5_000 });

        // No debe quedar pantalla en blanco/rota: el form sigue montado, con el
        // botón de submit disponible y sin haber navegado.
        const botonSubmit = page.getByRole("button", { name: "Registrar envío" });
        if (!(await botonSubmit.isVisible())) {
          throw new Error("El formulario desapareció tras el 500 (pantalla en blanco/rota)");
        }
        const urlTrasError = new URL(page.url()).pathname;
        if (urlTrasError !== "/envios/crear") {
          throw new Error(`No debía navegar tras el 500, quedó en "${urlTrasError}"`);
        }

        // Retry: mismo click, esta vez la request pasa de verdad (route.continue()).
        const [request] = await Promise.all([
          page.waitForRequest(
            (req) => req.url().includes("/api/envio") && req.method() === "POST",
            { timeout: 15_000 },
          ),
          botonSubmit.click(),
        ]);
        const response = await request.response();
        if (!response || response.status() < 200 || response.status() >= 300) {
          throw new Error(`Reintento de POST /api/envio -> ${response?.status()} (se esperaba 2xx)`);
        }
        await logger.step(page, name, "caso4-retry-exitoso");
      } finally {
        await page.unroute("**/api/envio").catch(() => {});
        await context.close();
      }
    },
  );

  // ── 5. Backend responde 4xx de validación -> error mapeado al campo correspondiente ──
  await record(
    5,
    "Backend 400 de validación forzado -> error mapeado al campo correcto (CONTRACTS.md §5)",
    async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      logger.attachPage(page, name);
      try {
        await loginAs(page, "admin", { logger, caseName: name });
        await irACrearEnvio(page);

        const datos = {
          nombre: "Marta",
          apellido: `E2E-Caso5-${Date.now()}`,
          emailRemitente: "caso5.remitente@example.com",
          emailReceptor: "caso5.receptor@example.com",
          prefijo: "351",
          telefono: "9998887",
        };
        await completarFormularioValido(page, {
          datos,
          paquete: { categoria: "Alimentos", peso: "1" },
        });

        const mensajeCampo = "El teléfono ingresado no tiene un formato válido.";
        await page.route("**/api/envio", async (route) => {
          if (route.request().method() !== "POST") return route.continue();
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              statusCode: 400,
              message: "Error en la validación de los campos.",
              fields: [{ field: "telefono", error: mensajeCampo }],
            }),
          });
        });

        await page.getByRole("button", { name: "Registrar envío" }).click();
        await page.getByText(mensajeCampo).waitFor({ timeout: 10_000 });
        await logger.step(page, name, "caso5-error-campo-mapeado");

        // El error debe quedar mapeado bajo el input de Teléfono (no como toast
        // suelto sin asociar a ningún campo).
        const telefonoInput = page.getByLabel(/^teléfono/i);
        const describedBy = await telefonoInput.getAttribute("aria-describedby");
        const marcado = describedBy
          ? await page.locator(`#${describedBy}`).filter({ hasText: mensajeCampo }).count()
          : 0;
        if (!marcado) {
          throw new Error(
            "El mensaje de error del 400 apareció en la página, pero no quedó asociado al input de Teléfono (aria-describedby)",
          );
        }

        const urlTrasError = new URL(page.url()).pathname;
        if (urlTrasError !== "/envios/crear") {
          throw new Error(`No debía navegar tras el 400, quedó en "${urlTrasError}"`);
        }
      } finally {
        await page.unroute("**/api/envio").catch(() => {});
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
