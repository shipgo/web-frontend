import config from "../lib/config.js";
import { loginAs } from "../lib/auth.js";

/**
 * Caso feliz de humo (único caso que trae esta tarea — QA-006..012 suman el
 * resto pantalla por pantalla): login admin -> ListaEnvios carga con datos
 * del seed. Ver README "Cómo agregar un caso nuevo" para el resto.
 */
export const name = "smoke-happy-path";

export async function run({ browser, logger }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  logger.attachPage(page, name);

  try {
    await loginAs(page, "admin", { logger, caseName: name });

    await page.goto(`${config.webBaseUrl}/envios`);
    await page.getByRole("heading", { name: "Envíos" }).waitFor({ timeout: 15_000 });

    const filas = page.locator("table tbody tr");
    await filas.first().waitFor({ timeout: 15_000 });
    const count = await filas.count();
    await logger.step(page, name, "lista-envios-cargada");

    if (count === 0) {
      throw new Error("ListaEnvios cargó pero la tabla no tiene filas (¿seed vacío?)");
    }
    logger.log(`[${name}] ${count} fila(s) en la tabla de envíos.`);
  } finally {
    await context.close();
  }
}

export default { name, run };
