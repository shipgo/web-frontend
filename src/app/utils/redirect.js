/**
 * Sanitización del `?redirect=` de post-login (`SHG-FE-054`).
 *
 * Objetivo: un visitante sin sesión que entra directo a una ruta protegida
 * (ej. le compartieron `/viajes/12`) es mandado a `/login?redirect=/viajes/12`
 * y, tras loguear, vuelve a esa ruta — pero `redirect` es un valor que viaja
 * en la URL, así que nunca hay que confiar en él sin sanear: de lo contrario
 * cualquiera arma un link `.../login?redirect=https://evil.com` (open
 * redirect) que termina llevando a una víctima ya logueada a un sitio externo.
 */

const LOGIN_PATH = '/login';

/**
 * Sólo acepta rutas internas *relativas* a este mismo origen: deben empezar
 * con un único `/` (nunca `//` ni `/\`, que el navegador interpreta como
 * protocol-relative — `//evil.com` navega a `https://evil.com`) y, resueltas
 * contra el origin actual, no deben apuntar a otro origin (cubre además
 * esquemas raros como `javascript:` o `https:/evil.com`).
 *
 * @param {unknown} path
 * @returns {string|null} la ruta saneada (`pathname + search + hash`) o
 *   `null` si no es una ruta interna válida.
 */
export const sanitizeRedirect = (path) => {
  if (typeof path !== 'string' || path.length === 0) return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return null;
  }

  try {
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

const isLoginPath = (path) =>
  path === LOGIN_PATH ||
  path.startsWith(`${LOGIN_PATH}/`) ||
  path.startsWith(`${LOGIN_PATH}?`);

/**
 * Arma el `to` (absoluto, prefijo `~` — ver `ProtectedRoute`/`PortalRoute`)
 * para mandar a un visitante sin sesión a `/login` preservando el destino
 * original. Si el destino no sanea a una ruta interna válida, o ya es
 * `/login` (evita un hop inútil / loop), cae a `/login` a secas.
 *
 * @param {string} currentPath  `pathname + search` actuales.
 * @returns {string}
 */
export const buildLoginRedirectTo = (currentPath) => {
  const redirect = sanitizeRedirect(currentPath);
  if (!redirect || isLoginPath(redirect)) return `~${LOGIN_PATH}`;
  return `~${LOGIN_PATH}?redirect=${encodeURIComponent(redirect)}`;
};

/**
 * Resuelve el destino post-login: el `redirect` de la query si sanea a una
 * ruta interna válida y no es el propio `/login`; si no, el `fallback` (el
 * home por rol, `landingPathFor(user)`). No valida "accesible para el rol"
 * acá a propósito — cada guarda de ruta (`ProtectedRoute`, `PortalRoute`,
 * `ProtectedRoutes`) ya resuelve eso al montar esa ruta, rebotando a `/` (que
 * a su vez cae en el home por rol) sin loop si el rol no puede entrar.
 *
 * @param {unknown} rawRedirect  Valor crudo del query param `redirect`.
 * @param {string} fallback      Home por rol (`landingPathFor(user)`).
 * @returns {string}
 */
export const resolvePostLoginRedirect = (rawRedirect, fallback) => {
  const redirect = sanitizeRedirect(rawRedirect);
  if (!redirect || isLoginPath(redirect)) return fallback;
  return redirect;
};
