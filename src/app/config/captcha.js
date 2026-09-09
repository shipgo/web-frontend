/**
 * Config de Cloudflare Turnstile (captcha) para las superficies públicas con
 * costo — login, tracking guest, self-signup CUSTOMER, arranque de
 * recuperación de contraseña. SHG-FE-043 / contrato `SHG-BE-032`
 * (`planning/coordination/frontend.md`, 2026-09-09).
 *
 * Contrato con backend:
 * - El token viaja en el header `X-Captcha-Token` (nunca en el body).
 * - Un `400` con `{ statusCode, message, code: "captcha_invalid" }` indica
 *   token faltante/inválido/vencido/reusado — se distingue por `code`, nunca
 *   parseando `message` (texto libre).
 * - Con `turnstile.enabled=false` del lado del backend (perfil dev/test) el
 *   chequeo se saltea del todo aunque el front mande el header — no rompe
 *   nada mandarlo siempre.
 */

/** Site key de test de Cloudflare que SIEMPRE pasa (útil sin red real). */
export const CAPTCHA_TEST_SITE_KEY = "1x00000000000000000000AA";

/** Nombre del header acordado con el backend para el token de captcha. */
export const CAPTCHA_TOKEN_HEADER = "X-Captcha-Token";

/** Código que el backend manda en `code` cuando el captcha es inválido. */
export const CAPTCHA_ERROR_CODE = "captcha_invalid";

/**
 * `true` si el captcha debe estar activo en este build/entorno.
 *
 * - `VITE_TURNSTILE_ENABLED` explícito (`"false"`) lo apaga sin importar el
 *   entorno — flag para dev/CI/e2e pedido por la tarea.
 * - Si no se define explícitamente, se apaga automáticamente bajo Vitest
 *   (`import.meta.env.TEST`, seteado por el propio test runner) para que los
 *   tests existentes (login, tracking, registro, recuperar cuenta) no tengan
 *   que mockear el widget de Cloudflare para poder enviar sus formularios.
 */
export const isCaptchaEnabled = () => {
  const explicit = import.meta.env.VITE_TURNSTILE_ENABLED;
  if (explicit !== undefined) return explicit !== "false";
  return !import.meta.env.TEST;
};

/**
 * Site key pública a usar. Si `isCaptchaEnabled()` es `true` pero no hay site
 * key configurada (falta `VITE_TURNSTILE_SITE_KEY` en `.env`), NO se cae a la
 * site key de test: eso generaría tokens que el backend (con la secret real)
 * rechazaría siempre. En ese caso `useCaptcha` queda en estado `"error"` (el
 * mismo camino que "no cargó el script") con su botón de reintento.
 */
export const getCaptchaSiteKey = () =>
  import.meta.env.VITE_TURNSTILE_SITE_KEY || null;

/** `true` si un error de API es un rechazo de captcha (`SHG-BE-032`). */
export const isCaptchaApiError = (error) =>
  error?.response?.data?.code === CAPTCHA_ERROR_CODE;

/**
 * Header listo para pasar como `{ headers }` en axios, dado un token. Si no
 * hay token (`null`/`undefined`) devuelve un objeto vacío — no manda el header
 * con un valor `undefined` (algunas superficies, como el detalle de envío del
 * portal CUSTOMER autenticado, siguen llamando a este mismo endpoint sin
 * pasar captcha; ver nota en `usePublicTracking`).
 */
export const captchaHeader = (token) =>
  token ? { [CAPTCHA_TOKEN_HEADER]: token } : {};
