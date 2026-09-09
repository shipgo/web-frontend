import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * SHG-QA-006 — Login, guardas de rol y tenant-scoping.
 *
 * Recorre los 9 casos de la tarea contra el stack real (backend dev + web).
 * Cada sub-caso corre con su propio `BrowserContext` (sesión aislada) y deja
 * su propio screenshot (`logger.step`); todos corren aunque alguno falle —
 * al final se imprime la tabla completa y se falla la corrida (con el detalle
 * de qué sub-casos rompieron) si quedó alguno en rojo. Ver README para la
 * convención de `logger`/`loginAs`.
 *
 * Datos de seed relevantes (`planning/DEV_ENV.md` §3-4 / `backend/dev-seed`):
 * - `admin` → sucursal Centro (id 1). `admin2` → sucursal Norte (id 2).
 * - Envíos: sólo el id 23 (`SHG-DEV-0023`) es de la sucursal Norte; el resto
 *   (1..22) son de Centro — permite una aserción de tenant-scoping exacta.
 * - Vehículos `disponible`: Centro tiene `AA111AA`/`AA777AA`; Norte tiene
 *   sólo `AA444AA` (`GET /api/vehiculo/disponibles`, SHG-BE-023).
 */
export const name = "login-guardas-tenant";

// Ventana de fechas sin viajes de seed (todos son ~dic 2025 / ene 2026) —
// evita que la disponibilidad de vehículos varíe por solapamiento real.
const DISPONIBILIDAD_PARAMS = { desde: "2027-01-10T00:00:00", hasta: "2027-01-11T00:00:00" };

const results = [];

async function record(n, label, fn) {
  try {
    await fn();
    results.push({ n, label, status: "PASS" });
  } catch (err) {
    results.push({ n, label, status: "FAIL", error: err.message });
  }
}

const pathnameOf = (page) => new URL(page.url()).pathname;

async function getVehiculosDisponibles(requestCtx) {
  const resp = await requestCtx.get(`${config.backendBaseUrl}/api/vehiculo/disponibles`, {
    params: DISPONIBILIDAD_PARAMS,
  });
  if (!resp.ok()) {
    throw new Error(`GET /api/vehiculo/disponibles -> ${resp.status()}`);
  }
  const body = await resp.json();
  return body.map((v) => v.patente);
}

