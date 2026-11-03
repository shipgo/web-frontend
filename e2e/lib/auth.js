import config from "./config.js";
import { SEED_USERS, SEED_PASSWORD } from "../users.js";

/**
 * Loguea por UI (formulario real, no llamada directa a la API) con un
 * usuario seed por rol (`super`/`admin`/`admin2`/`chofer`/`chofer2`/`carga`/
 * `customer` — ver `e2e/users.js`). La cookie `AUTH-TOKEN` la maneja el
 * `BrowserContext` de Playwright solo, no hace falta tocarla.
 *
 * No asume a dónde redirige el login (SU/AD van a `/`, CUSTOMER a
 * `/portal/envios`, CHOFER/CARGA no tienen web y caen en la pantalla
 * "usá la app") — sólo espera a salir de `/login`. El caso que llama a este
 * helper es responsable de navegar y aserer lo que corresponda después.
 */
export async function loginAs(page, roleKey, { logger, caseName } = {}) {
  const user = SEED_USERS[roleKey];
  if (!user) {
    throw new Error(
      `Rol de seed desconocido: "${roleKey}". Válidos: ${Object.keys(SEED_USERS).join(", ")}`,
    );
  }

  await page.goto(`${config.webBaseUrl}/login`);
  await page.getByLabel("Usuario").fill(user.username);
  await page.getByLabel("Contraseña").fill(SEED_PASSWORD);
  if (logger) await logger.step(page, caseName, `login-form-${roleKey}`);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }),
    page.getByRole("button", { name: "Iniciar sesión" }).click(),
  ]);

  if (logger) await logger.step(page, caseName, `post-login-${roleKey}`);

  return user;
}

export default loginAs;