export async function run({ browser, logger }) {
  // ── 1. admin / Shipgo123! -> panel, alcance sucursal Centro ──────────────
  await record(1, "Login admin -> panel, alcance sucursal Centro", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "admin", { logger, caseName: name });

      const path = pathnameOf(page);
      if (path !== "/") throw new Error(`admin no cayó en "/" (panel), cayó en "${path}"`);

      const whoami = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      const body = await whoami.json();
      const sucursal = body?.sucursal?.nombre ?? "";
      if (!/centro/i.test(sucursal)) {
        throw new Error(`whoami de admin no tiene sucursal "Centro" (vino: ${JSON.stringify(body?.sucursal)})`);
      }
      await logger.step(page, name, "caso1-admin-panel-centro");
    } finally {
      await context.close();
    }
  });

  // ── 2. super / Shipgo123! -> panel, alcance total ────────────────────────
  await record(2, "Login super -> panel, alcance total", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "super", { logger, caseName: name });

      const path = pathnameOf(page);
      if (path !== "/") throw new Error(`super no cayó en "/" (panel), cayó en "${path}"`);

      const whoami = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      const body = await whoami.json();
      const roles = (body?.authorities ?? []).map((a) => a?.name ?? a);
      if (!roles.some((r) => /SUPERUSER/i.test(r))) {
        throw new Error(`whoami de super no trae ROLE_SUPERUSER (vino: ${JSON.stringify(roles)})`);
      }
      if (body?.sucursal) {
        throw new Error(`super debería tener alcance total (sin sucursal fija), vino: ${JSON.stringify(body.sucursal)}`);
      }
      await logger.step(page, name, "caso2-super-panel-alcance-total");
    } finally {
      await context.close();
    }
  });

  // ── 3. customer / Shipgo123! -> portal (/portal/*) ───────────────────────
  await record(3, "Login customer -> portal (/portal/*)", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "customer", { logger, caseName: name });

      const path = pathnameOf(page);
      if (!path.startsWith("/portal")) {
        throw new Error(`customer no cayó en el portal ("/portal/*"), cayó en "${path}"`);
      }
      await logger.step(page, name, "caso3-customer-portal");
    } finally {
      await context.close();
    }
  });

  // ── 4. Login con contraseña incorrecta -> error manejado, sin sesión ────
  await record(4, "Login con contraseña incorrecta -> error manejado, sin sesión", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await page.goto(`${config.webBaseUrl}/login`);
      await page.getByLabel("Usuario").fill("admin");
      await page.getByLabel("Contraseña").fill("Contrasena-Incorrecta-1!");
      await page.getByRole("button", { name: "Iniciar sesión" }).click();

      await page.getByText(/usuario y\/o contraseña incorrectos/i).waitFor({ timeout: 10_000 });
      await logger.step(page, name, "caso4-password-incorrecta");

      const path = pathnameOf(page);
      if (path !== "/login") throw new Error(`no debía navegar fuera de "/login", quedó en "${path}"`);

      const whoami = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      if (whoami.ok()) throw new Error("quedó una sesión activa tras una contraseña incorrecta");
    } finally {
      await context.close();
    }
  });

  // ── 5. Login con el email en vez del username -> 401 manejado ───────────
  await record(5, "Login con email en vez de username -> 401 manejado", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await page.goto(`${config.webBaseUrl}/login`);
      await page.getByLabel("Usuario").fill("admin@shipgo.dev");
      await page.getByLabel("Contraseña").fill(config.seedPassword);

      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes("/api/login"), { timeout: 10_000 }),
        page.getByRole("button", { name: "Iniciar sesión" }).click(),
      ]);
      if (response.status() !== 401) {
        throw new Error(`se esperaba 401 al loguear con el email, vino ${response.status()}`);
      }

      // Mensaje claro visible (no un crash / pantalla en blanco) — el copy
      // exacto no importa, sólo que se muestre feedback manejado.
      await page
        .locator(".mantine-Notification-root, [role='alert']")
        .first()
        .waitFor({ timeout: 10_000 });
      await logger.step(page, name, "caso5-login-con-email");

      const path = pathnameOf(page);
      if (path !== "/login") throw new Error(`no debía navegar fuera de "/login", quedó en "${path}"`);
    } finally {
      await context.close();
    }
  });

  // ── 6. Ruta protegida sin sesión -> redirect a /login ────────────────────
  await record(6, "Ruta protegida sin sesión -> redirect a /login", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await page.goto(`${config.webBaseUrl}/envios`);
      await page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 });
      await logger.step(page, name, "caso6-ruta-protegida-sin-sesion");
    } finally {
      await context.close();
    }
  });

  // ── 7. customer navega a "/" (panel) -> bloqueado / redirect al portal ──
  await record(7, 'customer navega a "/" -> bloqueado / redirect al portal', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "customer", { logger, caseName: name });
      await page.goto(`${config.webBaseUrl}/`);
      await page.waitForURL((url) => url.pathname.startsWith("/portal"), { timeout: 10_000 });
      await logger.step(page, name, "caso7-customer-bloqueado-panel");
    } finally {
      await context.close();
    }
  });

  // ── 8. admin2 (Norte) no ve datos de Centro (ListaEnvios / disponibilidad) ─
  await record(8, "admin2 (Norte) no ve datos de Centro en ListaEnvios / disponibilidad", async () => {
    const centroCtx = await browser.newContext();
    const centroPage = await centroCtx.newPage();
    logger.attachPage(centroPage, name);
    let centroCodigos;
    let centroDisponibles;
    try {
      await loginAs(centroPage, "admin", { logger, caseName: name });
      await centroPage.goto(`${config.webBaseUrl}/envios`);
      await centroPage.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
      await centroPage.locator("table tbody tr").first().waitFor({ timeout: 15_000 });
      centroCodigos = await centroPage.locator("table tbody tr td:nth-child(2)").allInnerTexts();
      await logger.step(centroPage, name, "caso8-envios-admin-centro");

      centroDisponibles = await getVehiculosDisponibles(centroCtx.request);
    } finally {
      await centroCtx.close();
    }

    if (centroCodigos.length === 0) {
      throw new Error("admin (Centro) no tiene envíos visibles — no se puede confirmar el scoping por comparación");
    }

    const norteCtx = await browser.newContext();
    const nortePage = await norteCtx.newPage();
    logger.attachPage(nortePage, name);
    try {
      await loginAs(nortePage, "admin2", { logger, caseName: name });
      await nortePage.goto(`${config.webBaseUrl}/envios`);
      await nortePage.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });
      await nortePage.locator("table tbody tr").first().waitFor({ timeout: 15_000 });
      const norteCodigos = await nortePage.locator("table tbody tr td:nth-child(2)").allInnerTexts();
      await logger.step(nortePage, name, "caso8-envios-admin2-norte");

      if (norteCodigos.length === 0) {
        throw new Error("admin2 (Norte) no ve ningún envío — no se puede confirmar el scoping (¿lista vacía?)");
      }
      const interseccionEnvios = norteCodigos.filter((c) => centroCodigos.includes(c));
      if (interseccionEnvios.length > 0) {
        throw new Error(`admin2 (Norte) ve envíos de Centro en ListaEnvios: ${interseccionEnvios.join(", ")}`);
      }

      const norteDisponibles = await getVehiculosDisponibles(norteCtx.request);
      const interseccionVehiculos = norteDisponibles.filter((p) => centroDisponibles.includes(p));
      if (interseccionVehiculos.length > 0) {
        throw new Error(
          `admin2 (Norte) ve vehículos disponibles de Centro: ${interseccionVehiculos.join(", ")}`,
        );
      }
    } finally {
      await norteCtx.close();
    }
  });

  // ── 9. Logout -> sesión limpiada, vuelve a login; back no re-entra ──────
  await record(9, "Logout -> sesión limpiada, vuelve a login; back no re-entra", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    logger.attachPage(page, name);
    try {
      await loginAs(page, "admin", { logger, caseName: name });
      await page.goto(`${config.webBaseUrl}/envios`);
      await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });

      // Botón del menú de usuario del Header: único `[aria-haspopup="menu"]`
      // (las acciones por fila de la tabla también lo son) que envuelve un
      // Avatar — así no matchea con los menús de "Acciones" de cada envío.
      const userMenuButton = page
        .locator('button[aria-haspopup="menu"]')
        .filter({ has: page.locator(".mantine-Avatar-root") });
      await userMenuButton.click();
      await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();

      await page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 });
      await logger.step(page, name, "caso9-post-logout-login");

      const whoamiAfterLogout = await context.request.get(`${config.backendBaseUrl}/api/whoami`);
      if (whoamiAfterLogout.ok()) throw new Error("la sesión sigue activa tras el logout");

      await page.goBack();
      await page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 });
      await logger.step(page, name, "caso9-back-no-reentra");
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
